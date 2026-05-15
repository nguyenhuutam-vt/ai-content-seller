import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const OPENAI_IMAGES_URL = "https://api.openai.com/v1/images/generations";
const OPENAI_IMAGE_MODEL = "gpt-image-1";
const IMAGE_COUNT = 1;
const IMAGE_SIZE = "1024x1024";
const IMAGE_QUALITY = "low";
const IMAGE_OUTPUT_FORMAT = "jpeg";
const OPENAI_IMAGE_TIMEOUT_MS = 45_000;
const CACHE_WINDOW_MS = 24 * 60 * 60 * 1000;
const MIN_PRODUCT_NAME_LENGTH = 3;
const MAX_PRODUCT_NAME_LENGTH = 120;
const FREE_IMAGE_DAILY_LIMIT = 2;

const imagePlatforms = ["Shopee", "TikTok Shop"] as const;
const imageStyles = [
  "Shopee banner",
  "TikTok thumbnail",
  "Luxury product ad",
  "Minimal clean product",
] as const;

type ImagePlatform = (typeof imagePlatforms)[number];
type ImageStyle = (typeof imageStyles)[number];

type UserProfile = {
  id: string;
  email: string | null;
  plan: string | null;
  daily_limit: number;
};

type UsageQuota = {
  dailyLimit: number;
  usedToday: number;
  remainingToday: number;
};

type ReserveImageQuotaResult =
  | {
      ok: true;
      reservationId: string;
      dailyLimit: number;
      generationCountBefore: number;
    }
  | { ok: false; reason: "limit"; dailyLimit: number; usedToday: number }
  | { ok: false; reason: "rpc_error"; message?: string };

type ActiveImageQuota = {
  userId: string;
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseClientOrNull>>>;
  reservationId: string;
  dailyLimit: number;
  generationCountBefore: number;
};

type ValidatedGenerateImageInput =
  | {
      ok: true;
      productName: string;
      style: ImageStyle;
      platform: ImagePlatform;
    }
  | {
      ok: false;
      status: number;
      message: string;
    };

type OpenAIImageResponsePayload = {
  data?: unknown;
  usage?: unknown;
};

type CachedImageGeneration = {
  image_data_url: string;
  product_name: string;
  style: ImageStyle;
  platform: ImagePlatform;
};

const inFlightImageRequests = new Set<string>();

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON body không hợp lệ." }, { status: 400 });
  }

  const input = validateGenerateImageInput(body);

  if (!input.ok) {
    return Response.json({ error: input.message }, { status: input.status });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "Server chưa sẵn sàng tạo ảnh. Vui lòng thử lại sau." },
      { status: 500 },
    );
  }

  const authContext = await resolveAuthenticatedImageContext();

  if (!authContext.ok) {
    return Response.json(
      { error: "Vui lòng đăng nhập để tạo ảnh AI và theo dõi lượt dùng." },
      { status: authContext.status },
    );
  }

  const prompt = buildImagePrompt(input);
  const cachedImage = await findRecentCachedImage({
    supabase: authContext.supabase,
    userId: authContext.userId,
    prompt,
  });

  if (cachedImage) {
    return Response.json({
      imageDataUrl: cachedImage.image_data_url,
      productName: cachedImage.product_name,
      style: cachedImage.style,
      platform: cachedImage.platform,
      cached: true,
    });
  }

  const requestKey = getInFlightImageRequestKey(authContext.userId, prompt);

  if (inFlightImageRequests.has(requestKey)) {
    return Response.json(
      {
        error:
          "Ảnh với brief này đang được tạo. Vui lòng chờ vài giây để tránh trừ lượt hai lần.",
      },
      { status: 409 },
    );
  }

  inFlightImageRequests.add(requestKey);

  let activeQuota: ActiveImageQuota | undefined;

  try {
    const reserved = await reserveImageGenerationQuota(authContext.supabase);

    if (!reserved.ok) {
      if (reserved.reason === "limit") {
        return Response.json(
          {
            error:
              "Bạn đã dùng hết lượt tạo ảnh hôm nay. Lượt mới sẽ tự làm mới vào ngày mai.",
            usage: getUsageResponse({
              dailyLimit: reserved.dailyLimit,
              usedToday: reserved.usedToday,
              remainingToday: Math.max(
                reserved.dailyLimit - reserved.usedToday,
                0,
              ),
            }),
          },
          { status: 429 },
        );
      }

      return Response.json(
        {
          error:
            "Chưa kiểm tra được lượt tạo ảnh. Vui lòng thử lại sau ít phút.",
        },
        { status: 503 },
      );
    }

    activeQuota = {
      userId: authContext.userId,
      supabase: authContext.supabase,
      reservationId: reserved.reservationId,
      dailyLimit: reserved.dailyLimit,
      generationCountBefore: reserved.generationCountBefore,
    };

    const openAIResponse = await fetchOpenAIImage({
      apiKey,
      prompt,
    });

    if (!openAIResponse.ok) {
      console.error("OpenAI image API error", { status: openAIResponse.status });

      await releaseImageGenerationReservationSafe(activeQuota);
      activeQuota = undefined;

      return Response.json(
        { error: getOpenAIImageErrorMessage(openAIResponse.status) },
        { status: 502 },
      );
    }

    const responseData =
      (await openAIResponse.json()) as OpenAIImageResponsePayload;
    const imageBase64 = extractImageBase64(responseData);

    if (!imageBase64) {
      console.error("OpenAI image response missing b64_json");

      await releaseImageGenerationReservationSafe(activeQuota);
      activeQuota = undefined;

      return Response.json(
        { error: "AI chưa trả về ảnh hợp lệ. Vui lòng thử lại." },
        { status: 502 },
      );
    }

    const imageDataUrl = `data:image/jpeg;base64,${imageBase64}`;
    const saved = await saveImageGeneration({
      userId: activeQuota.userId,
      input,
      prompt,
      imageDataUrl,
      usage: responseData.usage,
    });

    if (!saved) {
      await releaseImageGenerationReservationSafe(activeQuota);
      activeQuota = undefined;

      return Response.json(
        {
          error:
            "Ảnh đã tạo xong nhưng chưa lưu được vào lịch sử. Vui lòng thử lại.",
        },
        { status: 502 },
      );
    }

    await releaseImageGenerationReservationSafe(activeQuota);

    const usedToday = activeQuota.generationCountBefore + 1;

    activeQuota = undefined;

    return Response.json({
      imageDataUrl,
      productName: input.productName,
      style: input.style,
      platform: input.platform,
      usage: getUsageResponse({
        dailyLimit: reserved.dailyLimit,
        usedToday,
        remainingToday: Math.max(reserved.dailyLimit - usedToday, 0),
      }),
    });
  } catch (error) {
    console.error("Generate image route error", getSafeErrorMessage(error));

    await releaseImageGenerationReservationSafe(activeQuota);

    const errorMessage = isAbortError(error)
      ? "Tạo ảnh mất quá lâu nên hệ thống đã dừng để không giữ lượt của bạn. Vui lòng thử lại sau."
      : "Không thể kết nối tới dịch vụ tạo ảnh.";

    return Response.json(
      { error: errorMessage },
      { status: isAbortError(error) ? 504 : 502 },
    );
  } finally {
    inFlightImageRequests.delete(requestKey);
  }
}

async function fetchOpenAIImage({
  apiKey,
  prompt,
}: {
  apiKey: string;
  prompt: string;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, OPENAI_IMAGE_TIMEOUT_MS);

  try {
    return await fetch(OPENAI_IMAGES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_IMAGE_MODEL,
        prompt,
        n: IMAGE_COUNT,
        size: IMAGE_SIZE,
        quality: IMAGE_QUALITY,
        output_format: IMAGE_OUTPUT_FORMAT,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveAuthenticatedImageContext(): Promise<
  | { ok: false; status: 401 | 503 }
  | {
      ok: true;
      supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseClientOrNull>>>;
      userId: string;
    }
> {
  const supabase = await getSupabaseClientOrNull();

  if (!supabase) {
    return { ok: false, status: 503 };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, status: 401 };
  }

  const profile = await getOrCreateProfile({
    userId: user.id,
    email: user.email ?? null,
    supabase,
  });

  if (!profile) {
    return { ok: false, status: 503 };
  }

  return { ok: true, supabase, userId: user.id };
}

async function reserveImageGenerationQuota(
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseClientOrNull>>>,
): Promise<ReserveImageQuotaResult> {
  const { data, error } = await supabase.rpc("reserve_image_generation_quota");

  if (error) {
    console.error("reserve_image_generation_quota RPC error", error.message);

    return { ok: false, reason: "rpc_error", message: error.message };
  }

  const payload = data as unknown;

  if (!isRecord(payload) || typeof payload.ok !== "boolean") {
    return { ok: false, reason: "rpc_error" };
  }

  if (!payload.ok) {
    if (payload.reason === "limit") {
      const dailyLimit = readPositiveNumber(
        payload.daily_limit,
        FREE_IMAGE_DAILY_LIMIT,
      );
      const usedToday =
        typeof payload.used_today === "number" ? payload.used_today : dailyLimit;

      return { ok: false, reason: "limit", dailyLimit, usedToday };
    }

    return { ok: false, reason: "rpc_error" };
  }

  const reservationId =
    typeof payload.reservation_id === "string" ? payload.reservation_id : null;

  if (!reservationId) {
    return { ok: false, reason: "rpc_error" };
  }

  return {
    ok: true,
    reservationId,
    dailyLimit: readPositiveNumber(payload.daily_limit, FREE_IMAGE_DAILY_LIMIT),
    generationCountBefore:
      typeof payload.generation_count_before === "number"
        ? payload.generation_count_before
        : 0,
  };
}

async function findRecentCachedImage({
  supabase,
  userId,
  prompt,
}: {
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseClientOrNull>>>;
  userId: string;
  prompt: string;
}) {
  const cacheCutoffIso = new Date(Date.now() - CACHE_WINDOW_MS).toISOString();
  const { data, error } = await supabase
    .from("image_generations")
    .select("image_data_url, product_name, style, platform")
    .eq("user_id", userId)
    .eq("prompt", prompt)
    .eq("model", OPENAI_IMAGE_MODEL)
    .eq("quality", IMAGE_QUALITY)
    .eq("size", IMAGE_SIZE)
    .eq("output_format", IMAGE_OUTPUT_FORMAT)
    .gte("created_at", cacheCutoffIso)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
    .returns<CachedImageGeneration | null>();

  if (error) {
    console.error("Supabase image cache select error", error.message);
    return null;
  }

  if (!data || !isImageStyle(data.style) || !isImagePlatform(data.platform)) {
    return null;
  }

  return data;
}

async function releaseImageGenerationReservationSafe(
  activeQuota: ActiveImageQuota | undefined,
) {
  if (!activeQuota) {
    return;
  }

  const { error } = await activeQuota.supabase.rpc(
    "release_image_generation_reservation",
    {
      p_reservation_id: activeQuota.reservationId,
    },
  );

  if (error) {
    console.error(
      "release_image_generation_reservation RPC error",
      error.message,
    );
  }
}

async function getSupabaseClientOrNull() {
  try {
    return await createSupabaseServerClient();
  } catch (error) {
    console.error(
      "Supabase server client unavailable",
      getSafeErrorMessage(error),
    );
    return null;
  }
}

async function getOrCreateProfile({
  userId,
  email,
  supabase,
}: {
  userId: string;
  email: string | null;
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseClientOrNull>>>;
}) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, plan, daily_limit")
    .eq("id", userId)
    .maybeSingle()
    .returns<UserProfile | null>();

  if (error) {
    console.error("Supabase image profile select error", error.message);
    return null;
  }

  if (data) {
    return data;
  }

  const fallbackProfile: UserProfile = {
    id: userId,
    email,
    plan: "free",
    daily_limit: 10,
  };

  const { data: insertedProfile, error: insertError } = await supabase
    .from("profiles")
    .insert(fallbackProfile)
    .select("id, email, plan, daily_limit")
    .single()
    .returns<UserProfile>();

  if (insertError) {
    console.error("Supabase image profile insert error", insertError.message);
    return fallbackProfile;
  }

  return insertedProfile;
}

async function saveImageGeneration({
  userId,
  input,
  prompt,
  imageDataUrl,
  usage,
}: {
  userId: string;
  input: Extract<ValidatedGenerateImageInput, { ok: true }>;
  prompt: string;
  imageDataUrl: string;
  usage: unknown;
}) {
  const supabase = await getSupabaseClientOrNull();

  if (!supabase) {
    return false;
  }

  const { error } = await supabase.from("image_generations").insert({
    user_id: userId,
    product_name: input.productName,
    style: input.style,
    platform: input.platform,
    prompt,
    image_data_url: imageDataUrl,
    model: OPENAI_IMAGE_MODEL,
    quality: IMAGE_QUALITY,
    size: IMAGE_SIZE,
    output_format: IMAGE_OUTPUT_FORMAT,
    usage,
  });

  if (error) {
    console.error("Supabase image generation insert error", error.message);
    return false;
  }

  return true;
}

function validateGenerateImageInput(
  body: unknown,
): ValidatedGenerateImageInput {
  if (!isRecord(body)) {
    return { ok: false, status: 400, message: "JSON body không hợp lệ." };
  }

  const productName = readString(body.productName);
  const style = readString(body.style);
  const platform = readString(body.platform);

  if (!productName) {
    return { ok: false, status: 400, message: "productName là bắt buộc." };
  }

  if (!style) {
    return { ok: false, status: 400, message: "style là bắt buộc." };
  }

  if (!platform) {
    return { ok: false, status: 400, message: "platform là bắt buộc." };
  }

  if (productName.length < MIN_PRODUCT_NAME_LENGTH) {
    return {
      ok: false,
      status: 400,
      message: `productName tối thiểu ${MIN_PRODUCT_NAME_LENGTH} ký tự.`,
    };
  }

  if (productName.length > MAX_PRODUCT_NAME_LENGTH) {
    return {
      ok: false,
      status: 400,
      message: `productName tối đa ${MAX_PRODUCT_NAME_LENGTH} ký tự.`,
    };
  }

  if (!isImageStyle(style)) {
    return {
      ok: false,
      status: 400,
      message: `style phải là một trong: ${imageStyles.join(", ")}.`,
    };
  }

  if (!isImagePlatform(platform)) {
    return {
      ok: false,
      status: 400,
      message: `platform phải là một trong: ${imagePlatforms.join(", ")}.`,
    };
  }

  return { ok: true, productName, style, platform };
}

function buildImagePrompt(
  input: Extract<ValidatedGenerateImageInput, { ok: true }>,
) {
  return [
    `Realistic ecommerce marketing visual for product: ${input.productName}.`,
    `Platform: ${input.platform}. Style: ${input.style}.`,
    "Clean background, professional lighting, seller-friendly composition.",
    "No fake logos, no medical claims, no before-after claims, minimal readable text.",
  ].join(" ");
}

function extractImageBase64(responseData: OpenAIImageResponsePayload) {
  if (!Array.isArray(responseData.data)) {
    return null;
  }

  const firstImage = responseData.data[0];

  if (!isRecord(firstImage) || typeof firstImage.b64_json !== "string") {
    return null;
  }

  return firstImage.b64_json;
}

function getUsageResponse(quota: UsageQuota) {
  return {
    dailyLimit: quota.dailyLimit,
    usedToday: quota.usedToday,
    remainingToday: quota.remainingToday,
  };
}

function getInFlightImageRequestKey(userId: string, prompt: string) {
  return `${userId}:${prompt.toLowerCase()}`;
}

function getOpenAIImageErrorMessage(status: number) {
  if (status === 429) {
    return "Dịch vụ tạo ảnh đang bận. Lượt của bạn chưa bị tính, vui lòng thử lại sau ít phút.";
  }

  if (status >= 500) {
    return "Dịch vụ tạo ảnh đang quá tải. Lượt của bạn chưa bị tính, vui lòng thử lại sau.";
  }

  return "Không thể tạo ảnh lúc này. Lượt của bạn chưa bị tính, vui lòng thử lại.";
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readPositiveNumber(value: unknown, fallback: number) {
  return typeof value === "number" && value > 0 ? value : fallback;
}

function isImagePlatform(value: string): value is ImagePlatform {
  return imagePlatforms.includes(value as ImagePlatform);
}

function isImageStyle(value: string): value is ImageStyle {
  return imageStyles.includes(value as ImageStyle);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getSafeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

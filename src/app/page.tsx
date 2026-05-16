"use client";

import Image from "next/image";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { track } from "@vercel/analytics";

import {
  createClient as createSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

const features = [
  {
    title: "Caption bán hàng",
    description:
      "Viết caption theo giọng thương hiệu, đúng ngữ cảnh Shopee và TikTok Shop.",
  },
  {
    title: "Hashtag tối ưu",
    description:
      "Gợi ý bộ hashtag theo ngành hàng, trend nội dung và ý định tìm kiếm.",
  },
  {
    title: "Mô tả sản phẩm",
    description:
      "Biến thông tin rời rạc thành mô tả rõ lợi ích, thông số và lý do mua.",
  },
];

const plans = [
  {
    name: "Free",
    price: "0đ",
    description: "Dành cho shop mới thử AI content và tạo vài bản nháp đầu.",
  },
  {
    name: "Pro",
    price: "99.000đ/tháng",
    description: "Tạo nội dung hằng ngày cho shop đang tăng trưởng.",
    highlighted: true,
  },
  {
    name: "Business",
    price: "299k/tháng",
    description: "Cho team bán hàng cần nhiều mẫu content và quy trình hơn.",
  },
];

const stats = [
  "Dành cho seller Việt Nam",
  "Tạo content trong vài giây",
  "Không cần nghĩ caption mỗi ngày",
  "Shopee + TikTok Shop",
];
const proBenefits = [
  "100 lượt tạo content/ngày",
  "Lưu lịch sử",
  "Ưu tiên tính năng mới",
] as const;

const faqs = [
  {
    question: "AI có miễn phí không?",
    answer:
      "Có. Bạn có thể dùng gói Free để tạo nội dung thử. Gói Pro phù hợp khi shop cần tạo nhiều content hơn mỗi ngày.",
  },
  {
    question: "Có hỗ trợ TikTok Shop không?",
    answer:
      "Có. Công cụ hỗ trợ TikTok Shop, Shopee và Facebook, với caption, hashtag, mô tả và CTA theo từng kênh bán.",
  },
  {
    question: "Có cần biết prompt không?",
    answer:
      "Không. Chỉ cần nhập tên sản phẩm, chọn kênh và tone. AI sẽ tự biến brief ngắn thành bản nháp tiếng Việt dễ dùng.",
  },
] as const;

const BANK_NAME = "Tên ngân hàng của tôi";
const BANK_ACCOUNT = "Số tài khoản của tôi";
const BANK_ACCOUNT_NAME = "Tên chủ tài khoản";

const manualPaymentDetails = [
  ["Bank", BANK_NAME],
  ["Account", BANK_ACCOUNT],
  ["Name", BANK_ACCOUNT_NAME],
  ["Note", "PRO + email đăng nhập"],
] as const;

const navLinks = [
  { href: "#features", label: "Tính năng" },
  { href: "#pricing", label: "Bảng giá" },
  { href: "#demo", label: "Demo" },
  { href: "#generators", label: "Generator" },
] as const;

type GeneratorTab = "content" | "image" | "video-script" | "tiktok-hooks";

const generatorTabs: { id: GeneratorTab; label: string }[] = [
  { id: "content", label: "Content" },
  { id: "image", label: "Ảnh AI" },
  { id: "video-script", label: "Video Script" },
  { id: "tiktok-hooks", label: "TikTok Hooks" },
];

const platforms = ["Shopee", "TikTok Shop", "Facebook"] as const;
const tones = ["Chuyên nghiệp", "Gen Z", "Sang trọng", "Viral"] as const;
const imagePlatforms = ["Shopee", "TikTok Shop"] as const;
const videoScriptPlatforms = ["TikTok Shop", "Shopee", "Facebook Reels"] as const;
const videoScriptTones = ["Gen Z", "Chuyên nghiệp", "Viral", "Sang trọng"] as const;
const videoScriptDurations = ["15 giây", "30 giây", "45 giây"] as const;
const FREE_VIDEO_SCRIPT_DAILY_LIMIT = 5;
const PRO_VIDEO_SCRIPT_DAILY_LIMIT = 50;
const hookCategories = [
  "Mỹ phẩm",
  "Thời trang",
  "Đồ gia dụng",
  "Mẹ & bé",
  "Đồ công nghệ",
  "Khác",
] as const;
const hookTargetCustomers = [
  "Học sinh / sinh viên",
  "Dân văn phòng",
  "Mẹ bỉm",
  "Nam giới",
  "Nữ giới",
  "Chủ shop",
] as const;
const hookTones = ["Gen Z", "Viral", "Chuyên nghiệp", "Hài hước"] as const;
const FREE_HOOKS_DAILY_LIMIT = 10;
const PRO_HOOKS_DAILY_LIMIT = 100;
const MAX_CUSTOMER_PAIN_LENGTH = 160;
const imageStyles = [
  "Shopee banner",
  "TikTok thumbnail",
  "Luxury product ad",
  "Minimal clean product",
] as const;
const MIN_PRODUCT_NAME_LENGTH = 3;
const MAX_PRODUCT_NAME_LENGTH = 120;
const HASHTAG_MIN_COUNT = 5;
const HASHTAG_MAX_COUNT = 8;
const RECENT_GENERATION_LIMIT = 5;
const AUTH_SESSION_READY_TIMEOUT_MS = 5_000;
const DEFAULT_DAILY_LIMIT = 10;
const FREE_IMAGE_DAILY_LIMIT = 2;
const PRO_IMAGE_DAILY_LIMIT = 20;

const generatorSteps = [
  "Nhập sản phẩm",
  "Chọn kênh",
  "Chọn tone",
  "Tạo bản nháp",
] as const;

const previewItems = [
  {
    title: "Caption",
    body: "Nhỏ gọn nhưng đựng đủ đồ cần thiết. Đi học, đi làm hay đi chơi cuối tuần đều hợp.",
  },
  {
    title: "CTA",
    body: "Chọn màu bạn thích và đặt ngay hôm nay.",
  },
] as const;

const fieldLabelClassName = "text-xs font-black uppercase text-zinc-500";
const formControlClassName =
  "mt-3 h-14 w-full rounded-lg border border-white/10 bg-white/[0.045] px-5 text-sm font-semibold text-white outline-none transition duration-300 hover:border-yellow-300/35 hover:bg-white/[0.06] focus:border-yellow-300 focus:bg-black/80 focus:shadow-[0_0_0_4px_rgba(250,204,21,0.12),0_18px_45px_rgba(250,204,21,0.08)]";

type Platform = (typeof platforms)[number];
type Tone = (typeof tones)[number];
type ImagePlatform = (typeof imagePlatforms)[number];
type ImageStyle = (typeof imageStyles)[number];
type VideoScriptPlatform = (typeof videoScriptPlatforms)[number];
type VideoScriptTone = (typeof videoScriptTones)[number];
type VideoScriptDuration = (typeof videoScriptDurations)[number];
type HookCategory = (typeof hookCategories)[number];
type HookTargetCustomer = (typeof hookTargetCustomers)[number];
type HookTone = (typeof hookTones)[number];
type Feature = (typeof features)[number];
type Plan = (typeof plans)[number];
type AuthMode = "login" | "signup";
type AccountPlan = "free" | "pro";
type UpgradeSource = "generator_usage" | "pricing_pro_card";
type AnalyticsEventName =
  | "generate_clicked"
  | "generation_success"
  | "generation_failed"
  | "image_generate_clicked"
  | "image_generation_success"
  | "image_generation_failed"
  | "video_script_generate_clicked"
  | "video_script_generation_success"
  | "video_script_generation_failed"
  | "hooks_generate_clicked"
  | "hooks_generation_success"
  | "hooks_generation_failed"
  | "upgrade_clicked";
type AnalyticsEventProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

type GeneratedContent = {
  caption: string;
  hashtags: string[];
  cta: string;
  description: string;
};

type DailyUsage = {
  dailyLimit: number;
  usedToday: number;
  remainingToday: number;
};

type GenerateSuccessResponse = GeneratedContent & {
  usage?: DailyUsage;
};

type GenerateResponse =
  | GenerateSuccessResponse
  | { error?: string; usage?: DailyUsage };
type SupabaseBrowserClient = ReturnType<typeof createSupabaseClient>;

type RecentGeneration = GeneratedContent & {
  id: string;
  product_name: string;
  platform: string;
  tone: string;
  created_at: string | null;
};

type UsageProfile = {
  plan: string | null;
  daily_limit: number | null;
};

type ImageUsageProfile = {
  plan: string | null;
};

type GeneratedImage = {
  imageDataUrl: string;
  productName: string;
  style: ImageStyle;
  platform: ImagePlatform;
  usage?: DailyUsage;
};

type GenerateImageResponse =
  | GeneratedImage
  | { error?: string; usage?: DailyUsage };

type VideoScene = {
  time: string;
  visual: string;
  voiceover: string;
  overlayText: string;
};

type GeneratedVideoScript = {
  hook: string;
  scenes: VideoScene[];
  cta: string;
  caption: string;
  hashtags: string[];
};

type GenerateVideoScriptResponse =
  | GeneratedVideoScript
  | { error?: string; usage?: DailyUsage };

type HookItem = {
  hook: string;
  angle: string;
  overlayText: string;
};

type GeneratedHooks = {
  hooks: HookItem[];
  caption: string;
  hashtags: string[];
};

type GenerateHooksResponse =
  | GeneratedHooks
  | { error?: string; usage?: DailyUsage };

function GeneratorDemoSection({
  supabase,
  userId,
  onUpgradeClick,
}: {
  supabase: SupabaseBrowserClient | null;
  userId: string | null;
  onUpgradeClick: (source: UpgradeSource) => void;
}) {
  const [productName, setProductName] = useState(
    "Túi đeo chéo mini chống nước",
  );
  const [platform, setPlatform] = useState<Platform>("Shopee");
  const [tone, setTone] = useState<Tone>("Chuyên nghiệp");
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [productNameError, setProductNameError] = useState<string | null>(null);
  const [recentGenerations, setRecentGenerations] = useState<
    RecentGeneration[]
  >([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyErrorMessage, setHistoryErrorMessage] = useState<string | null>(
    null,
  );
  const [dailyUsage, setDailyUsage] = useState<DailyUsage | null>(null);
  const [accountPlan, setAccountPlan] = useState<AccountPlan>("free");
  const [usageErrorMessage, setUsageErrorMessage] = useState<string | null>(
    null,
  );

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchRecentGenerations = useCallback(async () => {
    if (!supabase || !userId) {
      if (isMountedRef.current) {
        setRecentGenerations([]);
        setHistoryErrorMessage(null);
        setIsHistoryLoading(false);
      }
      return;
    }

    if (isMountedRef.current) {
      setIsHistoryLoading(true);
      setHistoryErrorMessage(null);
    }

    const { data, error } = await supabase
      .from("generations")
      .select(
        "id, product_name, platform, tone, caption, hashtags, cta, description, created_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(RECENT_GENERATION_LIMIT)
      .returns<RecentGeneration[]>();

    if (!isMountedRef.current) {
      return;
    }

    setIsHistoryLoading(false);

    if (error) {
      console.error("Supabase generations select error", error.message);
      setRecentGenerations([]);
      setHistoryErrorMessage("Không tải được lịch sử gần đây.");
      return;
    }

    setRecentGenerations(data ?? []);
  }, [supabase, userId]);

  const fetchDailyUsage = useCallback(async () => {
    if (!supabase || !userId) {
      if (isMountedRef.current) {
        setDailyUsage(null);
        setAccountPlan("free");
        setUsageErrorMessage(null);
      }
      return;
    }

    const todayRange = getVietnamTodayRange();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("plan, daily_limit")
      .eq("id", userId)
      .maybeSingle()
      .returns<UsageProfile | null>();

    if (!isMountedRef.current) {
      return;
    }

    if (profileError) {
      console.error("Supabase profile select error", profileError.message);
      setDailyUsage(null);
      setUsageErrorMessage("Không tải được lượt còn lại.");
      return;
    }

    const { count, error: countError } = await supabase
      .from("generations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", todayRange.startIso)
      .lt("created_at", todayRange.endIso);

    if (!isMountedRef.current) {
      return;
    }

    if (countError) {
      console.error("Supabase generations count error", countError.message);
      setDailyUsage(null);
      setUsageErrorMessage("Không tải được lượt còn lại.");
      return;
    }

    const dailyLimit =
      typeof profile?.daily_limit === "number" && profile.daily_limit > 0
        ? profile.daily_limit
        : DEFAULT_DAILY_LIMIT;
    const usedToday = count ?? 0;

    setAccountPlan(normalizeAccountPlan(profile?.plan));
    setDailyUsage({
      dailyLimit,
      usedToday,
      remainingToday: Math.max(dailyLimit - usedToday, 0),
    });
    setUsageErrorMessage(null);
  }, [supabase, userId]);

  useEffect(() => {
    void Promise.resolve().then(fetchDailyUsage);
  }, [fetchDailyUsage]);

  useEffect(() => {
    void Promise.resolve().then(fetchRecentGenerations);
  }, [fetchRecentGenerations]);

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const analyticsProperties = getGeneratorAnalyticsProperties({
      platform,
      tone,
      accountPlan,
      userId,
    });
    const nextProductNameError = getProductNameError(productName);

    trackAnalyticsEvent("generate_clicked", analyticsProperties);

    if (nextProductNameError) {
      setContent(null);
      setErrorMessage(null);
      setProductNameError(nextProductNameError);
      trackAnalyticsEvent("generation_failed", {
        ...analyticsProperties,
        reason: "validation",
      });
      return;
    }

    setIsLoading(true);
    setContent(null);
    setErrorMessage(null);
    setProductNameError(null);

    let failedStatus: number | undefined;
    let failedReason: "request_error" | "invalid_response" = "request_error";

    try {
      const submittedProductName = productName.trim();
      const submittedPlatform = platform;
      const submittedTone = tone;

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: submittedProductName,
          platform: submittedPlatform,
          tone: submittedTone,
        }),
      });
      const data = (await response.json()) as GenerateResponse;

      if (!response.ok) {
        failedStatus = response.status;

        if (data.usage) {
          setDailyUsage(data.usage);
        }

        throw new Error(getGenerateErrorMessage(data));
      }

      if (!isGeneratedContent(data)) {
        failedReason = "invalid_response";
        throw new Error("API trả về định dạng không hợp lệ.");
      }

      setContent(data);
      trackAnalyticsEvent("generation_success", analyticsProperties);

      if (data.usage) {
        setDailyUsage(data.usage);
      } else {
        void fetchDailyUsage();
      }

      void fetchRecentGenerations();
    } catch (error) {
      trackAnalyticsEvent("generation_failed", {
        ...analyticsProperties,
        reason: failedReason,
        status: failedStatus,
      });
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể tạo nội dung. Vui lòng thử lại.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section
      id="generator"
      aria-labelledby="generator-title"
      className="relative isolate overflow-hidden border-y border-yellow-300/10 bg-[#050505]"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(250,204,21,0.22),transparent_32%),radial-gradient(circle_at_86%_72%,rgba(245,158,11,0.16),transparent_28%),linear-gradient(180deg,#070707_0%,#020202_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-[0.18] [background-image:linear-gradient(rgba(250,204,21,0.24)_1px,transparent_1px),linear-gradient(90deg,rgba(250,204,21,0.18)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(circle_at_50%_20%,black,transparent_72%)]" />
      <div className="absolute left-1/2 top-0 -z-10 h-px w-[78rem] -translate-x-1/2 bg-gradient-to-r from-transparent via-yellow-200/70 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.84fr_1.16fr] lg:items-end">
          <div>
            <p className="inline-flex rounded-lg border border-yellow-300/25 bg-yellow-300/10 px-3 py-2 text-xs font-extrabold uppercase text-yellow-100 shadow-[0_0_36px_rgba(250,204,21,0.16)]">
              AI Generator Demo
            </p>
            <h2
              id="generator-title"
              className="mt-6 max-w-2xl text-4xl font-black leading-[1.05] text-white md:text-6xl"
            >
              Tạo content bán hàng trong vài giây.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-zinc-400 md:text-lg">
              Nhập tên sản phẩm, chọn kênh bán và giọng điệu. Công cụ sẽ tạo
              caption, hashtag, CTA và mô tả sản phẩm cho seller Việt Nam qua
              API route server-side.
            </p>
          </div>

          <div className="relative rounded-lg border border-yellow-300/15 bg-black/55 p-2 shadow-[0_28px_90px_rgba(250,204,21,0.13)] backdrop-blur-xl">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-yellow-200 to-transparent" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {generatorSteps.map((step, index) => (
                <GeneratorStepCard key={step} step={step} index={index} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <form
            onSubmit={handleGenerate}
            aria-label="Tạo content bán hàng bằng AI"
            className="relative overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(145deg,rgba(22,22,22,0.96),rgba(5,5,5,0.96))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)] transition duration-500 ease-out hover:-translate-y-1 hover:border-yellow-300/35 hover:shadow-[0_36px_110px_rgba(250,204,21,0.12)] md:p-7"
          >
            <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-yellow-300/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-200/70 to-transparent" />

            <div className="relative flex items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <PanelTitle title="Input brief" description="" />
              </div>
              <StatusPill className="border-yellow-300/25 bg-yellow-300/10 text-yellow-100 shadow-[0_0_28px_rgba(250,204,21,0.14)]">
                Live demo
              </StatusPill>
            </div>

            <div className="relative mt-7 space-y-5">
              <label className="block">
                <span className={fieldLabelClassName}>Product name</span>
                <input
                  id="product-name"
                  name="productName"
                  value={productName}
                  onChange={(event) => {
                    const nextProductName = event.target.value;

                    setProductName(nextProductName);

                    if (productNameError) {
                      setProductNameError(getProductNameError(nextProductName));
                    }
                  }}
                  placeholder="Ví dụ: Nến thơm thư giãn hương gỗ"
                  aria-describedby={
                    productNameError ? "product-name-error" : undefined
                  }
                  aria-invalid={Boolean(productNameError)}
                  className={`${formControlClassName} placeholder:text-zinc-600`}
                />
                {productNameError ? (
                  <p
                    id="product-name-error"
                    className="mt-2 text-xs font-bold leading-5 text-red-200"
                  >
                    {productNameError}
                  </p>
                ) : null}
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className={fieldLabelClassName}>Platform</span>
                  <select
                    id="platform"
                    name="platform"
                    value={platform}
                    onChange={(event) =>
                      setPlatform(event.target.value as Platform)
                    }
                    className={formControlClassName}
                  >
                    {platforms.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className={fieldLabelClassName}>Tone</span>
                  <select
                    id="tone"
                    name="tone"
                    value={tone}
                    onChange={(event) => setTone(event.target.value as Tone)}
                    className={formControlClassName}
                  >
                    {tones.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group relative inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-lg bg-[linear-gradient(135deg,#fde68a_0%,#facc15_40%,#d97706_100%)] px-6 text-sm font-black text-black shadow-[0_20px_55px_rgba(250,204,21,0.24)] transition duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_26px_80px_rgba(250,204,21,0.38)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                <span className="absolute inset-y-0 -left-20 w-16 rotate-12 bg-white/35 blur-md transition duration-700 group-hover:left-[115%]" />
                <span className="relative flex items-center gap-2 transition duration-500 group-hover:scale-[1.02]">
                  {isLoading ? "Đang tạo nội dung..." : "Tạo content"}
                  <span aria-hidden="true">-&gt;</span>
                </span>
              </button>

              <div className="flex flex-col gap-3 text-xs font-bold leading-5 text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
                {userId ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill className="border-yellow-300/25 bg-yellow-300/10 text-yellow-100">
                      {getAccountPlanLabel(accountPlan)}
                    </StatusPill>
                    {dailyUsage ? (
                      <p className="text-yellow-100">
                        Còn {dailyUsage.remainingToday}/{dailyUsage.dailyLimit}{" "}
                        lượt hôm nay
                      </p>
                    ) : (
                      <p>{usageErrorMessage ?? "Đang tải lượt còn lại..."}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill className="border-white/10 bg-white/[0.04] text-zinc-300">
                      Gói Free
                    </StatusPill>
                    <p>Khách vẫn dùng được demo miễn phí.</p>
                  </div>
                )}
                {accountPlan === "free" ? (
                  <button
                    type="button"
                    onClick={() => onUpgradeClick("generator_usage")}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-yellow-300/35 bg-yellow-300/10 px-4 text-xs font-black text-yellow-200 transition hover:border-yellow-300 hover:bg-yellow-300 hover:text-black focus:outline-none focus:ring-2 focus:ring-yellow-300/60"
                  >
                    Nâng cấp Pro
                  </button>
                ) : null}
              </div>
            </div>
          </form>

          <div className="relative overflow-hidden rounded-lg border border-yellow-300/18 bg-[linear-gradient(145deg,rgba(18,18,18,0.96),rgba(4,4,4,0.98)_58%,rgba(28,19,5,0.92))] p-6 shadow-[0_30px_110px_rgba(250,204,21,0.12)] transition duration-500 ease-out hover:-translate-y-1 hover:border-yellow-300/45 hover:shadow-[0_36px_130px_rgba(250,204,21,0.18)] md:p-7">
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-yellow-300/12 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 translate-x-1/3 translate-y-1/3 rounded-full bg-amber-500/12 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-yellow-200 to-transparent" />

            <div className="relative flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <PanelTitle
                  title="AI output"
                  description="Caption, hashtag, CTA và mô tả"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusPill className="border-white/10 bg-white text-black shadow-[0_12px_34px_rgba(255,255,255,0.12)]">
                  {platform}
                </StatusPill>
                <StatusPill className="border-yellow-300/25 bg-yellow-300/10 text-yellow-100">
                  {tone}
                </StatusPill>
              </div>
            </div>

            <div aria-live="polite">
              {errorMessage ? (
                <div
                  role="alert"
                  className="relative mt-6 overflow-hidden rounded-lg border border-red-400/30 bg-red-500/[0.08] p-5 shadow-[inset_0_1px_0_rgba(248,113,113,0.18)]"
                >
                  <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-red-400/10 blur-3xl" />
                  <p className="relative text-sm font-black text-red-200">
                    Không tạo được nội dung
                  </p>
                  <p className="relative mt-2 text-sm leading-6 text-zinc-300">
                    {errorMessage}
                  </p>
                </div>
              ) : isLoading ? (
                <OutputLoadingSkeleton />
              ) : content ? (
                <div className="relative mt-6 grid gap-4">
                  <OutputBlock
                    title="Caption"
                    body={content.caption}
                    featured
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <OutputBlock
                      title="Hashtags"
                      body={content.hashtags.join(" ")}
                    />
                    <OutputBlock title="CTA" body={content.cta} />
                  </div>
                  <OutputBlock
                    title="Product description"
                    body={content.description}
                  />
                </div>
              ) : (
                <div className="relative mt-6 overflow-hidden rounded-lg border border-dashed border-yellow-300/30 bg-yellow-300/[0.045] p-8 text-center shadow-[inset_0_1px_0_rgba(250,204,21,0.18)]">
                  <div className="absolute left-1/2 top-0 h-24 w-64 -translate-x-1/2 rounded-full bg-yellow-300/10 blur-3xl" />
                  <p className="relative text-xl font-black text-white">
                    Sẵn sàng tạo bản nháp đầu tiên.
                  </p>
                  <p className="relative mt-3 text-sm leading-6 text-zinc-400">
                    Kết quả AI sẽ xuất hiện ở đây với nội dung tiếng Việt phù
                    hợp kênh bán hàng đã chọn.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <RecentHistorySection
          generations={recentGenerations}
          isLoading={isHistoryLoading}
          errorMessage={historyErrorMessage}
          isLoggedIn={Boolean(userId)}
        />
      </div>
    </section>
  );
}

function ImageGenerationSection({
  supabase,
  userId,
  onUpgradeClick,
}: {
  supabase: SupabaseBrowserClient | null;
  userId: string | null;
  onUpgradeClick: (source: UpgradeSource) => void;
}) {
  const [productName, setProductName] = useState("Set serum dưỡng sáng da");
  const [style, setStyle] = useState<ImageStyle>("Shopee banner");
  const [platform, setPlatform] = useState<ImagePlatform>("Shopee");
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState<GeneratedImage | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [productNameError, setProductNameError] = useState<string | null>(null);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage | null>(null);
  const [accountPlan, setAccountPlan] = useState<AccountPlan>("free");
  const [usageErrorMessage, setUsageErrorMessage] = useState<string | null>(
    null,
  );
  const isMountedRef = useRef(true);
  const imageRequestInFlightRef = useRef(false);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchImageDailyUsage = useCallback(async () => {
    if (!supabase || !userId) {
      if (isMountedRef.current) {
        setDailyUsage(null);
        setAccountPlan("free");
        setUsageErrorMessage(null);
      }
      return;
    }

    const todayRange = getVietnamTodayRange();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle()
      .returns<ImageUsageProfile | null>();

    if (!isMountedRef.current) {
      return;
    }

    if (profileError) {
      console.error("Supabase image profile select error", profileError.message);
      setDailyUsage(null);
      setUsageErrorMessage("Không tải được lượt ảnh còn lại.");
      return;
    }

    const { count, error: countError } = await supabase
      .from("image_generations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", todayRange.startIso)
      .lt("created_at", todayRange.endIso);

    if (!isMountedRef.current) {
      return;
    }

    if (countError) {
      console.error("Supabase image count error", countError.message);
      setDailyUsage(null);
      setUsageErrorMessage("Không tải được lượt ảnh còn lại.");
      return;
    }

    const nextAccountPlan = normalizeAccountPlan(profile?.plan);
    const dailyLimit = getImageDailyLimit(nextAccountPlan);
    const usedToday = count ?? 0;

    setAccountPlan(nextAccountPlan);
    setDailyUsage({
      dailyLimit,
      usedToday,
      remainingToday: Math.max(dailyLimit - usedToday, 0),
    });
    setUsageErrorMessage(null);
  }, [supabase, userId]);

  useEffect(() => {
    void Promise.resolve().then(fetchImageDailyUsage);
  }, [fetchImageDailyUsage]);

  async function handleGenerateImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading || imageRequestInFlightRef.current) {
      return;
    }

    const analyticsProperties = {
      platform,
      style,
      plan: accountPlan,
      authenticated: Boolean(userId),
    };
    const nextProductNameError = getProductNameError(productName);

    trackAnalyticsEvent("image_generate_clicked", analyticsProperties);

    if (nextProductNameError) {
      setImage(null);
      setErrorMessage(null);
      setProductNameError(nextProductNameError);
      trackAnalyticsEvent("image_generation_failed", {
        ...analyticsProperties,
        reason: "validation",
      });
      return;
    }

    imageRequestInFlightRef.current = true;
    setIsLoading(true);
    setImage(null);
    setErrorMessage(null);
    setProductNameError(null);

    let failedStatus: number | undefined;
    let failedReason: "request_error" | "invalid_response" = "request_error";

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productName.trim(),
          style,
          platform,
        }),
      });
      const data = (await response.json()) as GenerateImageResponse;

      if (!response.ok) {
        failedStatus = response.status;

        if (data.usage) {
          setDailyUsage(data.usage);
        }

        throw new Error(getGenerateImageErrorMessage(data));
      }

      if (!isGeneratedImage(data)) {
        failedReason = "invalid_response";
        throw new Error("API trả về định dạng ảnh không hợp lệ.");
      }

      setImage(data);
      trackAnalyticsEvent("image_generation_success", analyticsProperties);

      if (data.usage) {
        setDailyUsage(data.usage);
      } else {
        void fetchImageDailyUsage();
      }
    } catch (error) {
      trackAnalyticsEvent("image_generation_failed", {
        ...analyticsProperties,
        reason: failedReason,
        status: failedStatus,
      });
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể tạo ảnh. Vui lòng thử lại.",
      );
    } finally {
      imageRequestInFlightRef.current = false;
      setIsLoading(false);
    }
  }

  return (
    <section
      id="image-generator"
      aria-labelledby="image-generator-title"
      className="relative isolate overflow-hidden border-b border-yellow-300/10 bg-[#080808]"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_0%,rgba(250,204,21,0.16),transparent_30%),linear-gradient(180deg,#090909_0%,#030303_100%)]" />
      <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-end">
          <div>
            <p className="inline-flex rounded-lg border border-yellow-300/25 bg-yellow-300/10 px-3 py-2 text-xs font-extrabold uppercase text-yellow-100">
              AI tạo ảnh bán hàng
            </p>
            <h2
              id="image-generator-title"
              className="mt-6 max-w-3xl text-4xl font-black leading-[1.05] text-white md:text-5xl"
            >
              Tạo visual marketing cho Shopee và TikTok Shop.
            </h2>
          </div>
          <p className="text-base font-semibold leading-8 text-zinc-400">
            Mỗi lần tạo dùng một prompt ngắn, một ảnh vuông chất lượng thấp để
            giữ chi phí hợp lý cho MVP.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <form
            onSubmit={handleGenerateImage}
            aria-label="Tạo ảnh bán hàng bằng AI"
            className="relative overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(145deg,rgba(22,22,22,0.96),rgba(5,5,5,0.96))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.52)] md:p-7"
          >
            <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-yellow-300/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-200/70 to-transparent" />

            <div className="relative flex items-center justify-between gap-4 border-b border-white/10 pb-5">
              <PanelTitle title="Image brief" description="1 ảnh/lần tạo" />
              <StatusPill className="border-yellow-300/25 bg-yellow-300/10 text-yellow-100">
                gpt-image-1
              </StatusPill>
            </div>

            <div className="relative mt-7 space-y-5">
              <label className="block">
                <span className={fieldLabelClassName}>Product name</span>
                <input
                  value={productName}
                  onChange={(event) => {
                    const nextProductName = event.target.value;

                    setProductName(nextProductName);

                    if (productNameError) {
                      setProductNameError(getProductNameError(nextProductName));
                    }
                  }}
                  placeholder="Ví dụ: Máy xay sinh tố mini"
                  aria-describedby={
                    productNameError ? "image-product-name-error" : undefined
                  }
                  aria-invalid={Boolean(productNameError)}
                  className={`${formControlClassName} placeholder:text-zinc-600`}
                />
                {productNameError ? (
                  <p
                    id="image-product-name-error"
                    className="mt-2 text-xs font-bold leading-5 text-red-200"
                  >
                    {productNameError}
                  </p>
                ) : null}
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className={fieldLabelClassName}>Style</span>
                  <select
                    value={style}
                    onChange={(event) =>
                      setStyle(event.target.value as ImageStyle)
                    }
                    className={formControlClassName}
                  >
                    {imageStyles.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className={fieldLabelClassName}>Platform</span>
                  <select
                    value={platform}
                    onChange={(event) =>
                      setPlatform(event.target.value as ImagePlatform)
                    }
                    className={formControlClassName}
                  >
                    {imagePlatforms.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading || !userId}
                className="group relative inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-lg bg-[linear-gradient(135deg,#fde68a_0%,#facc15_40%,#d97706_100%)] px-6 text-sm font-black text-black shadow-[0_20px_55px_rgba(250,204,21,0.24)] transition duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_26px_80px_rgba(250,204,21,0.38)] focus:outline-none focus:ring-2 focus:ring-yellow-300/70 focus:ring-offset-2 focus:ring-offset-black disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                <span className="absolute inset-y-0 -left-20 w-16 rotate-12 bg-white/35 blur-md transition duration-700 group-hover:left-[115%]" />
                <span className="relative flex items-center gap-2 transition duration-500 group-hover:scale-[1.02]">
                  {isLoading ? "Đang tạo ảnh..." : "Tạo ảnh bán hàng"}
                  <span aria-hidden="true">-&gt;</span>
                </span>
              </button>

              <div className="flex flex-col gap-3 text-xs font-bold leading-5 text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
                {userId ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill className="border-yellow-300/25 bg-yellow-300/10 text-yellow-100">
                      {getAccountPlanLabel(accountPlan)}
                    </StatusPill>
                    {dailyUsage ? (
                      <p className="text-yellow-100">
                        Còn {dailyUsage.remainingToday}/{dailyUsage.dailyLimit}{" "}
                        ảnh hôm nay
                      </p>
                    ) : (
                      <p>
                        {usageErrorMessage ?? "Đang tải lượt ảnh còn lại..."}
                      </p>
                    )}
                  </div>
                ) : (
                  <p>Đăng nhập để tạo ảnh và kiểm soát giới hạn chi phí.</p>
                )}
                {accountPlan === "free" ? (
                  <button
                    type="button"
                    onClick={() => onUpgradeClick("generator_usage")}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-yellow-300/35 bg-yellow-300/10 px-4 text-xs font-black text-yellow-200 transition hover:border-yellow-300 hover:bg-yellow-300 hover:text-black focus:outline-none focus:ring-2 focus:ring-yellow-300/60"
                  >
                    Nâng cấp Pro
                  </button>
                ) : null}
              </div>
            </div>
          </form>

          <div className="relative overflow-hidden rounded-lg border border-yellow-300/18 bg-[linear-gradient(145deg,rgba(18,18,18,0.96),rgba(4,4,4,0.98)_58%,rgba(28,19,5,0.92))] p-6 shadow-[0_30px_110px_rgba(250,204,21,0.12)] md:p-7">
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-yellow-300/12 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-yellow-200 to-transparent" />

            <div className="relative flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <PanelTitle
                title="Image output"
                description="Visual thương mại điện tử"
              />
              <div className="flex flex-wrap gap-2">
                <StatusPill className="border-white/10 bg-white text-black">
                  {platform}
                </StatusPill>
                <StatusPill className="border-yellow-300/25 bg-yellow-300/10 text-yellow-100">
                  {style}
                </StatusPill>
              </div>
            </div>

            <div aria-live="polite">
              {errorMessage ? (
                <div
                  role="alert"
                  className="relative mt-6 overflow-hidden rounded-lg border border-red-400/30 bg-red-500/[0.08] p-5"
                >
                  <p className="relative text-sm font-black text-red-200">
                    Không tạo được ảnh
                  </p>
                  <p className="relative mt-2 text-sm leading-6 text-zinc-300">
                    {errorMessage}
                  </p>
                </div>
              ) : isLoading ? (
                <ImageLoadingSkeleton />
              ) : image ? (
                <article className="relative mt-6 overflow-hidden rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <Image
                    src={image.imageDataUrl}
                    alt={`Ảnh bán hàng AI cho ${image.productName}`}
                    width={1024}
                    height={1024}
                    unoptimized
                    className="aspect-square w-full rounded-lg border border-white/10 object-cover"
                  />
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-white">
                        {image.productName}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-zinc-500">
                        {image.platform} • {image.style}
                      </p>
                    </div>
                    <a
                      href={image.imageDataUrl}
                      download={getImageDownloadName(image)}
                      className="inline-flex h-11 items-center justify-center rounded-full border border-yellow-300/35 bg-yellow-300/10 px-5 text-xs font-black text-yellow-200 transition hover:border-yellow-300 hover:bg-yellow-300 hover:text-black focus:outline-none focus:ring-2 focus:ring-yellow-300/60"
                    >
                      Tải ảnh
                    </a>
                  </div>
                </article>
              ) : (
                <div className="relative mt-6 overflow-hidden rounded-lg border border-dashed border-yellow-300/30 bg-yellow-300/[0.045] p-8 text-center">
                  <p className="relative text-xl font-black text-white">
                    Ảnh bán hàng sẽ xuất hiện ở đây.
                  </p>
                  <p className="relative mt-3 text-sm leading-6 text-zinc-400">
                    Kết quả phù hợp cho banner sản phẩm, thumbnail video ngắn
                    và visual quảng cáo đơn giản.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function VideoScriptSection({
  supabase,
  userId,
  onUpgradeClick,
}: {
  supabase: SupabaseBrowserClient | null;
  userId: string | null;
  onUpgradeClick: (source: UpgradeSource) => void;
}) {
  const [productName, setProductName] = useState("Túi đeo chéo mini chống nước");
  const [platform, setPlatform] = useState<VideoScriptPlatform>("TikTok Shop");
  const [tone, setTone] = useState<VideoScriptTone>("Gen Z");
  const [duration, setDuration] = useState<VideoScriptDuration>("30 giây");
  const [isLoading, setIsLoading] = useState(false);
  const [script, setScript] = useState<GeneratedVideoScript | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [productNameError, setProductNameError] = useState<string | null>(null);
  const [accountPlan, setAccountPlan] = useState<AccountPlan>("free");
  const [dailyUsage, setDailyUsage] = useState<DailyUsage | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchVideoScriptUsage = useCallback(async () => {
    if (!supabase || !userId) {
      if (isMountedRef.current) {
        setDailyUsage(null);
        setAccountPlan("free");
      }
      return;
    }

    const todayRange = getVietnamTodayRange();
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle()
      .returns<{ plan: string | null } | null>();

    if (!isMountedRef.current) return;

    const { count } = await supabase
      .from("video_scripts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", todayRange.startIso)
      .lt("created_at", todayRange.endIso);

    if (!isMountedRef.current) return;

    const nextPlan = normalizeAccountPlan(profile?.plan);
    const limit =
      nextPlan === "pro" ? PRO_VIDEO_SCRIPT_DAILY_LIMIT : FREE_VIDEO_SCRIPT_DAILY_LIMIT;
    const usedToday = count ?? 0;

    setAccountPlan(nextPlan);
    setDailyUsage({
      dailyLimit: limit,
      usedToday,
      remainingToday: Math.max(limit - usedToday, 0),
    });
  }, [supabase, userId]);

  useEffect(() => {
    void Promise.resolve().then(fetchVideoScriptUsage);
  }, [fetchVideoScriptUsage]);

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) return;

    const nextProductNameError = getProductNameError(productName);
    trackAnalyticsEvent("video_script_generate_clicked", {
      platform,
      tone,
      duration,
      plan: accountPlan,
      authenticated: Boolean(userId),
    });

    if (nextProductNameError) {
      setScript(null);
      setErrorMessage(null);
      setProductNameError(nextProductNameError);
      return;
    }

    setIsLoading(true);
    setScript(null);
    setErrorMessage(null);
    setProductNameError(null);

    try {
      const response = await fetch("/api/generate-video-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productName.trim(),
          platform,
          tone,
          duration,
        }),
      });
      const data = (await response.json()) as GenerateVideoScriptResponse;

      if (!response.ok) {
        if ("usage" in data && data.usage) {
          setDailyUsage(data.usage);
        }
        throw new Error(
          "error" in data && data.error
            ? data.error
            : "Không thể tạo kịch bản. Vui lòng thử lại.",
        );
      }

      if (!isGeneratedVideoScript(data)) {
        throw new Error("API trả về định dạng không hợp lệ.");
      }

      setScript(data);
      trackAnalyticsEvent("video_script_generation_success", {
        platform,
        tone,
        duration,
        plan: accountPlan,
        authenticated: Boolean(userId),
      });
      void fetchVideoScriptUsage();
    } catch (error) {
      trackAnalyticsEvent("video_script_generation_failed", {
        platform,
        tone,
        duration,
        plan: accountPlan,
        authenticated: Boolean(userId),
      });
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể tạo kịch bản. Vui lòng thử lại.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section
      id="video-script"
      aria-labelledby="video-script-title"
      className="relative isolate overflow-hidden border-b border-yellow-300/10 bg-[#060606]"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_10%,rgba(250,204,21,0.14),transparent_30%),linear-gradient(180deg,#070707_0%,#020202_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-[0.14] [background-image:linear-gradient(rgba(250,204,21,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(250,204,21,0.14)_1px,transparent_1px)] [background-size:80px_80px] [mask-image:radial-gradient(circle_at_80%_20%,black,transparent_65%)]" />
      <div className="absolute left-1/2 top-0 -z-10 h-px w-[72rem] -translate-x-1/2 bg-gradient-to-r from-transparent via-yellow-200/60 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-end">
          <div>
            <p className="inline-flex rounded-lg border border-yellow-300/25 bg-yellow-300/10 px-3 py-2 text-xs font-extrabold uppercase text-yellow-100">
              AI viết kịch bản video bán hàng
            </p>
            <h2
              id="video-script-title"
              className="mt-6 max-w-3xl text-4xl font-black leading-[1.05] text-white md:text-5xl"
            >
              Kịch bản video TikTok Shop và Shopee trong vài giây.
            </h2>
          </div>
          <p className="text-base font-semibold leading-8 text-zinc-400">
            Nhập sản phẩm, chọn kênh, tone và thời lượng. AI tự tạo hook, từng
            cảnh quay, lời thoại và CTA hoàn chỉnh cho seller tự quay.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <form
            onSubmit={handleGenerate}
            aria-label="Tạo kịch bản video bán hàng bằng AI"
            className="relative overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(145deg,rgba(22,22,22,0.96),rgba(5,5,5,0.96))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.52)] md:p-7"
          >
            <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-yellow-300/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-200/70 to-transparent" />

            <div className="relative flex items-center justify-between gap-4 border-b border-white/10 pb-5">
              <PanelTitle title="Video brief" description="Hook + cảnh + CTA" />
              <StatusPill className="border-yellow-300/25 bg-yellow-300/10 text-yellow-100">
                {duration}
              </StatusPill>
            </div>

            <div className="relative mt-7 space-y-5">
              <label className="block">
                <span className={fieldLabelClassName}>Product name</span>
                <input
                  value={productName}
                  onChange={(event) => {
                    const next = event.target.value;
                    setProductName(next);
                    if (productNameError) {
                      setProductNameError(getProductNameError(next));
                    }
                  }}
                  placeholder="Ví dụ: Serum dưỡng trắng da ban đêm"
                  aria-describedby={
                    productNameError ? "vs-product-name-error" : undefined
                  }
                  aria-invalid={Boolean(productNameError)}
                  className={`${formControlClassName} placeholder:text-zinc-600`}
                />
                {productNameError ? (
                  <p
                    id="vs-product-name-error"
                    className="mt-2 text-xs font-bold leading-5 text-red-200"
                  >
                    {productNameError}
                  </p>
                ) : null}
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className={fieldLabelClassName}>Platform</span>
                  <select
                    value={platform}
                    onChange={(event) =>
                      setPlatform(event.target.value as VideoScriptPlatform)
                    }
                    className={formControlClassName}
                  >
                    {videoScriptPlatforms.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className={fieldLabelClassName}>Tone</span>
                  <select
                    value={tone}
                    onChange={(event) =>
                      setTone(event.target.value as VideoScriptTone)
                    }
                    className={formControlClassName}
                  >
                    {videoScriptTones.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className={fieldLabelClassName}>Thời lượng video</span>
                <select
                  value={duration}
                  onChange={(event) =>
                    setDuration(event.target.value as VideoScriptDuration)
                  }
                  className={formControlClassName}
                >
                  {videoScriptDurations.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="group relative inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-lg bg-[linear-gradient(135deg,#fde68a_0%,#facc15_40%,#d97706_100%)] px-6 text-sm font-black text-black shadow-[0_20px_55px_rgba(250,204,21,0.24)] transition duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_26px_80px_rgba(250,204,21,0.38)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                <span className="absolute inset-y-0 -left-20 w-16 rotate-12 bg-white/35 blur-md transition duration-700 group-hover:left-[115%]" />
                <span className="relative flex items-center gap-2 transition duration-500 group-hover:scale-[1.02]">
                  {isLoading ? "Đang tạo kịch bản..." : "Tạo kịch bản video"}
                  <span aria-hidden="true">-&gt;</span>
                </span>
              </button>

              <div className="flex flex-col gap-3 text-xs font-bold leading-5 text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
                {userId ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill className="border-yellow-300/25 bg-yellow-300/10 text-yellow-100">
                      {getAccountPlanLabel(accountPlan)}
                    </StatusPill>
                    {dailyUsage ? (
                      <p className="text-yellow-100">
                        Kịch bản video: còn {dailyUsage.remainingToday}/
                        {dailyUsage.dailyLimit} lượt hôm nay
                      </p>
                    ) : (
                      <p>Đang tải lượt còn lại...</p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill className="border-white/10 bg-white/[0.04] text-zinc-300">
                      Gói Free
                    </StatusPill>
                    <p>Khách vẫn dùng được {FREE_VIDEO_SCRIPT_DAILY_LIMIT} kịch bản/ngày.</p>
                  </div>
                )}
                {accountPlan === "free" ? (
                  <button
                    type="button"
                    onClick={() => onUpgradeClick("generator_usage")}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-yellow-300/35 bg-yellow-300/10 px-4 text-xs font-black text-yellow-200 transition hover:border-yellow-300 hover:bg-yellow-300 hover:text-black focus:outline-none focus:ring-2 focus:ring-yellow-300/60"
                  >
                    Nâng cấp Pro
                  </button>
                ) : null}
              </div>
            </div>
          </form>

          <div className="relative overflow-hidden rounded-lg border border-yellow-300/18 bg-[linear-gradient(145deg,rgba(18,18,18,0.96),rgba(4,4,4,0.98)_58%,rgba(28,19,5,0.92))] p-6 shadow-[0_30px_110px_rgba(250,204,21,0.12)] md:p-7">
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-yellow-300/12 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-yellow-200 to-transparent" />

            <div className="relative flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <PanelTitle
                title="Video script output"
                description="Hook, cảnh, CTA, caption"
              />
              <div className="flex flex-wrap gap-2">
                <StatusPill className="border-white/10 bg-white text-black">
                  {platform}
                </StatusPill>
                <StatusPill className="border-yellow-300/25 bg-yellow-300/10 text-yellow-100">
                  {tone}
                </StatusPill>
              </div>
            </div>

            <div aria-live="polite">
              {errorMessage ? (
                <div
                  role="alert"
                  className="relative mt-6 overflow-hidden rounded-lg border border-red-400/30 bg-red-500/[0.08] p-5 shadow-[inset_0_1px_0_rgba(248,113,113,0.18)]"
                >
                  <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-red-400/10 blur-3xl" />
                  <p className="relative text-sm font-black text-red-200">
                    Không tạo được kịch bản
                  </p>
                  <p className="relative mt-2 text-sm leading-6 text-zinc-300">
                    {errorMessage}
                  </p>
                </div>
              ) : isLoading ? (
                <VideoScriptLoadingSkeleton />
              ) : script ? (
                <VideoScriptOutput script={script} />
              ) : (
                <div className="relative mt-6 overflow-hidden rounded-lg border border-dashed border-yellow-300/30 bg-yellow-300/[0.045] p-8 text-center shadow-[inset_0_1px_0_rgba(250,204,21,0.18)]">
                  <div className="absolute left-1/2 top-0 h-24 w-64 -translate-x-1/2 rounded-full bg-yellow-300/10 blur-3xl" />
                  <p className="relative text-xl font-black text-white">
                    Kịch bản video sẽ xuất hiện ở đây.
                  </p>
                  <p className="relative mt-3 text-sm leading-6 text-zinc-400">
                    Hook, từng cảnh quay, lời thoại và CTA cho seller tự quay
                    tại nhà.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function VideoScriptOutput({ script }: { script: GeneratedVideoScript }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function copyToClipboard(text: string, key: string) {
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    });
  }

  return (
    <div className="relative mt-6 space-y-4">
      <article className="group relative overflow-hidden rounded-lg border border-yellow-200/70 bg-[linear-gradient(135deg,#fde68a_0%,#facc15_46%,#d97706_100%)] p-5 shadow-[0_26px_80px_rgba(250,204,21,0.26)]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-white/30 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-black/20" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-xs font-black text-yellow-300 shadow-[0_12px_30px_rgba(0,0,0,0.2)]">
              H
            </span>
            <p className="text-xs font-black uppercase text-black/65">Hook</p>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(script.hook, "hook")}
            className="rounded-lg bg-black/10 px-2.5 py-1 text-[11px] font-black text-black/70 transition hover:bg-black/20 focus:outline-none"
            aria-label="Sao chép hook"
          >
            {copiedKey === "hook" ? "Đã chép" : "Chép"}
          </button>
        </div>
        <p className="relative mt-4 text-sm font-semibold leading-7 text-black">
          {script.hook}
        </p>
      </article>

      <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.055]">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-yellow-300/25 bg-yellow-300/10 text-xs font-black text-yellow-200">
            S
          </span>
          <p className="text-xs font-black uppercase text-yellow-200">Scenes</p>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {script.scenes.map((scene, index) => (
            <div key={index} className="px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="rounded-lg border border-yellow-300/25 bg-yellow-300/10 px-2.5 py-1 text-[11px] font-black text-yellow-200">
                  {scene.time}
                </span>
                <span className="text-xs font-black text-zinc-500">
                  Cảnh {index + 1}
                </span>
              </div>
              <dl className="mt-3 grid gap-2">
                <div>
                  <dt className="text-[10px] font-black uppercase text-zinc-600">
                    Visual
                  </dt>
                  <dd className="mt-1 text-sm font-semibold leading-6 text-zinc-300">
                    {scene.visual}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-black uppercase text-zinc-600">
                    Voiceover
                  </dt>
                  <dd className="mt-1 text-sm font-semibold leading-6 text-white">
                    {scene.voiceover}
                  </dd>
                </div>
                {scene.overlayText ? (
                  <div>
                    <dt className="text-[10px] font-black uppercase text-zinc-600">
                      Text trên màn hình
                    </dt>
                    <dd className="mt-1 inline-flex rounded-lg border border-yellow-300/20 bg-yellow-300/10 px-3 py-1 text-xs font-black text-yellow-100">
                      {scene.overlayText}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <article className="relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-yellow-300/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-200/60 to-transparent" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-yellow-300/25 bg-yellow-300/10 text-xs font-black text-yellow-200">
                C
              </span>
              <p className="text-xs font-black uppercase text-yellow-200">CTA</p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(script.cta, "cta")}
              className="rounded-lg border border-white/10 bg-black/35 px-2.5 py-1 text-[11px] font-black text-zinc-400 transition hover:text-yellow-200 focus:outline-none"
              aria-label="Sao chép CTA"
            >
              {copiedKey === "cta" ? "Đã chép" : "Chép"}
            </button>
          </div>
          <p className="relative mt-4 text-sm font-semibold leading-7 text-zinc-200">
            {script.cta}
          </p>
        </article>

        <article className="relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-yellow-300/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-200/60 to-transparent" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-yellow-300/25 bg-yellow-300/10 text-xs font-black text-yellow-200">
                #
              </span>
              <p className="text-xs font-black uppercase text-yellow-200">Hashtags</p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(script.hashtags.join(" "), "hashtags")}
              className="rounded-lg border border-white/10 bg-black/35 px-2.5 py-1 text-[11px] font-black text-zinc-400 transition hover:text-yellow-200 focus:outline-none"
              aria-label="Sao chép hashtag"
            >
              {copiedKey === "hashtags" ? "Đã chép" : "Chép"}
            </button>
          </div>
          <p className="relative mt-4 text-sm font-bold leading-7 text-yellow-200/90">
            {script.hashtags.join(" ")}
          </p>
        </article>
      </div>

      <article className="relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-yellow-300/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-200/60 to-transparent" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-yellow-300/25 bg-yellow-300/10 text-xs font-black text-yellow-200">
              C
            </span>
            <p className="text-xs font-black uppercase text-yellow-200">Caption</p>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(script.caption, "caption")}
            className="rounded-lg border border-white/10 bg-black/35 px-2.5 py-1 text-[11px] font-black text-zinc-400 transition hover:text-yellow-200 focus:outline-none"
            aria-label="Sao chép caption"
          >
            {copiedKey === "caption" ? "Đã chép" : "Chép"}
          </button>
        </div>
        <p className="relative mt-4 text-sm font-semibold leading-7 text-zinc-200">
          {script.caption}
        </p>
      </article>
    </div>
  );
}

function VideoScriptLoadingSkeleton() {
  return (
    <div className="relative mt-6 space-y-4">
      <div className="overflow-hidden rounded-lg border border-yellow-200/40 bg-yellow-300/10 p-5">
        <div className="h-3 w-16 animate-pulse rounded-full bg-yellow-300/40" />
        <div className="mt-4 h-3 w-full animate-pulse rounded-full bg-yellow-300/20" />
        <div className="mt-3 h-3 w-3/4 animate-pulse rounded-full bg-yellow-300/20" />
      </div>
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] p-5"
        >
          <div className="h-3 w-20 animate-pulse rounded-full bg-yellow-300/30" />
          <div className="mt-4 h-3 w-full animate-pulse rounded-full bg-white/10" />
          <div className="mt-3 h-3 w-4/5 animate-pulse rounded-full bg-white/10" />
          <div className="mt-3 h-3 w-2/3 animate-pulse rounded-full bg-white/10" />
        </div>
      ))}
    </div>
  );
}

function RecentHistorySection({
  generations,
  isLoading,
  errorMessage,
  isLoggedIn,
}: {
  generations: RecentGeneration[];
  isLoading: boolean;
  errorMessage: string | null;
  isLoggedIn: boolean;
}) {
  return (
    <section className="relative mt-6 overflow-hidden rounded-lg border border-white/10 bg-black/55 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.38)] md:p-7">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-yellow-200/70 to-transparent" />
      <div className="relative flex flex-col gap-2 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <PanelTitle
          title="Lịch sử gần đây"
          description={
            isLoggedIn
              ? "5 nội dung mới nhất đã lưu"
              : "Đăng nhập để tự động lưu nội dung đã tạo"
          }
        />
        {isLoggedIn ? (
          <StatusPill className="border-yellow-300/25 bg-yellow-300/10 text-yellow-100">
            Latest 5
          </StatusPill>
        ) : null}
      </div>

      {!isLoggedIn ? (
        <p className="relative mt-5 rounded-lg border border-dashed border-yellow-300/25 bg-yellow-300/[0.04] p-5 text-sm font-semibold leading-6 text-zinc-300">
          Bạn vẫn có thể tạo content miễn phí. Khi đăng nhập, kết quả thành công
          sẽ được lưu vào lịch sử.
        </p>
      ) : errorMessage ? (
        <p
          role="alert"
          className="relative mt-5 rounded-lg border border-red-400/30 bg-red-500/[0.08] p-5 text-sm font-bold leading-6 text-red-200"
        >
          {errorMessage}
        </p>
      ) : isLoading ? (
        <div className="relative mt-5 grid gap-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-lg border border-white/10 bg-white/[0.04] p-4"
            >
              <div className="h-3 w-40 animate-pulse rounded-full bg-yellow-300/25" />
              <div className="mt-4 h-3 w-full animate-pulse rounded-full bg-white/10" />
            </div>
          ))}
        </div>
      ) : generations.length > 0 ? (
        <div className="relative mt-5 grid gap-3">
          {generations.map((generation) => (
            <RecentGenerationItem key={generation.id} generation={generation} />
          ))}
        </div>
      ) : (
        <p className="relative mt-5 rounded-lg border border-dashed border-white/10 bg-white/[0.04] p-5 text-sm font-semibold leading-6 text-zinc-400">
          Chưa có nội dung nào được lưu.
        </p>
      )}
    </section>
  );
}

function RecentGenerationItem({
  generation,
}: {
  generation: RecentGeneration;
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-white/[0.045] p-4 transition duration-300 hover:border-yellow-300/35 hover:bg-white/[0.065]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black text-white">
            {generation.product_name}
          </p>
          <p className="mt-1 text-xs font-semibold text-zinc-500">
            {generation.platform} • {generation.tone}
          </p>
        </div>
        <span className="shrink-0 rounded-lg border border-yellow-300/20 bg-yellow-300/10 px-3 py-1 text-xs font-black text-yellow-100">
          {formatGenerationTime(generation.created_at)}
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-zinc-300">
        {generation.caption}
      </p>
      <p className="mt-3 line-clamp-1 text-xs font-bold leading-5 text-yellow-200/90">
        {generation.hashtags.join(" ")}
      </p>
    </article>
  );
}

function PanelTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <>
      <p className="text-sm font-black text-yellow-200">{title}</p>
      <p className="mt-1 text-xs font-semibold text-zinc-500">{description}</p>
    </>
  );
}

function StatusPill({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <span
      className={`rounded-lg border px-3 py-1 text-xs font-black ${className}`}
    >
      {children}
    </span>
  );
}

function GeneratorStepCard({ step, index }: { step: string; index: number }) {
  return (
    <div className="group rounded-lg border border-white/10 bg-white/[0.035] px-4 py-4 transition duration-500 ease-out hover:-translate-y-0.5 hover:border-yellow-300/45 hover:bg-yellow-300/[0.08] hover:shadow-[0_18px_50px_rgba(250,204,21,0.16)]">
      <span className="text-xs font-black text-yellow-300/80">
        0{index + 1}
      </span>
      <p className="mt-2 text-sm font-bold text-zinc-200 transition duration-500 group-hover:text-yellow-100">
        {step}
      </p>
    </div>
  );
}

function OutputLoadingSkeleton() {
  return (
    <div className="relative mt-6 space-y-4">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] p-5"
        >
          <div className="h-3 w-24 animate-pulse rounded-full bg-yellow-300/30" />
          <div className="mt-5 h-3 w-full animate-pulse rounded-full bg-white/10" />
          <div className="mt-3 h-3 w-4/5 animate-pulse rounded-full bg-white/10" />
        </div>
      ))}
    </div>
  );
}

function ImageLoadingSkeleton() {
  return (
    <div className="relative mt-6 overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] p-4">
      <div className="aspect-square w-full animate-pulse rounded-lg bg-yellow-300/10" />
      <div className="mt-5 h-3 w-44 animate-pulse rounded-full bg-yellow-300/30" />
      <div className="mt-3 h-3 w-28 animate-pulse rounded-full bg-white/10" />
    </div>
  );
}

function OutputBlock({
  title,
  body,
  featured = false,
}: {
  title: string;
  body: string;
  featured?: boolean;
}) {
  return (
    <article
      className={`group relative overflow-hidden rounded-lg border p-5 transition duration-500 ease-out hover:-translate-y-1 ${
        featured
          ? "border-yellow-200/70 bg-[linear-gradient(135deg,#fde68a_0%,#facc15_46%,#d97706_100%)] text-black shadow-[0_26px_80px_rgba(250,204,21,0.26)] hover:shadow-[0_32px_95px_rgba(250,204,21,0.34)]"
          : "border-white/10 bg-white/[0.055] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-yellow-300/35 hover:bg-white/[0.075] hover:shadow-[0_22px_70px_rgba(250,204,21,0.12)]"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-px ${
          featured
            ? "bg-black/20"
            : "bg-gradient-to-r from-transparent via-yellow-200/60 to-transparent"
        }`}
      />
      {featured ? (
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-white/30 blur-3xl" />
      ) : (
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-yellow-300/10 blur-3xl transition duration-500 group-hover:bg-yellow-300/16" />
      )}

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black ${
              featured
                ? "bg-black text-yellow-300 shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
                : "border border-yellow-300/25 bg-yellow-300/10 text-yellow-200"
            }`}
          >
            {title.slice(0, 1)}
          </span>
          <p
            className={`text-xs font-black uppercase ${
              featured ? "text-black/65" : "text-yellow-200"
            }`}
          >
            {title}
          </p>
        </div>
        <span
          className={`rounded-lg px-2.5 py-1 text-[11px] font-black ${
            featured
              ? "bg-black/10 text-black/60"
              : "border border-white/10 bg-black/35 text-zinc-400"
          }`}
        >
          {featured ? "Hero" : "Ready"}
        </span>
      </div>
      <p
        className={`relative mt-4 text-sm font-semibold leading-7 ${
          featured ? "text-black" : "text-zinc-200"
        }`}
      >
        {body}
      </p>
    </article>
  );
}

function getGenerateErrorMessage(data: GenerateResponse) {
  return "error" in data && data.error
    ? data.error
    : "Không thể tạo nội dung. Vui lòng thử lại.";
}

function getGenerateImageErrorMessage(data: GenerateImageResponse) {
  return "error" in data && data.error
    ? data.error
    : "Không thể tạo ảnh. Vui lòng thử lại.";
}

function formatGenerationTime(value: string | null) {
  if (!value) {
    return "Mới lưu";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Mới lưu";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getVietnamTodayRange() {
  const vietnamOffsetMs = 7 * 60 * 60 * 1000;
  const dayMs = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const startMs =
    Math.floor((now + vietnamOffsetMs) / dayMs) * dayMs - vietnamOffsetMs;

  return {
    startIso: new Date(startMs).toISOString(),
    endIso: new Date(startMs + dayMs).toISOString(),
  };
}

function normalizeAccountPlan(plan: string | null | undefined): AccountPlan {
  return plan?.toLowerCase() === "pro" ? "pro" : "free";
}

function getAccountPlanLabel(plan: AccountPlan) {
  return plan === "pro" ? "Gói Pro" : "Gói Free";
}

function getImageDailyLimit(plan: AccountPlan) {
  return plan === "pro" ? PRO_IMAGE_DAILY_LIMIT : FREE_IMAGE_DAILY_LIMIT;
}

function getImageDownloadName(image: GeneratedImage) {
  const slug = image.productName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${slug || "ai-product-image"}.jpg`;
}

function getGeneratorAnalyticsProperties({
  platform,
  tone,
  accountPlan,
  userId,
}: {
  platform: Platform;
  tone: Tone;
  accountPlan: AccountPlan;
  userId: string | null;
}) {
  return {
    platform,
    tone,
    plan: accountPlan,
    authenticated: Boolean(userId),
  };
}

function trackAnalyticsEvent(
  name: AnalyticsEventName,
  properties?: AnalyticsEventProperties,
) {
  track(name, properties);
}

function getProductNameError(productName: string) {
  const trimmedProductName = productName.trim();

  if (!trimmedProductName) {
    return "Vui lòng nhập tên sản phẩm.";
  }

  if (trimmedProductName.length < MIN_PRODUCT_NAME_LENGTH) {
    return `Tên sản phẩm cần ít nhất ${MIN_PRODUCT_NAME_LENGTH} ký tự.`;
  }

  if (trimmedProductName.length > MAX_PRODUCT_NAME_LENGTH) {
    return `Tên sản phẩm tối đa ${MAX_PRODUCT_NAME_LENGTH} ký tự.`;
  }

  return null;
}

function isGeneratedContent(
  value: GenerateResponse,
): value is GeneratedContent {
  return (
    "caption" in value &&
    "hashtags" in value &&
    "cta" in value &&
    "description" in value &&
    typeof value.caption === "string" &&
    Array.isArray(value.hashtags) &&
    value.hashtags.length >= HASHTAG_MIN_COUNT &&
    value.hashtags.length <= HASHTAG_MAX_COUNT &&
    value.hashtags.every(
      (hashtag) => typeof hashtag === "string" && hashtag.trim().length > 0,
    ) &&
    typeof value.cta === "string" &&
    typeof value.description === "string"
  );
}

function isGeneratedVideoScript(
  value: GenerateVideoScriptResponse,
): value is GeneratedVideoScript {
  return (
    "hook" in value &&
    "scenes" in value &&
    "cta" in value &&
    "caption" in value &&
    "hashtags" in value &&
    typeof value.hook === "string" &&
    Array.isArray(value.scenes) &&
    value.scenes.length > 0 &&
    typeof value.cta === "string" &&
    typeof value.caption === "string" &&
    Array.isArray(value.hashtags)
  );
}

function isGeneratedHooks(
  value: GenerateHooksResponse,
): value is GeneratedHooks {
  return (
    "hooks" in value &&
    Array.isArray(value.hooks) &&
    value.hooks.length > 0 &&
    value.hooks.every(
      (item) =>
        typeof (item as Record<string, unknown>).hook === "string" &&
        typeof (item as Record<string, unknown>).angle === "string" &&
        typeof (item as Record<string, unknown>).overlayText === "string",
    ) &&
    "caption" in value &&
    typeof value.caption === "string" &&
    "hashtags" in value &&
    Array.isArray(value.hashtags) &&
    value.hashtags.length >= 5
  );
}

function isGeneratedImage(value: GenerateImageResponse): value is GeneratedImage {
  return (
    "imageDataUrl" in value &&
    "productName" in value &&
    "style" in value &&
    "platform" in value &&
    typeof value.imageDataUrl === "string" &&
    value.imageDataUrl.startsWith("data:image/") &&
    typeof value.productName === "string" &&
    imageStyles.includes(value.style as ImageStyle) &&
    imagePlatforms.includes(value.platform as ImagePlatform)
  );
}

function TikTokHooksSection({
  supabase,
  userId,
  onUpgradeClick,
}: {
  supabase: SupabaseBrowserClient | null;
  userId: string | null;
  onUpgradeClick: (source: UpgradeSource) => void;
}) {
  const [productName, setProductName] = useState("Kem dưỡng da ban đêm");
  const [category, setCategory] = useState<HookCategory>("Mỹ phẩm");
  const [targetCustomer, setTargetCustomer] =
    useState<HookTargetCustomer>("Nữ giới");
  const [customerPain, setCustomerPain] = useState("");
  const [tone, setTone] = useState<HookTone>("Gen Z");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GeneratedHooks | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [productNameError, setProductNameError] = useState<string | null>(null);
  const [accountPlan, setAccountPlan] = useState<AccountPlan>("free");
  const [dailyUsage, setDailyUsage] = useState<DailyUsage | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchHooksUsage = useCallback(async () => {
    if (!supabase || !userId) {
      if (isMountedRef.current) {
        setDailyUsage(null);
        setAccountPlan("free");
      }
      return;
    }

    const todayRange = getVietnamTodayRange();
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle()
      .returns<{ plan: string | null } | null>();

    if (!isMountedRef.current) return;

    const { count } = await supabase
      .from("generations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("platform", "TikTok Hooks")
      .gte("created_at", todayRange.startIso)
      .lt("created_at", todayRange.endIso);

    if (!isMountedRef.current) return;

    const nextPlan = normalizeAccountPlan(profile?.plan);
    const limit =
      nextPlan === "pro" ? PRO_HOOKS_DAILY_LIMIT : FREE_HOOKS_DAILY_LIMIT;
    const usedToday = count ?? 0;

    setAccountPlan(nextPlan);
    setDailyUsage({
      dailyLimit: limit,
      usedToday,
      remainingToday: Math.max(limit - usedToday, 0),
    });
  }, [supabase, userId]);

  useEffect(() => {
    void Promise.resolve().then(fetchHooksUsage);
  }, [fetchHooksUsage]);

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) return;

    const nextProductNameError = getProductNameError(productName);
    trackAnalyticsEvent("hooks_generate_clicked", {
      category,
      tone,
      plan: accountPlan,
      authenticated: Boolean(userId),
    });

    if (nextProductNameError) {
      setResult(null);
      setErrorMessage(null);
      setProductNameError(nextProductNameError);
      return;
    }

    setIsLoading(true);
    setResult(null);
    setErrorMessage(null);
    setProductNameError(null);

    try {
      const response = await fetch("/api/generate-hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productName.trim(),
          category,
          targetCustomer,
          customerPain: customerPain.trim(),
          tone,
        }),
      });
      const data = (await response.json()) as GenerateHooksResponse;

      if (!response.ok) {
        if ("usage" in data && data.usage) {
          setDailyUsage(data.usage);
        }
        throw new Error(
          "error" in data && data.error
            ? data.error
            : "Không thể tạo hook. Vui lòng thử lại.",
        );
      }

      if (!isGeneratedHooks(data)) {
        throw new Error("API trả về định dạng không hợp lệ.");
      }

      setResult(data);
      trackAnalyticsEvent("hooks_generation_success", {
        category,
        tone,
        plan: accountPlan,
        authenticated: Boolean(userId),
      });
      void fetchHooksUsage();
    } catch (error) {
      trackAnalyticsEvent("hooks_generation_failed", {
        category,
        tone,
        plan: accountPlan,
        authenticated: Boolean(userId),
      });
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể tạo hook. Vui lòng thử lại.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section
      id="tiktok-hooks"
      aria-labelledby="tiktok-hooks-title"
      className="relative isolate overflow-hidden border-b border-yellow-300/10 bg-[#060606]"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(250,204,21,0.14),transparent_30%),linear-gradient(180deg,#070707_0%,#020202_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-[0.14] [background-image:linear-gradient(rgba(250,204,21,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(250,204,21,0.14)_1px,transparent_1px)] [background-size:80px_80px] [mask-image:radial-gradient(circle_at_20%_20%,black,transparent_65%)]" />
      <div className="absolute left-1/2 top-0 -z-10 h-px w-[72rem] -translate-x-1/2 bg-gradient-to-r from-transparent via-yellow-200/60 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-end">
          <div>
            <p className="inline-flex rounded-lg border border-yellow-300/25 bg-yellow-300/10 px-3 py-2 text-xs font-extrabold uppercase text-yellow-100">
              AI tạo hook TikTok bán hàng
            </p>
            <h2
              id="tiktok-hooks-title"
              className="mt-6 max-w-3xl text-4xl font-black leading-[1.05] text-white md:text-5xl"
            >
              10 hook TikTok bán hàng trong vài giây.
            </h2>
          </div>
          <p className="text-base font-semibold leading-8 text-zinc-400">
            Nhập sản phẩm, mô tả nỗi đau khách hàng và chọn tone. AI tạo 10
            hook mở đầu video mạnh trong 3 giây đầu, kèm angle, text màn hình,
            caption và hashtag.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <form
            onSubmit={handleGenerate}
            aria-label="Tạo hook TikTok bán hàng bằng AI"
            className="relative overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(145deg,rgba(22,22,22,0.96),rgba(5,5,5,0.96))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.52)] md:p-7"
          >
            <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-yellow-300/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-200/70 to-transparent" />

            <div className="relative flex items-center justify-between gap-4 border-b border-white/10 pb-5">
              <PanelTitle
                title="Hook brief"
                description="Sản phẩm + khách hàng + nỗi đau"
              />
              <StatusPill className="border-yellow-300/25 bg-yellow-300/10 text-yellow-100">
                10 hooks
              </StatusPill>
            </div>

            <div className="relative mt-7 space-y-5">
              <label className="block">
                <span className={fieldLabelClassName}>Tên sản phẩm</span>
                <input
                  value={productName}
                  onChange={(event) => {
                    const next = event.target.value;
                    setProductName(next);
                    if (productNameError) {
                      setProductNameError(getProductNameError(next));
                    }
                  }}
                  placeholder="Ví dụ: Kem dưỡng da ban đêm"
                  aria-describedby={
                    productNameError ? "hooks-product-name-error" : undefined
                  }
                  aria-invalid={Boolean(productNameError)}
                  className={`${formControlClassName} placeholder:text-zinc-600`}
                />
                {productNameError ? (
                  <p
                    id="hooks-product-name-error"
                    className="mt-2 text-xs font-bold leading-5 text-red-200"
                  >
                    {productNameError}
                  </p>
                ) : null}
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className={fieldLabelClassName}>Ngành hàng</span>
                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value as HookCategory)
                    }
                    className={formControlClassName}
                  >
                    {hookCategories.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className={fieldLabelClassName}>
                    Khách hàng mục tiêu
                  </span>
                  <select
                    value={targetCustomer}
                    onChange={(event) =>
                      setTargetCustomer(event.target.value as HookTargetCustomer)
                    }
                    className={formControlClassName}
                  >
                    {hookTargetCustomers.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className={fieldLabelClassName}>
                  Nỗi đau khách hàng (tuỳ chọn)
                </span>
                <textarea
                  value={customerPain}
                  onChange={(event) => {
                    if (
                      event.target.value.length <= MAX_CUSTOMER_PAIN_LENGTH
                    ) {
                      setCustomerPain(event.target.value);
                    }
                  }}
                  placeholder="Ví dụ: Da khô bong tróc vào mùa đông, thử nhiều kem vẫn không đỡ"
                  rows={3}
                  className="mt-3 w-full resize-none rounded-lg border border-white/10 bg-white/[0.045] px-5 py-3 text-sm font-semibold text-white outline-none transition duration-300 hover:border-yellow-300/35 hover:bg-white/[0.06] focus:border-yellow-300 focus:bg-black/80 focus:shadow-[0_0_0_4px_rgba(250,204,21,0.12),0_18px_45px_rgba(250,204,21,0.08)] placeholder:text-zinc-600"
                />
                <p className="mt-1 text-right text-xs font-semibold text-zinc-600">
                  {customerPain.length}/{MAX_CUSTOMER_PAIN_LENGTH}
                </p>
              </label>

              <label className="block">
                <span className={fieldLabelClassName}>Tone</span>
                <select
                  value={tone}
                  onChange={(event) =>
                    setTone(event.target.value as HookTone)
                  }
                  className={formControlClassName}
                >
                  {hookTones.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="group relative inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-lg bg-[linear-gradient(135deg,#fde68a_0%,#facc15_40%,#d97706_100%)] px-6 text-sm font-black text-black shadow-[0_20px_55px_rgba(250,204,21,0.24)] transition duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_26px_80px_rgba(250,204,21,0.38)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                <span className="absolute inset-y-0 -left-20 w-16 rotate-12 bg-white/35 blur-md transition duration-700 group-hover:left-[115%]" />
                <span className="relative flex items-center gap-2 transition duration-500 group-hover:scale-[1.02]">
                  {isLoading ? "Đang tạo hook..." : "Tạo 10 hook"}
                  <span aria-hidden="true">-&gt;</span>
                </span>
              </button>

              <div className="flex flex-col gap-3 text-xs font-bold leading-5 text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
                {userId ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill className="border-yellow-300/25 bg-yellow-300/10 text-yellow-100">
                      {getAccountPlanLabel(accountPlan)}
                    </StatusPill>
                    {dailyUsage ? (
                      <p className="text-yellow-100">
                        Hook: còn {dailyUsage.remainingToday}/
                        {dailyUsage.dailyLimit} lượt hôm nay
                      </p>
                    ) : (
                      <p>Đang tải lượt còn lại...</p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill className="border-white/10 bg-white/[0.04] text-zinc-300">
                      Gói Free
                    </StatusPill>
                    <p>
                      Khách vẫn dùng được {FREE_HOOKS_DAILY_LIMIT} lần/ngày.
                    </p>
                  </div>
                )}
                {accountPlan === "free" ? (
                  <button
                    type="button"
                    onClick={() => onUpgradeClick("generator_usage")}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-yellow-300/35 bg-yellow-300/10 px-4 text-xs font-black text-yellow-200 transition hover:border-yellow-300 hover:bg-yellow-300 hover:text-black focus:outline-none focus:ring-2 focus:ring-yellow-300/60"
                  >
                    Nâng cấp Pro
                  </button>
                ) : null}
              </div>
            </div>
          </form>

          <div className="relative overflow-hidden rounded-lg border border-yellow-300/18 bg-[linear-gradient(145deg,rgba(18,18,18,0.96),rgba(4,4,4,0.98)_58%,rgba(28,19,5,0.92))] p-6 shadow-[0_30px_110px_rgba(250,204,21,0.12)] md:p-7">
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-yellow-300/12 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-yellow-200 to-transparent" />

            <div className="relative flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <PanelTitle
                title="Hook output"
                description="10 hooks + caption + hashtag"
              />
              <div className="flex flex-wrap gap-2">
                <StatusPill className="border-white/10 bg-white text-black">
                  {category}
                </StatusPill>
                <StatusPill className="border-yellow-300/25 bg-yellow-300/10 text-yellow-100">
                  {tone}
                </StatusPill>
              </div>
            </div>

            <div aria-live="polite">
              {errorMessage ? (
                <div
                  role="alert"
                  className="relative mt-6 overflow-hidden rounded-lg border border-red-400/30 bg-red-500/[0.08] p-5 shadow-[inset_0_1px_0_rgba(248,113,113,0.18)]"
                >
                  <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-red-400/10 blur-3xl" />
                  <p className="relative text-sm font-black text-red-200">
                    Không tạo được hook
                  </p>
                  <p className="relative mt-2 text-sm leading-6 text-zinc-300">
                    {errorMessage}
                  </p>
                </div>
              ) : isLoading ? (
                <HooksLoadingSkeleton />
              ) : result ? (
                <HooksOutput result={result} />
              ) : (
                <div className="relative mt-6 overflow-hidden rounded-lg border border-dashed border-yellow-300/30 bg-yellow-300/[0.045] p-8 text-center shadow-[inset_0_1px_0_rgba(250,204,21,0.18)]">
                  <div className="absolute left-1/2 top-0 h-24 w-64 -translate-x-1/2 rounded-full bg-yellow-300/10 blur-3xl" />
                  <p className="relative text-xl font-black text-white">
                    10 hook TikTok sẽ xuất hiện ở đây.
                  </p>
                  <p className="relative mt-3 text-sm leading-6 text-zinc-400">
                    Hook, angle, text màn hình, caption và hashtag bán hàng.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HooksOutput({ result }: { result: GeneratedHooks }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function copyToClipboard(text: string, key: string) {
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    });
  }

  return (
    <div className="relative mt-6 space-y-3">
      <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.055]">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-yellow-300/25 bg-yellow-300/10 text-xs font-black text-yellow-200">
            H
          </span>
          <p className="text-xs font-black uppercase text-yellow-200">
            10 Hooks
          </p>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {result.hooks.map((item, index) => (
            <div key={index} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-yellow-300/10 text-[11px] font-black text-yellow-200">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold leading-6 text-white">
                    {item.hook}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(item.hook, `hook-${index}`)}
                  className="shrink-0 rounded-lg border border-white/10 bg-black/35 px-2.5 py-1 text-[11px] font-black text-zinc-400 transition hover:text-yellow-200 focus:outline-none"
                  aria-label={`Sao chép hook ${index + 1}`}
                >
                  {copiedKey === `hook-${index}` ? "Đã chép" : "Chép"}
                </button>
              </div>
              <dl className="mt-2 grid gap-1 pl-8">
                <div className="flex items-start gap-2">
                  <dt className="shrink-0 text-[10px] font-black uppercase text-zinc-600">
                    Angle
                  </dt>
                  <dd className="text-xs font-semibold leading-5 text-zinc-400">
                    {item.angle}
                  </dd>
                </div>
                {item.overlayText ? (
                  <div className="flex items-start gap-2">
                    <dt className="shrink-0 text-[10px] font-black uppercase text-zinc-600">
                      Text
                    </dt>
                    <dd>
                      <span className="inline-flex rounded-md border border-yellow-300/20 bg-yellow-300/10 px-2 py-0.5 text-[11px] font-black text-yellow-100">
                        {item.overlayText}
                      </span>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <article className="relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-yellow-300/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-200/60 to-transparent" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-yellow-300/25 bg-yellow-300/10 text-xs font-black text-yellow-200">
                C
              </span>
              <p className="text-xs font-black uppercase text-yellow-200">
                Caption
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(result.caption, "caption")}
              className="rounded-lg border border-white/10 bg-black/35 px-2.5 py-1 text-[11px] font-black text-zinc-400 transition hover:text-yellow-200 focus:outline-none"
              aria-label="Sao chép caption"
            >
              {copiedKey === "caption" ? "Đã chép" : "Chép"}
            </button>
          </div>
          <p className="relative mt-4 text-sm font-semibold leading-7 text-zinc-200">
            {result.caption}
          </p>
        </article>

        <article className="relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-yellow-300/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-200/60 to-transparent" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-yellow-300/25 bg-yellow-300/10 text-xs font-black text-yellow-200">
                #
              </span>
              <p className="text-xs font-black uppercase text-yellow-200">
                Hashtags
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                copyToClipboard(result.hashtags.join(" "), "hashtags")
              }
              className="rounded-lg border border-white/10 bg-black/35 px-2.5 py-1 text-[11px] font-black text-zinc-400 transition hover:text-yellow-200 focus:outline-none"
              aria-label="Sao chép hashtag"
            >
              {copiedKey === "hashtags" ? "Đã chép" : "Chép"}
            </button>
          </div>
          <p className="relative mt-4 text-sm font-bold leading-7 text-yellow-200/90">
            {result.hashtags.join(" ")}
          </p>
        </article>
      </div>
    </div>
  );
}

function HooksLoadingSkeleton() {
  return (
    <div className="relative mt-6 space-y-3">
      <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] p-5">
        <div className="h-3 w-16 animate-pulse rounded-full bg-yellow-300/30" />
        {[1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="mt-4 border-t border-white/[0.06] pt-4 first:mt-0 first:border-0 first:pt-0"
          >
            <div className="h-3 w-full animate-pulse rounded-full bg-white/10" />
            <div className="mt-2 h-3 w-3/4 animate-pulse rounded-full bg-white/[0.06]" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2].map((item) => (
          <div
            key={item}
            className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] p-5"
          >
            <div className="h-3 w-20 animate-pulse rounded-full bg-yellow-300/30" />
            <div className="mt-4 h-3 w-full animate-pulse rounded-full bg-white/10" />
            <div className="mt-3 h-3 w-4/5 animate-pulse rounded-full bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const supabase = useMemo(
    () => (isSupabaseConfigured ? createSupabaseClient() : null),
    [],
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(!isSupabaseConfigured);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [generatorTab, setGeneratorTab] = useState<GeneratorTab>("content");
  const [activatedTabs, setActivatedTabs] = useState<Set<GeneratorTab>>(
    () => new Set<GeneratorTab>(["content"]),
  );

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;
    const authReadyTimeout = window.setTimeout(() => {
      if (!isMounted) {
        return;
      }

      setUserEmail(null);
      setUserId(null);
      setIsAuthReady(true);
    }, AUTH_SESSION_READY_TIMEOUT_MS);

    void Promise.resolve()
      .then(() => supabase.auth.getSession())
      .then(({ data }) => {
        if (!isMounted) {
          return;
        }

        setUserEmail(data.session?.user.email ?? null);
        setUserId(data.session?.user.id ?? null);
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        console.error(
          "Supabase session read error",
          error instanceof Error ? error.message : "Unknown error",
        );
        setUserEmail(null);
        setUserId(null);
      })
      .finally(() => {
        if (!isMounted) {
          return;
        }

        window.clearTimeout(authReadyTimeout);
        setIsAuthReady(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
      setUserId(session?.user.id ?? null);
      setIsAuthReady(true);
    });

    return () => {
      isMounted = false;
      window.clearTimeout(authReadyTimeout);
      subscription.unsubscribe();
    };
  }, [supabase]);

  function openAuthDialog(nextMode: AuthMode) {
    setAuthMode(nextMode);
    setAuthError(null);
    setAuthMessage(null);
    setIsAuthOpen(true);
  }

  function switchAuthMode(nextMode: AuthMode) {
    setAuthMode(nextMode);
    setAuthError(null);
    setAuthMessage(null);
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setAuthError("Supabase chưa được cấu hình cho môi trường này.");
      return;
    }

    const email = authEmail.trim();

    if (!email) {
      setAuthError("Vui lòng nhập email.");
      return;
    }

    if (authPassword.length < 6) {
      setAuthError("Mật khẩu cần ít nhất 6 ký tự.");
      return;
    }

    setIsAuthLoading(true);
    setAuthError(null);
    setAuthMessage(null);

    const redirectTo =
      typeof window === "undefined" ? undefined : window.location.origin;

    const { data, error } =
      authMode === "signup"
        ? await supabase.auth.signUp({
            email,
            password: authPassword,
            options: { emailRedirectTo: redirectTo },
          })
        : await supabase.auth.signInWithPassword({
            email,
            password: authPassword,
          });

    setIsAuthLoading(false);

    if (error) {
      setAuthError(getAuthErrorMessage(error.message));
      return;
    }

    setAuthPassword("");

    if (authMode === "signup" && !data.session) {
      setAuthMessage(
        "Tài khoản đã được tạo. Vui lòng kiểm tra email xác nhận.",
      );
      return;
    }

    setUserEmail(data.user?.email ?? email);
    setUserId(data.user?.id ?? null);
    setIsAuthOpen(false);
  }

  async function handleLogout() {
    if (!supabase) {
      return;
    }

    setIsAuthLoading(true);

    const { error } = await supabase.auth.signOut();

    setIsAuthLoading(false);

    if (error) {
      setAuthError(getAuthErrorMessage(error.message));
      setIsAuthOpen(true);
      return;
    }

    setUserEmail(null);
    setUserId(null);
  }

  function handleUpgradeClick(source: UpgradeSource) {
    trackAnalyticsEvent("upgrade_clicked", {
      source,
      authenticated: Boolean(userId),
    });
    setIsUpgradeOpen(true);
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <header className="border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a
            href="#"
            aria-label="AI Content Seller trang chủ"
            className="text-lg font-black tracking-tight"
          >
            AI<span className="text-yellow-300">Content</span>Seller
          </a>
          <div className="flex items-center gap-4">
            <nav
              aria-label="Điều hướng chính"
              className="hidden items-center gap-8 text-sm font-semibold text-zinc-300 md:flex"
            >
              {navLinks.map((link) => (
                <NavLink key={link.href} href={link.href}>
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <AuthNavbarState
              isReady={isAuthReady}
              userEmail={userEmail}
              isLoading={isAuthLoading}
              onLogin={() => openAuthDialog("login")}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </header>

      {isAuthOpen ? (
        <AuthDialog
          mode={authMode}
          email={authEmail}
          password={authPassword}
          error={authError}
          message={authMessage}
          isLoading={isAuthLoading}
          isConfigured={isSupabaseConfigured}
          onClose={() => setIsAuthOpen(false)}
          onEmailChange={setAuthEmail}
          onPasswordChange={setAuthPassword}
          onModeChange={switchAuthMode}
          onSubmit={handleAuthSubmit}
        />
      ) : null}

      {isUpgradeOpen ? (
        <UpgradeDialog
          userEmail={userEmail}
          onClose={() => setIsUpgradeOpen(false)}
        />
      ) : null}

      <section aria-labelledby="hero-title" className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,#facc15_0%,rgba(250,204,21,0.24)_30%,transparent_62%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 md:py-24 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <p className="mb-6 inline-flex rounded-full border border-yellow-300/30 bg-yellow-300 px-4 py-2 text-sm font-black text-black shadow-[0_0_40px_rgba(250,204,21,0.25)]">
              Dành cho seller Việt Nam
            </p>
            <h1
              id="hero-title"
              className="max-w-4xl text-5xl font-black leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl"
            >
              Hết bí caption: tạo content bán hàng trong vài giây
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-300">
              Nhập sản phẩm một lần để có caption, hashtag, mô tả và CTA cho
              Shopee hoặc TikTok Shop. Không cần nghĩ caption mỗi ngày, không
              cần biết prompt.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                href="#generator"
                className="inline-flex h-12 items-center justify-center rounded-full bg-yellow-300 px-7 text-sm font-black text-black shadow-[0_14px_40px_rgba(250,204,21,0.28)] transition hover:bg-yellow-200"
              >
                Tạo content miễn phí ngay
              </a>
              <a
                href="#demo"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/10 px-7 text-sm font-black text-white transition hover:border-yellow-300/70 hover:text-yellow-200"
              >
                Xem mẫu content
              </a>
            </div>

            <p className="mt-5 max-w-xl text-sm font-semibold leading-6 text-zinc-400">
              Phù hợp cho shop cần đăng đều trên sàn, seller livestream và đội
              vận hành muốn có bản nháp tiếng Việt nhanh trước khi chỉnh giọng
              thương hiệu.
            </p>

            <div className="mt-10 grid max-w-xl grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2 sm:grid-cols-4">
              {stats.map((item) => (
                <div
                  key={item}
                  className="rounded-xl bg-black px-3 py-4 text-center text-xs font-bold leading-5 text-zinc-300"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <section
            id="demo"
            aria-labelledby="demo-title"
            className="rounded-[2rem] border border-yellow-300/20 bg-[#111] p-4 shadow-2xl shadow-yellow-300/10"
          >
            <div className="rounded-[1.5rem] border border-white/10 bg-black p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h2
                    id="demo-title"
                    className="text-sm font-black text-yellow-300"
                  >
                    Content preview
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    Shopee + TikTok Shop
                  </p>
                </div>
                <span className="rounded-full bg-yellow-300 px-3 py-1 text-xs font-black text-black">
                  Vài giây
                </span>
              </div>

              <div className="space-y-4 pt-5">
                <div className="rounded-2xl bg-yellow-300 p-5 text-black">
                  <p className="text-xs font-black uppercase">Input sản phẩm</p>
                  <p className="mt-2 text-xl font-black">
                    Túi đeo chéo mini chống nước
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {previewItems.map((item) => (
                    <PreviewContentCard key={item.title} item={item} />
                  ))}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white p-4 text-black">
                  <p className="text-xs font-black uppercase text-zinc-500">
                    Hashtag đề xuất
                  </p>
                  <p className="mt-3 text-sm font-bold leading-6">
                    #tuideocheo #tiktokshop #thoitrangnu #phukienhangngay
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      <div id="generators">
        <div className="border-b border-yellow-300/10 bg-black">
          <div className="mx-auto max-w-7xl px-6 py-3">
            <div
              className="flex gap-1 overflow-x-auto pb-0.5"
              role="tablist"
              aria-label="Chọn công cụ AI"
            >
              {generatorTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={generatorTab === tab.id}
                  onClick={() => {
                    setGeneratorTab(tab.id);
                    setActivatedTabs((prev) => {
                      if (prev.has(tab.id)) return prev;
                      const next = new Set(prev);
                      next.add(tab.id);
                      return next;
                    });
                  }}
                  className={`shrink-0 rounded-lg border px-4 py-2 text-xs font-black transition duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-300/60 ${
                    generatorTab === tab.id
                      ? "border-yellow-300/40 bg-yellow-300/10 text-yellow-100 shadow-[0_0_20px_rgba(250,204,21,0.10)]"
                      : "border-transparent text-zinc-500 hover:border-white/10 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          role="tabpanel"
          className={generatorTab !== "content" ? "hidden" : ""}
          aria-hidden={generatorTab !== "content"}
        >
          <GeneratorDemoSection
            supabase={supabase}
            userId={userId}
            onUpgradeClick={handleUpgradeClick}
          />
        </div>

        {activatedTabs.has("image") && (
          <div
            role="tabpanel"
            className={generatorTab !== "image" ? "hidden" : ""}
            aria-hidden={generatorTab !== "image"}
          >
            <ImageGenerationSection
              supabase={supabase}
              userId={userId}
              onUpgradeClick={handleUpgradeClick}
            />
          </div>
        )}

        {activatedTabs.has("video-script") && (
          <div
            role="tabpanel"
            className={generatorTab !== "video-script" ? "hidden" : ""}
            aria-hidden={generatorTab !== "video-script"}
          >
            <VideoScriptSection
              supabase={supabase}
              userId={userId}
              onUpgradeClick={handleUpgradeClick}
            />
          </div>
        )}

        {activatedTabs.has("tiktok-hooks") && (
          <div
            role="tabpanel"
            className={generatorTab !== "tiktok-hooks" ? "hidden" : ""}
            aria-hidden={generatorTab !== "tiktok-hooks"}
          >
            <TikTokHooksSection
              supabase={supabase}
              userId={userId}
              onUpgradeClick={handleUpgradeClick}
            />
          </div>
        )}
      </div>

      <section
        id="features"
        aria-labelledby="features-title"
        className="bg-yellow-300 text-black"
      >
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-wide">
              Tạo content như một team marketing mini
            </p>
            <h2
              id="features-title"
              className="mt-4 text-4xl font-black tracking-tight md:text-5xl"
            >
              Tập trung vào sản phẩm, để AI lo phần chữ bán hàng.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} feature={feature} />
            ))}
          </div>
        </div>
      </section>

      <section
        id="pricing"
        aria-labelledby="pricing-title"
        className="mx-auto max-w-7xl px-6 py-16 md:py-20"
      >
        <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-yellow-300">
              Pricing preview
            </p>
            <h2
              id="pricing-title"
              className="mt-4 text-4xl font-black tracking-tight md:text-5xl"
            >
              Gói đơn giản để bắt đầu bán hàng đều hơn.
            </h2>
          </div>
          <p className="text-base leading-7 text-zinc-400">
            Bắt đầu miễn phí để kiểm tra chất lượng nội dung trước khi nâng cấp
            cho nhu cầu đăng bài hằng ngày.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <PricingCard
              key={plan.name}
              plan={plan}
              onUpgradeClick={() => handleUpgradeClick("pricing_pro_card")}
            />
          ))}
        </div>
      </section>

      <section
        aria-labelledby="faq-title"
        className="mx-auto max-w-7xl px-6 pb-16 md:pb-20"
      >
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
          <p className="text-sm font-black uppercase tracking-wide text-yellow-300">
            FAQ
          </p>
          <h2
            id="faq-title"
            className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl"
          >
            Câu hỏi thường gặp trước khi dùng thử
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {faqs.map((faq) => (
              <article
                key={faq.question}
                className="rounded-2xl border border-white/10 bg-black p-5"
              >
                <h3 className="text-lg font-black text-yellow-200">
                  {faq.question}
                </h3>
                <p className="mt-3 text-sm font-medium leading-6 text-zinc-400">
                  {faq.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function AuthNavbarState({
  isReady,
  userEmail,
  isLoading,
  onLogin,
  onLogout,
}: {
  isReady: boolean;
  userEmail: string | null;
  isLoading: boolean;
  onLogin: () => void;
  onLogout: () => void;
}) {
  if (userEmail) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden max-w-48 truncate text-sm font-semibold text-zinc-300 sm:inline">
          {userEmail}
        </span>
        <button
          type="button"
          onClick={onLogout}
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center rounded-full border border-yellow-300/40 bg-yellow-300/10 px-4 text-sm font-black text-yellow-200 transition hover:border-yellow-300 hover:bg-yellow-300 hover:text-black focus:outline-none focus:ring-2 focus:ring-yellow-300/60 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Đăng xuất
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onLogin}
      disabled={!isReady}
      className="inline-flex h-10 items-center justify-center rounded-full bg-yellow-300 px-4 text-sm font-black text-black shadow-[0_12px_32px_rgba(250,204,21,0.2)] transition hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-300/60 focus:ring-offset-2 focus:ring-offset-black disabled:cursor-not-allowed disabled:opacity-70"
    >
      Đăng nhập
    </button>
  );
}

function AuthDialog({
  mode,
  email,
  password,
  error,
  message,
  isLoading,
  isConfigured,
  onClose,
  onEmailChange,
  onPasswordChange,
  onModeChange,
  onSubmit,
}: {
  mode: AuthMode;
  email: string;
  password: string;
  error: string | null;
  message: string | null;
  isLoading: boolean;
  isConfigured: boolean;
  onClose: () => void;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onModeChange: (mode: AuthMode) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isSignup = mode === "signup";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-6 py-8 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-dialog-title"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-lg border border-yellow-300/20 bg-[linear-gradient(145deg,rgba(18,18,18,0.98),rgba(4,4,4,0.98))] p-6 shadow-[0_30px_110px_rgba(250,204,21,0.16)]">
        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-yellow-300/12 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-yellow-200 to-transparent" />

        <div className="relative flex items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-sm font-black text-yellow-200">Supabase Auth</p>
            <h2
              id="auth-dialog-title"
              className="mt-2 text-2xl font-black text-white"
            >
              {isSignup ? "Tạo tài khoản" : "Đăng nhập"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-lg font-black text-zinc-300 transition hover:border-yellow-300/50 hover:text-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-300/60"
            aria-label="Đóng form đăng nhập"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="relative mt-6 space-y-5">
          {!isConfigured ? (
            <div
              role="alert"
              className="rounded-lg border border-yellow-300/25 bg-yellow-300/10 p-4 text-sm font-semibold leading-6 text-yellow-100"
            >
              Thêm NEXT_PUBLIC_SUPABASE_URL và
              NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY để bật đăng nhập.
            </div>
          ) : null}

          <label className="block">
            <span className={fieldLabelClassName}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="seller@example.com"
              autoComplete="email"
              className={`${formControlClassName} placeholder:text-zinc-600`}
              required
            />
          </label>

          <label className="block">
            <span className={fieldLabelClassName}>Mật khẩu</span>
            <input
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="Ít nhất 6 ký tự"
              autoComplete={isSignup ? "new-password" : "current-password"}
              className={`${formControlClassName} placeholder:text-zinc-600`}
              minLength={6}
              required
            />
          </label>

          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-red-400/30 bg-red-500/[0.08] p-4 text-sm font-bold leading-6 text-red-200"
            >
              {error}
            </p>
          ) : null}

          {message ? (
            <p className="rounded-lg border border-yellow-300/25 bg-yellow-300/10 p-4 text-sm font-bold leading-6 text-yellow-100">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading || !isConfigured}
            className="inline-flex h-14 w-full items-center justify-center rounded-lg bg-[linear-gradient(135deg,#fde68a_0%,#facc15_42%,#d97706_100%)] px-6 text-sm font-black text-black shadow-[0_20px_55px_rgba(250,204,21,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_80px_rgba(250,204,21,0.34)] focus:outline-none focus:ring-2 focus:ring-yellow-300/70 focus:ring-offset-2 focus:ring-offset-black disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isLoading ? "Đang xử lý..." : isSignup ? "Đăng ký" : "Đăng nhập"}
          </button>
        </form>

        <div className="relative mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-zinc-400">
          <span>{isSignup ? "Đã có tài khoản?" : "Chưa có tài khoản?"}</span>
          <button
            type="button"
            onClick={() => onModeChange(isSignup ? "login" : "signup")}
            className="font-black text-yellow-300 transition hover:text-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-300/60"
          >
            {isSignup ? "Đăng nhập" : "Đăng ký"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UpgradeDialog({
  userEmail,
  onClose,
}: {
  userEmail: string | null;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-6 py-8 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-dialog-title"
    >
      <div className="relative max-h-full w-full max-w-2xl overflow-y-auto rounded-lg border border-yellow-300/25 bg-[linear-gradient(145deg,rgba(18,18,18,0.98),rgba(4,4,4,0.98)_62%,rgba(28,19,5,0.96))] p-6 shadow-[0_30px_120px_rgba(250,204,21,0.18)] md:p-7">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-yellow-300/14 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-yellow-200 to-transparent" />

        <div className="relative flex items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-sm font-black uppercase text-yellow-200">
              Manual upgrade
            </p>
            <h2
              id="upgrade-dialog-title"
              className="mt-2 text-3xl font-black text-white"
            >
              Nâng cấp Pro
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-lg font-black text-zinc-300 transition hover:border-yellow-300/50 hover:text-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-300/60"
            aria-label="Đóng hướng dẫn nâng cấp Pro"
          >
            ×
          </button>
        </div>

        <div className="relative mt-6 grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-yellow-300/25 bg-yellow-300 p-5 text-black shadow-[0_24px_70px_rgba(250,204,21,0.18)]">
            <p className="text-sm font-black uppercase text-black/60">Pro</p>
            <p className="mt-3 text-4xl font-black">99.000đ/tháng</p>
            <ul className="mt-5 space-y-3 text-sm font-black leading-6">
              {proBenefits.map((benefit) => (
                <li key={benefit}>✓ {benefit}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
            <p className="text-sm font-black text-yellow-200">
              Cách thanh toán thủ công
            </p>
            <p className="mt-3 text-sm font-semibold leading-6 text-zinc-300">
              Chuyển khoản ngân hàng hoặc ví điện tử. Sau khi thanh toán, gửi
              email/tin nhắn để kích hoạt tài khoản.
            </p>

            <dl className="mt-5 grid gap-3">
              {manualPaymentDetails.map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-col gap-1 rounded-lg border border-white/10 bg-black/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <dt className="text-xs font-black uppercase text-zinc-500">
                    {label}
                  </dt>
                  <dd className="text-sm font-black text-white">{value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-4 rounded-lg border border-yellow-300/20 bg-yellow-300/10 p-4 text-xs font-bold leading-5 text-yellow-100">
              Email đăng nhập hiện tại: {userEmail ?? "chưa đăng nhập"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="relative mt-6 inline-flex h-12 w-full items-center justify-center rounded-lg bg-[linear-gradient(135deg,#fde68a_0%,#facc15_42%,#d97706_100%)] px-6 text-sm font-black text-black shadow-[0_20px_55px_rgba(250,204,21,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_80px_rgba(250,204,21,0.34)] focus:outline-none focus:ring-2 focus:ring-yellow-300/70 focus:ring-offset-2 focus:ring-offset-black"
        >
          Đã hiểu
        </button>
      </div>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="transition hover:text-yellow-300">
      {children}
    </a>
  );
}

function getAuthErrorMessage(message: string) {
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "Email hoặc mật khẩu chưa đúng.";
  }

  if (message.toLowerCase().includes("email not confirmed")) {
    return "Email chưa được xác nhận. Vui lòng kiểm tra hộp thư.";
  }

  return message || "Không thể xử lý đăng nhập. Vui lòng thử lại.";
}

function PreviewContentCard({ item }: { item: (typeof previewItems)[number] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
      <p className="text-xs font-bold text-yellow-300">{item.title}</p>
      <p className="mt-3 text-sm leading-6 text-zinc-200">{item.body}</p>
    </div>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <article className="rounded-3xl border-2 border-black bg-white p-6 shadow-[8px_8px_0_#000]">
      <h3 className="text-2xl font-black">{feature.title}</h3>
      <p className="mt-4 text-sm font-medium leading-6 text-zinc-700">
        {feature.description}
      </p>
    </article>
  );
}

function PricingCard({
  plan,
  onUpgradeClick,
}: {
  plan: Plan;
  onUpgradeClick: () => void;
}) {
  return (
    <article
      className={`group rounded-3xl border p-6 transition-all duration-300 ease-out hover:-translate-y-2 ${
        plan.highlighted
          ? "border-yellow-300 bg-yellow-300 text-black shadow-[0_0_55px_rgba(250,204,21,0.24)] hover:scale-[1.02] hover:shadow-[0_0_85px_rgba(250,204,21,0.36)]"
          : "border-white/10 bg-white/[0.06] text-white hover:border-yellow-300 hover:bg-yellow-300 hover:text-black hover:shadow-[0_0_55px_rgba(250,204,21,0.22)]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-2xl font-black">{plan.name}</h3>
        {plan.highlighted ? (
          <span className="rounded-full bg-black px-3 py-1 text-xs font-black text-yellow-300">
            Phổ biến
          </span>
        ) : null}
      </div>
      <p className="mt-6 text-4xl font-black">{plan.price}</p>
      <p
        className={`mt-4 text-sm font-medium leading-6 transition-colors duration-300 ${
          plan.highlighted
            ? "text-zinc-800"
            : "text-zinc-400 group-hover:text-zinc-800"
        }`}
      >
        {plan.description}
      </p>
      {plan.highlighted ? (
        <>
          <ul className="mt-5 space-y-2 text-sm font-black leading-6 text-zinc-900">
            {proBenefits.map((benefit) => (
              <li key={benefit}>✓ {benefit}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onUpgradeClick}
            className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-full bg-black text-sm font-black text-yellow-300 transition-all duration-300 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-black/50 group-hover:scale-[1.03]"
          >
            Nâng cấp Pro
          </button>
        </>
      ) : (
        <a
          href="#generator"
          className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-full border border-white/15 text-sm font-black text-white transition-all duration-300 group-hover:border-black group-hover:bg-black group-hover:text-yellow-300"
        >
          Tạo content miễn phí
        </a>
      )}
    </article>
  );
}

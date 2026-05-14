"use client";

import { type FormEvent, useState } from "react";

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
    price: "99k/tháng",
    description: "Tạo nội dung hằng ngày cho shop đang tăng trưởng.",
    highlighted: true,
  },
  {
    name: "Business",
    price: "299k/tháng",
    description: "Cho team bán hàng cần nhiều mẫu content và quy trình hơn.",
  },
];

const stats = ["Caption", "Hashtag", "Mô tả", "CTA"];

const platforms = ["Shopee", "TikTok Shop", "Facebook"] as const;
const tones = ["Chuyên nghiệp", "Gen Z", "Sang trọng", "Viral"] as const;

const generatorSteps = [
  "Nhập sản phẩm",
  "Chọn kênh",
  "Chọn tone",
  "Tạo bản nháp",
] as const;

type Platform = (typeof platforms)[number];
type Tone = (typeof tones)[number];

type GeneratedContent = {
  caption: string;
  hashtags: string;
  cta: string;
  description: string;
};

type GenerateResponse = GeneratedContent | { error?: string };

function GeneratorDemoSection() {
  const [productName, setProductName] = useState(
    "Túi đeo chéo mini chống nước",
  );
  const [platform, setPlatform] = useState<Platform>("Shopee");
  const [tone, setTone] = useState<Tone>("Chuyên nghiệp");
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setContent(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, platform, tone }),
      });
      const data = (await response.json()) as GenerateResponse;

      if (!response.ok) {
        throw new Error(getGenerateErrorMessage(data));
      }

      if (!isGeneratedContent(data)) {
        throw new Error("API trả về định dạng không hợp lệ.");
      }

      setContent(data);
    } catch (error) {
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
            <h2 className="mt-6 max-w-2xl text-4xl font-black leading-[1.05] text-white md:text-6xl">
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
                <div
                  key={step}
                  className="group rounded-lg border border-white/10 bg-white/[0.035] px-4 py-4 transition duration-500 ease-out hover:-translate-y-0.5 hover:border-yellow-300/45 hover:bg-yellow-300/[0.08] hover:shadow-[0_18px_50px_rgba(250,204,21,0.16)]"
                >
                  <span className="text-xs font-black text-yellow-300/80">
                    0{index + 1}
                  </span>
                  <p className="mt-2 text-sm font-bold text-zinc-200 transition duration-500 group-hover:text-yellow-100">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <form
            onSubmit={handleGenerate}
            className="relative overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(145deg,rgba(22,22,22,0.96),rgba(5,5,5,0.96))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)] transition duration-500 ease-out hover:-translate-y-1 hover:border-yellow-300/35 hover:shadow-[0_36px_110px_rgba(250,204,21,0.12)] md:p-7"
          >
            <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-yellow-300/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-200/70 to-transparent" />

            <div className="relative flex items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <p className="text-sm font-black text-yellow-200">
                  Input brief
                </p>
                <p className="mt-1 text-xs font-semibold text-zinc-500">
                  Gọi OpenAI qua API route server-side
                </p>
              </div>
              <span className="rounded-lg border border-yellow-300/25 bg-yellow-300/10 px-3 py-1 text-xs font-black text-yellow-100 shadow-[0_0_28px_rgba(250,204,21,0.14)]">
                Live demo
              </span>
            </div>

            <div className="relative mt-7 space-y-5">
              <label className="block">
                <span className="text-xs font-black uppercase text-zinc-500">
                  Product name
                </span>
                <input
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                  placeholder="Ví dụ: Nến thơm thư giãn hương gỗ"
                  required
                  maxLength={120}
                  className="mt-3 h-14 w-full rounded-lg border border-white/10 bg-white/[0.045] px-5 text-sm font-semibold text-white outline-none transition duration-300 placeholder:text-zinc-600 hover:border-yellow-300/35 hover:bg-white/[0.06] focus:border-yellow-300 focus:bg-black/80 focus:shadow-[0_0_0_4px_rgba(250,204,21,0.12),0_18px_45px_rgba(250,204,21,0.08)]"
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-black uppercase text-zinc-500">
                    Platform
                  </span>
                  <select
                    value={platform}
                    onChange={(event) =>
                      setPlatform(event.target.value as Platform)
                    }
                    className="mt-3 h-14 w-full rounded-lg border border-white/10 bg-white/[0.045] px-5 text-sm font-semibold text-white outline-none transition duration-300 hover:border-yellow-300/35 hover:bg-white/[0.06] focus:border-yellow-300 focus:bg-black/80 focus:shadow-[0_0_0_4px_rgba(250,204,21,0.12),0_18px_45px_rgba(250,204,21,0.08)]"
                  >
                    {platforms.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-black uppercase text-zinc-500">
                    Tone
                  </span>
                  <select
                    value={tone}
                    onChange={(event) => setTone(event.target.value as Tone)}
                    className="mt-3 h-14 w-full rounded-lg border border-white/10 bg-white/[0.045] px-5 text-sm font-semibold text-white outline-none transition duration-300 hover:border-yellow-300/35 hover:bg-white/[0.06] focus:border-yellow-300 focus:bg-black/80 focus:shadow-[0_0_0_4px_rgba(250,204,21,0.12),0_18px_45px_rgba(250,204,21,0.08)]"
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
            </div>
          </form>

          <div className="relative overflow-hidden rounded-lg border border-yellow-300/18 bg-[linear-gradient(145deg,rgba(18,18,18,0.96),rgba(4,4,4,0.98)_58%,rgba(28,19,5,0.92))] p-6 shadow-[0_30px_110px_rgba(250,204,21,0.12)] transition duration-500 ease-out hover:-translate-y-1 hover:border-yellow-300/45 hover:shadow-[0_36px_130px_rgba(250,204,21,0.18)] md:p-7">
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-yellow-300/12 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 translate-x-1/3 translate-y-1/3 rounded-full bg-amber-500/12 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-yellow-200 to-transparent" />

            <div className="relative flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-yellow-200">AI output</p>
                <p className="mt-1 text-xs font-semibold text-zinc-500">
                  Caption, hashtag, CTA và mô tả
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg border border-white/10 bg-white px-3 py-1 text-xs font-black text-black shadow-[0_12px_34px_rgba(255,255,255,0.12)]">
                  {platform}
                </span>
                <span className="rounded-lg border border-yellow-300/25 bg-yellow-300/10 px-3 py-1 text-xs font-black text-yellow-100">
                  {tone}
                </span>
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
              ) : content ? (
                <div className="relative mt-6 grid gap-4">
                  <OutputBlock
                    title="Caption"
                    body={content.caption}
                    featured
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <OutputBlock title="Hashtags" body={content.hashtags} />
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
      </div>
    </section>
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

function isGeneratedContent(value: GenerateResponse): value is GeneratedContent {
  return (
    "caption" in value &&
    "hashtags" in value &&
    "cta" in value &&
    "description" in value &&
    typeof value.caption === "string" &&
    typeof value.hashtags === "string" &&
    typeof value.cta === "string" &&
    typeof value.description === "string"
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <header className="border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="#" className="text-lg font-black tracking-tight">
            AI<span className="text-yellow-300">Content</span>Seller
          </a>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-zinc-300 md:flex">
            <a href="#features" className="transition hover:text-yellow-300">
              Tính năng
            </a>
            <a href="#pricing" className="transition hover:text-yellow-300">
              Bảng giá
            </a>
            <a href="#demo" className="transition hover:text-yellow-300">
              Demo
            </a>
            <a href="#generator" className="transition hover:text-yellow-300">
              Generator
            </a>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,#facc15_0%,rgba(250,204,21,0.24)_30%,transparent_62%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 md:py-24 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <p className="mb-6 inline-flex rounded-full border border-yellow-300/30 bg-yellow-300 px-4 py-2 text-sm font-black text-black shadow-[0_0_40px_rgba(250,204,21,0.25)]">
              AI content engine cho seller Việt Nam
            </p>
            <h1 className="max-w-4xl text-5xl font-black leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
              AI viết content bán hàng cho Shopee & TikTok Shop
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-300">
              Người bán có thể tạo caption, hashtag, mô tả sản phẩm và CTA chỉ
              trong vài giây để đăng bài nhanh hơn, đều hơn và thuyết phục hơn.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                href="#pricing"
                className="inline-flex h-12 items-center justify-center rounded-full bg-yellow-300 px-7 text-sm font-black text-black shadow-[0_14px_40px_rgba(250,204,21,0.28)] transition hover:bg-yellow-200"
              >
                Dùng thử miễn phí
              </a>
              <a
                href="#demo"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/10 px-7 text-sm font-black text-white transition hover:border-yellow-300/70 hover:text-yellow-200"
              >
                Xem demo
              </a>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-4 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
              {stats.map((item) => (
                <div
                  key={item}
                  className="rounded-xl bg-black px-3 py-4 text-center text-xs font-bold text-zinc-300"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div
            id="demo"
            className="rounded-[2rem] border border-yellow-300/20 bg-[#111] p-4 shadow-2xl shadow-yellow-300/10"
          >
            <div className="rounded-[1.5rem] border border-white/10 bg-black p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-black text-yellow-300">
                    Content preview
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Shopee + TikTok Shop
                  </p>
                </div>
                <span className="rounded-full bg-yellow-300 px-3 py-1 text-xs font-black text-black">
                  8 giây
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
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                    <p className="text-xs font-bold text-yellow-300">Caption</p>
                    <p className="mt-3 text-sm leading-6 text-zinc-200">
                      Nhỏ gọn nhưng đựng đủ đồ cần thiết. Đi học, đi làm hay đi
                      chơi cuối tuần đều hợp.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                    <p className="text-xs font-bold text-yellow-300">CTA</p>
                    <p className="mt-3 text-sm leading-6 text-zinc-200">
                      Chọn màu bạn thích và đặt ngay hôm nay.
                    </p>
                  </div>
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
          </div>
        </div>
      </section>

      <GeneratorDemoSection />

      <section id="features" className="bg-yellow-300 text-black">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-wide">
              Tạo content như một team marketing mini
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
              Tập trung vào sản phẩm, để AI lo phần chữ bán hàng.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-3xl border-2 border-black bg-white p-6 shadow-[8px_8px_0_#000]"
              >
                <h3 className="text-2xl font-black">{feature.title}</h3>
                <p className="mt-4 text-sm font-medium leading-6 text-zinc-700">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-yellow-300">
              Pricing preview
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
              Gói đơn giản để bắt đầu bán hàng đều hơn.
            </h2>
          </div>
          <p className="text-base leading-7 text-zinc-400">
            Bảng giá xem trước cho landing page. Chưa có backend, auth, database
            hoặc payment.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
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
              <a
                href="#"
                className={`mt-7 inline-flex h-12 w-full items-center justify-center rounded-full text-sm font-black transition-all duration-300 ${
                  plan.highlighted
                    ? "bg-black text-yellow-300 hover:bg-zinc-900 group-hover:scale-[1.03]"
                    : "border border-white/15 text-white group-hover:border-black group-hover:bg-black group-hover:text-yellow-300"
                }`}
              >
                Dùng thử miễn phí
              </a>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

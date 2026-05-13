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

type Platform = (typeof platforms)[number];
type Tone = (typeof tones)[number];

type GeneratedContent = {
  caption: string;
  hashtags: string;
  cta: string;
  description: string;
};

function createFakeContent(
  productName: string,
  platform: Platform,
  tone: Tone,
): GeneratedContent {
  const product = productName.trim() || "Set dưỡng da phục hồi ban đêm";
  const platformHook =
    platform === "TikTok Shop"
      ? "Lên TikTok Shop là phải có một món vừa đẹp hình vừa chốt đơn nhanh."
      : platform === "Facebook"
        ? "Một bài đăng tốt cần nói đúng điều khách đang cần trước khi họ lướt qua."
        : "Shopee hôm nay có một lựa chọn đáng thêm ngay vào giỏ.";

  const toneLine =
    tone === "Gen Z"
      ? "Nhỏ gọn, xịn vibe, dùng một lần là hiểu vì sao đang được săn."
      : tone === "Sang trọng"
        ? "Thiết kế tinh tế, cảm giác cao cấp và phù hợp để nâng tầm thói quen mỗi ngày."
        : tone === "Viral"
          ? "Món này đang có đủ yếu tố để khách dừng lại, xem tiếp và bấm mua."
          : "Tập trung vào công năng, độ bền và trải nghiệm sử dụng thực tế.";

  return {
    caption: `${platformHook} ${product} giúp bạn giải quyết nhu cầu hằng ngày với diện mạo chỉn chu, dễ dùng và cực kỳ hợp để làm nổi bật gian hàng. ${toneLine}`,
    hashtags:
      platform === "Facebook"
        ? "#contentbanhang #shoponline #sanphamhot #muasamthongminh"
        : platform === "TikTok Shop"
          ? "#tiktokshop #dealhot #xuhuongmuasam #reviewthat"
          : "#shopee #shopeefinds #dealhomnay #sanphamnenmua",
    cta:
      tone === "Viral"
        ? "Bấm đặt ngay trước khi hết lượt ưu đãi hôm nay."
        : tone === "Gen Z"
          ? "Chốt đơn liền tay để kịp lên outfit/giỏ đồ mới nhé."
          : "Đặt hàng hôm nay để nhận ưu đãi và tư vấn chọn mẫu phù hợp.",
    description: `${product} được gợi ý cho khách hàng muốn một sản phẩm đẹp, dễ sử dụng và có giá trị rõ ràng. Nội dung có thể dùng cho ${platform}, nhấn mạnh lợi ích chính, cảm giác sở hữu và lý do nên mua ngay trong lần xem đầu tiên.`,
  };
}

function GeneratorDemoSection() {
  const [productName, setProductName] = useState(
    "Túi đeo chéo mini chống nước",
  );
  const [platform, setPlatform] = useState<Platform>("Shopee");
  const [tone, setTone] = useState<Tone>("Chuyên nghiệp");
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<GeneratedContent | null>(null);

  function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setContent(null);

    window.setTimeout(() => {
      setContent(createFakeContent(productName, platform, tone));
      setIsLoading(false);
    }, 1500);
  }

  return (
    <section
      id="generator"
      className="relative overflow-hidden border-y border-white/10 bg-[#0b0b0b]"
    >
      <div className="absolute left-1/2 top-0 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-yellow-300/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <p className="inline-flex rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-yellow-200 shadow-[0_0_34px_rgba(250,204,21,0.16)]">
              AI Generator Demo
            </p>
            <h2 className="mt-5 max-w-2xl text-4xl font-black tracking-tight text-white md:text-5xl">
              Tạo content bán hàng trong vài giây.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-zinc-400">
              Nhập tên sản phẩm, chọn kênh bán và giọng điệu. Demo này mô phỏng
              cách AI sẽ tạo caption, hashtag, CTA và mô tả sản phẩm cho seller
              Việt Nam.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-3xl border border-yellow-300/20 bg-white/[0.03] p-3 shadow-[0_0_70px_rgba(250,204,21,0.12)] sm:grid-cols-4">
            {[
              "1. Nhập sản phẩm",
              "2. Chọn kênh",
              "3. Chọn tone",
              "4. Tạo bản nháp",
            ].map((step) => (
              <div
                key={step}
                className="rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-center text-xs font-black text-zinc-300 transition hover:border-yellow-300/60 hover:text-yellow-200"
              >
                {step}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <form
            onSubmit={handleGenerate}
            className="rounded-[2rem] border border-white/10 bg-[#111]/95 p-5 shadow-2xl shadow-black/50 transition duration-300 hover:border-yellow-300/35 hover:shadow-yellow-300/10 md:p-7"
          >
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <p className="text-sm font-black text-yellow-300">
                  Input brief
                </p>
                <p className="mt-1 text-xs font-semibold text-zinc-500">
                  Không gọi API, chỉ mô phỏng kết quả AI
                </p>
              </div>
              <span className="rounded-full border border-yellow-300/30 bg-yellow-300/10 px-3 py-1 text-xs font-black text-yellow-200">
                Live demo
              </span>
            </div>

            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                  Product name
                </span>
                <input
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                  placeholder="Ví dụ: Nến thơm thư giãn hương gỗ"
                  className="mt-3 h-14 w-full rounded-2xl border border-white/10 bg-black px-5 text-sm font-bold text-white outline-none transition placeholder:text-zinc-600 hover:border-yellow-300/40 focus:border-yellow-300 focus:shadow-[0_0_0_4px_rgba(250,204,21,0.12)]"
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                    Platform
                  </span>
                  <select
                    value={platform}
                    onChange={(event) =>
                      setPlatform(event.target.value as Platform)
                    }
                    className="mt-3 h-14 w-full rounded-2xl border border-white/10 bg-black px-5 text-sm font-bold text-white outline-none transition hover:border-yellow-300/40 focus:border-yellow-300 focus:shadow-[0_0_0_4px_rgba(250,204,21,0.12)]"
                  >
                    {platforms.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                    Tone
                  </span>
                  <select
                    value={tone}
                    onChange={(event) => setTone(event.target.value as Tone)}
                    className="mt-3 h-14 w-full rounded-2xl border border-white/10 bg-black px-5 text-sm font-bold text-white outline-none transition hover:border-yellow-300/40 focus:border-yellow-300 focus:shadow-[0_0_0_4px_rgba(250,204,21,0.12)]"
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
                className="group inline-flex h-14 w-full items-center justify-center rounded-2xl bg-yellow-300 px-6 text-sm font-black text-black shadow-[0_18px_50px_rgba(250,204,21,0.28)] transition duration-300 hover:-translate-y-1 hover:bg-yellow-200 hover:shadow-[0_24px_70px_rgba(250,204,21,0.38)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                <span className="transition group-hover:scale-[1.03]">
                  {isLoading ? "Đang tạo nội dung..." : "Tạo content"}
                </span>
              </button>
            </div>
          </form>

          <div className="relative rounded-[2rem] border border-yellow-300/20 bg-[linear-gradient(145deg,#151515,#050505)] p-5 shadow-2xl shadow-yellow-300/10 transition duration-300 hover:border-yellow-300/45 md:p-7">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-yellow-300 to-transparent" />

            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <p className="text-sm font-black text-yellow-300">AI output</p>
                <p className="mt-1 text-xs font-semibold text-zinc-500">
                  Caption, hashtag, CTA và mô tả
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-black">
                {platform}
              </span>
            </div>

            {isLoading ? (
              <div className="mt-6 space-y-4">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/[0.06]"
                  />
                ))}
              </div>
            ) : content ? (
              <div className="mt-6 grid gap-4">
                <OutputBlock title="Caption" body={content.caption} featured />
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
              <div className="mt-6 rounded-3xl border border-dashed border-yellow-300/30 bg-yellow-300/[0.05] p-8 text-center">
                <p className="text-xl font-black text-white">
                  Sẵn sàng tạo bản nháp đầu tiên.
                </p>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  Kết quả mẫu sẽ xuất hiện ở đây sau 1.5 giây với nội dung tiếng
                  Việt phù hợp kênh bán hàng đã chọn.
                </p>
              </div>
            )}
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
      className={`rounded-2xl border p-5 transition duration-300 hover:-translate-y-1 ${
        featured
          ? "border-yellow-300/40 bg-yellow-300 text-black shadow-[0_0_48px_rgba(250,204,21,0.22)]"
          : "border-white/10 bg-white/[0.06] hover:border-yellow-300/35"
      }`}
    >
      <p
        className={`text-xs font-black uppercase tracking-[0.16em] ${
          featured ? "text-black/60" : "text-yellow-300"
        }`}
      >
        {title}
      </p>
      <p
        className={`mt-3 text-sm font-semibold leading-7 ${
          featured ? "text-black" : "text-zinc-200"
        }`}
      >
        {body}
      </p>
    </article>
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

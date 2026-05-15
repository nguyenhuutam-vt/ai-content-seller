import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type Metric = {
  label: string;
  value: number | string;
  sub?: string;
};

type AdminStats = {
  totalGenerations: number;
  todayGenerations: number;
  totalUsers: number;
  freeUsers: number;
  proUsers: number;
};

async function fetchStats(): Promise<AdminStats | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const vietnamOffsetMs = 7 * 60 * 60 * 1000;
  const dayMs = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const todayStartMs =
    Math.floor((now + vietnamOffsetMs) / dayMs) * dayMs - vietnamOffsetMs;
  const todayStart = new Date(todayStartMs).toISOString();

  const [totalGen, todayGen, totalProfiles, freeProfiles, proProfiles] =
    await Promise.all([
      supabase
        .from("generations")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("generations")
        .select("id", { count: "exact", head: true })
        .gte("created_at", todayStart),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .or("plan.eq.free,plan.is.null"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("plan", "pro"),
    ]);

  if (
    totalGen.error ||
    todayGen.error ||
    totalProfiles.error ||
    freeProfiles.error ||
    proProfiles.error
  ) {
    return null;
  }

  return {
    totalGenerations: totalGen.count ?? 0,
    todayGenerations: todayGen.count ?? 0,
    totalUsers: totalProfiles.count ?? 0,
    freeUsers: freeProfiles.count ?? 0,
    proUsers: proProfiles.count ?? 0,
  };
}

function StatCard({ metric }: { metric: Metric }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-5">
      <p className="text-sm text-zinc-400">{metric.label}</p>
      <p className="mt-1 text-3xl font-bold text-yellow-400">{metric.value}</p>
      {metric.sub && (
        <p className="mt-1 text-xs text-zinc-500">{metric.sub}</p>
      )}
    </div>
  );
}

export default async function AdminPage() {
  const stats = await fetchStats();

  const configured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  const metrics: Metric[] = stats
    ? [
        {
          label: "Tổng số lượt tạo nội dung",
          value: stats.totalGenerations.toLocaleString("vi-VN"),
          sub: "Tất cả thời gian",
        },
        {
          label: "Lượt tạo hôm nay",
          value: stats.todayGenerations.toLocaleString("vi-VN"),
          sub: "Theo múi giờ Việt Nam (GMT+7)",
        },
        {
          label: "Tổng người dùng",
          value: stats.totalUsers.toLocaleString("vi-VN"),
          sub: "Đã tạo ít nhất 1 lượt",
        },
        {
          label: "Người dùng Free",
          value: stats.freeUsers.toLocaleString("vi-VN"),
        },
        {
          label: "Người dùng Pro",
          value: stats.proUsers.toLocaleString("vi-VN"),
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl space-y-8">

        {/* Warning banner */}
        <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
          ⚠️ Internal MVP dashboard — không chia sẻ link này ra ngoài.
        </div>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Stats</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Số liệu cơ bản để theo dõi MVP. Tự động cập nhật mỗi lần tải trang.
          </p>
        </div>

        {/* Metrics */}
        {!configured && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            Thiếu{" "}
            <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> hoặc{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> trong
            biến môi trường. Thêm vào <code className="font-mono">.env.local</code> để xem số liệu.
          </div>
        )}

        {configured && !stats && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            Truy vấn Supabase thất bại. Kiểm tra service role key và kết nối DB.
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {metrics.map((m) => (
              <StatCard key={m.label} metric={m} />
            ))}
          </div>
        )}

        {/* Footer note */}
        <p className="text-xs text-zinc-600">
          Số liệu người dùng chỉ tính profile đã được tạo trong bảng{" "}
          <code className="font-mono">profiles</code> (kích hoạt khi generate lần đầu).
        </p>
      </div>
    </div>
  );
}

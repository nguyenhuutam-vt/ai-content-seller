const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(getSupabasePublicConfig());

export function getSupabasePublicConfig() {
  if (
    !supabaseUrl ||
    !supabasePublishableKey ||
    !isHttpUrl(supabaseUrl)
  ) {
    return null;
  }

  return {
    url: supabaseUrl,
    publishableKey: supabasePublishableKey,
  };
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

import { createBrowserClient } from "@supabase/ssr";

import {
  getSupabasePublicConfig,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

export { isSupabaseConfigured };

export function createClient() {
  const config = getSupabasePublicConfig();

  if (!config) {
    throw new Error("Missing Supabase public environment variables.");
  }

  return createBrowserClient(config.url, config.publishableKey);
}

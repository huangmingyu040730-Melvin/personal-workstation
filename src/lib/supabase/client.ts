import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseConfig } from "./config";

export function createClient() {
  if (!isSupabaseConfigured || !supabaseConfig.url || !supabaseConfig.publishableKey) {
    throw new Error("Supabase is not configured.");
  }

  return createBrowserClient(supabaseConfig.url, supabaseConfig.publishableKey);
}

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured, supabaseConfig } from "./config";

export async function createClient() {
  if (!isSupabaseConfigured || !supabaseConfig.url || !supabaseConfig.publishableKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseConfig.url, supabaseConfig.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write cookies; proxy.ts handles refreshes.
        }
      }
    }
  });
}

export async function getVerifiedClaims() {
  const supabase = await createClient();

  if (!supabase) {
    return { configured: false, claims: null, error: null };
  }

  const { data, error } = await supabase.auth.getClaims();

  return {
    configured: true,
    claims: data?.claims ?? null,
    error
  };
}

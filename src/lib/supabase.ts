import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const hasSupabase = Boolean(url && key);

/**
 * Supabase client. `null` when no credentials are configured, so the
 * whole app degrades gracefully to a localStorage-only mode.
 */
export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(url!, key!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

export async function invokeEdgeFunction<TResp = unknown>(
  name: string,
  body: unknown,
): Promise<TResp> {
  if (!supabase) {
    throw new Error(
      "Supabase není nakonfigurováno. Doplňte VITE_SUPABASE_URL a VITE_SUPABASE_PUBLISHABLE_KEY v .env.",
    );
  }
  const { data, error } = await supabase.functions.invoke<TResp>(name, {
    body: body as Record<string, unknown>,
  });
  if (error) throw error;
  return data as TResp;
}

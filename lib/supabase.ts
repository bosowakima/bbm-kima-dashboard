import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True bila kedua environment variable Supabase sudah terisi. */
export const supabaseSiap = Boolean(url && anonKey);

let klien: SupabaseClient | null = null;

/** Mengembalikan klien Supabase, atau null bila environment variable belum diisi. */
export function getSupabase(): SupabaseClient | null {
  if (!supabaseSiap) return null;
  if (!klien) {
    klien = createClient(url as string, anonKey as string, {
      auth: { persistSession: false },
    });
  }
  return klien;
}

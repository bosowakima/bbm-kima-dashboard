import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Spasi dan garis miring di ujung alamat dibuang agar alamat permintaan tetap sah.
const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)
  ?.trim()
  .replace(/\/+$/, "");
const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

/** True bila alamat proyek dan secret key Supabase sudah terisi. */
export const supabaseSiap = Boolean(url && secretKey);

let klien: SupabaseClient | null = null;

/**
 * Klien Supabase untuk sisi server. Memakai secret key (service_role),
 * jadi berkas ini tidak boleh diimpor oleh komponen yang berjalan di peramban.
 * Paket "server-only" di atas akan menggagalkan build bila hal itu terjadi.
 */
export function getSupabase(): SupabaseClient | null {
  if (!supabaseSiap) return null;
  if (!klien) {
    klien = createClient(url as string, secretKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
      // Next.js dapat menyimpan hasil fetch; data rekap harus selalu dibaca langsung.
      global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
    });
  }
  return klien;
}

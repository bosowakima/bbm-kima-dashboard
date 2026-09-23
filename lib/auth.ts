/**
 * Sesi admin sederhana berbasis cookie bertanda tangan HMAC.
 * Memakai Web Crypto, sehingga berjalan di middleware maupun route handler.
 */

export const NAMA_COOKIE = "bbm_admin";
export const MASA_SESI_DETIK = 12 * 60 * 60; // 12 jam

const enc = new TextEncoder();

function kunciRahasia(): string | null {
  const sandi = process.env.ADMIN_PASSWORD;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sandi || !secret) return null;
  // Mengganti kata sandi admin otomatis membatalkan semua sesi lama.
  return `${sandi}::${secret}`;
}

async function tandaTangan(pesan: string, rahasia: string): Promise<string> {
  const kunci = await crypto.subtle.importKey(
    "raw",
    enc.encode(rahasia),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const hasil = await crypto.subtle.sign("HMAC", kunci, enc.encode(pesan));
  return Array.from(new Uint8Array(hasil))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function samaPersis(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let beda = 0;
  for (let i = 0; i < a.length; i++) beda |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return beda === 0;
}

export function adminSiap(): boolean {
  return kunciRahasia() !== null;
}

export async function cocokkanSandi(masukan: string): Promise<boolean> {
  const sandi = process.env.ADMIN_PASSWORD;
  if (!sandi) return false;
  // Dibandingkan lewat hash agar waktu perbandingan tidak bergantung pada isi sandi.
  const [a, b] = await Promise.all([
    tandaTangan(masukan, "bandingkan"),
    tandaTangan(sandi, "bandingkan"),
  ]);
  return samaPersis(a, b);
}

export async function buatTokenSesi(): Promise<string | null> {
  const rahasia = kunciRahasia();
  if (!rahasia) return null;
  const kedaluwarsa = Math.floor(Date.now() / 1000) + MASA_SESI_DETIK;
  return `${kedaluwarsa}.${await tandaTangan(String(kedaluwarsa), rahasia)}`;
}

export async function tokenSah(token: string | undefined): Promise<boolean> {
  const rahasia = kunciRahasia();
  if (!rahasia || !token) return false;
  const [kedaluwarsa, tanda] = token.split(".");
  if (!kedaluwarsa || !tanda) return false;
  if (Number(kedaluwarsa) < Math.floor(Date.now() / 1000)) return false;
  return samaPersis(tanda, await tandaTangan(kedaluwarsa, rahasia));
}

"use client";

export default function Galat({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-6">
      <h1 className="text-lg font-semibold text-ink">Data tidak dapat dimuat</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate">
        Server gagal membaca data dari Supabase. Pesan dari server:
      </p>
      <p className="mt-2 font-mono text-sm text-part">{error.message || "Tidak ada keterangan."}</p>
      <p className="mt-4 max-w-2xl text-sm text-slate">
        Periksa bahwa SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY sudah benar, dan bahwa berkas
        supabase/01_schema.sql versi terbaru sudah dijalankan. Bagian Pemecahan masalah pada
        TUTORIAL.md menjelaskan arti setiap pesan.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 h-9 rounded-md bg-ink px-4 text-sm font-medium text-white hover:bg-slate"
      >
        Coba muat ulang
      </button>
    </div>
  );
}

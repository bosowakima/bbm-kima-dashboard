import { adminSiap } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Masuk Admin — Rekap Pembelian BBM KIMA" };

const PESAN: Record<string, string> = {
  salah: "Kata sandi tidak cocok. Periksa huruf besar dan kecilnya, lalu coba lagi.",
  "belum-diatur":
    "Halaman admin belum diaktifkan. Isi ADMIN_PASSWORD dan SUPABASE_SERVICE_ROLE_KEY pada environment variable, lalu jalankan ulang server.",
};

export default function Halaman({ searchParams }: { searchParams: { galat?: string; lanjut?: string; keluar?: string } }) {
  const siap = adminSiap();
  const galat = !siap ? PESAN["belum-diatur"] : searchParams.galat ? PESAN[searchParams.galat] : null;

  return (
    <div className="mx-auto max-w-sm pt-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Masuk admin</h1>
      <p className="mt-2 text-sm text-slate">
        Halaman admin dipakai untuk mengubah data, mengimpor, dan mengekspor Excel.
      </p>

      {searchParams.keluar ? <p className="mt-4 text-sm text-slate">Anda sudah keluar.</p> : null}
      {galat ? <p role="alert" className="mt-4 text-sm text-part">{galat}</p> : null}

      <form action="/api/admin/login" method="post" className="mt-6 space-y-3">
        <input type="hidden" name="lanjut" value={searchParams.lanjut ?? "/admin"} />
        <label className="block text-sm">
          <span className="text-slate">Kata sandi</span>
          <input
            type="password"
            name="sandi"
            required
            autoComplete="current-password"
            disabled={!siap}
            className="mt-1 h-10 w-full rounded-md border border-line bg-panel px-3 text-sm text-ink"
          />
        </label>
        <button
          type="submit"
          disabled={!siap}
          className="h-10 w-full rounded-md bg-ink text-sm font-medium text-white hover:bg-slate disabled:opacity-50"
        >
          Masuk
        </button>
      </form>
    </div>
  );
}

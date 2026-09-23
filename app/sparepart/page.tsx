import HalamanDepartemen, { ParamHalaman } from "@/components/halaman-departemen";

// Selalu mengambil data terbaru, sehingga perubahan dari halaman Admin langsung terlihat
// dan proses build di Vercel tidak bergantung pada koneksi ke Supabase.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sparepart — Rekap Pembelian BBM KIMA",
};

export default function Halaman({
  searchParams,
}: {
  searchParams: ParamHalaman;
}) {
  return <HalamanDepartemen departemen="sparepart" searchParams={searchParams} />;
}

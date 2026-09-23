import HalamanDepartemen, { ParamHalaman } from "@/components/halaman-departemen";

export const revalidate = 300;

export const metadata = {
  title: "Service — Rekap Pembelian BBM KIMA",
};

export default function Halaman({
  searchParams,
}: {
  searchParams: ParamHalaman;
}) {
  return <HalamanDepartemen departemen="service" searchParams={searchParams} />;
}

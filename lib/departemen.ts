import type { Departemen } from "./barang";

export const DEPARTEMEN: Record<
  Departemen,
  { nama: string; jalur: string; ringkas: string; sumber: string; warna: string }
> = {
  sparepart: {
    nama: "Sparepart",
    jalur: "/sparepart",
    ringkas: "Pembelian sparepart dari Mallomo",
    sumber:
      "Diambil dari nota bertanda biru pada rekap sparepart, periode Januari sampai Agustus 2026.",
    warna: "#C8102E",
  },
  service: {
    nama: "Service",
    jalur: "/service",
    ringkas: "Pembelian kebutuhan service",
    sumber:
      "Diambil dari seluruh nota pada rekap service, periode Januari sampai Agustus 2026.",
    warna: "#24618F",
  },
};

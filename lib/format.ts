const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const angka = new Intl.NumberFormat("id-ID");

export function formatRupiah(nilai: number | null | undefined): string {
  if (nilai === null || nilai === undefined) return "—";
  return rupiah.format(nilai);
}

export function formatAngka(nilai: number | null | undefined): string {
  if (nilai === null || nilai === undefined) return "—";
  return angka.format(nilai);
}

/** Memendekkan nilai rupiah besar agar muat pada kartu ringkasan. */
export function formatRupiahSingkat(nilai: number): string {
  if (nilai >= 1_000_000_000) return `Rp ${angka.format(Math.round(nilai / 100_000_000) / 10)} miliar`;
  if (nilai >= 1_000_000) return `Rp ${angka.format(Math.round(nilai / 100_000) / 10)} juta`;
  return rupiah.format(nilai);
}

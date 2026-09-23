import "server-only";
import ExcelJS from "exceljs";
import { kunciBarang, validasiBarang, type InputBarang, type Departemen } from "./barang";
import { DEPARTEMEN } from "./departemen";
import type { BarisRekap } from "./data";

/* ------------------------------------------------------------------ */
/* Membaca berkas                                                      */
/* ------------------------------------------------------------------ */

/** Nama judul kolom yang dikenali, dalam bentuk huruf besar tanpa titik dan spasi ganda. */
const JUDUL = {
  no_part: ["NO PART", "NOPART", "PART NUMBER", "PART NO", "KODE PART"],
  nama_barang: ["NAMA BARANG", "NAMA", "BARANG", "DESKRIPSI"],
  harga_satuan: ["HARGA SATUAN", "SATUAN", "HARGA"],
  frekuensi: ["FREKUENSI", "FREK", "JUMLAH PEMBELIAN"],
} as const;

type KolomDikenal = keyof typeof JUDUL;

function rapikanJudul(nilai: unknown): string {
  return String(nilai ?? "")
    .toUpperCase()
    .replace(/[.:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Mengambil nilai sebenarnya dari sel ExcelJS: hasil rumus, teks kaya, atau hyperlink. */
function nilaiSel(sel: ExcelJS.Cell): unknown {
  const v = sel.value as unknown;
  if (v === null || v === undefined) return null;
  if (typeof v !== "object") return v;
  if (v instanceof Date) return v;
  const obj = v as Record<string, unknown>;
  if ("result" in obj) return obj.result ?? null;
  if ("richText" in obj && Array.isArray(obj.richText)) {
    return (obj.richText as Array<{ text: string }>).map((t) => t.text).join("");
  }
  if ("text" in obj) return obj.text;
  return null;
}

type PetaKolom = Partial<Record<KolomDikenal, number>>;

/** Mencari baris judul di 40 baris pertama: baris yang memuat NAMA BARANG dan kolom harga. */
function cariBarisJudul(ws: ExcelJS.Worksheet): { baris: number; kolom: PetaKolom } | null {
  const batas = Math.min(ws.rowCount, 40);
  for (let r = 1; r <= batas; r++) {
    const row = ws.getRow(r);
    const kolom: PetaKolom = {};
    row.eachCell({ includeEmpty: false }, (sel, c) => {
      const judul = rapikanJudul(nilaiSel(sel));
      (Object.keys(JUDUL) as KolomDikenal[]).forEach((kunci) => {
        if (kolom[kunci] === undefined && (JUDUL[kunci] as readonly string[]).includes(judul)) {
          // "FREKUENSI TOTAL" sengaja tidak dipakai: nilainya dihitung ulang otomatis.
          kolom[kunci] = c;
        }
      });
    });
    if (kolom.nama_barang && kolom.harga_satuan) return { baris: r, kolom };
  }
  return null;
}

export type SheetTerbaca = {
  nama: string;
  adaKolomFrekuensi: boolean;
  jumlahBaris: number;
};

export type HasilBaca = {
  sheet: SheetTerbaca[];
  /** Baris per sheet, belum digabung. */
  baris: Record<string, InputBarang[]>;
  /** Baris yang dilewati, per sheet. */
  peringatan: Record<string, string[]>;
};

export async function bacaBerkasExcel(buffer: ArrayBuffer): Promise<HasilBaca> {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buffer);
  } catch {
    throw new Error("Berkas tidak dapat dibaca. Pastikan formatnya .xlsx, bukan .xls atau .csv.");
  }

  const hasil: HasilBaca = { sheet: [], baris: {}, peringatan: {} };

  wb.eachSheet((ws) => {
    const judul = cariBarisJudul(ws);
    if (!judul) return;

    const { kolom } = judul;
    const barisSheet: InputBarang[] = [];
    const lewati: string[] = [];
    let kosongBeruntun = 0;

    for (let r = judul.baris + 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const ambil = (k: KolomDikenal) => (kolom[k] ? nilaiSel(row.getCell(kolom[k] as number)) : null);

      const nama = ambil("nama_barang");
      const part = ambil("no_part");
      const harga = ambil("harga_satuan");

      const namaKosong = nama === null || String(nama).trim() === "";
      const partKosong = part === null || String(part).trim() === "" || String(part).trim() === "-";

      if (namaKosong && partKosong) {
        // Berhenti setelah 25 baris kosong berturut-turut: dianggap akhir tabel.
        if (++kosongBeruntun >= 25) break;
        continue;
      }
      kosongBeruntun = 0;

      // Baris ringkasan di bawah tabel (misalnya "TOTAL BARIS") tidak punya nama maupun harga.
      const hargaKosong = harga === null || String(harga).trim() === "";
      if (namaKosong && hargaKosong) continue;

      const cek = validasiBarang({
        no_part: part,
        nama_barang: namaKosong ? "(NAMA TIDAK TERCATAT)" : nama,
        harga_satuan: harga,
        frekuensi: kolom.frekuensi ? ambil("frekuensi") : 1,
      });

      if (!cek.sah) {
        lewati.push(`Sheet "${ws.name}" baris ${r} dilewati: ${cek.pesan}`);
        continue;
      }
      barisSheet.push(cek.data);
    }

    if (barisSheet.length > 0) {
      hasil.sheet.push({
        nama: ws.name,
        adaKolomFrekuensi: Boolean(kolom.frekuensi),
        jumlahBaris: barisSheet.length,
      });
      hasil.baris[ws.name] = barisSheet;
      hasil.peringatan[ws.name] = lewati;
    }
  });

  if (hasil.sheet.length === 0) {
    throw new Error(
      'Tidak ditemukan tabel yang dapat diimpor. Setiap sheet perlu memiliki baris judul berisi "NAMA BARANG" dan "HARGA SATUAN" (atau "SATUAN").'
    );
  }
  return hasil;
}

/**
 * Menggabungkan baris dari sheet terpilih menjadi satu daftar tanpa duplikat.
 * Barang yang sama pada harga yang sama dijumlahkan frekuensinya.
 * Pada sheet tanpa kolom FREKUENSI, setiap baris dihitung sebagai satu kali pembelian.
 */
export function gabungkanBaris(hasil: HasilBaca, sheetTerpilih: string[]): InputBarang[] {
  const peta = new Map<string, InputBarang>();
  for (const nama of sheetTerpilih) {
    for (const b of hasil.baris[nama] ?? []) {
      const kunci = `${kunciBarang(b.no_part, b.nama_barang)}#${b.harga_satuan}`;
      const ada = peta.get(kunci);
      if (ada) ada.frekuensi += b.frekuensi;
      else peta.set(kunci, { ...b });
    }
  }
  return Array.from(peta.values());
}

/** Daftar baris yang dilewati pada sheet terpilih, paling banyak 50 butir. */
export function peringatanTerpilih(hasil: HasilBaca, sheetTerpilih: string[]): string[] {
  return sheetTerpilih.flatMap((s) => hasil.peringatan[s] ?? []).slice(0, 50);
}

/** Sheet yang dipilih bawaan: bila ada sheet hasil analisis (berkolom FREKUENSI), hanya sheet itu. */
export function sheetBawaan(sheet: SheetTerbaca[]): string[] {
  const analisis = sheet.filter((s) => s.adaKolomFrekuensi);
  return (analisis.length > 0 ? analisis : sheet).map((s) => s.nama);
}

/* ------------------------------------------------------------------ */
/* Menulis berkas                                                      */
/* ------------------------------------------------------------------ */

const BIRU = "FF4F81BD";
const BIRU_MUDA = "FFDCE6F1";

export async function buatBerkasExcel(
  departemen: Departemen,
  baris: BarisRekap[]
): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Dashboard Rekap BBM KIMA";
  wb.created = new Date();

  const ws = wb.addWorksheet(`REKAP ${DEPARTEMEN[departemen].nama.toUpperCase()}`, {
    views: [{ state: "frozen", ySplit: 4, showGridLines: false }],
  });

  ws.columns = [
    { key: "no", width: 6 },
    { key: "no_part", width: 18 },
    { key: "nama_barang", width: 42 },
    { key: "harga_satuan", width: 16 },
    { key: "frekuensi", width: 12 },
    { key: "frekuensi_total", width: 16 },
  ];

  const tanggal = new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Makassar" }).format(new Date());

  ws.getCell("A1").value = `REKAP PEMBELIAN ${DEPARTEMEN[departemen].nama.toUpperCase()} — BOSOWA BERLIAN MOTOR KIMA`;
  ws.getCell("A1").font = { name: "Arial", size: 13, bold: true, color: { argb: BIRU } };
  ws.getCell("A2").value = `Diekspor dari dashboard pada ${tanggal} WITA. Berkas ini dapat diimpor kembali tanpa perubahan format.`;
  ws.getCell("A2").font = { name: "Arial", size: 9, italic: true, color: { argb: "FF595959" } };

  const judul = ["NO", "NO. PART", "NAMA BARANG", "HARGA SATUAN", "FREKUENSI", "FREKUENSI TOTAL"];
  const barisJudul = ws.getRow(4);
  barisJudul.values = judul;
  barisJudul.eachCell((sel) => {
    sel.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    sel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BIRU } };
    sel.alignment = { horizontal: "center", vertical: "middle" };
  });

  const garis = { style: "thin" as const, color: { argb: "FFB0B0B0" } };
  baris.forEach((b, i) => {
    const row = ws.addRow([i + 1, b.no_part, b.nama_barang, b.harga_satuan, b.frekuensi, b.frekuensi_total]);
    row.eachCell((sel, c) => {
      sel.font = { name: "Arial", size: 10 };
      sel.border = { top: garis, left: garis, bottom: garis, right: garis };
      if (c === 4) sel.numFmt = "#,##0";
      if (c === 1 || c >= 5) sel.alignment = { horizontal: "center" };
      if (i % 2 === 1) sel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BIRU_MUDA } };
    });
  });

  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + baris.length, column: 6 } };

  const akhir = 4 + baris.length;
  const ringkas = ws.getRow(akhir + 2);
  ringkas.getCell(1).value = "TOTAL BARIS";
  ringkas.getCell(2).value = { formula: `COUNTA(C5:C${akhir})`, result: baris.length };
  const ringkas2 = ws.getRow(akhir + 3);
  ringkas2.getCell(1).value = "TOTAL PEMBELIAN";
  ringkas2.getCell(2).value = {
    formula: `SUM(E5:E${akhir})`,
    result: baris.reduce((t, b) => t + b.frekuensi, 0),
  };
  [ringkas, ringkas2].forEach((r) => r.eachCell((sel) => (sel.font = { name: "Arial", size: 10, bold: true })));

  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

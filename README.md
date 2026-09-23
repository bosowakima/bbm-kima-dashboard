# Dashboard Rekap Pembelian — Bosowa Berlian Motor KIMA

Dashboard web untuk membaca rekap pembelian suku cadang pada dua departemen,
**Sparepart** dan **Service**, periode Januari sampai Agustus 2026.

Data berasal dari rekap nota Toko Intan Motor yang sudah dibersihkan dari
pencatatan ganda. Satu baris mewakili satu barang pada satu harga satuan.

## Isi dashboard

| Halaman | Isi |
|---|---|
| `/` | Kartu ringkasan dan delapan barang paling sering dibeli untuk kedua departemen |
| `/sparepart` | Ringkasan, lima barang teratas, dan daftar lengkap 688 baris |
| `/service` | Ringkasan, lima barang teratas, dan daftar lengkap 525 baris |

Daftar lengkap dilengkapi pencarian nama barang atau nomor part, pengurutan
setiap kolom, dan paginasi 25 baris per halaman.

## Teknologi

- **Next.js 14** (App Router) dan **React 18** — kerangka aplikasi
- **Tailwind CSS** — penataan tampilan
- **Supabase** — basis data PostgreSQL dan API baca
- **Vercel** — hosting

Seluruhnya dapat dipakai pada paket gratis masing-masing layanan.

## Menjalankan di komputer sendiri

```bash
npm install
cp .env.example .env.local   # lalu isi nilainya
npm run dev
```

Buka http://localhost:3000.

Dua environment variable yang wajib diisi:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Bila keduanya belum diisi, dashboard tetap terbuka dan menampilkan petunjuk
pengisian, bukan halaman error.

## Struktur berkas

```
app/                     halaman dashboard
  page.tsx               ringkasan kedua departemen
  sparepart/page.tsx     halaman departemen sparepart
  service/page.tsx       halaman departemen service
components/              komponen tampilan
lib/
  supabase.ts            koneksi ke Supabase
  data.ts                kueri dan tipe data
  format.ts              format rupiah dan angka
supabase/
  01_schema.sql          tabel, view, indeks, dan aturan akses
  02_seed_sparepart.sql  688 baris data sparepart
  03_seed_service.sql    525 baris data service
tools/
  generate_seed.py       membuat ulang berkas seed dari Excel
TUTORIAL.md              panduan lengkap dari nol sampai online
```

## Memperbarui data periode berikutnya

```bash
python tools/generate_seed.py rekap_sparepart.xlsx "ANALISIS MALLOMO" sparepart
python tools/generate_seed.py rekap_service.xlsx "ANALISIS JAN-AGU 2026" service
```

Jalankan isi berkas SQL yang dihasilkan pada Supabase SQL Editor. Perintah
`delete` di awal berkas memastikan data lama departemen tersebut diganti, bukan
ditumpuk.

## Panduan lengkap

Langkah pembuatan akun GitHub, Supabase, dan Vercel sampai dashboard dapat
diakses publik ada di [TUTORIAL.md](TUTORIAL.md).

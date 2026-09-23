# Dashboard Rekap Pembelian — Bosowa Berlian Motor KIMA

Dashboard web untuk rekap pembelian suku cadang departemen **Sparepart** dan
**Service**, dilengkapi halaman **Admin** untuk mengubah data langsung di tabel,
mengimpor dari Excel, dan mengekspor ke Excel.

## Fitur

| Halaman | Isi | Perlu masuk |
|---|---|---|
| `/` | Ringkasan dan barang tersering kedua departemen | Tidak |
| `/sparepart`, `/service` | Ringkasan, lima barang teratas, daftar lengkap dengan pencarian dan pengurutan | Tidak |
| `/admin/sparepart`, `/admin/service` | Ubah setiap sel, tambah dan hapus baris, impor Excel, ekspor Excel | Ya |

Frekuensi total dan urutan barang dihitung ulang otomatis oleh basis data setiap
kali data berubah. Impor berjalan dalam satu transaksi, sehingga impor yang
gagal tidak meninggalkan data setengah jadi.

## Teknologi

Next.js 14 (App Router), React 18, Tailwind CSS, Supabase (PostgreSQL), ExcelJS,
dan Vercel. Seluruhnya dapat dipakai pada paket gratis.

Semua akses ke Supabase dilakukan di server memakai secret key. Peramban
pengunjung tidak pernah menerima kunci apa pun, dan tabel dikunci dari akses
publik langsung.

## Menjalankan di komputer sendiri

```bash
npm install
cp .env.example .env.local   # lalu isi ketiga nilainya
npm run dev
```

| Variabel | Isi |
|---|---|
| `SUPABASE_URL` | Project URL, misalnya `https://abcd.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key (`sb_secret_…`) atau service_role key |
| `ADMIN_PASSWORD` | Kata sandi halaman Admin, minimal 12 karakter |

Sebelum dijalankan pertama kali, jalankan seluruh isi `supabase/01_schema.sql`
pada Supabase SQL Editor.

## Struktur berkas

```
app/
  page.tsx, sparepart/, service/   halaman publik
  admin/                           halaman masuk dan kelola data
  api/admin/                       API tambah, ubah, hapus, impor, ekspor, masuk, keluar
components/
  admin/                           tabel yang dapat diubah dan panel impor
lib/
  supabase.ts   klien Supabase sisi server
  data.ts       kueri baca
  barang.ts     aturan validasi dan kunci barang
  excel.ts      baca dan tulis berkas Excel
  auth.ts       sesi admin
middleware.ts   melindungi /admin dan /api/admin
supabase/
  01_schema.sql           tabel, fungsi, dan hak akses (aman dijalankan ulang)
  02_seed_sparepart.sql   data awal opsional
  03_seed_service.sql     data awal opsional
tools/generate_seed.py    cadangan: membuat berkas seed dari Excel
TUTORIAL.md               panduan lengkap dari nol sampai online
```

Panduan langkah demi langkah, termasuk cara memperbarui dari versi 1, ada di
[TUTORIAL.md](TUTORIAL.md).

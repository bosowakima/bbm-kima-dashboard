# Dashboard Rekap Pembelian — Bosowa Berlian Motor KIMA

Dashboard web untuk rekap pembelian suku cadang departemen **Sparepart** dan
**Service**, dilengkapi halaman **Admin** untuk mengubah data langsung di tabel,
mengimpor dari Excel, dan mengekspor ke Excel.

## Fitur

| Halaman | Isi | Perlu masuk |
|---|---|---|
| `/` | Ringkasan dan barang tersering kedua departemen | Tidak |
| `/sparepart`, `/service` | Ringkasan, lima barang teratas, daftar lengkap dengan tanggal nota, pencarian, dan pengurutan | Tidak |
| `/admin/sparepart`, `/admin/service` | Ubah setiap sel, tambah dan hapus baris, kelola tanggal nota, impor Excel, ekspor Excel | Ya |

Fitur tabel (versi 3):

- Tanggal nota terakhir dan jumlah nota tertulis kecil di bawah setiap nama barang.
- Panah di kiri baris membuka detail berisi seluruh tanggal nota, No. GR, dan qty, terbaru di atas.
- Urutan: frekuensi total terbesar di atas; varian harga dari nomor part yang sama berdampingan,
  dengan varian bernota terbaru paling atas.
- Warna latar lembut yang sama untuk nomor part yang sama (atau nama barang bila nomor part kosong).
- Nama barang disorot saat kursor diarahkan, dan seluruh baris bernomor part sama ikut menebal warnanya.
- Paginasi dengan nomor halaman, serta kotak **Ke halaman** untuk langsung membuka halaman tertentu.
  Nomor yang melebihi jumlah halaman membuka halaman terakhir. Pencarian dan urutan tetap terbawa.

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
pada Supabase SQL Editor, lalu impor kedua berkas di folder `data-awal/` lewat
halaman Admin dengan mode **Ganti seluruh data**.

## Struktur berkas

```
app/
  page.tsx, sparepart/, service/   halaman publik
  admin/                           halaman masuk dan kelola data
  api/admin/                       API tambah, ubah, hapus, impor, ekspor, masuk, keluar
components/
  admin/                           tabel yang dapat diubah dan panel impor
  rekap/                           detail nota, warna kelompok, sorotan (dipakai publik dan admin)
lib/
  supabase.ts   klien Supabase sisi server
  data.ts       kueri baca
  barang.ts     aturan validasi dan kunci barang
  excel.ts      baca dan tulis berkas Excel, termasuk tanggal nota
  kelompok.ts   warna kelompok part dan format tanggal
  auth.ts       sesi admin
middleware.ts   melindungi /admin dan /api/admin
supabase/
  01_schema.sql           tabel, fungsi, dan hak akses (versi 3, aman dijalankan ulang)
  02_seed_sparepart.sql   data awal opsional lewat SQL, lengkap dengan tanggal nota
  03_seed_service.sql     data awal opsional lewat SQL, lengkap dengan tanggal nota
data-awal/
  data-awal-sparepart.xlsx  688 baris, 888 tanggal nota — impor lewat Admin
  data-awal-service.xlsx    525 baris, 720 tanggal nota — impor lewat Admin
tools/generate_seed.py    cadangan: membuat seed dari sheet analisis (tanpa tanggal nota)
TUTORIAL.md               panduan lengkap dari nol sampai online
```

Panduan langkah demi langkah, termasuk cara memperbarui dari versi 1, ada di
[TUTORIAL.md](TUTORIAL.md).

## Mengirim ke GitHub (PowerShell di Windows)

### Memperbarui proyek yang sudah ada

Contoh di bawah menganggap folder proyek ada di `Downloads\bbm-kima-dashboard`
dan ZIP versi 3 terunduh ke `Downloads\bbm-kima-dashboard-v3.zip`. Sesuaikan
bila berbeda.

```powershell
# 1. Ekstrak ZIP versi 3 ke folder sementara
Expand-Archive -Path "$env:USERPROFILE\Downloads\bbm-kima-dashboard-v3.zip" `
  -DestinationPath "$env:USERPROFILE\Downloads\bbm-v3" -Force

# 2. Salin ke folder proyek. .git, .env.local, node_modules, dan .next tidak disentuh.
robocopy "$env:USERPROFILE\Downloads\bbm-v3\bbm-kima-dashboard" `
  "$env:USERPROFILE\Downloads\bbm-kima-dashboard" /E /XD .git node_modules .next /XF .env.local

# 3. Pasang pustaka dan pastikan build berhasil
cd "$env:USERPROFILE\Downloads\bbm-kima-dashboard"
npm install
npm run build

# 4. Kirim ke GitHub
git add -A
git commit -m "Versi 3: tanggal nota, detail per barang, warna kelompok part"
git push
```

`robocopy` menampilkan ringkasan jumlah berkas yang disalin; itu bukan pesan
galat.

### Mengirim pertama kali

```powershell
cd "$env:USERPROFILE\Downloads\bbm-kima-dashboard"
git init
git add -A
git commit -m "Dashboard rekap pembelian BBM KIMA"
git branch -M main
git remote add origin https://github.com/bosowakima/bbm-kima-dashboard.git
git push -u origin main
```

Bila `git push` ditolak dengan pesan `Permission ... denied to NAMA-LAIN`,
hapus kredensial `git:https://github.com` di Windows Credential Manager, lalu
push ulang dan masuk dengan akun pemilik repositori. Bila ditolak dengan pesan
`fetch first` atau `non-fast-forward`, jalankan `git pull --rebase origin main`
terlebih dahulu, lalu `git push`.


# Modul Tutorial: Dashboard Rekap Pembelian BBM KIMA (versi 2)

Panduan ini membawa Anda dari keadaan belum memiliki akun apa pun sampai
dashboard dapat dibuka publik, lengkap dengan halaman Admin untuk mengubah data,
mengimpor, dan mengekspor Excel. Seluruh layanan yang dipakai memiliki paket
gratis dan tidak meminta kartu kredit.

Perkiraan waktu pengerjaan pertama kali: 45 sampai 60 menit.

> **Sudah memasang versi 1?** Langsung ke
> [bagian 13, Memperbarui dari versi 1](#13-memperbarui-dari-versi-1).

---

## Daftar isi

1. [Gambaran sistem](#1-gambaran-sistem)
2. [Menyiapkan perangkat](#2-menyiapkan-perangkat)
3. [Membuat akun GitHub](#3-membuat-akun-github)
4. [Mengunggah proyek ke GitHub](#4-mengunggah-proyek-ke-github)
5. [Membuat akun dan proyek Supabase](#5-membuat-akun-dan-proyek-supabase)
6. [Menyiapkan basis data](#6-menyiapkan-basis-data)
7. [Mengambil kunci koneksi Supabase](#7-mengambil-kunci-koneksi-supabase)
8. [Menjalankan dashboard di komputer sendiri](#8-menjalankan-dashboard-di-komputer-sendiri)
9. [Menerbitkan dashboard di Vercel](#9-menerbitkan-dashboard-di-vercel)
10. [Memakai halaman Admin](#10-memakai-halaman-admin)
11. [Pemecahan masalah](#11-pemecahan-masalah)
12. [Catatan keamanan dan batas paket gratis](#12-catatan-keamanan-dan-batas-paket-gratis)
13. [Memperbarui dari versi 1](#13-memperbarui-dari-versi-1)

---

## 1. Gambaran sistem

| Layanan | Peran | Biaya |
|---|---|---|
| **GitHub** | Menyimpan kode program dan riwayat perubahannya | Gratis |
| **Supabase** | Basis data PostgreSQL tempat data rekap disimpan | Gratis |
| **Vercel** | Menjalankan dashboard dan menyediakan alamat publik | Gratis |

```
                     ┌──────────────── Vercel ────────────────┐
 pengunjung ───────▶ │  halaman publik  (hanya membaca)       │
                     │                                        │ ──secret key──▶ Supabase
 admin  ─(sandi)───▶ │  halaman Admin   (ubah, impor, ekspor) │
                     └────────────────────────────────────────┘
          GitHub ──(otomatis setiap ada perubahan kode)──▶ Vercel
```

Hal penting pada versi ini: **peramban pengunjung tidak pernah berhubungan
langsung dengan Supabase.** Semua pembacaan dan penulisan data dilakukan oleh
server di Vercel memakai *secret key*. Kunci tersebut hanya tersimpan di server,
sehingga tabel di Supabase dapat dikunci rapat dari akses publik.

Halaman yang tersedia:

| Alamat | Isi | Perlu masuk |
|---|---|---|
| `/` | Ringkasan kedua departemen | Tidak |
| `/sparepart`, `/service` | Ringkasan, barang teratas, daftar lengkap | Tidak |
| `/admin/sparepart`, `/admin/service` | Ubah data, tambah, hapus, impor, ekspor | Ya |

Setelah basis data disiapkan satu kali, seluruh pengelolaan data dilakukan dari
halaman Admin. Anda tidak perlu membuka Supabase lagi.

---

## 2. Menyiapkan perangkat

Bagian ini hanya diperlukan bila Anda ingin menjalankan dashboard di komputer
sendiri. Bila hanya ingin menerbitkannya, lanjut ke bagian 3 dan unggah berkas
lewat halaman web GitHub.

### 2.1 Memasang Node.js

1. Buka <https://nodejs.org>, unduh versi **LTS**. Diperlukan versi **20 atau
   lebih baru**.
2. Jalankan pemasangnya dengan pengaturan bawaan.
3. Buka Command Prompt (Windows) atau Terminal (macOS), lalu periksa:

   ```bash
   node -v
   npm -v
   ```

### 2.2 Memasang Git

1. Buka <https://git-scm.com/downloads>, unduh sesuai sistem operasi Anda.
2. Jalankan pemasangnya dengan pengaturan bawaan.
3. Perkenalkan identitas Anda kepada Git:

   ```bash
   git config --global user.name "Nama Anda"
   git config --global user.email "email@anda.com"
   ```

### 2.3 Menyiapkan berkas proyek

Ekstrak berkas ZIP. Isinya satu folder bernama `bbm-kima-dashboard`. Letakkan di
tempat yang mudah dicari, misalnya `D:\proyek\bbm-kima-dashboard`.

---

## 3. Membuat akun GitHub

1. Buka <https://github.com/signup>, isi email, kata sandi, dan nama pengguna.
2. Selesaikan verifikasi dan konfirmasi email. Pilih paket **Free**.
3. Klik tanda **+** di kanan atas, pilih **New repository**.
4. Isi **Repository name** dengan `bbm-kima-dashboard`.
5. Pilih **Private** bila kode tidak ingin dilihat orang lain. Vercel tetap
   dapat membaca repositori privat milik akun Anda.
6. **Jangan** mencentang *Add a README file*, *Add .gitignore*, maupun
   *Choose a license*. Klik **Create repository**.

---

## 4. Mengunggah proyek ke GitHub

### Cara A — perintah Git (disarankan)

```bash
cd D:\proyek\bbm-kima-dashboard
git init
git add .
git commit -m "Dashboard rekap pembelian BBM KIMA"
git branch -M main
git remote add origin https://github.com/NAMA-ANDA/bbm-kima-dashboard.git
git push -u origin main
```

Ganti `NAMA-ANDA` dengan nama pengguna GitHub pemilik repositori. Bila muncul
jendela login, masuklah dengan akun **pemilik repositori tersebut**.

> Bila `git push` ditolak dengan pesan `Permission ... denied to NAMA-LAIN`,
> komputer Anda sedang memakai kredensial akun GitHub lain. Lihat bagian 11.

### Cara B — unggah lewat halaman web

1. Pada halaman repositori, klik **uploading an existing file**.
2. Seret **isi** folder proyek (bukan foldernya) ke area unggah, sehingga
   `package.json` berada di tingkat teratas.
3. Pastikan `node_modules`, `.next`, dan `.env.local` tidak ikut terunggah.
4. Klik **Commit changes**.

---

## 5. Membuat akun dan proyek Supabase

1. Buka <https://supabase.com>, klik **Start your project**, lalu pilih
   **Continue with GitHub**.
2. Klik **New project**, lalu isi:
   - **Project name**: `bbm-kima-dashboard`
   - **Database Password**: klik **Generate a password** dan simpan di tempat aman.
   - **Region**: **Southeast Asia (Singapore)**, paling dekat dengan Makassar.
   - **Pricing plan**: **Free**
3. Klik **Create new project**, tunggu satu sampai dua menit.

---

## 6. Menyiapkan basis data

Langkah ini hanya dilakukan **satu kali**.

1. Pada menu kiri Supabase, klik **SQL Editor**, lalu **New query**.
2. Buka berkas `supabase/01_schema.sql` dengan Notepad, salin **seluruh**
   isinya, lalu tempelkan ke editor.
3. Pastikan tidak ada teks yang tersorot, lalu klik **Run**.
4. Lihat hasil di bagian bawah. Harus muncul satu baris dengan tiga kolom:

   | boleh_membaca | boleh_menambah | boleh_mengubah |
   |---|---|---|
   | true | true | true |

   Bila ketiganya `true`, basis data siap.

Berkas ini membuat tabel `rekap_barang`, aturan agar satu barang pada satu harga
tidak tercatat dua kali, fungsi penghitung frekuensi total, fungsi impor, dan
hak akses. Berkas aman dijalankan ulang dan **tidak menghapus data**.

### Mengisi data awal

Ada dua cara. Pilih salah satu.

- **Cara yang disarankan:** biarkan tabel kosong. Setelah dashboard berjalan,
  impor berkas Excel lewat halaman Admin (bagian 10.4).
- **Cara lewat SQL:** jalankan isi `supabase/02_seed_sparepart.sql`, lalu
  `supabase/03_seed_service.sql`, masing-masing pada tab kueri baru.

---

## 7. Mengambil kunci koneksi Supabase

Dashboard memerlukan dua nilai dari Supabase.

**Alamat proyek**

1. Buka **Project Settings** (ikon roda gigi), lalu **Data API**.
2. Salin **Project URL**, berbentuk `https://abcdefghijklmnop.supabase.co`.

**Secret key**

1. Buka **Project Settings**, lalu **API Keys**.
2. Pada bagian **Secret keys**, salin kunci berawalan `sb_secret_`. Bila belum
   ada, klik **Create new secret key**.
3. Bila tampilan Anda hanya menampilkan tab **Legacy API keys**, salin kunci
   **service_role**, bukan **anon**.

> ⚠️ Secret key memberi akses penuh ke basis data. Jangan dibagikan, jangan
> ditempel di chat, dan jangan diberi awalan `NEXT_PUBLIC_`. Kunci ini hanya
> disimpan di `.env.local` dan di pengaturan Vercel.
>
> Kunci **anon** atau **publishable** tidak dapat dipakai pada versi 2. Bila
> tertukar, dashboard akan menampilkan pesan *permission denied*.

---

## 8. Menjalankan dashboard di komputer sendiri

1. Buka terminal di folder proyek, lalu pasang pustaka pendukung:

   ```bash
   npm install
   ```

2. Buat berkas `.env.local` di folder teratas proyek dengan isi berikut:

   ```
   SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxxxxxxxxxxxxxxxxxxx
   ADMIN_PASSWORD=kata-sandi-admin-yang-panjang
   ```

   Aturan penulisan: tanpa tanda kutip, tanpa spasi di sekitar tanda sama
   dengan, dan alamat proyek tanpa garis miring di akhir. `ADMIN_PASSWORD`
   bebas Anda tentukan; gunakan minimal 12 karakter.

3. Jalankan dashboard:

   ```bash
   npm run dev
   ```

4. Buka <http://localhost:3000>. Untuk halaman Admin, buka
   <http://localhost:3000/admin> dan masuk dengan `ADMIN_PASSWORD`.

Setiap kali isi `.env.local` diubah, hentikan server dengan `Ctrl + C` lalu
jalankan `npm run dev` kembali, karena berkas ini hanya dibaca saat server mulai.

---

## 9. Menerbitkan dashboard di Vercel

1. Buka <https://vercel.com/signup>, pilih **Continue with GitHub**, lalu pilih
   paket **Hobby** (gratis).
2. Klik **Add New**, lalu **Project**. Pilih `bbm-kima-dashboard`, klik
   **Import**. Bila repositori tidak muncul, klik
   **Adjust GitHub App Permissions** dan berikan akses.
3. **Framework Preset** terdeteksi sebagai **Next.js**. Biarkan pengaturan lain.
4. Buka **Environment Variables**, lalu tambahkan tiga baris:

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | Project URL dari bagian 7 |
   | `SUPABASE_SERVICE_ROLE_KEY` | Secret key dari bagian 7 |
   | `ADMIN_PASSWORD` | Kata sandi admin pilihan Anda |

5. Klik **Deploy**, tunggu satu sampai tiga menit.

Setelah selesai, dashboard dapat dibuka di alamat seperti
`https://bbm-kima-dashboard.vercel.app`, dan halaman Admin di
`https://bbm-kima-dashboard.vercel.app/admin`.

**Mengubah environment variable setelah deploy.** Buka **Settings**, lalu
**Environment Variables**, ubah nilainya, kemudian buka **Deployments**, pilih
deployment teratas, klik tombol titik tiga, dan pilih **Redeploy**. Nilai baru
hanya berlaku pada deployment berikutnya.

**Menerbitkan perubahan kode berikutnya.** Cukup kirim ke GitHub; Vercel
membangun ulang secara otomatis:

```bash
git add .
git commit -m "keterangan perubahan"
git push
```

---

## 10. Memakai halaman Admin

### 10.1 Masuk dan keluar

Buka `/admin`, masukkan kata sandi, lalu klik **Masuk**. Sesi berlaku 12 jam.
Klik **Keluar** di kanan atas bila memakai komputer bersama. Mengganti
`ADMIN_PASSWORD` otomatis mengeluarkan semua sesi yang masih aktif.

Gunakan pilihan **Sparepart** dan **Service** di kanan atas untuk berpindah
departemen.

### 10.2 Mengubah data langsung di tabel

1. Klik sel yang ingin diubah: nomor part, nama barang, harga satuan, atau
   frekuensi.
2. Ketik nilai baru.
3. Tekan **Enter** atau klik di luar sel untuk menyimpan. Tekan **Esc** untuk
   membatalkan.

Pesan di atas tabel memberi tahu apakah perubahan tersimpan. Bila nilai ditolak,
sel tetap terbuka dan pesan menjelaskan alasannya.

Beberapa aturan yang dijaga otomatis:

- **Frekuensi total** tidak diubah manual. Nilainya dihitung ulang dari seluruh
  varian harga barang yang sama setiap kali ada perubahan, sehingga tidak pernah
  selisih dengan rinciannya.
- Nama barang dan nomor part disimpan dalam huruf besar, dengan spasi ganda
  dirapikan, agar barang yang sama tidak tercatat sebagai barang berbeda.
- Harga dapat diketik sebagai `1250000` maupun `Rp 1.250.000`.
- Satu barang pada satu harga hanya boleh ada satu baris. Bila Anda membeli lagi
  barang yang sama dengan harga yang sama, tambahkan frekuensinya, bukan
  barisnya.

### 10.3 Menambah dan menghapus baris

**Menambah:** isi kotak di atas tabel (nomor part boleh dikosongkan), lalu klik
**Tambah barang**.

**Menghapus:** klik **Hapus** di ujung baris, lalu konfirmasi.

### 10.4 Mengimpor dari Excel

1. Pada panel **Impor dari Excel**, pilih berkas `.xlsx`.
2. Pilih cara impor:
   - **Ganti seluruh data** — data departemen ini dihapus dan diganti isi
     berkas. Cocok untuk memuat rekap periode baru secara utuh.
   - **Tambahkan ke data yang ada** — frekuensi barang yang sama pada harga yang
     sama dijumlahkan, barang baru disisipkan. Cocok untuk menambahkan rekap
     satu bulan.
3. Klik **Periksa berkas**. Data belum berubah pada tahap ini.
4. Periksa pratinjau: daftar sheet yang ditemukan, jumlah barang, jumlah
   pembelian, dan contoh baris. Centang atau hapus centang sheet sesuai
   kebutuhan; pratinjau diperbarui otomatis.
5. Klik tombol simpan di bawah pratinjau, lalu konfirmasi.

Berkas yang dapat dibaca:

| Jenis berkas | Cara dibaca |
|---|---|
| Hasil **Ekspor ke Excel** dari dashboard | Apa adanya |
| Sheet analisis berkolom FREKUENSI (misalnya `ANALISIS MALLOMO`) | Apa adanya; dipilih otomatis bila ada |
| Sheet rekap bulanan tanpa kolom FREKUENSI | Setiap baris dihitung satu kali pembelian |

Syaratnya, setiap sheet memiliki baris judul yang memuat **NAMA BARANG** dan
**HARGA SATUAN** (atau **SATUAN**). Kolom **NO. PART** dan **FREKUENSI** dibaca
bila ada. Baris judul boleh berada di mana saja pada 40 baris pertama.

> Impor dari sheet rekap bulanan **tidak membaca warna sel**. Untuk departemen
> sparepart yang hanya menghitung nota Mallomo (bertanda biru), impor sheet
> hasil analisis, bukan sheet bulanan mentah.

Impor berjalan dalam satu transaksi: bila terjadi kesalahan di tengah jalan,
tidak ada data yang berubah sama sekali.

### 10.5 Mengekspor ke Excel

Klik **Ekspor ke Excel** di kanan atas. Berkas yang terunduh berisi seluruh
data departemen yang sedang dibuka, dengan kolom yang sama seperti sheet
analisis. Berkas ini dapat diedit di Excel lalu diimpor kembali memakai mode
**Ganti seluruh data**.

---

## 11. Pemecahan masalah

Pesan galat ditampilkan di layar. Cocokkan dengan daftar berikut.

**"Dashboard belum terhubung ke Supabase"**
Environment variable belum terbaca. Periksa nama berkas harus tepat
`.env.local` dan jalankan ulang `npm run dev`. Di Vercel, periksa ejaan nama
variabel, lalu lakukan **Redeploy**.

**"Invalid path specified in request URL"**
Nilai `SUPABASE_URL` salah bentuk. Isinya harus berakhir di `.supabase.co`,
tanpa `/rest/v1`, tanpa tanda kutip.

**"Invalid API key"** atau **"Unregistered API key"**
Secret key salah salin atau berasal dari proyek lain. Salin ulang dari
**Project Settings** lalu **API Keys** pada proyek yang benar.

**"Server tidak memiliki izin ke tabel rekap_barang"** atau **"permission denied"**
Ada dua kemungkinan. Pertama, `SUPABASE_SERVICE_ROLE_KEY` berisi kunci anon atau
publishable; ganti dengan secret key (bagian 7). Kedua, berkas
`01_schema.sql` versi 2 belum dijalankan; jalankan seluruh isinya dan pastikan
ketiga kolom pemeriksaan bernilai `true`.

**"Fungsi basis data belum tersedia"**
Berkas `01_schema.sql` yang dijalankan masih versi 1. Jalankan isi berkas versi
terbaru dari folder `supabase/`.

**"Halaman admin belum diaktifkan"** pada halaman masuk
`ADMIN_PASSWORD` atau `SUPABASE_SERVICE_ROLE_KEY` belum diisi.

**"Tidak ditemukan tabel yang dapat diimpor"**
Tidak ada sheet yang memiliki baris judul berisi NAMA BARANG dan HARGA SATUAN.
Periksa ejaan judul kolom pada berkas.

**"Format berkas harus .xlsx"**
Buka berkas di Excel, pilih **File**, **Save As**, lalu pilih jenis
**Excel Workbook (*.xlsx)**.

**`git push` ditolak dengan pesan "Permission ... denied to NAMA-LAIN"**
Windows menyimpan kredensial akun GitHub lain. Buka **Credential Manager**, pilih
**Windows Credentials**, hapus entri `git:https://github.com`, keluar dari akun
GitHub lama di peramban, lalu jalankan `git push` lagi dan masuk dengan akun
pemilik repositori.

**Proyek Supabase berstatus dijeda**
Proyek gratis yang tidak dipakai sekitar satu minggu akan dijeda. Buka dasbor
Supabase, klik **Restore project**. Data tidak hilang.

---

## 12. Catatan keamanan dan batas paket gratis

**Rahasia yang harus dijaga.** Secret key Supabase, kata sandi basis data, dan
`ADMIN_PASSWORD`. Ketiganya tidak pernah masuk ke GitHub karena `.env.local`
sudah tercantum di `.gitignore`.

**Halaman publik tetap terbuka.** Siapa pun yang mengetahui alamat dashboard
dapat melihat nama barang, nomor part, dan harga satuan, tetapi tidak dapat
mengubahnya. Perubahan data hanya dapat dilakukan setelah masuk ke halaman Admin.

**Kata sandi admin.** Gunakan minimal 12 karakter dan jangan memakai kata sandi
yang sama dengan akun lain. Server menambahkan jeda pada setiap percobaan masuk
yang gagal untuk memperlambat upaya menebak.

**Cadangan data.** Lakukan **Ekspor ke Excel** untuk kedua departemen secara
berkala, misalnya setiap akhir bulan. Berkas ekspor dapat diimpor kembali kapan
saja untuk memulihkan data.

| Layanan | Batas utama paket gratis |
|---|---|
| Supabase | Penyimpanan 500 MB; proyek dijeda setelah sekitar satu minggu tanpa aktivitas |
| Vercel | Penggunaan bukan komersial dengan kuota bulanan; unggahan maksimal sekitar 4,5 MB per berkas |
| GitHub | Repositori publik maupun privat tanpa batas jumlah |

---

## 13. Memperbarui dari versi 1

Bagian ini untuk Anda yang sudah memasang versi 1 dan mengalami pesan
*permission denied*. Versi 2 mengatasi masalah tersebut dengan tidak lagi
memakai kunci anon, sekaligus menambahkan halaman Admin.

1. **Ganti berkas proyek.** Ekstrak ZIP versi 2, lalu salin seluruh isinya ke
   folder proyek lama dan timpa berkas yang sama. Folder `.git` dan berkas
   `.env.local` milik Anda tetap dipertahankan.

2. **Jalankan skema versi 2.** Di Supabase SQL Editor, jalankan seluruh isi
   `supabase/01_schema.sql` yang baru. Data yang sudah ada tidak terhapus.
   Pastikan ketiga kolom pemeriksaan bernilai `true`.

3. **Perbarui `.env.local`.** Ganti isinya menjadi tiga baris pada bagian 8.
   Nama variabel berubah: `NEXT_PUBLIC_SUPABASE_URL` menjadi `SUPABASE_URL`,
   dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` dihapus, diganti
   `SUPABASE_SERVICE_ROLE_KEY` berisi secret key.

4. **Pasang ulang pustaka dan coba.**

   ```bash
   npm install
   npm run dev
   ```

   Buka <http://localhost:3000> dan <http://localhost:3000/admin>.

5. **Perbarui Vercel.** Pada **Settings**, **Environment Variables**, hapus dua
   variabel lama yang berawalan `NEXT_PUBLIC_`, lalu tambahkan tiga variabel dari
   bagian 9.

6. **Kirim ke GitHub.** Vercel membangun ulang otomatis.

   ```bash
   git add .
   git commit -m "Versi 2: halaman admin, impor dan ekspor Excel"
   git push
   ```

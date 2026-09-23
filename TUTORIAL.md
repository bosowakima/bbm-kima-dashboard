# Modul Tutorial: Membangun Dashboard Rekap Pembelian BBM KIMA

Panduan ini membawa Anda dari keadaan belum memiliki akun apa pun sampai
dashboard dapat dibuka siapa saja melalui tautan publik. Seluruh layanan yang
dipakai memiliki paket gratis dan tidak meminta kartu kredit.

Perkiraan waktu pengerjaan pertama kali: 45 sampai 60 menit.

---

## Daftar isi

1. [Gambaran sistem](#1-gambaran-sistem)
2. [Menyiapkan perangkat](#2-menyiapkan-perangkat)
3. [Membuat akun GitHub](#3-membuat-akun-github)
4. [Mengunggah proyek ke GitHub](#4-mengunggah-proyek-ke-github)
5. [Membuat akun dan proyek Supabase](#5-membuat-akun-dan-proyek-supabase)
6. [Membuat tabel dan mengisi data](#6-membuat-tabel-dan-mengisi-data)
7. [Mengambil kunci koneksi Supabase](#7-mengambil-kunci-koneksi-supabase)
8. [Menjalankan dashboard di komputer sendiri](#8-menjalankan-dashboard-di-komputer-sendiri)
9. [Membuat akun Vercel dan menerbitkan dashboard](#9-membuat-akun-vercel-dan-menerbitkan-dashboard)
10. [Memperbarui data periode berikutnya](#10-memperbarui-data-periode-berikutnya)
11. [Pemecahan masalah](#11-pemecahan-masalah)
12. [Catatan keamanan dan batas paket gratis](#12-catatan-keamanan-dan-batas-paket-gratis)

---

## 1. Gambaran sistem

Tiga layanan bekerja bersama:

| Layanan | Peran | Biaya |
|---|---|---|
| **GitHub** | Menyimpan kode program dan riwayat perubahannya | Gratis |
| **Supabase** | Basis data PostgreSQL tempat data rekap disimpan | Gratis |
| **Vercel** | Menjalankan dashboard dan menyediakan alamat publik | Gratis |

Alur kerjanya: kode disimpan di GitHub, Vercel membaca kode itu dan
menjalankannya sebagai situs web, lalu situs tersebut mengambil data dari
Supabase setiap kali halaman dibuka.

```
Excel rekap  ──(sekali, lewat SQL)──▶  Supabase
                                          │
                                          │ dibaca saat halaman dibuka
                                          ▼
   GitHub  ──(otomatis saat ada perubahan)──▶  Vercel  ──▶  pengunjung
```

Data rekap tidak disimpan di dalam kode. Kode hanya berisi tampilan dan cara
membaca data. Karena itu, memperbarui data cukup dilakukan di Supabase tanpa
menyentuh kode.

---

## 2. Menyiapkan perangkat

Bagian ini hanya diperlukan bila Anda ingin menjalankan dan mengubah dashboard
di komputer sendiri. Bila Anda hanya ingin menerbitkannya, Anda dapat langsung
ke [bagian 3](#3-membuat-akun-github) dan mengunggah berkas lewat halaman web
GitHub.

### 2.1 Memasang Node.js

Node.js adalah program yang menjalankan kode dashboard di komputer Anda.

1. Buka <https://nodejs.org>.
2. Unduh versi yang bertanda **LTS**. Versi 18 atau yang lebih baru sudah cukup.
3. Jalankan pemasangnya, tekan Next sampai selesai dengan pengaturan bawaan.
4. Buka Command Prompt pada Windows, atau Terminal pada macOS, lalu ketik:

   ```bash
   node -v
   npm -v
   ```

   Bila keduanya menampilkan nomor versi, pemasangan berhasil.

### 2.2 Memasang Git

Git adalah program yang mengirim kode ke GitHub.

1. Buka <https://git-scm.com/downloads>, unduh sesuai sistem operasi Anda.
2. Jalankan pemasangnya dengan pengaturan bawaan.
3. Periksa hasilnya:

   ```bash
   git --version
   ```

4. Perkenalkan identitas Anda kepada Git, karena setiap perubahan dicatat atas
   nama ini:

   ```bash
   git config --global user.name "Nama Anda"
   git config --global user.email "email@anda.com"
   ```

### 2.3 Menyiapkan berkas proyek

Ekstrak berkas ZIP yang Anda terima. Isinya adalah satu folder bernama
`bbm-kima-dashboard`. Letakkan di tempat yang mudah dicari, misalnya
`D:\proyek\bbm-kima-dashboard` atau `~/proyek/bbm-kima-dashboard`.

---

## 3. Membuat akun GitHub

1. Buka <https://github.com/signup>.
2. Masukkan alamat email, kata sandi, dan nama pengguna. Nama pengguna akan
   muncul pada alamat repositori, jadi pilih yang rapi, misalnya `ahnafzaki`.
3. Selesaikan verifikasi, lalu buka email Anda dan klik tautan konfirmasi.
4. Saat ditanya paket, pilih **Free**.

Setelah masuk, Anda berada di halaman beranda GitHub.

### 3.1 Membuat repositori kosong

1. Klik tanda **+** di kanan atas, lalu pilih **New repository**.
2. Isi **Repository name** dengan `bbm-kima-dashboard`.
3. Isi **Description** dengan keterangan singkat, misalnya
   `Dashboard rekap pembelian sparepart dan service BBM KIMA`.
4. Pilih **Public** agar Vercel dapat membacanya tanpa pengaturan tambahan.
   Pilih **Private** bila data dianggap rahasia; Vercel tetap dapat membaca
   repositori privat milik akun Anda sendiri.
5. **Jangan** mencentang *Add a README file*, *Add .gitignore*, maupun
   *Choose a license*. Berkas-berkas itu sudah ada di dalam proyek.
6. Klik **Create repository**.

Halaman berikutnya menampilkan alamat repositori, misalnya
`https://github.com/ahnafzaki/bbm-kima-dashboard.git`. Simpan alamat ini.

---

## 4. Mengunggah proyek ke GitHub

Pilih salah satu dari dua cara berikut.

### Cara A — melalui perintah Git (disarankan)

Buka Command Prompt atau Terminal, lalu masuk ke folder proyek:

```bash
cd D:\proyek\bbm-kima-dashboard      # Windows
cd ~/proyek/bbm-kima-dashboard       # macOS atau Linux
```

Jalankan perintah berikut satu per satu:

```bash
git init
git add .
git commit -m "Dashboard rekap pembelian BBM KIMA"
git branch -M main
git remote add origin https://github.com/NAMA-ANDA/bbm-kima-dashboard.git
git push -u origin main
```

Ganti `NAMA-ANDA` dengan nama pengguna GitHub Anda.

Pada perintah terakhir, GitHub meminta autentikasi. Bila jendela login muncul,
masuk seperti biasa. Bila yang diminta adalah kata sandi di dalam terminal,
GitHub tidak lagi menerima kata sandi akun; Anda perlu membuat token:

1. Buka <https://github.com/settings/tokens>.
2. Pilih **Generate new token**, lalu **Generate new token (classic)**.
3. Beri nama `push dashboard`, pilih masa berlaku, dan centang cakupan **repo**.
4. Klik **Generate token**, lalu salin token yang muncul. Token hanya
   ditampilkan satu kali.
5. Tempelkan token itu sebagai pengganti kata sandi.

### Cara B — melalui halaman web GitHub

1. Pada halaman repositori yang baru dibuat, klik **uploading an existing file**.
2. Seret seluruh isi folder `bbm-kima-dashboard` ke area unggah. Masukkan
   isinya, bukan foldernya, agar `package.json` berada di tingkat teratas.
3. Pastikan folder `node_modules` dan `.next` tidak ikut terunggah. Keduanya
   berukuran besar dan dibuat ulang secara otomatis.
4. Isi kotak **Commit changes** dengan keterangan singkat, lalu klik
   **Commit changes**.

Setelah selesai, halaman repositori menampilkan daftar berkas proyek.

---

## 5. Membuat akun dan proyek Supabase

1. Buka <https://supabase.com>, klik **Start your project**.
2. Pilih **Continue with GitHub** agar tidak perlu membuat kata sandi baru, lalu
   setujui permintaan izinnya.
3. Setelah masuk, klik **New project**.
4. Isi formulir:
   - **Organization**: pilih yang tersedia, atau buat baru dengan nama bebas.
   - **Project name**: `bbm-kima-dashboard`.
   - **Database Password**: klik **Generate a password**, lalu **simpan kata
     sandi itu di tempat aman**. Kata sandi ini dipakai bila suatu saat Anda
     menyambung ke basis data secara langsung.
   - **Region**: pilih **Southeast Asia (Singapore)** karena paling dekat dengan
     Makassar, sehingga halaman terasa lebih cepat.
   - **Pricing plan**: **Free**.
5. Klik **Create new project**, lalu tunggu satu sampai dua menit sampai status
   proyek berubah menjadi aktif.

---

## 6. Membuat tabel dan mengisi data

Seluruh perintah basis data sudah disiapkan dalam tiga berkas di folder
`supabase/`. Jalankan berurutan.

1. Pada menu kiri Supabase, klik ikon **SQL Editor**.
2. Klik **New query**.
3. Buka berkas `supabase/01_schema.sql` dengan Notepad atau editor teks,
   salin seluruh isinya, lalu tempelkan ke kotak editor Supabase.
4. Klik **Run** di kanan bawah. Hasil yang benar adalah pesan **Success**.

   Berkas ini membuat tabel `rekap_barang`, dua view ringkasan, indeks agar
   pencarian cepat, dan aturan akses yang hanya mengizinkan pembacaan data.

5. Klik **New query** lagi. Salin isi `supabase/02_seed_sparepart.sql`,
   tempelkan, lalu **Run**. Berkas ini memasukkan 688 baris data sparepart.
6. Ulangi untuk `supabase/03_seed_service.sql` yang berisi 525 baris data
   service.

> Berkas seed berukuran cukup besar. Bila editor terasa berat saat menempel,
> tunggu beberapa detik sebelum menekan Run.

### Memastikan data sudah masuk

Jalankan kueri berikut pada tab baru:

```sql
select departemen, count(*) as baris, sum(frekuensi) as pembelian
from public.rekap_barang
group by departemen;
```

Hasil yang benar:

| departemen | baris | pembelian |
|---|---|---|
| service | 525 | 720 |
| sparepart | 688 | 888 |

---

## 7. Mengambil kunci koneksi Supabase

Dashboard memerlukan dua nilai untuk menyambung ke basis data.

1. Pada menu kiri, klik ikon roda gigi **Project Settings**.
2. Pilih **Data API** (pada sebagian tampilan bernama **API**).
3. Salin dua nilai berikut:
   - **Project URL**, berbentuk `https://xxxxxxxxxxxx.supabase.co`
   - **anon public** pada bagian Project API keys, berupa teks panjang

Kunci `anon` memang dirancang untuk dipakai di sisi pengunjung dan aman
ditempatkan di aplikasi web, selama aturan akses basis data sudah dibatasi.
Aturan itu sudah diatur oleh `01_schema.sql`, yang hanya mengizinkan perintah
baca.

> Jangan menyalin kunci **service_role**. Kunci tersebut memiliki akses penuh
> dan tidak boleh keluar dari lingkungan pribadi Anda.

---

## 8. Menjalankan dashboard di komputer sendiri

Langkah ini bersifat pilihan, tetapi berguna untuk memastikan semuanya benar
sebelum diterbitkan.

1. Buka Command Prompt atau Terminal di folder proyek.
2. Pasang pustaka pendukung:

   ```bash
   npm install
   ```

   Proses ini mengunduh berkas ke folder `node_modules` dan memakan waktu satu
   sampai tiga menit.

3. Buat berkas bernama `.env.local` di folder teratas proyek, dengan isi:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

   Ganti kedua nilainya dengan yang Anda salin pada bagian 7. Jangan memberi
   tanda kutip dan jangan menambahkan spasi di sekitar tanda sama dengan.

4. Jalankan dashboard:

   ```bash
   npm run dev
   ```

5. Buka <http://localhost:3000> pada peramban.

Bila halaman menampilkan kartu ringkasan dan grafik barang tersering, berarti
sambungan ke Supabase berhasil. Tekan `Ctrl + C` pada terminal untuk
menghentikannya.

Berkas `.env.local` sudah terdaftar pada `.gitignore`, sehingga tidak akan ikut
terunggah ke GitHub.

---

## 9. Membuat akun Vercel dan menerbitkan dashboard

1. Buka <https://vercel.com/signup>.
2. Pilih **Continue with GitHub**, lalu setujui permintaan izinnya.
3. Saat ditanya jenis penggunaan, pilih **Hobby** yang merupakan paket gratis.
   Isi nama tampilan bila diminta.
4. Pada dasbor Vercel, klik **Add New**, lalu **Project**.
5. Cari `bbm-kima-dashboard` pada daftar repositori, klik **Import**. Bila
   repositori tidak muncul, klik **Adjust GitHub App Permissions** dan berikan
   akses ke repositori tersebut.
6. Pada halaman konfigurasi:
   - **Framework Preset** akan terdeteksi sebagai **Next.js**. Biarkan.
   - **Build Command**, **Output Directory**, dan **Install Command** dibiarkan
     kosong atau bawaan.
   - Buka bagian **Environment Variables**, lalu tambahkan dua baris:

     | Name | Value |
     |---|---|
     | `NEXT_PUBLIC_SUPABASE_URL` | Project URL dari bagian 7 |
     | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | kunci anon public dari bagian 7 |

     Pastikan keduanya berlaku untuk lingkungan Production, Preview, dan
     Development.
7. Klik **Deploy**, lalu tunggu satu sampai tiga menit.

Setelah selesai, Vercel menampilkan pratinjau dan alamat publik berbentuk
`https://bbm-kima-dashboard.vercel.app`. Alamat tersebut dapat dibuka siapa saja
tanpa perlu masuk.

### Mengubah alamat situs

Buka **Settings**, lalu **Domains**, untuk mengganti alamat bawaan atau
menambahkan domain sendiri bila nanti tersedia.

### Menerbitkan perubahan berikutnya

Setiap kali kode diubah dan dikirim ke GitHub, Vercel membangun ulang situs
secara otomatis:

```bash
git add .
git commit -m "keterangan perubahan"
git push
```

---

## 10. Memperbarui data periode berikutnya

Data di dashboard berasal dari tabel Supabase, sehingga pembaruan dilakukan di
sana, bukan di kode.

### Bila format sheet analisis tetap sama

1. Siapkan berkas Excel rekap yang sudah memuat sheet analisis dengan susunan
   kolom NO, NO. PART, NAMA BARANG, HARGA SATUAN, FREKUENSI, dan FREKUENSI
   TOTAL, dimulai pada baris ke-8.
2. Pasang pustaka pembaca Excel, sekali saja:

   ```bash
   pip install openpyxl
   ```

3. Buat ulang berkas seed:

   ```bash
   python tools/generate_seed.py rekap_sparepart.xlsx "ANALISIS MALLOMO" sparepart
   python tools/generate_seed.py rekap_service.xlsx "ANALISIS JAN-AGU 2026" service
   ```

4. Buka Supabase SQL Editor, jalankan isi berkas seed yang baru. Setiap berkas
   diawali perintah `delete` untuk departemen bersangkutan, sehingga data lama
   diganti, bukan bertumpuk.
5. Muat ulang dashboard. Halaman menyimpan hasil selama lima menit, jadi
   perubahan tampak paling lambat lima menit kemudian.

### Menambah data tanpa menghapus yang lama

Bila Anda ingin menyimpan beberapa periode sekaligus, tambahkan kolom periode
pada tabel, lalu sesuaikan kueri di `lib/data.ts`. Perubahan ini mengubah
struktur, jadi sebaiknya dicoba lebih dahulu di proyek Supabase terpisah.

---

## 11. Pemecahan masalah

**Dashboard menampilkan tulisan "belum terhubung ke Supabase".**
Environment variable belum terbaca. Di komputer sendiri, periksa nama berkas
harus tepat `.env.local` dan jalankan ulang `npm run dev`. Di Vercel, periksa
ejaan nama variabel, lalu buka **Deployments**, pilih yang terbaru, dan klik
**Redeploy**, karena nilai baru hanya terpakai pada pembangunan berikutnya.

**Halaman terbuka tetapi seluruh angka bernilai nol.**
Berkas seed belum dijalankan atau gagal. Jalankan kueri pemeriksaan pada bagian
6 untuk memastikan jumlah barisnya.

**Muncul pesan galat berisi "permission denied for table rekap_barang".**
Berkas `01_schema.sql` belum dijalankan sampai selesai. Jalankan ulang seluruh
isinya; berkas tersebut aman dijalankan berkali-kali karena diawali perintah
`drop` yang bersyarat.

**Pembangunan di Vercel gagal dengan pesan tentang modul yang tidak ditemukan.**
Folder `node_modules` mungkin ikut terunggah dan membuat isinya tidak
konsisten. Hapus folder tersebut dari repositori, lalu kirim ulang.

**`git push` ditolak dengan pesan "Authentication failed".**
Gunakan token akses pribadi sebagai pengganti kata sandi, seperti dijelaskan
pada bagian 4.

**Proyek Supabase berstatus dijeda.**
Pada paket gratis, proyek yang tidak dipakai selama kurang lebih satu minggu
akan dijeda. Buka dasbor Supabase lalu klik **Restore project**. Data tidak
hilang.

---

## 12. Catatan keamanan dan batas paket gratis

**Yang boleh dan tidak boleh dibagikan.** Kunci `anon` aman berada di aplikasi
web karena aturan akses membatasinya pada perintah baca. Kata sandi basis data
dan kunci `service_role` tidak boleh dibagikan maupun dimasukkan ke dalam kode.

**Data dashboard bersifat publik.** Siapa pun yang mengetahui alamatnya dapat
melihat nama barang, nomor part, dan harga satuan. Bila informasi harga dinilai
sensitif, tambahkan autentikasi Supabase sebelum alamatnya disebarkan.

**Batas paket gratis yang perlu diketahui:**

| Layanan | Batas utama |
|---|---|
| Supabase | Penyimpanan 500 MB dan proyek dijeda setelah kurang lebih satu minggu tanpa aktivitas |
| Vercel | Penggunaan wajar untuk keperluan bukan komersial, dengan kuota bandwidth bulanan |
| GitHub | Repositori publik maupun privat tanpa batas jumlah |

Data 1.213 baris pada dashboard ini hanya memakai ruang beberapa ratus kilobita,
jauh di bawah batas tersebut.

**Cadangan data.** Berkas seed di folder `supabase/` adalah salinan lengkap data
yang ada di basis data. Selama repositori GitHub terjaga, data selalu dapat
dipulihkan dengan menjalankan ulang ketiga berkas SQL.

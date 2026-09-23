-- =============================================================
-- Skema dashboard rekap pembelian Bosowa Berlian Motor KIMA
-- Jalankan berkas ini lebih dahulu pada Supabase > SQL Editor.
-- =============================================================

drop view if exists public.barang_ringkas;
drop view if exists public.ringkasan_departemen;
drop table if exists public.rekap_barang;

create table public.rekap_barang (
  id               bigint generated always as identity primary key,
  departemen       text   not null check (departemen in ('sparepart', 'service')),
  no_urut          integer not null,
  no_part          text   not null default '-',
  nama_barang      text   not null,
  harga_satuan     bigint not null check (harga_satuan >= 0),
  frekuensi        integer not null check (frekuensi > 0),
  frekuensi_total  integer not null check (frekuensi_total > 0)
);

comment on table public.rekap_barang is
  'Satu baris mewakili satu barang pada satu harga satuan, hasil rekap nota Januari sampai Agustus 2026.';
comment on column public.rekap_barang.frekuensi is
  'Jumlah pembelian barang pada harga satuan tersebut.';
comment on column public.rekap_barang.frekuensi_total is
  'Jumlah pembelian barang tersebut pada seluruh varian harga.';

create index rekap_barang_departemen_idx on public.rekap_barang (departemen);
create index rekap_barang_frekuensi_idx  on public.rekap_barang (departemen, frekuensi_total desc);
create index rekap_barang_nama_idx       on public.rekap_barang (nama_barang);

-- Ringkasan angka per departemen untuk kartu di halaman depan.
create view public.ringkasan_departemen as
select
  departemen,
  count(*)::int                                   as jumlah_baris,
  count(distinct no_part || '|' || nama_barang)::int as jumlah_barang,
  sum(frekuensi)::int                             as jumlah_pembelian,
  sum(harga_satuan * frekuensi)::bigint           as estimasi_nilai
from public.rekap_barang
group by departemen;

-- Satu baris per barang, dipakai untuk grafik barang paling sering dibeli.
create view public.barang_ringkas as
select
  departemen,
  no_part,
  nama_barang,
  sum(frekuensi)::int                   as frekuensi_total,
  count(*)::int                         as varian_harga,
  min(harga_satuan)::bigint             as harga_min,
  max(harga_satuan)::bigint             as harga_max,
  sum(harga_satuan * frekuensi)::bigint as estimasi_nilai
from public.rekap_barang
group by departemen, no_part, nama_barang;

-- Dashboard hanya membaca data, jadi akses publik dibatasi pada perintah select.
alter table public.rekap_barang enable row level security;

drop policy if exists "Baca rekap untuk publik" on public.rekap_barang;
create policy "Baca rekap untuk publik"
  on public.rekap_barang
  for select
  to anon, authenticated
  using (true);

grant select on public.ringkasan_departemen to anon, authenticated;
grant select on public.barang_ringkas       to anon, authenticated;

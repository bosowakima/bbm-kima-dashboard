-- =============================================================
-- Skema dashboard rekap pembelian Bosowa Berlian Motor KIMA  (versi 2)
--
-- Jalankan SELURUH isi berkas ini sekali pada Supabase > SQL Editor.
-- Berkas ini aman dijalankan ulang dan TIDAK menghapus data yang sudah ada.
--
-- Mulai versi 2, dashboard membaca dan menulis data melalui server
-- menggunakan secret key (service_role). Kunci ini tidak pernah dikirim
-- ke peramban, sehingga tabel tidak perlu dibuka untuk publik.
-- =============================================================

-- 1. Tabel utama ------------------------------------------------
create table if not exists public.rekap_barang (
  id               bigint generated always as identity primary key,
  departemen       text    not null check (departemen in ('sparepart', 'service')),
  no_urut          integer not null default 0,
  no_part          text    not null default '-',
  nama_barang      text    not null,
  harga_satuan     bigint  not null check (harga_satuan >= 0),
  frekuensi        integer not null check (frekuensi > 0),
  frekuensi_total  integer not null default 0
);

-- Menyesuaikan tabel dari versi 1 bila sudah pernah dibuat.
alter table public.rekap_barang alter column no_urut set default 0;
alter table public.rekap_barang alter column frekuensi_total set default 0;
alter table public.rekap_barang drop constraint if exists rekap_barang_frekuensi_total_check;

comment on table public.rekap_barang is
  'Satu baris mewakili satu barang pada satu harga satuan.';

-- View dari versi 1 tidak dipakai lagi.
drop view if exists public.barang_ringkas;
drop view if exists public.ringkasan_departemen;

-- 2. Kunci barang -----------------------------------------------
-- Barang dikenali dari NO. PART. Bila NO. PART kosong atau "-",
-- barang dikenali dari NAMA BARANG.
create or replace function public.kunci_barang(p_no_part text, p_nama text)
returns text
language sql
immutable
as $$
  select case
    when coalesce(nullif(trim(p_no_part), ''), '-') = '-'
      then 'N|' || upper(trim(p_nama))
    else 'P|' || upper(trim(p_no_part))
  end
$$;

-- Satu barang pada satu harga hanya boleh muncul sekali per departemen.
create unique index if not exists rekap_barang_unik_idx
  on public.rekap_barang (departemen, public.kunci_barang(no_part, nama_barang), harga_satuan);

create index if not exists rekap_barang_departemen_idx
  on public.rekap_barang (departemen, frekuensi_total desc);

-- 3. Merapikan frekuensi total dan nomor urut --------------------
create or replace function public.rapikan_departemen(p_departemen text)
returns void
language plpgsql
as $$
begin
  with total as (
    select public.kunci_barang(no_part, nama_barang) as k, sum(frekuensi)::int as t
    from public.rekap_barang
    where departemen = p_departemen
    group by 1
  )
  update public.rekap_barang r
     set frekuensi_total = total.t
    from total
   where r.departemen = p_departemen
     and public.kunci_barang(r.no_part, r.nama_barang) = total.k
     and r.frekuensi_total is distinct from total.t;

  with urut as (
    select id,
           row_number() over (
             order by frekuensi_total desc, nama_barang, frekuensi desc, harga_satuan
           ) as n
    from public.rekap_barang
    where departemen = p_departemen
  )
  update public.rekap_barang r
     set no_urut = urut.n
    from urut
   where r.id = urut.id
     and r.no_urut is distinct from urut.n;
end;
$$;

-- 4. Impor dari Excel dalam satu transaksi ----------------------
-- p_mode 'ganti'  : seluruh data departemen diganti isi berkas.
-- p_mode 'tambah' : frekuensi ditambahkan ke barang yang sama, barang baru disisipkan.
-- Bila ada kesalahan di tengah jalan, seluruh perubahan dibatalkan.
create or replace function public.impor_departemen(
  p_departemen text,
  p_mode text,
  p_baris jsonb
)
returns integer
language plpgsql
as $$
declare
  v_jumlah integer;
begin
  if p_departemen not in ('sparepart', 'service') then
    raise exception 'Departemen tidak dikenal: %', p_departemen;
  end if;
  if p_mode not in ('ganti', 'tambah') then
    raise exception 'Mode impor tidak dikenal: %', p_mode;
  end if;

  if p_mode = 'ganti' then
    delete from public.rekap_barang where departemen = p_departemen;
  end if;

  with masuk as (
    select
      upper(coalesce(nullif(trim(x.no_part), ''), '-')) as no_part,
      upper(trim(x.nama_barang))                         as nama_barang,
      x.harga_satuan,
      x.frekuensi
    from jsonb_to_recordset(p_baris)
         as x(no_part text, nama_barang text, harga_satuan bigint, frekuensi integer)
  )
  update public.rekap_barang r
     set frekuensi = r.frekuensi + m.frekuensi
    from masuk m
   where r.departemen = p_departemen
     and public.kunci_barang(r.no_part, r.nama_barang) = public.kunci_barang(m.no_part, m.nama_barang)
     and r.harga_satuan = m.harga_satuan;

  with masuk as (
    select
      upper(coalesce(nullif(trim(x.no_part), ''), '-')) as no_part,
      upper(trim(x.nama_barang))                         as nama_barang,
      x.harga_satuan,
      x.frekuensi
    from jsonb_to_recordset(p_baris)
         as x(no_part text, nama_barang text, harga_satuan bigint, frekuensi integer)
  )
  insert into public.rekap_barang (departemen, no_urut, no_part, nama_barang, harga_satuan, frekuensi, frekuensi_total)
  select p_departemen, 0, m.no_part, m.nama_barang, m.harga_satuan, m.frekuensi, m.frekuensi
  from masuk m
  where not exists (
    select 1 from public.rekap_barang r
    where r.departemen = p_departemen
      and public.kunci_barang(r.no_part, r.nama_barang) = public.kunci_barang(m.no_part, m.nama_barang)
      and r.harga_satuan = m.harga_satuan
  );

  get diagnostics v_jumlah = row_count;
  perform public.rapikan_departemen(p_departemen);
  return v_jumlah;
end;
$$;

-- 5. Hak akses --------------------------------------------------
-- Tabel dikunci dari publik; hanya server dashboard (service_role) yang boleh mengakses.
alter table public.rekap_barang enable row level security;
drop policy if exists "Baca rekap untuk publik" on public.rekap_barang;

revoke all on public.rekap_barang from anon, authenticated;

grant usage on schema public to service_role;
grant select, insert, update, delete on public.rekap_barang to service_role;
grant usage, select on all sequences in schema public to service_role;

revoke execute on function public.rapikan_departemen(text)            from public, anon, authenticated;
revoke execute on function public.impor_departemen(text, text, jsonb) from public, anon, authenticated;
grant  execute on function public.kunci_barang(text, text)            to service_role;
grant  execute on function public.rapikan_departemen(text)            to service_role;
grant  execute on function public.impor_departemen(text, text, jsonb) to service_role;

-- 6. Pemeriksaan: ketiga kolom harus bernilai true --------------
select
  has_table_privilege('service_role', 'public.rekap_barang', 'SELECT') as boleh_membaca,
  has_table_privilege('service_role', 'public.rekap_barang', 'INSERT') as boleh_menambah,
  has_table_privilege('service_role', 'public.rekap_barang', 'UPDATE') as boleh_mengubah;

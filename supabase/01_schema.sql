-- =============================================================
-- Skema dashboard rekap pembelian Bosowa Berlian Motor KIMA  (versi 3)
--
-- Jalankan SELURUH isi berkas ini sekali pada Supabase > SQL Editor.
-- Aman dijalankan ulang dan aman dijalankan di atas versi 1 atau 2:
-- data yang sudah ada TIDAK dihapus.
--
-- Hasil akhirnya satu baris berisi empat kolom. Keempatnya harus true.
-- =============================================================

-- 1. Tabel rekap per barang per harga ---------------------------
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

-- Penyesuaian bila tabel berasal dari versi 1.
alter table public.rekap_barang alter column no_urut set default 0;
alter table public.rekap_barang alter column frekuensi_total set default 0;
alter table public.rekap_barang drop constraint if exists rekap_barang_frekuensi_total_check;

comment on table public.rekap_barang is
  'Satu baris mewakili satu barang pada satu harga satuan.';

-- View versi 1 tidak dipakai lagi.
drop view if exists public.barang_ringkas;
drop view if exists public.ringkasan_departemen;

-- 2. Tabel tanggal nota (baru di versi 3) ------------------------
-- Satu baris = satu kali pembelian barang tersebut pada satu nota.
-- Terhapus otomatis bila baris rekapnya dihapus.
create table if not exists public.nota_pembelian (
  id            bigint generated always as identity primary key,
  rekap_id      bigint  not null references public.rekap_barang (id) on delete cascade,
  tanggal_nota  date,
  no_gr         text,
  qty           numeric check (qty is null or qty >= 0)
);

comment on table public.nota_pembelian is
  'Riwayat pembelian: tanggal nota, nomor GR, dan jumlah barang untuk setiap baris rekap.';

create index if not exists nota_pembelian_rekap_idx
  on public.nota_pembelian (rekap_id, tanggal_nota desc);

-- 3. Kunci barang -----------------------------------------------
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

create unique index if not exists rekap_barang_unik_idx
  on public.rekap_barang (departemen, public.kunci_barang(no_part, nama_barang), harga_satuan);

create index if not exists rekap_barang_departemen_idx
  on public.rekap_barang (departemen, no_urut);

-- 4. Merapikan frekuensi total dan urutan -----------------------
-- Urutan daftar: frekuensi total terbesar di atas. Varian harga dari
-- barang yang sama selalu berdampingan, dan di antara varian itu yang
-- tanggal notanya paling baru berada paling atas.
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

  with terakhir as (
    select r.id,
           public.kunci_barang(r.no_part, r.nama_barang) as k,
           min(r.nama_barang) over (partition by public.kunci_barang(r.no_part, r.nama_barang)) as nama_kelompok,
           r.frekuensi_total, r.frekuensi, r.harga_satuan,
           (select max(n.tanggal_nota) from public.nota_pembelian n where n.rekap_id = r.id) as tgl
    from public.rekap_barang r
    where r.departemen = p_departemen
  ),
  urut as (
    select id,
           row_number() over (
             order by frekuensi_total desc, nama_kelompok, k,
                      tgl desc nulls last, frekuensi desc, harga_satuan desc
           ) as n
    from terakhir
  )
  update public.rekap_barang r
     set no_urut = urut.n
    from urut
   where r.id = urut.id
     and r.no_urut is distinct from urut.n;
end;
$$;

-- 5. Impor dari Excel dalam satu transaksi ----------------------
-- p_mode 'ganti'  : seluruh data departemen diganti isi berkas.
-- p_mode 'tambah' : frekuensi ditambahkan ke barang yang sama, barang baru disisipkan.
-- Setiap butir p_baris boleh membawa "nota": [{tanggal_nota, no_gr, qty}, ...].
-- Bila ada kesalahan di tengah jalan, seluruh perubahan dibatalkan.
drop function if exists public.impor_departemen(text, text, jsonb);
create function public.impor_departemen(
  p_departemen text,
  p_mode text,
  p_baris jsonb
)
returns integer
language plpgsql
as $$
declare
  v_baru integer;
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

  -- Tambah frekuensi pada barang yang sudah ada.
  with masuk as (
    select upper(coalesce(nullif(trim(x.no_part), ''), '-')) as no_part,
           upper(trim(x.nama_barang)) as nama_barang,
           x.harga_satuan, x.frekuensi
    from jsonb_to_recordset(p_baris)
         as x(no_part text, nama_barang text, harga_satuan bigint, frekuensi integer)
  )
  update public.rekap_barang r
     set frekuensi = r.frekuensi + m.frekuensi
    from masuk m
   where r.departemen = p_departemen
     and public.kunci_barang(r.no_part, r.nama_barang) = public.kunci_barang(m.no_part, m.nama_barang)
     and r.harga_satuan = m.harga_satuan;

  -- Sisipkan barang baru.
  with masuk as (
    select upper(coalesce(nullif(trim(x.no_part), ''), '-')) as no_part,
           upper(trim(x.nama_barang)) as nama_barang,
           x.harga_satuan, x.frekuensi
    from jsonb_to_recordset(p_baris)
         as x(no_part text, nama_barang text, harga_satuan bigint, frekuensi integer)
  )
  insert into public.rekap_barang
    (departemen, no_urut, no_part, nama_barang, harga_satuan, frekuensi, frekuensi_total)
  select p_departemen, 0, m.no_part, m.nama_barang, m.harga_satuan, m.frekuensi, m.frekuensi
  from masuk m
  where not exists (
    select 1 from public.rekap_barang r
    where r.departemen = p_departemen
      and public.kunci_barang(r.no_part, r.nama_barang) = public.kunci_barang(m.no_part, m.nama_barang)
      and r.harga_satuan = m.harga_satuan
  );
  get diagnostics v_baru = row_count;

  -- Simpan tanggal nota yang dibawa berkas.
  insert into public.nota_pembelian (rekap_id, tanggal_nota, no_gr, qty)
  select r.id,
         nullif(n.value ->> 'tanggal_nota', '')::date,
         nullif(trim(n.value ->> 'no_gr'), ''),
         nullif(n.value ->> 'qty', '')::numeric
  from jsonb_array_elements(p_baris) b
  cross join lateral jsonb_array_elements(coalesce(b.value -> 'nota', '[]'::jsonb)) n
  join public.rekap_barang r
    on r.departemen = p_departemen
   and public.kunci_barang(r.no_part, r.nama_barang)
       = public.kunci_barang(b.value ->> 'no_part', b.value ->> 'nama_barang')
   and r.harga_satuan = (b.value ->> 'harga_satuan')::bigint;

  perform public.rapikan_departemen(p_departemen);
  return v_baru;
end;
$$;

-- 6. Hak akses --------------------------------------------------
-- Tabel dikunci dari publik; hanya server dashboard (secret key /
-- service_role) yang boleh mengakses.
alter table public.rekap_barang   enable row level security;
alter table public.nota_pembelian enable row level security;
drop policy if exists "Baca rekap untuk publik" on public.rekap_barang;

revoke all on public.rekap_barang   from anon, authenticated;
revoke all on public.nota_pembelian from anon, authenticated;

grant usage on schema public to service_role;
grant select, insert, update, delete on public.rekap_barang   to service_role;
grant select, insert, update, delete on public.nota_pembelian to service_role;
grant usage, select on all sequences in schema public to service_role;

revoke execute on function public.rapikan_departemen(text)            from public, anon, authenticated;
revoke execute on function public.impor_departemen(text, text, jsonb) from public, anon, authenticated;
grant  execute on function public.kunci_barang(text, text)            to service_role;
grant  execute on function public.rapikan_departemen(text)            to service_role;
grant  execute on function public.impor_departemen(text, text, jsonb) to service_role;

-- 7. Pemeriksaan: keempat kolom harus bernilai true -------------
select
  has_table_privilege('service_role', 'public.rekap_barang',   'SELECT') as boleh_membaca,
  has_table_privilege('service_role', 'public.rekap_barang',   'UPDATE') as boleh_mengubah,
  has_table_privilege('service_role', 'public.nota_pembelian', 'INSERT') as tabel_nota_siap,
  exists (select 1 from pg_proc where proname = 'impor_departemen')      as fungsi_impor_siap;

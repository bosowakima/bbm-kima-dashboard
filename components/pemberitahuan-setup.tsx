export default function PemberitahuanSetup() {
  return (
    <div className="rounded-lg border border-line bg-panel p-6">
      <h2 className="text-base font-semibold text-ink">
        Dashboard belum terhubung ke Supabase
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-slate">
        Isi dua environment variable berikut, lalu muat ulang halaman. Pada
        komputer sendiri, nilainya ditulis di berkas <code>.env.local</code>. Di
        Vercel, nilainya diisi pada menu Settings lalu Environment Variables.
      </p>
      <ul className="mt-4 space-y-1 font-mono text-sm text-ink">
        <li>NEXT_PUBLIC_SUPABASE_URL</li>
        <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
      </ul>
      <p className="mt-4 text-sm text-muted">
        Langkah lengkapnya ada di berkas TUTORIAL.md pada repositori ini.
      </p>
    </div>
  );
}

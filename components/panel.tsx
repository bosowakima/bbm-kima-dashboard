export function Panel({
  judul,
  keterangan,
  children,
}: {
  judul: string;
  keterangan?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-panel">
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-base font-semibold text-ink">{judul}</h2>
        {keterangan ? (
          <p className="mt-1 max-w-2xl text-sm text-muted">{keterangan}</p>
        ) : null}
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

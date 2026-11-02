import Link from "next/link";

export default function AffinityHero() {
  return <section aria-label="AffinityImmuno product catalog" className="relative overflow-hidden border-b border-cyan-900/10 bg-cyan-50">
    <div className="mx-auto grid min-h-[220px] max-w-[1320px] items-center gap-8 px-6 py-10 md:min-h-[280px] md:grid-cols-[minmax(0,1fr)_320px] md:py-14">
      <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-800">ITS BIO · Immunoassays & Antibodies</p><h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-[44px]">AffinityImmuno</h1><p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-600">ELISA kits, research antibodies, biosimilars and isotype controls. Search by target, clone or catalog number.</p></div>
      <div className="hidden grid-cols-2 gap-3 md:grid">{[["19", "ELISA Kits", "elisas"], ["198", "Antibodies", "antibodies"]].map(([count,label,slug])=><Link key={slug} href={`/products/affinity/${slug}`} className="rounded-2xl border border-cyan-200 bg-white p-6 transition hover:border-cyan-500"><span className="block text-3xl font-semibold tracking-tight text-cyan-900">{count}</span><span className="mt-2 block text-sm text-slate-600">{label} ›</span></Link>)}</div>
    </div>
  </section>;
}

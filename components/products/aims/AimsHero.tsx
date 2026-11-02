import Image from "next/image";
import Link from "next/link";

export default function AimsHero() {
  return <section aria-label="AIMS product catalog" className="relative overflow-hidden border-b border-sky-900/10 bg-sky-50">
    <div className="mx-auto grid min-h-[220px] max-w-[1320px] items-center gap-8 px-6 py-10 md:min-h-[280px] md:grid-cols-[minmax(0,1fr)_340px] md:py-14">
      <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-800">ITS BIO · Animal Identification</p><h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-[44px]">AIMS Products</h1><p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-600">Tattoo identification systems for laboratory rodents, neonates and larger animals.</p></div>
      <Link href="/products/aims" className="hidden items-center justify-center rounded-[22px] border border-sky-800/15 bg-white p-8 shadow-sm md:flex" aria-label="AIMS product overview"><Image src="/partners/aims-logo.png" alt="AIMS" width={250} height={100} priority className="h-auto max-h-24 w-auto object-contain" /></Link>
    </div>
  </section>;
}

import Image from "next/image";

export default function DogenHero() {
  return (
    <section aria-label="DoGen product catalog" className="relative overflow-hidden border-b border-red-200 bg-red-50">
      <div className="absolute inset-0 bg-[linear-gradient(110deg,#ffffff_0%,#fff8f8_58%,#ffeded_100%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-[9%] -top-[55%] h-[440px] w-[440px] rounded-full bg-red-800/10 md:right-[2%]" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-[85%] right-[15%] h-[430px] w-[430px] rounded-full border-[70px] border-red-800/5" aria-hidden="true" />
      <div className="absolute right-0 top-0 h-full w-[7px] bg-red-800" aria-hidden="true" />
      <div className="relative mx-auto grid min-h-[220px] max-w-[1320px] items-center gap-8 px-6 py-10 md:min-h-[280px] md:grid-cols-[minmax(0,1fr)_360px] md:py-14">
        <div>
          <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-red-800">
            <span className="h-px w-8 bg-red-800" aria-hidden="true" /> ITS BIO
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-[1.12] tracking-[-0.035em] text-slate-950 md:text-[44px]">DoGen</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 md:text-[15px]">Cell viability and cytotoxicity assays, protein analysis reagents, and assay kits.</p>
        </div>
        <div className="hidden h-[126px] w-[330px] items-center justify-center justify-self-end rounded-[22px] border border-red-200 bg-white px-8 shadow-sm md:flex">
          <Image src="/partners/dogen-logo.png" alt="DoGenBio" width={140} height={36} priority className="h-auto w-[220px] max-w-full object-contain" />
        </div>
      </div>
    </section>
  );
}

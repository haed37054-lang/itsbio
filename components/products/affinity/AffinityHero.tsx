import Image from "next/image";

export default function AffinityHero() {
  return (
    <section className="relative overflow-hidden border-b border-[#29add0]/25 bg-[#f7fcfe]" aria-label="AffinityImmuno product catalog">
      <div className="absolute inset-0 bg-[linear-gradient(110deg,#ffffff_0%,#f7fcfe_58%,#e8f7fc_100%)]" />
      <div className="pointer-events-none absolute -right-[9%] -top-[55%] h-[440px] w-[440px] rounded-full bg-[#29add0]/10 md:right-[2%]" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-[85%] right-[15%] h-[430px] w-[430px] rounded-full border-[70px] border-[#29add0]/[0.055]" aria-hidden="true" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-[7px] bg-[#29add0]" aria-hidden="true" />
      <div className="relative mx-auto grid min-h-[220px] max-w-[1320px] items-center gap-8 px-6 py-10 md:min-h-[280px] md:grid-cols-[minmax(0,1fr)_360px] md:py-14">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-800"><span className="h-px w-8 bg-[#29add0]" aria-hidden="true" />ITS BIO</div>
          <h1 className="mt-4 max-w-[820px] text-3xl font-semibold leading-[1.12] tracking-[-0.035em] text-slate-950 md:text-[44px]">AffinityImmuno Products</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 md:text-[15px]">ELISA kits, research antibodies, biosimilars and isotype controls from AffinityImmuno.</p>
        </div>
        <div className="hidden justify-self-end md:block"><div className="flex h-[126px] w-[330px] items-center justify-center rounded-[22px] border border-[#29add0]/20 bg-white px-8 shadow-[0_18px_50px_rgba(41,173,208,0.10)]"><Image src="/partners/affinityimmuno-logo.png" alt="AffinityImmuno" width={500} height={141} priority className="h-auto max-h-[82px] w-auto max-w-[255px] object-contain" /></div></div>
      </div>
    </section>
  );
}

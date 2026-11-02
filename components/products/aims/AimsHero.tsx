import Image from "next/image";

export default function AimsHero() {
  return <section aria-label="AIMS Lab Products catalog" className="relative overflow-hidden border-b border-red-200 bg-red-50/40">
    <div className="absolute inset-0 bg-[linear-gradient(110deg,#ffffff_0%,#fffafa_58%,#fef0f0_100%)]" />
    <div aria-hidden="true" className="pointer-events-none absolute -right-[9%] -top-[55%] h-[440px] w-[440px] rounded-full bg-red-500/10 md:right-[2%]" />
    <div aria-hidden="true" className="pointer-events-none absolute -bottom-[85%] right-[15%] h-[430px] w-[430px] rounded-full border-[70px] border-red-500/5" />
    <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-full w-[7px] bg-red-600" />
    <div className="relative mx-auto grid min-h-[220px] max-w-[1320px] items-center gap-8 px-6 py-10 md:min-h-[280px] md:grid-cols-[minmax(0,1fr)_360px] md:py-14">
      <div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-800">ITS BIO</p><h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-slate-950 md:text-[44px]">AIMS Lab Products</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 md:text-[15px]">Surgery and procedure boards, warming equipment, CO₂ systems and rodent restraints.</p></div>
      <div className="hidden justify-self-end md:block"><div className="flex h-[126px] w-[330px] items-center justify-center rounded-[22px] border border-red-200 bg-white px-8 shadow-sm"><Image src="/partners/aims-lab-logo.png" alt="AIMS Lab Products" width={585} height={187} priority className="h-auto max-h-[82px] w-auto max-w-[255px] object-contain" /></div></div>
    </div>
  </section>;
}

import Image from "next/image";

export default function AnimalIdHero() {
  return (
    <section aria-label="AIMS Animal Identification catalog" className="relative overflow-hidden border-b border-sky-200 bg-sky-50">
      <div className="absolute inset-0 bg-[linear-gradient(110deg,#ffffff_0%,#f7fcff_58%,#eaf7ff_100%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-[9%] -top-[55%] h-[440px] w-[440px] rounded-full bg-sky-500/10 md:right-[2%]" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-[85%] right-[15%] h-[430px] w-[430px] rounded-full border-[70px] border-sky-500/[0.055]" aria-hidden="true" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-[7px] bg-sky-600" aria-hidden="true" />
      <div className="relative mx-auto grid min-h-[220px] max-w-[1320px] items-center gap-8 px-6 py-10 md:min-h-[280px] md:grid-cols-[minmax(0,1fr)_360px] md:py-14">
        <div className="max-w-3xl">
          <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-sky-800">
            <span className="h-px w-8 bg-sky-600" aria-hidden="true" />
            ITS BIO · AIMS
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-[1.12] tracking-[-0.035em] text-slate-950 md:text-[44px]">Animal Identification</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 md:text-[15px]">Tattoo identification systems for laboratory rodents, neonates and larger animals.</p>
        </div>
        <div className="hidden justify-self-end md:block">
          <div className="flex h-[126px] w-[330px] items-center justify-center rounded-[22px] border border-sky-200 bg-white px-8 shadow-sm">
            <Image src="/partners/aims-logo.png" alt="AIMS Lab Animal Tattoo Identification" width={250} height={100} priority className="h-auto max-h-[82px] w-auto max-w-[255px] object-contain" />
          </div>
        </div>
      </div>
    </section>
  );
}

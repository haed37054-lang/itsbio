import Image from "next/image";

export default function SeedburoHero({ title = "Seedburo Products" }: { title?: string }) {
  return (
    <section className="relative overflow-hidden border-b border-green-900/10 bg-[#f1f7ef]" aria-label="Seedburo product catalog">
      <div className="pointer-events-none absolute -right-24 -top-36 h-[480px] w-[480px] rounded-full border-[70px] border-green-800/[0.035]" aria-hidden />
      <div className="relative mx-auto grid min-h-[220px] max-w-[1320px] items-center gap-8 px-6 py-10 md:min-h-[280px] md:grid-cols-[minmax(0,1fr)_340px] md:py-14">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-green-800">ITS BIO · Agricultural Research</div>
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-slate-950 md:text-[44px]">{title}</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-600">Grain, seed and feed sampling, testing, inspection and grading equipment.</p>
        </div>
        <div className="hidden items-center justify-center rounded-[22px] border border-green-800/15 bg-white p-8 shadow-sm md:flex">
          <Image src="/partners/Seedburo-logo.png" alt="Seedburo Equipment Company" width={250} height={90} priority className="h-auto max-h-24 w-auto object-contain" />
        </div>
      </div>
    </section>
  );
}

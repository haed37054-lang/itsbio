export default function AimsSupport() {
  return (
    <section id="support" className="mt-6 scroll-mt-28 border-t border-slate-200 py-8">
      <h2 className="text-2xl font-semibold text-slate-950">Training & Equipment Care</h2>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-950">Manufacturer training</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">Each system includes equipment instructions and an animal-specific training guide. AIMS also describes on-site training using the customer’s own equipment, with hands-on instruction and a written assessment. Its published program requires at least six participants and working equipment with adequate supplies.</p>
          <a href="https://animalid.com/training/" target="_blank" rel="noopener noreferrer" className="mt-5 inline-block text-sm font-semibold text-sky-800 underline">AIMS training program ↗</a>
        </article>
        <article className="rounded-2xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-950">Maintenance & service</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">AIMS recommends annual service of the tattoo handpiece. Its service program checks springs, the capacitor and contact screw, inspects connections and the needle tube, then recalibrates and tests performance. The manufacturer’s care page explains the current service process.</p>
          <a href="https://animalid.com/equipment-care/" target="_blank" rel="noopener noreferrer" className="mt-5 inline-block text-sm font-semibold text-sky-800 underline">AIMS equipment care ↗</a>
        </article>
      </div>
    </section>
  );
}

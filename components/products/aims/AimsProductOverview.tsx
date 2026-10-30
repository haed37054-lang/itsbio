"use client";

import { useEffect, useId, useState } from "react";
import type { AimsProduct } from "@/lib/aims/catalog";
import AimsGallery from "./AimsGallery";

export default function AimsProductOverview({ product }: { product: Pick<AimsProduct, "sku" | "title" | "summary" | "audience" | "models" | "images"> }) {
  const [sku, setSku] = useState(product.models[0].sku);
  const group = useId();
  const selected = product.models.find((item) => item.sku === sku) || product.models[0];
  useEffect(() => {
    const fromHash = () => {
      if (!window.location.hash.startsWith("#model-")) return;
      let value = "";
      try { value = decodeURIComponent(window.location.hash.slice(7)); } catch { return; }
      const model = product.models.find((item) => item.sku.toUpperCase() === value.toUpperCase());
      if (model) setSku(model.sku);
    };
    fromHash(); window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [product.models]);
  const title = `${product.sku} ${product.title}`;
  return <div data-quote-context="product" data-product-name={title} data-cat-no={selected.sku} data-product-model={`${selected.title} — ${selected.description}`} className="grid gap-10 lg:grid-cols-2">
    <AimsGallery images={product.images} title={title} />
    <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-widest text-sky-800">AIMS · {product.audience}</p><h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-slate-950 md:text-4xl">{title}</h2><p className="mt-5 text-[15px] leading-7 text-slate-600">{product.summary}</p>
      <fieldset className="mt-6 min-w-0 overflow-hidden rounded-xl border border-sky-200"><legend className="sr-only">Cat.No and package selection</legend>
        <div aria-live="polite" aria-atomic="true" className="bg-sky-50 px-5 py-4"><p className="text-xs font-semibold uppercase tracking-wide text-sky-800">Cat.No</p><p className="mt-1 text-xl font-semibold text-slate-950">{selected.sku}</p><p className="mt-2 text-sm font-medium text-slate-800">{selected.title}</p><p className="mt-2 text-sm leading-6 text-slate-600">{selected.description}</p></div>
        {product.models.length > 1 ? <div role="radiogroup" aria-label="System and ATS-3 upgrade packages" className="divide-y divide-slate-100 border-t border-sky-200 bg-white">{product.models.map((model) => <label key={model.sku} id={`model-${model.sku}`} className={`flex cursor-pointer scroll-mt-28 items-start gap-3 px-5 py-4 hover:bg-sky-50/70 ${sku === model.sku ? "bg-sky-50/50" : ""}`}><input type="radio" name={group} value={model.sku} checked={sku === model.sku} onChange={() => { setSku(model.sku); window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}#model-${encodeURIComponent(model.sku)}`); }} aria-label={`${model.sku} · ${model.title}`} className="mt-1 h-4 w-4 shrink-0 accent-sky-700" /><span><span className="block text-sm font-semibold text-slate-900">{model.sku} · {model.title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{model.sku === product.sku ? "Complete system" : "For existing ATS-3 systems"}</span></span></label>)}</div> : null}
      </fieldset>
    </div>
  </div>;
}

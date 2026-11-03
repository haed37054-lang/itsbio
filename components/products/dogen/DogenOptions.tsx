"use client";

import { useEffect, useId, useState } from "react";
import type { DogenProduct } from "@/lib/dogen/catalog";

export default function DogenOptions({ title, models, labels }: { title: string; models: DogenProduct["models"]; labels: string[] }) {
  const [selected, setSelected] = useState(models[0]);
  const radioName = useId();

  useEffect(() => {
    const readHash = () => {
      const model = models.find(({ sku }) => window.location.hash === `#model-${encodeURIComponent(sku)}`);
      if (model) setSelected(model);
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, [models]);

  return (
    <fieldset
      data-quote-context="product"
      data-product-name={title}
      data-cat-no={selected.sku}
      data-product-model={selected.values.filter(Boolean).join(" · ")}
      className="mt-5 min-w-0 border-t border-slate-200 pt-4"
    >
      <legend className="sr-only">Cat.No and package options</legend>
      <div className="flex flex-wrap items-baseline gap-x-3 text-sm text-slate-600" aria-live="polite">
        <span className="font-semibold text-slate-950">Cat.No</span>
        <strong className="text-red-900">{selected.sku}</strong>
        {selected.values.filter(Boolean).map((value, index) => <span key={index}>· {value}</span>)}
      </div>
      {selected.label && <p className="mt-2 text-sm text-slate-600">{selected.label}</p>}
      {models.length > 1 && (
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-800">
              <tr><th scope="col" className="px-3 py-3">Cat.No</th>{labels.map((label) => <th scope="col" key={label} className="px-3 py-3">{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {models.map((model) => (
                <tr key={model.sku} id={`model-${model.sku}`} className={`scroll-mt-28 ${selected.sku === model.sku ? "bg-red-50" : ""}`}>
                  <th scope="row" className="whitespace-nowrap px-3 py-3 font-medium">
                    <label className="flex cursor-pointer items-center gap-2 text-red-900">
                      <input type="radio" name={radioName} value={model.sku} checked={selected.sku === model.sku} onChange={() => setSelected(model)} className="accent-red-800" />
                      {model.sku}
                    </label>
                  </th>
                  {model.values.map((value, index) => <td key={index} className="px-3 py-3 text-slate-600">{value}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </fieldset>
  );
}

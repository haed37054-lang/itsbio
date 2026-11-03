"use client";

import { useEffect, useId, useState } from "react";
import { ITS_AGAROSE, itsAgarosePackageHref } from "@/lib/itschem/agarose";

export default function AgarosePackageSelector() {
  const [selected, setSelected] = useState<(typeof ITS_AGAROSE.packages)[number]>(ITS_AGAROSE.packages[0]);
  const group = useId();

  useEffect(() => {
    function selectFromHash() {
      const sku = window.location.hash.replace(/^#model-/, "");
      const match = ITS_AGAROSE.packages.find((option) => option.sku === sku);
      if (match) setSelected(match);
    }
    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);
    return () => window.removeEventListener("hashchange", selectFromHash);
  }, []);

  return (
    <fieldset
      data-quote-context="product"
      data-product-name={ITS_AGAROSE.title}
      data-cat-no={selected.sku}
      data-product-model={selected.label}
      className="mt-5 min-w-0 border-t border-slate-200 pt-4"
    >
      <legend className="sr-only">Cat.No and package size</legend>
      <div className="flex flex-wrap items-baseline gap-x-3 text-sm text-slate-600" aria-live="polite">
        <span className="font-semibold text-slate-950">Cat.No</span>
        <span className="font-semibold text-rose-800">{selected.sku}</span>
        <span>· {selected.label} · {selected.detail}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {ITS_AGAROSE.packages.map((option) => (
          <label
            key={option.sku}
            id={`model-${option.sku}`}
            className={`flex cursor-pointer scroll-mt-28 items-center gap-2 rounded-md border px-3 py-2 text-sm ${selected.sku === option.sku ? "border-rose-300 bg-rose-50 text-rose-900" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
          >
            <input
              type="radio"
              name={group}
              value={option.sku}
              checked={selected.sku === option.sku}
              onChange={() => {
                setSelected(option);
                window.history.replaceState(window.history.state, "", itsAgarosePackageHref(option.sku));
              }}
              className="accent-rose-700"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

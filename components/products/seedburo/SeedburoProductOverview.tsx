"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import type { SeedburoImage, SeedburoVariant } from "@/lib/seedburo/catalog";

export default function SeedburoProductOverview({ title, vendor, images, variants }: { title: string; vendor: string; images: SeedburoImage[]; variants: SeedburoVariant[] }) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id || "");
  const [selectedPhoto, setSelectedPhoto] = useState(variants[0]?.image || images[0]?.url || "");
  const [query, setQuery] = useState("");
  const [zoom, setZoom] = useState(false);
  const modelGroup = useId();
  const galleryTrigger = useRef<HTMLButtonElement>(null);
  const selected = variants.find((variant) => variant.id === selectedId) || variants[0];
  const activePhoto = selectedPhoto || selected?.image || images[0]?.url;
  const hasImages = images.length > 0 || variants.some((variant) => variant.image);
  const allImages = images.length ? images : selected?.image ? [{ url: selected.image, alt: title, width: 1000, height: 1000 }] : [];
  const tokens = query.normalize("NFKC").trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matchingVariants = variants.filter((variant) => {
    const text = `${variant.sku} ${variant.title}`.normalize("NFKC").toLowerCase();
    return tokens.every((token) => text.includes(token));
  });
  const chooseVariant = (variant: SeedburoVariant) => {
    setSelectedId(variant.id);
    setSelectedPhoto(variant.image || images[0]?.url || "");
    const modelHash = variant.sku ? `#model-${encodeURIComponent(variant.sku)}` : "";
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}${modelHash}`);
  };

  useEffect(() => {
    const selectLinkedModel = () => {
      if (!window.location.hash.startsWith("#model-")) return;
      let sku = "";
      try { sku = decodeURIComponent(window.location.hash.replace(/^#model-/, "")); } catch { return; }
      const variant = variants.find((item) => item.sku.toLowerCase() === sku.toLowerCase());
      if (!variant) return;
      setQuery("");
      setSelectedId(variant.id);
      setSelectedPhoto(variant.image || images[0]?.url || "");
    };
    selectLinkedModel();
    window.addEventListener("hashchange", selectLinkedModel);
    return () => window.removeEventListener("hashchange", selectLinkedModel);
  }, [variants, images]);

  useEffect(() => {
    if (!zoom) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoom(false);
      if (event.key === "Tab") { event.preventDefault(); document.getElementById("seedburo-close-photo")?.focus(); }
    };
    window.addEventListener("keydown", close);
    return () => { window.removeEventListener("keydown", close); galleryTrigger.current?.focus(); };
  }, [zoom]);

  return <>
    <div data-quote-context="product" data-product-name={title} data-cat-no={selected?.sku || ""} data-product-model={selected?.title !== "Default Title" ? selected?.title || "" : ""} className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {hasImages ? <div>
        <button ref={galleryTrigger} type="button" onClick={() => setZoom(true)} aria-label={`Enlarge ${title} photograph`} className="relative block aspect-square w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {activePhoto ? <Image src={activePhoto} alt={title} fill priority quality={90} sizes="(max-width: 1024px) 90vw, 580px" className="object-contain p-6" /> : null}
        </button>
        {allImages.length > 1 ? <div className="mt-4 grid grid-cols-5 gap-3">{allImages.map((image, index) => <button key={image.url} type="button" aria-label={`View ${title} photograph ${index + 1}`} aria-pressed={activePhoto === image.url} onClick={() => setSelectedPhoto(image.url)} className={`relative aspect-square overflow-hidden rounded-lg border bg-white ${activePhoto === image.url ? "border-green-700 ring-1 ring-green-700" : "border-slate-200 hover:border-green-400"}`}><Image src={image.url} alt="" fill quality={90} sizes="110px" className="object-contain p-2" /></button>)}</div> : null}
      </div> : <div className="flex aspect-square flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center"><p className="text-lg font-medium text-slate-600">Product photo unavailable</p><p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">Seedburo has not provided a photograph for this item.</p></div>}

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-green-800">Seedburo Equipment</p>
        <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-slate-950 md:text-4xl">{title}</h2>
        {vendor && !/^seedburo/i.test(vendor) ? <p className="mt-4 text-sm text-slate-500">Manufacturer: {vendor}</p> : null}
        {selected && (selected.sku || selected.title !== "Default Title" || variants.length > 1) ? <fieldset className="mt-6 min-w-0 overflow-hidden rounded-xl border border-green-200">
          <legend className="sr-only">Cat.No and model selection</legend>
          <div aria-live="polite" aria-atomic="true" className="bg-green-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-800">{selected?.sku ? "Cat.No" : "Model"}</p>
            {selected?.sku ? <p className="mt-1 break-words text-xl font-semibold text-slate-950">{selected.sku}</p> : null}
            {selected?.title && selected.title !== "Default Title" ? <p className="mt-2 text-sm leading-6 text-slate-700">{selected.title}</p> : null}
          </div>
          {variants.length > 1 ? <>
            <div className="border-t border-green-200 bg-white px-5 py-4">
              <p className="text-sm font-semibold text-slate-800">Select Cat.No / specification</p>
              {variants.length > 8 ? <div className="mt-3">
                <label htmlFor={`${modelGroup}-search`} className="sr-only">Search Cat.No or specification</label>
                <input id={`${modelGroup}-search`} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Cat.No or specification" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-100" />
                <p aria-live="polite" className="mt-2 text-xs text-slate-500">{matchingVariants.length} of {variants.length} models</p>
              </div> : null}
            </div>
            <div aria-hidden="true" className="grid grid-cols-[minmax(110px,0.4fr)_minmax(0,1fr)] gap-4 border-y border-slate-200 bg-slate-50 px-5 py-2.5 text-xs font-semibold text-slate-500"><span>Cat.No</span><span>Specification / model</span></div>
            <div role="radiogroup" aria-label="Available Cat.Nos and specifications" className="max-h-[340px] overflow-y-auto overscroll-contain bg-white">
              {matchingVariants.map((variant) => <label key={variant.id} id={variant.sku ? `model-${variant.sku}` : undefined} className={`grid cursor-pointer scroll-mt-28 grid-cols-[minmax(110px,0.4fr)_minmax(0,1fr)] items-start gap-4 border-b border-slate-100 px-5 py-3.5 text-sm last:border-b-0 hover:bg-green-50/60 ${selectedId === variant.id ? "bg-green-50" : "bg-white"}`}>
                <span className="flex min-w-0 items-start gap-2.5"><input type="radio" name={modelGroup} value={variant.id} checked={selectedId === variant.id} onChange={() => chooseVariant(variant)} aria-label={`${variant.sku ? `${variant.sku} · ` : ""}${variant.title}`} className="mt-1 h-4 w-4 shrink-0 accent-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700" /><span className="break-words font-semibold leading-6 text-slate-900">{variant.sku || "—"}</span></span>
                <span className="min-w-0 break-words leading-6 text-slate-600">{variant.title === "Default Title" ? title : variant.title}</span>
              </label>)}
              {!matchingVariants.length ? <p className="px-5 py-8 text-center text-sm text-slate-500">No matching Cat.No or specification.</p> : null}
            </div>
          </> : null}
        </fieldset> : null}
      </div>
    </div>
    {zoom && activePhoto ? <div role="dialog" aria-modal="true" aria-label={`${title} enlarged photograph`} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-6" onClick={() => setZoom(false)}><button id="seedburo-close-photo" autoFocus type="button" onClick={() => setZoom(false)} aria-label="Close enlarged photograph" className="absolute right-5 top-5 z-10 rounded-full bg-white px-4 py-2 font-semibold text-slate-900">Close ×</button><div className="relative h-[85vh] w-[90vw]" onClick={(event) => event.stopPropagation()}><Image src={activePhoto} alt={title} fill quality={90} sizes="90vw" className="object-contain" /></div></div> : null}
  </>;
}

"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { SeedburoImage, SeedburoVariant } from "@/lib/seedburo/catalog";

export default function SeedburoProductOverview({ title, vendor, images, variants }: { title: string; vendor: string; images: SeedburoImage[]; variants: SeedburoVariant[] }) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id || "");
  const [selectedPhoto, setSelectedPhoto] = useState(variants[0]?.image || images[0]?.url || "");
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(false);
  const selected = variants.find((variant) => variant.id === selectedId) || variants[0];
  const activePhoto = selectedPhoto || selected?.image || images[0]?.url;
  const hasImages = images.length > 0 || variants.some((variant) => variant.image);
  const allImages = images.length ? images : selected?.image ? [{ url: selected.image, alt: title, width: 1000, height: 1000 }] : [];
  const chooseVariant = (variant: SeedburoVariant) => {
    setSelectedId(variant.id);
    setSelectedPhoto(variant.image || images[0]?.url || "");
  };
  useEffect(() => {
    let sku = "";
    try { sku = decodeURIComponent(window.location.hash.replace(/^#model-/, "")); } catch { return; }
    const index = variants.findIndex((variant) => variant.sku.toLowerCase() === sku.toLowerCase());
    if (index < 0) return;
    const variant = variants[index];
    setSelectedId(variant.id);
    setSelectedPhoto(variant.image || images[0]?.url || "");
    setPage(Math.floor(index / 20) + 1);
  }, [variants, images]);
  useEffect(() => {
    if (!zoom) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoom(false);
      if (event.key === "Tab") { event.preventDefault(); document.getElementById("seedburo-close-photo")?.focus(); }
    };
    window.addEventListener("keydown", close);
    return () => { window.removeEventListener("keydown", close); previousFocus?.focus(); };
  }, [zoom]);
  return <><div className={`grid gap-10 ${hasImages ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : ""}`}>
    {hasImages ? <div><button type="button" onClick={() => setZoom(true)} aria-label={`Enlarge ${title} photograph`} className="relative block aspect-square w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">{activePhoto ? <Image src={activePhoto} alt={title} fill priority quality={90} sizes="(max-width: 1024px) 90vw, 580px" className="object-contain p-6" /> : null}</button>{allImages.length > 1 ? <div className="mt-4 grid grid-cols-5 gap-3">{allImages.map((image, index) => <button key={image.url} type="button" aria-label={`View ${title} photograph ${index + 1}`} aria-pressed={activePhoto === image.url} onClick={() => setSelectedPhoto(image.url)} className={`relative aspect-square overflow-hidden rounded-lg border bg-white ${activePhoto === image.url ? "border-green-700 ring-1 ring-green-700" : "border-slate-200 hover:border-green-400"}`}><Image src={image.url} alt="" fill quality={90} sizes="110px" className="object-contain p-2" /></button>)}</div> : null}</div> : null}
    <div><p className="text-xs font-semibold uppercase tracking-widest text-green-800">Seedburo Equipment</p><h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-slate-950 md:text-4xl">{title}</h2>{vendor && !/^seedburo/i.test(vendor) ? <p className="mt-4 text-sm text-slate-500">Manufacturer: {vendor}</p> : null}{selected?.sku ? <div className="mt-6 rounded-xl border border-green-100 bg-green-50 px-5 py-4"><span className="text-xs font-semibold uppercase tracking-wide text-green-800">Cat.No</span><p className="mt-1 text-xl font-semibold text-slate-950">{selected.sku}</p></div> : null}{variants.length > 1 ? <div className="mt-6"><label htmlFor="seedburo-model" className="text-sm font-semibold text-slate-800">Model / configuration</label><select id="seedburo-model" value={selectedId} onChange={(event) => { const variant = variants.find((item) => item.id === event.target.value); if (variant) chooseVariant(variant); }} className="mt-3 block w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-6 focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-100">{variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.sku ? `${variant.sku} · ` : ""}{variant.title}</option>)}</select></div> : selected?.title && selected.title !== "Default Title" ? <p className="mt-5 text-base leading-7 text-slate-700">{selected.title}</p> : null}</div>
  </div>{variants.length > 1 ? <section className="mt-12"><h3 className="mb-5 text-xl font-semibold text-slate-950">Models &amp; Cat.Nos</h3><div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[520px] text-left text-sm"><thead className="bg-green-50"><tr><th className="px-5 py-4 font-semibold text-green-900">Cat.No</th><th className="px-5 py-4 font-semibold text-green-900">Model / configuration</th><th className="w-24 px-5 py-4"><span className="sr-only">Select model</span></th></tr></thead><tbody>{variants.slice((page - 1) * 20, page * 20).map((variant) => <tr key={variant.id} id={`model-${variant.sku}`} className={`scroll-mt-28 border-t border-slate-200 ${selectedId === variant.id ? "bg-green-50/60" : "bg-white"}`}><td className="px-5 py-4 font-medium text-slate-900">{variant.sku || "—"}</td><td className="px-5 py-4 leading-6 text-slate-700">{variant.title}</td><td className="px-5 py-4"><button type="button" onClick={() => chooseVariant(variant)} aria-label={`Select ${variant.sku || variant.title}`} className="font-semibold text-green-800 hover:underline">{selectedId === variant.id ? "Selected" : "Select"}</button></td></tr>)}</tbody></table></div>{variants.length > 20 ? <div className="mt-4 flex items-center justify-end gap-4 text-sm"><button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">‹ Previous</button><span>{page} / {Math.ceil(variants.length / 20)}</span><button type="button" disabled={page * 20 >= variants.length} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Next ›</button></div> : null}</section> : null}{zoom && activePhoto ? <div role="dialog" aria-modal="true" aria-label={`${title} enlarged photograph`} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-6" onClick={() => setZoom(false)}><button id="seedburo-close-photo" autoFocus type="button" onClick={() => setZoom(false)} aria-label="Close enlarged photograph" className="absolute right-5 top-5 z-10 rounded-full bg-white px-4 py-2 font-semibold text-slate-900">Close ×</button><div className="relative h-[85vh] w-[90vw]" onClick={(event) => event.stopPropagation()}><Image src={activePhoto} alt={title} fill quality={90} sizes="90vw" className="object-contain" /></div></div> : null}</>;
}

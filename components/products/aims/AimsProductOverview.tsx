"use client";
import {useEffect,useState} from "react";
import type {AimsProduct} from "@/lib/aims/catalog";
import AimsGallery from "./AimsGallery";

export default function AimsProductOverview({product}:{product:Pick<AimsProduct,"sku"|"title"|"summary"|"models"|"images">}) {
  const [sku,setSku]=useState(product.models[0]?.sku||product.sku);
  useEffect(()=>{const read=()=>{if(!window.location.hash.startsWith('#model-'))return;let code;try{code=decodeURIComponent(window.location.hash.slice(7));}catch{return;}if(product.models.some(m=>m.sku===code))setSku(code);};read();window.addEventListener('hashchange',read);return()=>window.removeEventListener('hashchange',read);},[product.models]);
  return <div data-quote-context="product" data-product-name={product.title} data-cat-no={sku} data-product-model={sku} className="grid items-start gap-7 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
    <AimsGallery images={product.images} title={product.title} accent="red" compact />
    <div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-widest text-red-800">AIMS Lab Products</p><h2 className="mt-3 text-2xl font-semibold leading-snug tracking-tight text-slate-950 md:text-[28px]">{product.title}</h2>
      {sku?<dl className="mt-5 border-y border-slate-200 py-3"><div className="flex items-baseline gap-5 text-sm"><dt className="shrink-0 font-semibold text-slate-800">Cat.No</dt><dd className="break-words font-medium text-slate-600" aria-live="polite">{sku}</dd></div></dl>:null}
      {product.models.length>1?<fieldset className="mt-5"><legend className="text-sm font-semibold text-slate-800">Model / Cat.No</legend><div className="mt-3 flex flex-wrap gap-2">{product.models.map(model=><label id={`model-${model.sku}`} key={model.sku} className={`cursor-pointer scroll-mt-28 rounded-lg border px-3 py-2 text-sm ${sku===model.sku?'border-red-700 bg-red-50 text-red-900':'border-slate-200 text-slate-600'}`}><input type="radio" name={`aims-model-${product.sku}`} value={model.sku} checked={sku===model.sku} onChange={()=>setSku(model.sku)} className="mr-2 accent-red-700" />{model.sku}</label>)}</div></fieldset>:null}
      {product.summary?<p className="mt-5 text-sm leading-7 text-slate-600">{product.summary}</p>:null}
    </div>
  </div>;
}

"use client";
import {useEffect,useState} from "react";
import type {AimsProduct} from "@/lib/aims/catalog";
import AimsGallery from "./AimsGallery";

export default function AimsProductOverview({product}:{product:Pick<AimsProduct,"sku"|"title"|"summary"|"models"|"images">}) {
  const [sku,setSku]=useState(product.models[0]?.sku||product.sku);
  useEffect(()=>{const read=()=>{if(!window.location.hash.startsWith('#model-'))return;let code;try{code=decodeURIComponent(window.location.hash.slice(7));}catch{return;}if(product.models.some(m=>m.sku===code))setSku(code);};read();window.addEventListener('hashchange',read);return()=>window.removeEventListener('hashchange',read);},[product.models]);
  return <div data-quote-context="product" data-product-name={product.title} data-cat-no={sku} data-product-model={sku} className="grid items-start gap-8 xl:grid-cols-2">
    <AimsGallery images={product.images} title={product.title} accent="red" />
    <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-widest text-red-800">AIMS Lab Products</p><h2 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-slate-950 md:text-3xl">{product.title}</h2>{product.summary?<p className="mt-5 text-sm leading-7 text-slate-600">{product.summary}</p>:null}
      {sku?<div className="mt-6 rounded-xl border border-red-200 bg-red-50/60 px-5 py-4"><p className="text-xs font-semibold uppercase tracking-wide text-red-800">Cat.No</p><p className="mt-2 break-all text-xl font-semibold text-slate-950">{sku}</p></div>:null}
      {product.models.length>1?<fieldset className="mt-5"><legend className="text-sm font-semibold text-slate-800">Model / Cat.No</legend><div className="mt-3 flex flex-wrap gap-2">{product.models.map(model=><label id={`model-${model.sku}`} key={model.sku} className={`cursor-pointer scroll-mt-28 rounded-lg border px-3 py-2 text-sm ${sku===model.sku?'border-red-700 bg-red-50 text-red-900':'border-slate-200 text-slate-600'}`}><input type="radio" name={`aims-model-${product.sku}`} value={model.sku} checked={sku===model.sku} onChange={()=>setSku(model.sku)} className="mr-2 accent-red-700" />{model.sku}</label>)}</div></fieldset>:null}
    </div>
  </div>;
}

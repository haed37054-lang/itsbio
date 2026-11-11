import { productSearchMetadata } from "@/lib/product-search";
import ProductSearchInfo from "@/components/products/ProductSearchInfo";
import { localizeManufacturerLinks } from "@/lib/manufacturer-links";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/site/Breadcrumb";
import AimsGallery from "@/components/products/aims/AimsGallery";
import AffinityHero from "@/components/products/affinity/AffinityHero";
import AffinitySidebar from "@/components/products/affinity/AffinitySidebar";
import AffinityProductTabs from "@/components/products/affinity/AffinityProductTabs";
import { AFFINITY_ALL_PRODUCTS, getAffinityProduct, exactAffinityProduct, affinityProductHref } from "@/lib/affinityimmuno/catalog";

export const dynamicParams = false;
export function generateStaticParams(){return AFFINITY_ALL_PRODUCTS.map(p=>({slug:p.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}) {
  const product = getAffinityProduct((await params).slug);
  return product ? productSearchMetadata({ name: product.title, brand: "AffinityImmuno", sku: product.sku, modelNumbers: [], description: product.summary, image: product.images[0]?.url, path: affinityProductHref(product) }) : {};
}
export default async function AffinityProductPage({params}:{params:Promise<{slug:string}>}){
  const product=getAffinityProduct((await params).slug);if(!product)notFound();
  const category=product.kind==='elisa'?'elisas':'antibodies';
  const sourceText = product.descriptionHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  const sourceHasPrinciple = /principle\s+of\s+(?:the\s+)?assay|assay\s+principle/i.test(sourceText);
  const assaySections = product.protocolSections.filter(section => section.title !== 'Assay principle' || !sourceHasPrinciple);
  const specifications = product.specifications.filter(([label]) =>
    !(label === 'Components' && product.components.length > 0) &&
    !(label === 'Precision' && product.specifications.some(([key]) => key === 'Assay precision'))
  );
  const highlights = product.specifications.filter(([label])=>(product.kind==='elisa'?["Antigen","Reactivity","Detection range","Detection minimum","Sample type","Assay time"]:["Host species","Target species","Clone","Clonality","Isotype","Application"]).includes(label));
  const tabs = [
    { id: "overview", label: "Overview", content: (product.descriptionHtml || product.background ? <section><h2 className="text-2xl font-semibold text-slate-950">Product Overview</h2>{product.descriptionHtml?<div className="affinity-content mt-5" dangerouslySetInnerHTML={{__html:localizeManufacturerLinks(product.descriptionHtml, product.sourceUrl, AFFINITY_ALL_PRODUCTS.map(p=>({sourceUrl:p.sourceUrl,href:affinityProductHref(p)})))}} />:<p className="mt-5 whitespace-pre-line text-sm leading-8 text-slate-600">{product.background}</p>}{product.background && product.descriptionHtml && !product.descriptionHtml.includes(product.background.slice(0,100))?<details className="mt-6 rounded-xl border border-slate-200 p-5"><summary className="cursor-pointer text-sm font-semibold text-cyan-900">Target background</summary><p className="mt-4 whitespace-pre-line text-sm leading-8 text-slate-600">{product.background}</p></details>:null}</section>:null) },
    { id: "specifications", label: "Specifications", content: (<section><h2 className="text-2xl font-semibold text-slate-950">Specifications</h2><dl className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200">{specifications.map(([label,value])=><div key={label} className="grid gap-2 px-5 py-4 text-sm sm:grid-cols-[180px_minmax(0,1fr)]"><dt className="font-semibold text-slate-800">{label}</dt><dd className="break-words whitespace-pre-line leading-7 text-slate-600">{value}</dd></div>)}</dl></section>) },
    { id: "components", label: "Kit Components", content: (product.components.length?<section><h2 className="text-2xl font-semibold text-slate-950">Kit Components</h2><ul className="mt-5 divide-y divide-slate-200 rounded-xl border border-slate-200">{product.components.map((component,i)=><li key={i} className="px-5 py-3 text-sm leading-7 text-slate-600">{component}</li>)}</ul></section>:null) },
    { id: "assay-information", label: "Assay Information", content: (assaySections.length?<section><h2 className="text-2xl font-semibold text-slate-950">Assay Information</h2><div className="mt-5 space-y-3">{assaySections.map((s,i)=><details key={s.title} open={i===0} className="rounded-xl border border-slate-200 px-5 py-4"><summary className="cursor-pointer text-sm font-semibold text-cyan-900">{s.title}</summary><p className="mt-4 whitespace-pre-line text-sm leading-8 text-slate-600">{s.body}</p></details>)}</div></section>:null) },
    { id: "documents", label: "Documents", content: (product.documents.length?<section><h2 className="text-2xl font-semibold text-slate-950">Documents</h2><div className="mt-5 flex flex-wrap gap-3">{product.documents.map(d=><a key={d.url} href={d.url} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-xl border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm font-semibold text-cyan-900">{d.label} · PDF ↗</a>)}</div></section>:null) },
  ].filter(tab => tab.content !== null);
  const related=product.relatedSkus.map(exactAffinityProduct).filter(p=>!!p);
  return <><AffinityHero /><main className="mx-auto max-w-[1320px] px-6 pb-16"><div className="my-7"><Breadcrumb items={[{label:"Home",href:"/"},{label:"Products",href:"/products"},{label:"AffinityImmuno",href:"/products/affinity"},{label:product.kind==='elisa'?"ELISA Kits":"Antibodies",href:`/products/affinity/${category}`},{label:product.sku}]} /></div><div className="grid items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)]"><AffinitySidebar active={category} /><article className="min-w-0" data-quote-context="product" data-product-name={product.title} data-cat-no={product.sku} data-product-model={product.unit}>
    <div className={product.images.length?"grid items-start gap-8 xl:grid-cols-2":""}>{product.images.length?<AimsGallery images={product.images} title={product.sku} />:null}<div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-widest text-cyan-800">AffinityImmuno · {product.kind==='elisa'?"ELISA Kit":"Research Antibody"}</p><h2 className="mt-3 break-words text-2xl font-semibold leading-tight tracking-tight text-slate-950 md:text-3xl">{product.title}</h2><div className="mt-6 rounded-xl border border-cyan-200 bg-cyan-50/60 px-5 py-4"><p className="text-xs font-semibold uppercase tracking-wide text-cyan-800">Cat.No</p><p className="mt-2 break-all text-xl font-semibold text-slate-950">{product.sku}</p><p className="mt-2 text-sm text-slate-600">{product.unit}</p></div><dl className="mt-5 divide-y divide-slate-100 text-sm">{highlights.map(([label,value])=><div key={label} className="grid gap-1 py-3 sm:grid-cols-[135px_minmax(0,1fr)]"><dt className="font-medium text-slate-800">{label}</dt><dd className="break-words leading-6 text-slate-600">{value}</dd></div>)}</dl></div></div>
    <ProductSearchInfo info={{ name: product.title, brand: "AffinityImmuno", sku: product.sku, modelNumbers: [], description: product.summary, image: product.images[0]?.url, path: affinityProductHref(product) }} brandHref="/products/affinity" />
    <AffinityProductTabs key={product.slug} tabs={tabs} />
    {related.length?<section className="border-t border-slate-200 py-8"><h2 className="text-2xl font-semibold text-slate-950">Related Products</h2><ul className="mt-5 space-y-3">{related.map(p=><li key={p.slug}><Link href={affinityProductHref(p)} className="text-sm text-cyan-900 underline">{p.sku} · {p.title}</Link></li>)}</ul></section>:null}
  </article></div></main></>;
}

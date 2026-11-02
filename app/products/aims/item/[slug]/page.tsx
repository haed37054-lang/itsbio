import {notFound} from "next/navigation";
import Breadcrumb from "@/components/site/Breadcrumb";
import ProductInformationTabs from "@/components/products/ProductInformationTabs";
import AimsHero from "@/components/products/aims/AimsHero";
import AimsSidebar from "@/components/products/aims/AimsSidebar";
import AimsProductOverview from "@/components/products/aims/AimsProductOverview";
import AimsProductCards from "@/components/products/aims/AimsProductCards";
import {AIMS_PRODUCTS,AIMS_CATEGORIES,getAimsProduct} from "@/lib/aims/catalog";
export const dynamicParams=false;
export function generateStaticParams(){return AIMS_PRODUCTS.map(p=>({slug:p.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const p=getAimsProduct((await params).slug);return p?{title:`${p.sku?p.sku+' ':''}${p.title} | AIMS Lab Products`,description:p.summary}:{};}
export default async function AimsProductPage({params}:{params:Promise<{slug:string}>}) {
  const p=getAimsProduct((await params).slug);if(!p)notFound();
  const activeCategory=p.categories.find(slug=>!AIMS_CATEGORIES.some(c=>c.parent===slug&&p.categories.includes(c.slug)));
  const tabs=[
    {id:'overview',label:'Overview',content:<section><h2 className="text-2xl font-semibold text-slate-950">Product Overview</h2><div className="aims-content mt-5" dangerouslySetInnerHTML={{__html:p.descriptionHtml}} /></section>},
    {id:'specifications',label:'Specifications',content:p.sku||p.specifications.length?<section><h2 className="text-2xl font-semibold text-slate-950">Specifications</h2><dl className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200">{[...(p.sku?[["Cat.No",p.sku]]:[]),...p.specifications].map(([label,value])=><div key={label} className="grid gap-2 px-5 py-4 text-sm sm:grid-cols-[160px_minmax(0,1fr)]"><dt className="font-semibold text-slate-800">{label}</dt><dd className="break-words whitespace-pre-line leading-7 text-slate-600">{value}</dd></div>)}</dl></section>:null},
    {id:'documents',label:'Documents',content:p.documents.length?<section><h2 className="text-2xl font-semibold text-slate-950">Documents</h2><div className="mt-5 flex flex-wrap gap-3">{p.documents.map(d=><a key={d.url} href={d.url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-900">{d.label} · PDF ↗</a>)}</div></section>:null},
  ].filter(tab=>tab.content!==null);
  const related=p.relatedSlugs.map(getAimsProduct).filter(product=>!!product);
  return <><AimsHero /><main className="mx-auto max-w-[1320px] px-6 pb-16"><div className="my-7"><Breadcrumb items={[{label:'Home',href:'/'},{label:'Products',href:'/products'},{label:'AIMS Lab Products',href:'/products/aims'},{label:p.sku||p.title}]} /></div><div className="grid items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)]"><AimsSidebar active={activeCategory} /><article className="min-w-0"><AimsProductOverview key={p.slug} product={{sku:p.sku,title:p.title,summary:p.summary,models:p.models,images:p.images}} /><ProductInformationTabs key={p.slug} tabs={tabs} accent="red" />{related.length?<section className="mt-10 border-t border-slate-200 pt-8"><h2 className="mb-5 text-2xl font-semibold text-slate-950">Related Products</h2><AimsProductCards products={related} /></section>:null}</article></div></main></>;
}

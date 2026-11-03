import {notFound} from "next/navigation";
import {load} from "cheerio";
import Breadcrumb from "@/components/site/Breadcrumb";
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
  // The opening summary already appears beside the gallery. Keep every other
  // source paragraph, image and table in the continuous detail section.
  const description=load(p.descriptionHtml,{},false);
  const opening=description.root().children().first();
  const normalize=(text:string)=>text.normalize("NFKC").replace(/\s+/g," ").trim();
  if(opening.is("p")&&normalize(opening.text())===normalize(p.summary)&&!opening.find("img,a").length)opening.remove();
  const descriptionHtml=description.html();
  const hasDescription=!!description.text().trim()||description("img,table").length>0;
  const related=p.relatedSlugs.map(getAimsProduct).filter(product=>!!product);

  return <>
    <AimsHero compact />
    <main className="mx-auto max-w-[1320px] px-6 pb-16">
      <div className="my-7"><Breadcrumb items={[{label:'Home',href:'/'},{label:'Products',href:'/products'},{label:'AIMS',href:'/products/aims'},{label:'Lab Products',href:'/products/aims#lab-products'},{label:p.sku||p.title}]} /></div>
      <div className="grid items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <AimsSidebar active={activeCategory} />
        <article className="min-w-0">
          <AimsProductOverview key={p.slug} product={{sku:p.sku,title:p.title,summary:p.summary,models:p.models,images:p.images}} />
          {hasDescription?<section id="overview" aria-labelledby="aims-details-title" className="mt-10 scroll-mt-28">
            <h2 id="aims-details-title" className="border-b border-slate-200 pb-3 text-2xl font-semibold tracking-tight text-slate-950">Product Details</h2>
            <div className="aims-content mt-5" dangerouslySetInnerHTML={{__html:descriptionHtml}} />
          </section>:null}
          {p.specifications.length?<section id="specifications" aria-labelledby="aims-specifications-title" className="mt-9 scroll-mt-28">
            <h2 id="aims-specifications-title" className="border-b border-slate-200 pb-3 text-2xl font-semibold tracking-tight text-slate-950">Specifications</h2>
            <dl className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200">{p.specifications.map(([label,value])=><div key={label} className="grid text-sm sm:grid-cols-[180px_minmax(0,1fr)]"><dt className="bg-slate-50 px-4 py-3 font-semibold text-slate-800">{label}</dt><dd className="break-words whitespace-pre-line px-4 py-3 leading-7 text-slate-600">{value}</dd></div>)}</dl>
          </section>:null}
          {p.documents.length?<section id="documents" aria-labelledby="aims-documents-title" className="mt-9 scroll-mt-28">
            <h2 id="aims-documents-title" className="border-b border-slate-200 pb-3 text-2xl font-semibold tracking-tight text-slate-950">Documents</h2>
            <ul className="mt-5 space-y-3">{p.documents.map(d=><li key={d.url} className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3"><span aria-hidden="true" className="flex h-11 w-10 shrink-0 items-center justify-center rounded border border-red-200 text-[10px] font-bold text-red-800">PDF</span><span className="text-sm font-medium leading-6 text-slate-700">{d.label.replace(/\s*[-–·]?\s*PDF$/i,'')}</span></div>
              <a href={d.url} target="_blank" rel="noopener noreferrer" aria-label={`Download PDF: ${d.label} (opens in a new tab)`} className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-md bg-red-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-800 sm:self-auto"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4"><path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4" /></svg>Download PDF<span aria-hidden="true">↗</span></a>
            </li>)}</ul>
          </section>:null}
          {related.length?<section className="mt-10" aria-labelledby="aims-related-title"><h2 id="aims-related-title" className="mb-5 border-b border-slate-200 pb-3 text-2xl font-semibold tracking-tight text-slate-950">Related Products</h2><AimsProductCards products={related} compact /></section>:null}
        </article>
      </div>
    </main>
  </>;
}

import { getSeedburoRecommendations } from "@/lib/seedburo/recommendations";
import { SeedburoProductGrid } from "@/components/products/seedburo/SeedburoCatalog";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/site/Breadcrumb";
import SeedburoHero from "@/components/products/seedburo/SeedburoHero";
import SeedburoProductOverview from "@/components/products/seedburo/SeedburoProductOverview";
import { getSeedburoProduct } from "@/lib/seedburo/catalog";

export const revalidate = 3600;
export function generateStaticParams() { return []; }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = getSeedburoProduct(slug);
  return product ? { title: `${product.title} | Seedburo`, description: product.summary || undefined } : {};
}
export default async function SeedburoProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getSeedburoProduct(slug);
  if (!product) notFound();
  const recommendations = getSeedburoRecommendations(product.handle);
  const limitedDescription = product.summary.length < 120 && !/<(?:table|iframe|video|img)\b/i.test(product.descriptionHtml) && product.tabs.length === 0;
  const mediaClass = "seedburo-content max-w-none text-[15px] leading-8 text-slate-700 [&_h2]:mb-4 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_a]:font-medium [&_a]:text-green-800 [&_a]:underline [&_img]:my-6 [&_img]:h-auto [&_img]:max-h-[620px] [&_img]:max-w-full [&_img]:object-contain [&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-200 [&_td]:p-3 [&_th]:border [&_th]:border-slate-200 [&_th]:bg-green-50 [&_th]:p-3 [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:border-0 [&_video]:w-full";
  return <><SeedburoHero /><main className="mx-auto max-w-[1320px] px-6 pb-16"><div className="my-7"><Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Products", href: "/products" }, { label: "Seedburo", href: "/products/seedburo" }, { label: product.title }]} /></div><SeedburoProductOverview key={product.id} title={product.title} vendor={product.vendor} images={product.images} variants={product.variants} />{limitedDescription || !product.images.length ? <aside className="mt-8 rounded-xl border border-slate-200 bg-slate-50 px-6 py-5 text-sm leading-7 text-slate-600"><p>{limitedDescription ? "The manufacturer provides only brief product information on the source page. Please contact us for additional details." : "The manufacturer has not published a product photograph for this item."}</p><a href={product.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-semibold text-green-800 underline">View original Seedburo product page ↗</a></aside> : null}<div className="mt-12 border-t border-slate-200">{product.descriptionHtml ? <section className="border-b border-slate-200 py-8"><h3 className="mb-5 text-2xl font-semibold text-slate-950">Product Description</h3><div className={mediaClass} dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} /></section> : <section className="border-b border-slate-200 py-8"><h3 className="mb-5 text-2xl font-semibold text-slate-950">Product Information</h3><p className="text-[15px] leading-8 text-slate-700">{product.variants.find((variant) => variant.title !== "Default Title")?.title || product.title}</p><p className="mt-3 text-sm text-slate-500">Additional descriptions and specifications have not been published by the manufacturer.</p></section>}{product.tabs.map((tab, index) => <details key={`${tab.title}-${index}`} className="group border-b border-slate-200"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-6 text-lg font-semibold text-slate-950 marker:content-none [&::-webkit-details-marker]:hidden">{tab.title}<span aria-hidden className="text-green-800"><span className="group-open:hidden">+</span><span className="hidden group-open:inline">−</span></span></summary><div className={`${mediaClass} overflow-x-auto pb-8`} dangerouslySetInnerHTML={{ __html: tab.html }} /></details>)}</div>{recommendations.products.length ? <section aria-labelledby="seedburo-recommendations-heading" className="mt-12 border-t border-slate-200 pt-8"><h3 id="seedburo-recommendations-heading" className="mb-6 text-2xl font-semibold tracking-tight text-slate-950">{recommendations.heading}</h3><SeedburoProductGrid products={recommendations.products} hrefs={recommendations.hrefs} columns={4} /></section> : null}</main></>;
}

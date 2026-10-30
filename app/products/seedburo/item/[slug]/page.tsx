import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/site/Breadcrumb";
import SeedburoHero from "@/components/products/seedburo/SeedburoHero";
import SeedburoProductOverview from "@/components/products/seedburo/SeedburoProductOverview";
import { getSeedburoProduct, getSeedburoCollection, seedburoCollectionHref } from "@/lib/seedburo/catalog";

export const revalidate = 3600;
export function generateStaticParams() { return []; }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = getSeedburoProduct(slug);
  return product ? { title: `${product.title} | Seedburo | ITS BIO`, description: product.summary || undefined } : {};
}
export default async function SeedburoProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getSeedburoProduct(slug);
  if (!product) notFound();
  const categories = product.categoryHandles.map(getSeedburoCollection).filter(Boolean);
  const mediaClass = "seedburo-content max-w-none text-[15px] leading-8 text-slate-700 [&_h2]:mb-4 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_a]:font-medium [&_a]:text-green-800 [&_a]:underline [&_img]:my-6 [&_img]:h-auto [&_img]:max-h-[620px] [&_img]:max-w-full [&_img]:object-contain [&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-200 [&_td]:p-3 [&_th]:border [&_th]:border-slate-200 [&_th]:bg-green-50 [&_th]:p-3 [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:border-0 [&_video]:w-full";
  return <><SeedburoHero /><main className="mx-auto max-w-[1320px] px-6 pb-16"><div className="my-7"><Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Products", href: "/products" }, { label: "Seedburo", href: "/products/seedburo" }, { label: product.title }]} /></div><SeedburoProductOverview key={product.id} title={product.title} vendor={product.vendor} images={product.images} variants={product.variants} /><div className="mt-12 border-t border-slate-200">{product.descriptionHtml ? <section className="border-b border-slate-200 py-8"><h3 className="mb-5 text-2xl font-semibold text-slate-950">Product Description</h3><div className={mediaClass} dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} /></section> : null}{product.tabs.map((tab, index) => <details key={`${tab.title}-${index}`} className="group border-b border-slate-200"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-6 text-lg font-semibold text-slate-950 marker:content-none [&::-webkit-details-marker]:hidden">{tab.title}<span aria-hidden className="text-green-800"><span className="group-open:hidden">+</span><span className="hidden group-open:inline">−</span></span></summary><div className={`${mediaClass} overflow-x-auto pb-8`} dangerouslySetInnerHTML={{ __html: tab.html }} /></details>)}</div>{categories.length ? <section className="mt-8"><h3 className="text-sm font-semibold text-slate-700">Browse related categories</h3><div className="mt-3 flex flex-wrap gap-2">{categories.slice(0, 10).map((category) => category ? <Link key={category.handle} href={seedburoCollectionHref(category.handle)} prefetch={false} className="rounded-full border border-green-200 bg-green-50 px-4 py-2 text-xs font-medium text-green-800 hover:bg-green-100">{category.title}</Link> : null)}</div></section> : null}</main></>;
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/site/Breadcrumb";
import AimsHero from "@/components/products/aims/AimsHero";
import AimsGallery from "@/components/products/aims/AimsGallery";
import AimsProductOverview from "@/components/products/aims/AimsProductOverview";
import { AIMS_PRODUCTS, getAimsProduct, aimsProductHref, aimsVideoLabel } from "@/lib/aims/catalog";

export function generateStaticParams() { return AIMS_PRODUCTS.map((product) => ({ slug: product.slug })); }
export const dynamicParams = false;
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = getAimsProduct((await params).slug);
  return product ? { title: `${product.sku} ${product.title} | AIMS`, description: product.summary } : {};
}
export default async function AimsProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = getAimsProduct((await params).slug);
  if (!product) notFound();
  return <><AimsHero /><main className="mx-auto max-w-[1320px] px-6 pb-16"><div className="my-7"><Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Products", href: "/products" }, { label: "AIMS", href: "/products/aims" }, { label: product.sku }]} /></div><nav aria-label="AIMS systems" className="mb-8 flex flex-wrap gap-2">{AIMS_PRODUCTS.map((item) => <Link key={item.sku} href={aimsProductHref(item.slug)} aria-current={item.slug === product.slug ? "page" : undefined} className={`rounded-full border px-4 py-2 text-sm font-medium ${item.slug === product.slug ? "border-sky-700 bg-sky-700 text-white" : "border-slate-200 text-slate-600 hover:border-sky-300"}`}>{item.sku}</Link>)}</nav>
    <AimsProductOverview key={product.slug} product={{ sku: product.sku, title: product.title, summary: product.summary, audience: product.audience, models: product.models, images: product.images }} />
    <section className="mt-12 border-t border-slate-200 py-8"><h3 className="text-2xl font-semibold text-slate-950">Product Overview</h3><p className="mt-5 max-w-4xl text-[15px] leading-8 text-slate-600">{product.description}</p><ul className="mt-6 grid gap-3 sm:grid-cols-2">{product.features.map((feature) => <li key={feature} className="rounded-xl border border-sky-100 bg-sky-50/50 px-5 py-4 text-sm leading-6 text-slate-700">{feature}</li>)}</ul></section>
    <section className="border-t border-slate-200 py-8"><h3 className="text-2xl font-semibold text-slate-950">Specifications</h3><dl className="mt-5 divide-y divide-slate-200 rounded-xl border border-slate-200">{product.specifications.map(([label, value]) => <div key={label} className="grid gap-2 px-5 py-4 text-sm sm:grid-cols-[220px_minmax(0,1fr)]"><dt className="font-semibold text-slate-800">{label}</dt><dd className="leading-6 text-slate-600">{value}</dd></div>)}</dl></section>
    <section className="border-t border-slate-200 py-8"><h3 className="text-2xl font-semibold text-slate-950">Documents</h3><div className="mt-5 flex flex-wrap gap-3">{product.brochures.map((url) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-xl border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-semibold text-sky-800">{product.sku} Product Brochure · PDF ↗</a>)}</div></section>
    {product.gallery.length ? <section className="border-t border-slate-200 py-8"><h3 className="mb-6 text-2xl font-semibold text-slate-950">Application Gallery</h3><div className="max-w-[900px]"><AimsGallery key={`${product.slug}-applications`} images={product.gallery} title={`${product.sku} application`} application /></div></section> : null}
    {product.videos.length ? <section className="border-t border-slate-200 py-8"><h3 className="mb-6 text-2xl font-semibold text-slate-950">Videos</h3><div className="grid gap-6 md:grid-cols-2">{product.videos.map((url) => <figure key={url} className="min-w-0"><video controls preload="none" playsInline aria-label={`${product.sku} ${aimsVideoLabel(url)}`} className="aspect-[4/3] w-full rounded-xl bg-slate-950"><source src={url} type="video/mp4" /><a href={url}>Open video</a></video><figcaption className="mt-3 text-sm text-slate-600">{aimsVideoLabel(url)}</figcaption></figure>)}</div></section> : null}
    <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block text-sm font-medium text-sky-800 underline">Manufacturer product page ↗</a>
  </main></>;
}

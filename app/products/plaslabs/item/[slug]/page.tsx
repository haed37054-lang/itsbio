import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AimsGallery from "@/components/products/aims/AimsGallery";
import PlasLabsFrame from "@/components/products/plaslabs/PlasLabsFrame";
import { COMPACT_GLOVE_BOXES, PLASLABS_CATEGORIES, PLASLABS_PRODUCTS, plasLabsProductHref } from "@/lib/plaslabs/catalog";
import { getPlasLabsDetailLayout } from "@/lib/plaslabs/detail-layout";
import "./plaslabs-details.css";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return PLASLABS_PRODUCTS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = PLASLABS_PRODUCTS.find((entry) => entry.slug === slug);
  return product ? { title: `${product.title} | PLAS-LABS`, description: product.summary } : {};
}

export default async function PlasLabsProductPage({ params }: Props) {
  const { slug } = await params;
  const product = PLASLABS_PRODUCTS.find((entry) => entry.slug === slug);
  if (!product) notFound();
  if (slug === COMPACT_GLOVE_BOXES.slug) {
    const { title, series } = COMPACT_GLOVE_BOXES;
    return (
      <PlasLabsFrame active={product.category} productSlug={slug} title={title}>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
        <ul aria-label="Compact Glove Box series" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {series.map((entry) => (
            <li key={entry.slug}>
              <Link href={plasLabsProductHref(entry.slug)} className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-400 hover:shadow-sm">
                <div className="relative aspect-[4/3] border-b border-slate-100">
                  <Image src={entry.image} alt={entry.title} fill sizes="(min-width: 1280px) 320px, (min-width: 640px) 45vw, 90vw" className="object-contain p-4" />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h3 className="font-semibold text-slate-950 group-hover:underline">{entry.title}</h3>
                  <p className="text-sm leading-6 text-slate-600">{entry.summary}</p>
                  <span className="mt-auto pt-2 text-sm font-semibold text-slate-800">View series <span aria-hidden="true">→</span></span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <section aria-labelledby="compact-shared-details" className="mt-8 border-t border-slate-200 pt-6">
          <h3 id="compact-shared-details" className="mb-4 text-2xl font-semibold tracking-tight text-slate-950">Standard Features of the &quot;Compact&quot; Glove Boxes:</h3>
          <div className="plaslabs-details overflow-x-auto" dangerouslySetInnerHTML={{ __html: product.html }} />
        </section>
      </PlasLabsFrame>
    );
  }

  const { images, leadHtml, quoteHref, detailsHtml } = getPlasLabsDetailLayout(product);
  const category = PLASLABS_CATEGORIES.find((entry) => entry.slug === product.category);

  return (
    <PlasLabsFrame active={product.category} productSlug={slug} title={product.title}>
      <article data-quote-context={slug === "stream-table-activities" ? undefined : "product"}
        data-product-name={product.title} data-cat-no={product.models.length === 1 ? product.models[0] : undefined}>
        <div className={images.length ? "grid items-start gap-7 xl:grid-cols-2" : undefined}>
          {images.length > 0 && <AimsGallery images={images} title={product.title} compact />}
          <div className="min-w-0">
            {images.length > 0 && category && (
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-600">{category.title}</p>
            )}
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{product.title}</h2>
            {product.subtitle && <p className="mt-2 text-base text-slate-700">{product.subtitle}</p>}
            {leadHtml && <div className="mt-4 text-sm leading-7 text-slate-600" dangerouslySetInnerHTML={{ __html: leadHtml }} />}
            {quoteHref && <Link href={quoteHref} className="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">Request a Quote</Link>}
          </div>
        </div>
        {detailsHtml && (
          <div className="plaslabs-details mt-8 overflow-x-auto" dangerouslySetInnerHTML={{ __html: detailsHtml }} />
        )}
      </article>
    </PlasLabsFrame>
  );
}

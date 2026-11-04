import Link from "next/link";
import { notFound } from "next/navigation";
import AimsGallery from "@/components/products/aims/AimsGallery";
import PlasLabsFrame from "@/components/products/plaslabs/PlasLabsFrame";
import { PLASLABS_CATEGORIES, PLASLABS_PRODUCTS } from "@/lib/plaslabs/catalog";
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
  const category = PLASLABS_CATEGORIES.find((entry) => entry.slug === product.category);
  const quoteHref = `/quote?product=${encodeURIComponent(product.title)}${product.models.length === 1 ? `&catNo=${encodeURIComponent(product.models[0])}` : ""}`;

  return (
    <PlasLabsFrame active={product.category} title={product.title}>
      <article>
        <div className={`grid items-start gap-7 ${product.images.length ? "xl:grid-cols-2" : ""}`}>
          {product.images.length > 0 && <AimsGallery images={product.images.map((url) => ({ url }))} title={product.title} compact />}
          <div data-quote-context="product" data-product-name={product.title} data-cat-no={product.models.length === 1 ? product.models[0] : ""}>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">{category?.title}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{product.title}</h2>
            {product.summary && <p className="mt-3 text-sm leading-7 text-slate-600">{product.summary}</p>}
            {product.models.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-slate-950">Model and part numbers</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {product.models.map((model) => (
                    <li key={model}>
                      <Link href={`/quote?product=${encodeURIComponent(product.title)}&catNo=${encodeURIComponent(model)}`}
                        aria-label={`Request a quote for ${model}`} className="block rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-slate-400">{model}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Link href={quoteHref} className="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">Request a Quote</Link>
          </div>
        </div>

        {product.html && (
          <section className="mt-8 border-t border-slate-200 pt-6" aria-labelledby="plaslabs-details-title">
            <h3 id="plaslabs-details-title" className="mb-4 text-2xl font-semibold tracking-tight text-slate-950">Product Details</h3>
            <div className="plaslabs-details overflow-x-auto" dangerouslySetInnerHTML={{ __html: product.html }} />
          </section>
        )}

      </article>
    </PlasLabsFrame>
  );
}

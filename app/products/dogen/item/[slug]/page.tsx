import { productSearchMetadata } from "@/lib/product-search";
import ProductSearchInfo from "@/components/products/ProductSearchInfo";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/site/Breadcrumb";
import AimsGallery from "@/components/products/aims/AimsGallery";
import ProductInformationTabs from "@/components/products/ProductInformationTabs";
import DogenHero from "@/components/products/dogen/DogenHero";
import DogenOptions from "@/components/products/dogen/DogenOptions";
import DogenSidebar from "@/components/products/dogen/DogenSidebar";
import { DOGEN_CATEGORIES, DOGEN_PRODUCTS, dogenCategoryHref } from "@/lib/dogen/catalog";
import "../../dogen.css";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return DOGEN_PRODUCTS.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = DOGEN_PRODUCTS.find((item) => item.slug === slug);
  return product ? productSearchMetadata({ name: product.title, brand: "DoGen", sku: product.models.length === 1 ? product.models[0].sku : undefined, modelNumbers: product.models.map((model) => model.sku), description: product.summary, image: product.image, path: `/products/dogen/item/${encodeURIComponent(product.slug)}` }) : {};
}

const documentLabels: Record<string, string> = {
  "Protocol(KOR.)": "Protocol (Korean)",
  "Protocol(ENG.)": "Protocol (English)",
  MSDS: "MSDS",
};

export default async function DogenProductPage({ params }: Props) {
  const { slug } = await params;
  const product = DOGEN_PRODUCTS.find((item) => item.slug === slug);
  if (!product) notFound();
  const category = DOGEN_CATEGORIES.find((item) => item.slug === product.category);
  const details = (
    <section aria-labelledby="dogen-details-title">
      <h2 id="dogen-details-title" className="mb-4 text-2xl font-semibold tracking-tight text-slate-950">Product Details</h2>
      <div className="dogen-details" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
    </section>
  );
  const documents = (
    <section aria-labelledby="dogen-documents-title">
      <h2 id="dogen-documents-title" className="mb-4 text-2xl font-semibold tracking-tight text-slate-950">Documents</h2>
      <ul className="space-y-3">
        {product.documents.map(({ url, label }) => (
          <li key={url} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-4">
            <span className="text-sm font-medium text-slate-800">{documentLabels[label] || label}</span>
            <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-md bg-red-800 px-3 py-2 text-sm font-semibold text-white hover:bg-red-900" aria-label={`Open ${documentLabels[label] || label} PDF in a new tab`}>Open PDF ↗</a>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <>
      <DogenHero />
      <main className="mx-auto max-w-[1320px] px-6 pb-16">
        <div className="my-7">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Products", href: "/products" }, { label: "DoGen", href: "/products/dogen" }, ...(category ? [{ label: category.title, href: dogenCategoryHref(category.slug) }] : []), { label: product.title }]} />
        </div>
        <div className="grid items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <DogenSidebar active={product.category} />
          <article className="min-w-0">
            <div className="grid items-start gap-7 xl:grid-cols-2">
              <AimsGallery images={[{ url: product.image }]} title={product.title} accent="red" compact />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-red-800">{product.group}</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{product.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{product.summary}</p>
                <DogenOptions title={product.title} models={product.models} labels={product.optionLabels} />
              </div>
            </div>
            <ProductSearchInfo info={{ name: product.title, brand: "DoGen", sku: product.models.length === 1 ? product.models[0].sku : undefined, modelNumbers: product.models.map((model) => model.sku), description: product.summary, image: product.image, path: `/products/dogen/item/${encodeURIComponent(product.slug)}` }} brandHref="/products/dogen" />
            {product.documents.length ? (
              <ProductInformationTabs accent="red" tabs={[
                { id: "details", label: "Product Details", content: details },
                { id: "documents", label: "Documents", content: documents },
              ]} />
            ) : <div className="mt-8 border-t border-slate-200 pt-6">{details}</div>}
          </article>
        </div>
      </main>
    </>
  );
}

import { productSearchMetadata } from "@/lib/product-search";
import ProductSearchInfo from "@/components/products/ProductSearchInfo";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import AimsGallery from "@/components/products/aims/AimsGallery";
import CellFreeFrame from "@/components/products/cellfree/CellFreeFrame";
import { CELLFREE_PRODUCTS } from "@/lib/cellfree/catalog";
import { CELLFREE_CATEGORIES, cellFreeProductHref, cellFreeSkuAnchor } from "@/lib/cellfree/navigation";

type Props = { params: Promise<{ slug: string }> };
const componentHeaders = ["Component", "Concentration", "Volume", "Quantity"];
const quoteClass = "inline-flex rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-950";

function quoteHref(product: string, sku?: string) {
  const query = new URLSearchParams({ product });
  if (sku) query.set("catNo", sku);
  return `/quote?${query}`;
}

export const dynamicParams = false;
export function generateStaticParams() {
  return CELLFREE_PRODUCTS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = CELLFREE_PRODUCTS.find((entry) => entry.slug === slug);
  return product ? productSearchMetadata({ name: product.title, brand: "CellFree Sciences", sku: product.options.length === 1 ? product.options[0].sku : undefined, modelNumbers: product.options.map((option) => option.sku), description: product.summary, image: product.image, path: cellFreeProductHref(product.slug) }) : {};
}

export default async function CellFreeProductPage({ params }: Props) {
  const { slug } = await params;
  const product = CELLFREE_PRODUCTS.find((entry) => entry.slug === slug);
  if (!product) notFound();

  const showLineup = product.options.length > 1;
  const option = showLineup ? undefined : product.options[0];
  const category = CELLFREE_CATEGORIES.find(({ key }) => key === product.category);

  const facts = product.facts ?? [];
  const variantTables = product.options.filter((entry) => entry.composition?.length);
  const documents = [...(product.documents ?? []), ...product.options.flatMap((entry) => entry.documents ?? [])];
  const specifications = (
    <div className="space-y-6">
      {facts.length > 0 && (
        <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
          {facts.map(([label, value]) => (
            <div key={label} className="grid gap-1 py-3 text-sm sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4">
              <dt className="font-semibold text-slate-900">{label}</dt><dd className="text-slate-600">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {!!product.components?.length && (
        <SpecificationTable title="Product composition" headers={componentHeaders} rows={product.components} />
      )}
      {product.consumables && (
        <SpecificationTable title={`Plastic consumables · ${product.consumables.sku}`} headers={["Consumable", "Quantity"]} rows={product.consumables.rows} />
      )}
      {variantTables.map((entry) => (
        <section key={entry.sku} id={cellFreeSkuAnchor(entry.sku)} className="scroll-mt-28 rounded-xl border border-slate-200 p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-blue-900">{entry.sku} <span className="ml-2 font-normal text-slate-600">{entry.size}</span></p>
              <h4 className="mt-1 text-lg font-semibold text-slate-950">{entry.name}</h4>
            </div>
            <Link href={quoteHref(entry.name, entry.sku)} className={quoteClass}>Request a Quote</Link>
          </div>
          <SpecificationTable headers={componentHeaders} groups={entry.composition} />
        </section>
      ))}
      {!!product.vectors?.length && (
        <SpecificationTable title="Vector set composition" headers={["Vector", "Tag position", "Protease recognition site"]} rows={product.vectors} />
      )}
    </div>
  );
  const hasSpecifications = facts.length || product.components?.length || product.consumables?.rows.length || variantTables.length || product.vectors?.length;

  return (
    <CellFreeFrame category={product.category} title={product.title}>
      <article>
        <div className={product.image ? "grid items-center gap-7 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" : undefined}>
          {product.image && <AimsGallery images={[{ url: product.image }]} title={product.title} compact />}
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-900">{category?.label}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{product.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{product.summary}</p>
            {option && (
              <div id={cellFreeSkuAnchor(option.sku)} className="mt-5 scroll-mt-28 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <dl className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                  <dt className="font-semibold text-blue-900">Cat.No</dt><dd className="font-semibold text-slate-950">{option.sku}</dd>
                  <dt className="sr-only">Pack size</dt><dd className="text-slate-600">{option.size}</dd>
                </dl>
              </div>
            )}
            {!showLineup && <Link href={quoteHref(option?.name ?? product.title, option?.sku)} className={`mt-5 ${quoteClass}`}>Request a Quote</Link>}
          </div>
        </div>
        <ProductSearchInfo info={{ name: product.title, brand: "CellFree Sciences", sku: product.options.length === 1 ? product.options[0].sku : undefined, modelNumbers: product.options.map((option) => option.sku), description: product.summary, image: product.image, path: cellFreeProductHref(product.slug) }} brandHref="/products/cellfree" />
        {!!product.overview?.length && (
          <DetailSection id="overview" title="Overview">
            <div className="space-y-6">
              {product.overview.map(({ title, text }) => (
                <div key={title}>
                  <h4 className="mb-2 text-lg font-semibold text-slate-950">{title}</h4>
                  <p className="text-sm leading-7 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </DetailSection>
        )}
        {product.workflow && (
          <DetailSection id="workflow" title="Flow of operations">
            <Image {...product.workflow} alt={`${product.title} workflow`} sizes="(min-width: 768px) 576px, 90vw" className="h-auto w-full max-w-xl" />
          </DetailSection>
        )}
        {showLineup && (
          <DetailSection id="product-lineup" title="Product lineup">
            <ul className={`grid gap-3 ${product.options.length === 2 ? "sm:grid-cols-2" : "md:grid-cols-3"}`}>
              {product.options.map((entry) => (
                <li key={entry.sku} id={entry.composition?.length ? undefined : cellFreeSkuAnchor(entry.sku)} className="flex scroll-mt-28 flex-col rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold tracking-wide text-blue-900">{entry.sku}</p>
                  <h4 className="mt-2 text-base font-semibold text-slate-950">{entry.name}</h4>
                  {entry.description && <p className="mt-2 text-sm leading-6 text-slate-600">{entry.description}</p>}
                  {!entry.composition?.length && (
                    <>
                      <p className="mb-4 mt-2 text-sm text-slate-600">{entry.size}</p>
                      <Link href={quoteHref(entry.name, entry.sku)} className={`mt-auto self-start ${quoteClass}`}>Request a Quote</Link>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </DetailSection>
        )}
        {!!hasSpecifications && (
          <DetailSection id="specifications" title={product.category === "services" ? "Service details" : "Specifications"}>
            {specifications}
          </DetailSection>
        )}
        {!!documents.length && (
          <DetailSection id="documents" title="Documents">
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
              {documents.map(({ label, url }) => (
                <li key={url} className="py-3"><a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-900 underline underline-offset-4">{label} (PDF) <span aria-hidden>↗</span></a></li>
              ))}
            </ul>
          </DetailSection>
        )}
        {!!product.related?.length && (
          <DetailSection id="related-products" title="Related products">
            <ul className="space-y-2">
              {CELLFREE_PRODUCTS.filter(({ slug }) => product.related?.includes(slug)).map((entry) => (
                <li key={entry.slug}><Link href={cellFreeProductHref(entry.slug)} className="text-sm font-semibold text-blue-900 underline underline-offset-4">{entry.title}</Link></li>
              ))}
            </ul>
          </DetailSection>
        )}
      </article>
    </CellFreeFrame>
  );
}

function DetailSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-8 scroll-mt-28 border-t border-slate-200 pt-6">
      <h3 className="mb-4 text-xl font-semibold text-slate-950">{title}</h3>
      {children}
    </section>
  );
}

function SpecificationTable({ title, headers, rows = [], groups = [{ rows }] }: {
  title?: string;
  headers: string[];
  rows?: string[][];
  groups?: { title?: string; rows: string[][] }[];
}) {
  return (
    <div>
      {title && <h4 className="mb-3 text-lg font-semibold text-slate-950">{title}</h4>}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[460px] text-left text-sm">
          <thead className="bg-blue-50 text-blue-950"><tr>{headers.map((header) => <th key={header} scope="col" className="px-4 py-3">{header}</th>)}</tr></thead>
          {groups.map(({ title: groupTitle, rows: groupRows }) => (
            <tbody key={groupTitle ?? "composition"} className="divide-y divide-slate-100 text-slate-600">
              {groupTitle && <tr><th scope="rowgroup" colSpan={headers.length} className="border-t border-slate-200 bg-slate-50 px-4 py-2 font-semibold text-slate-900">{groupTitle}</th></tr>}
              {groupRows.map(([name, ...values]) => (
                <tr key={name}><th scope="row" className="px-4 py-3 font-medium text-slate-900">{name}</th>{values.map((value, index) => <td key={headers[index + 1]} className="whitespace-nowrap px-4 py-3">{value}</td>)}</tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}

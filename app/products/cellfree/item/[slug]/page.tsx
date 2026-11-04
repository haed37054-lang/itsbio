import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AimsGallery from "@/components/products/aims/AimsGallery";
import CellFreeFrame from "@/components/products/cellfree/CellFreeFrame";
import ProductInformationTabs from "@/components/products/ProductInformationTabs";
import { CELLFREE_PRODUCTS } from "@/lib/cellfree/catalog";
import { CELLFREE_CATEGORIES, DIALYSIS_KIT_SLUG, cellFreeProductHref } from "@/lib/cellfree/navigation";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ sku?: string | string[] }> };
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
  return product ? { title: `${product.title} | CellFree Sciences`, description: product.summary, alternates: { canonical: cellFreeProductHref(slug) } } : {};
}

export default async function CellFreeProductPage({ params, searchParams }: Props) {
  const [{ slug }, { sku }] = await Promise.all([params, searchParams]);
  const product = CELLFREE_PRODUCTS.find((entry) => entry.slug === slug);
  if (!product) notFound();

  const showLineup = slug === DIALYSIS_KIT_SLUG;
  const option = showLineup ? undefined : product.options.find((entry) => entry.sku === sku) ?? product.options[0];
  const category = CELLFREE_CATEGORIES.find(({ key }) => key === product.category);

  const facts = product.facts ?? [];
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
      {showLineup && product.options.map((entry) => (
        <section key={entry.sku} id={entry.sku.toLowerCase()} className="scroll-mt-28 rounded-xl border border-slate-200 p-4 sm:p-5">
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
  const tabs = [{ id: "specifications", label: "Specifications", content: specifications }];
  if (product.overview?.length) tabs.push({
    id: "overview", label: "Overview",
    content: (
      <div className="space-y-6">
        {product.overview.map(({ title, text }) => (
          <section key={title}>
            <h3 className="mb-2 text-lg font-semibold text-slate-950">{title}</h3>
            <p className="text-sm leading-7 text-slate-600">{text}</p>
          </section>
        ))}
      </div>
    ),
  });
  if (product.workflow) tabs.push({
    id: "workflow", label: showLineup ? "Flow of operations" : "Workflow",
    content: showLineup
      ? <Image src={product.workflow} alt={`${product.title} workflow`} width={800} height={1296} sizes="(min-width: 768px) 576px, 90vw" className="h-auto w-full max-w-xl" />
      : <Image src={product.workflow} alt={`${product.title} workflow`} width={900} height={600} sizes="(min-width: 1024px) 850px, 90vw" className="h-auto max-w-full" />,
  });
  if (documents.length) tabs.push({
    id: "documents", label: "Documents",
    content: (
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
        {documents.map(({ label, url }) => (
          <li key={url} className="py-3"><a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-900 underline underline-offset-4">{label} (PDF) <span aria-hidden>↗</span></a></li>
        ))}
      </ul>
    ),
  });

  const lineup = showLineup ? {
    id: "product-lineup", label: "Product lineup",
    content: (
      <ul className="grid gap-3 md:grid-cols-3">
        {product.options.map((entry) => (
          <li key={entry.sku} className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold tracking-wide text-blue-900">{entry.sku}</p>
            <h4 className="mt-2 text-base font-semibold text-slate-950">{entry.name}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-600">{entry.description}</p>
          </li>
        ))}
      </ul>
    ),
  } : undefined;
  const orderedSections = lineup ? [
    ...tabs.filter(({ id }) => id === "overview" || id === "workflow"),
    lineup,
    ...tabs.filter(({ id }) => id === "specifications" || id === "documents"),
  ] : [];

  return (
    <CellFreeFrame category={product.category} title={product.title}>
      <article>
        <div className={showLineup ? "grid items-center gap-7 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" : product.image ? "grid items-start gap-7 xl:grid-cols-2" : undefined}>
          {product.image && <AimsGallery images={[{ url: product.image }]} title={product.title} compact />}
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-900">{category?.label}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{product.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{product.summary}</p>
            {option && (
              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <dl className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                  <dt className="font-semibold text-blue-900">Cat.No</dt><dd className="font-semibold text-slate-950">{option.sku}</dd>
                  <dt className="sr-only">Pack size</dt><dd className="text-slate-600">{option.size}</dd>
                </dl>
                {product.options.length > 1 && (
                  <nav aria-label="Catalog number options" className="mt-3 flex flex-wrap gap-2">
                    {product.options.map((entry) => (
                      <Link key={entry.sku} href={cellFreeProductHref(slug, entry.sku)} aria-current={entry.sku === option.sku ? "page" : undefined}
                        title={entry.name} scroll={false} className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${entry.sku === option.sku ? "border-blue-900 bg-blue-900 text-white" : "border-blue-200 bg-white text-blue-900 hover:border-blue-500"}`}>{entry.sku}</Link>
                    ))}
                  </nav>
                )}
                {product.options.length > 1 && <p className="mt-2 text-sm text-slate-600">{option.name}</p>}
              </div>
            )}
            {!showLineup && <Link href={quoteHref(option?.name ?? product.title, option?.sku)} className={`mt-5 ${quoteClass}`}>Request a Quote</Link>}
          </div>
        </div>
        {showLineup ? orderedSections.map(({ id, label, content }) => (
          <section key={id} id={id} className="mt-8 scroll-mt-28 border-t border-slate-200 pt-6">
            <h3 className="mb-4 text-xl font-semibold text-slate-950">{label}</h3>
            {content}
          </section>
        )) : tabs.length > 1 ? <ProductInformationTabs accent="sky" tabs={tabs} /> : (
          <section className="mt-8 border-t border-slate-200 pt-5">
            <h3 className="mb-3 text-xl font-semibold text-slate-950">{product.category === "services" ? "Service details" : "Specifications"}</h3>
            {specifications}
          </section>
        )}
        {!!product.related?.length && (
          <section className="mt-8 border-t border-slate-200 pt-5">
            <h3 className="text-xl font-semibold text-slate-950">Related products</h3>
            <ul className="mt-3 space-y-2">
              {CELLFREE_PRODUCTS.filter(({ slug }) => product.related?.includes(slug)).map((entry) => (
                <li key={entry.slug}><Link href={cellFreeProductHref(entry.slug)} className="text-sm font-semibold text-blue-900 underline underline-offset-4">{entry.title}</Link></li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </CellFreeFrame>
  );
}

function SpecificationTable({ title, headers, rows = [], groups = [{ rows }] }: {
  title?: string;
  headers: string[];
  rows?: string[][];
  groups?: { title?: string; rows: string[][] }[];
}) {
  return (
    <section>
      {title && <h3 className="mb-3 text-lg font-semibold text-slate-950">{title}</h3>}
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
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AimsGallery from "@/components/products/aims/AimsGallery";
import CellFreeFrame from "@/components/products/cellfree/CellFreeFrame";
import ProductInformationTabs from "@/components/products/ProductInformationTabs";
import { CELLFREE_PRODUCTS } from "@/lib/cellfree/catalog";
import { CELLFREE_CATEGORIES, cellFreeProductHref } from "@/lib/cellfree/navigation";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ sku?: string | string[] }> };

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

  const option = product.options.find((entry) => entry.sku === sku) ?? product.options[0];
  const category = CELLFREE_CATEGORIES.find(({ key }) => key === product.category);
  const quote = new URLSearchParams({ product: option?.name ?? product.title });
  if (option) quote.set("catNo", option.sku);

  const specifications = (
    <div className="space-y-6">
      {!!product.facts?.length && (
        <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
          {product.facts.map(([label, value]) => (
            <div key={label} className="grid gap-1 py-3 text-sm sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4">
              <dt className="font-semibold text-slate-900">{label}</dt><dd className="text-slate-600">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {!!product.components?.length && (
        <SpecificationTable title="Product composition" headers={["Component", "Concentration", "Volume", "Quantity"]} rows={product.components} />
      )}
      {!!product.vectors?.length && (
        <SpecificationTable title="Vector set composition" headers={["Vector", "Tag position", "Protease recognition site"]} rows={product.vectors} />
      )}
    </div>
  );
  const tabs = [{ id: "specifications", label: "Specifications", content: specifications }];
  if (product.workflow) tabs.push({
    id: "workflow", label: "Workflow",
    content: <Image src={product.workflow} alt={`${product.title} workflow`} width={900} height={600} sizes="(min-width: 1024px) 850px, 90vw" className="h-auto max-w-full" />,
  });
  if (product.documents?.length) tabs.push({
    id: "documents", label: "Documents",
    content: (
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
        {product.documents.map(({ label, url }) => (
          <li key={url} className="py-3"><a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-900 underline underline-offset-4">{label} (PDF) <span aria-hidden>↗</span></a></li>
        ))}
      </ul>
    ),
  });

  return (
    <CellFreeFrame category={product.category} title={product.title}>
      <article>
        <div className={product.image ? "grid items-start gap-7 xl:grid-cols-2" : undefined}>
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
            <Link href={`/quote?${quote}`} className="mt-5 inline-flex rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-950">Request a Quote</Link>
          </div>
        </div>
        {tabs.length > 1 ? <ProductInformationTabs accent="sky" tabs={tabs} /> : (
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

function SpecificationTable({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return (
    <section>
      <h3 className="mb-3 text-lg font-semibold text-slate-950">{title}</h3>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[460px] text-left text-sm">
          <thead className="bg-blue-50 text-blue-950"><tr>{headers.map((header) => <th key={header} scope="col" className="px-4 py-3">{header}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {rows.map(([name, ...values]) => (
              <tr key={name}><th scope="row" className="px-4 py-3 font-medium text-slate-900">{name}</th>{values.map((value, index) => <td key={headers[index + 1]} className="whitespace-nowrap px-4 py-3">{value}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

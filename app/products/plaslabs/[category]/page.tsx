import { notFound } from "next/navigation";
import PlasLabsCatalog from "@/components/products/plaslabs/PlasLabsCatalog";
import { PLASLABS_CATEGORIES } from "@/lib/plaslabs/catalog";
import { catalogCategoryMetadata } from "@/lib/catalog-category-metadata";

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
};

export const dynamicParams = false;
export function generateStaticParams() {
  return PLASLABS_CATEGORIES.map(({ slug }) => ({ category: slug }));
}

export async function generateMetadata({ params, searchParams }: Props) {
  const [{ category }, { q }] = await Promise.all([params, searchParams]);
  const entry = PLASLABS_CATEGORIES.find(({ slug }) => slug === category);
  return entry ? catalogCategoryMetadata({ title: entry.title, brand: "PLAS-LABS", path: `/products/plaslabs/${entry.slug}`,
    description: entry.summary, noIndex: Boolean(q), }) : {};
}

export default async function PlasLabsCategoryPage({ params, searchParams }: Props) {
  const [{ category }, { q }] = await Promise.all([params, searchParams]);
  const entry = PLASLABS_CATEGORIES.find(({ slug }) => slug === category);
  if (!entry) notFound();
  return <PlasLabsCatalog category={entry} query={typeof q === "string" ? q.trim() : ""} />;
}

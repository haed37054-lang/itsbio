import { notFound } from "next/navigation";
import DogenCatalog, { type DogenFilters } from "@/components/products/dogen/DogenCatalog";
import { DOGEN_CATEGORIES } from "@/lib/dogen/catalog";
import { catalogCategoryMetadata } from "@/lib/catalog-category-metadata";

type Props = { params: Promise<{ category: string }>; searchParams: Promise<DogenFilters> };

export const dynamicParams = false;
export function generateStaticParams() {
  return DOGEN_CATEGORIES.map(({ slug }) => ({ category: slug }));
}
export async function generateMetadata({ params, searchParams }: Props) {
  const [{ category }, filters] = await Promise.all([params, searchParams]);
  const entry = DOGEN_CATEGORIES.find(({ slug }) => slug === category);
  const page = Number.parseInt(filters.page || "1", 10);
  return entry ? catalogCategoryMetadata({ title: entry.title, brand: "DoGen", path: `/products/dogen/${entry.slug}${!filters.q && page > 1 ? `?page=${page}` : ""}`,
    noIndex: Boolean(filters.q), }) : {};
}
export default async function DogenCategoryPage({ params, searchParams }: Props) {
  const { category } = await params;
  if (!DOGEN_CATEGORIES.some(({ slug }) => slug === category)) notFound();
  return <DogenCatalog category={category} filters={await searchParams} />;
}

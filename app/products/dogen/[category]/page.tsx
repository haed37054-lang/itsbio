import { notFound } from "next/navigation";
import DogenCatalog, { type DogenFilters } from "@/components/products/dogen/DogenCatalog";
import { DOGEN_CATEGORIES } from "@/lib/dogen/catalog";

type Props = { params: Promise<{ category: string }>; searchParams: Promise<DogenFilters> };

export const dynamicParams = false;
export function generateStaticParams() {
  return DOGEN_CATEGORIES.map(({ slug }) => ({ category: slug }));
}
export async function generateMetadata({ params }: Props) {
  const { category } = await params;
  const entry = DOGEN_CATEGORIES.find(({ slug }) => slug === category);
  return entry ? { title: `${entry.title} | DoGen` } : {};
}
export default async function DogenCategoryPage({ params, searchParams }: Props) {
  const { category } = await params;
  if (!DOGEN_CATEGORIES.some(({ slug }) => slug === category)) notFound();
  return <DogenCatalog category={category} filters={await searchParams} />;
}

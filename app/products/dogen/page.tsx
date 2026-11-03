import DogenCatalog, { type DogenFilters } from "@/components/products/dogen/DogenCatalog";

export const metadata = { title: "DoGen", description: "DoGen cell viability and cytotoxicity assays, protein analysis reagents and assay kits." };

export default async function DogenPage({ searchParams }: { searchParams: Promise<DogenFilters> }) {
  return <DogenCatalog filters={await searchParams} />;
}

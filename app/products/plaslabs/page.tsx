import PlasLabsCatalog from "@/components/products/plaslabs/PlasLabsCatalog";

export const metadata = {
  title: "PLAS-LABS",
  description: "Browse PLAS-LABS glove boxes, laboratory enclosures, and animal care equipment.",
};

export default async function PlasLabsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const { q } = await searchParams;
  return <PlasLabsCatalog query={typeof q === "string" ? q.trim() : ""} />;
}

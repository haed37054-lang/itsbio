import products from "@/data/thistle-2026-products.json";
import type { CleaverProduct } from "@/lib/cleaver/catalog";

export const THISTLE_2026_PRODUCTS = products;

const bySku = new Map(products.flatMap((product) =>
  product.modelSkus.map((sku) => [sku.toUpperCase(), product] as const),
));

export function getThistle2026Product(skuOrSlug: string): Partial<CleaverProduct> | null {
  const value = skuOrSlug.normalize("NFKC").trim();
  const product = bySku.get(value.toUpperCase()) || products.find(({ slug }) => slug === value.toLowerCase());
  if (!product) return null;
  return { ...product, sku: product.modelSkus.find((sku) => sku.toUpperCase() === value.toUpperCase()) || product.sku };
}

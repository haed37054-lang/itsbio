import snapshot from "@/data/seedburo/recommendations.json";
import { getSeedburoProduct, seedburoProductHref, type SeedburoProduct } from "./catalog";

type RecommendationSnapshot = {
  sourceUrl: string;
  heading: string;
  kind: "bought-together" | "best-sellers" | "none";
  items: Array<{ handle: string; variantId?: string }>;
};
const recommendations = snapshot as Record<string, RecommendationSnapshot>;

export function getSeedburoRecommendations(handle: string) {
  const record = recommendations[handle];
  const products: SeedburoProduct[] = [];
  const hrefs: Record<string, string> = {};
  for (const item of record?.items || []) {
    const product = getSeedburoProduct(item.handle);
    if (!product) continue;
    products.push(product);
    const variant = item.variantId ? product.variants.find((candidate) => candidate.id === item.variantId) : undefined;
    hrefs[product.handle] = seedburoProductHref(product) + (variant?.sku ? `#model-${encodeURIComponent(variant.sku)}` : "");
  }
  return { heading: record?.heading || "", products, hrefs };
}

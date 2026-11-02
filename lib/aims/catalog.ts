import content from "@/data/aims/catalog.json";
import media from "@/data/aims/source-media.json";

type Image = { url: string; width: number; height: number };
export type AimsModel = { sku: string; title: string; description: string };
export type AimsProduct = {
  slug: string; sku: string; title: string; audience: string; summary: string;
  description: string; features: string[]; specifications: Array<[string, string]>;
  applications: string[]; kitContents: Array<[string, string]>; capacityNote: string;
  training: { volume: string; description: string; upgradeNote: string };
  models: AimsModel[]; sourceUrl: string; images: Image[]; gallery: Image[];
  brochures: string[]; videos: string[];
};
export const AIMS_PRODUCTS: AimsProduct[] = content.map((product) => ({ ...product, ...media[product.slug as keyof typeof media], specifications: product.specifications as Array<[string, string]>, kitContents: product.kitContents as Array<[string, string]> }));
export const aimsProductHref = (slug: string) => `/products/aims/item/${slug}`;
export const getAimsProduct = (slug: string) => AIMS_PRODUCTS.find((product) => product.slug === slug);
export function exactAimsModel(sku: string) {
  const key = sku.normalize("NFKC").trim().toUpperCase();
  for (const product of AIMS_PRODUCTS) {
    const model = product.models.find((item) => item.sku === key);
    if (model) return { product, model, href: `${aimsProductHref(product.slug)}#model-${encodeURIComponent(model.sku)}` };
  }
  return undefined;
}
export function searchAimsProducts(query: string) {
  const tokens = query.normalize("NFKC").toLowerCase().split(/\s+/).filter(Boolean);
  return AIMS_PRODUCTS.filter((product) => tokens.every((token) => `${product.sku} ${product.title} ${product.audience} ${product.summary} ${product.description} ${product.applications.join(" ")} ${product.features.join(" ")} ${product.kitContents.flat().join(" ")} ${product.specifications.flat().join(" ")} ${product.models.map((model) => `${model.sku} ${model.title}`).join(" ")}`.toLowerCase().includes(token)));
}

export function aimsVideoLabel(url: string) {
  const labels: Record<string, string> = {
    "cd-adult-rat-white.mp4": "Adult rat demonstration",
    "c57-adult-mouse-black.mp4": "Black adult mouse demonstration",
    "cd1-adult-mouse-white.mp4": "White adult mouse demonstration",
    "cd1-neonate-mouse.mp4": "Neonate mouse demonstration",
    "cd-neonate-rat.mp4": "Neonate rat demonstration",
  };
  return labels[url.split("/").at(-1) || ""] || "Product demonstration";
}

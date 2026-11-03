import content from "@/data/animalid/catalog.json";
import media from "@/data/animalid/source-media.json";

type Image = { url: string; width: number; height: number };
export type AnimalIdModel = { sku: string; title: string; description: string };
export type AnimalIdProduct = {
  slug: string; sku: string; title: string; audience: string; summary: string;
  description: string; features: string[]; specifications: Array<[string, string]>;
  applications: string[]; kitContents: Array<[string, string]>; capacityNote: string;
  training: { volume: string; description: string; upgradeNote: string };
  models: AnimalIdModel[]; sourceUrl: string; images: Image[]; gallery: Image[];
  brochures: string[]; videos: string[];
};
export const ANIMAL_ID_PRODUCTS: AnimalIdProduct[] = content.map((product) => ({ ...product, ...media[product.slug as keyof typeof media], specifications: product.specifications as Array<[string, string]>, kitContents: product.kitContents as Array<[string, string]> }));
export const animalIdProductHref = (slug: string) => `/products/animalid/item/${slug}`;
export const getAnimalIdProduct = (slug: string) => ANIMAL_ID_PRODUCTS.find((product) => product.slug === slug);
export function exactAnimalIdModel(sku: string) {
  const key = sku.normalize("NFKC").trim().toUpperCase();
  for (const product of ANIMAL_ID_PRODUCTS) {
    const model = product.models.find((item) => item.sku === key);
    if (model) return { product, model, href: `${animalIdProductHref(product.slug)}#model-${encodeURIComponent(model.sku)}` };
  }
  return undefined;
}
export function searchAnimalIdProducts(query: string) {
  const tokens = query.normalize("NFKC").toLowerCase().split(/\s+/).filter(Boolean);
  return ANIMAL_ID_PRODUCTS.filter((product) => tokens.every((token) => `${product.sku} ${product.title} ${product.audience} ${product.summary} ${product.description} ${product.applications.join(" ")} ${product.features.join(" ")} ${product.kitContents.flat().join(" ")} ${product.specifications.flat().join(" ")} ${product.models.map((model) => `${model.sku} ${model.title}`).join(" ")}`.toLowerCase().includes(token)));
}

export function animalIdVideoLabel(url: string) {
  const labels: Record<string, string> = {
    "cd-adult-rat-white.mp4": "Adult rat demonstration",
    "c57-adult-mouse-black.mp4": "Black adult mouse demonstration",
    "cd1-adult-mouse-white.mp4": "White adult mouse demonstration",
    "cd1-neonate-mouse.mp4": "Neonate mouse demonstration",
    "cd-neonate-rat.mp4": "Neonate rat demonstration",
  };
  return labels[url.split("/").at(-1) || ""] || "Product demonstration";
}

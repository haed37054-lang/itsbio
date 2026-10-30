import { isSeedburoPlaceholder, seedburoDisplayTitle } from "./presentation";
import catalog from "@/data/seedburo/catalog.json";
import collections from "@/data/seedburo/collections.json";
import navigation from "@/data/seedburo/navigation.json";

export type SeedburoImage = { url: string; alt: string; width: number; height: number };
export type SeedburoVariant = { id: string; title: string; sku: string; options: Array<string | null>; image: string };
export type SeedburoProduct = {
  id: string; handle: string; title: string; vendor: string; sourceUrl: string;
  summary: string; descriptionHtml: string; images: SeedburoImage[];
  variants: SeedburoVariant[]; optionNames: string[]; categoryHandles: string[];
  tabs: Array<{ title: string; html: string }>;
};
export type SeedburoCollection = {
  handle: string; title: string; sourceUrl: string; description: string;
  image: string; productHandles: string[]; count: number;
};
// Repair known source-feed encoding artifacts without changing product/SKU identities.
const displayText = (value: string) => value.replaceAll("Â®", "®").replaceAll("Â°", "°").replaceAll("Â ", " ");
export const SEEDBURO_PRODUCTS: SeedburoProduct[] = (catalog as SeedburoProduct[]).map((product) => ({
  ...product,
  title: displayText(seedburoDisplayTitle(product)),
  images: product.images.filter((image) => !isSeedburoPlaceholder(image.url)),
  vendor: displayText(product.vendor),
  summary: displayText(product.summary),
  descriptionHtml: displayText(product.descriptionHtml),
  variants: product.variants.map((variant) => ({ ...variant, title: displayText(variant.title), image: isSeedburoPlaceholder(variant.image) ? "" : variant.image })),
  tabs: product.tabs.map((tab) => ({ title: displayText(tab.title), html: displayText(tab.html) })),
}));
export const SEEDBURO_COLLECTIONS = collections as SeedburoCollection[];
export const SEEDBURO_NAVIGATION = navigation;
const byHandle = new Map(SEEDBURO_PRODUCTS.map((product) => [product.handle, product]));
const collectionByHandle = new Map(SEEDBURO_COLLECTIONS.map((collection) => [collection.handle, collection]));
const normalized = (value: string) => value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
export const seedburoProductHref = (product: Pick<SeedburoProduct, "handle">) => `/products/seedburo/item/${encodeURIComponent(product.handle)}`;
export const seedburoCollectionHref = (handle: string) => `/products/seedburo/${encodeURIComponent(handle)}`;
function routeHandle(value: string) {
  try { return decodeURIComponent(value); } catch { return value; }
}
export const getSeedburoProduct = (handle: string) => byHandle.get(routeHandle(handle));
export const getSeedburoCollection = (handle: string) => collectionByHandle.get(routeHandle(handle));
export function searchSeedburoProducts(query: string, source = SEEDBURO_PRODUCTS) {
  const tokens = normalized(query).split(" ").filter(Boolean);
  return source.filter((product) => {
    const haystack = normalized(`${product.title} ${product.vendor} ${product.variants.map((variant) => `${variant.sku} ${variant.title}`).join(" ")}`);
    return tokens.every((token) => haystack.includes(token));
  });
}
export function seedburoPrimarySku(product: SeedburoProduct) {
  return product.variants.find((variant) => variant.sku)?.sku || "";
}
export function exactSeedburoProducts(sku: string) {
  return SEEDBURO_PRODUCTS.filter((product) => product.variants.some((variant) => normalized(variant.sku) === normalized(sku)));
}
export function seedburoCollectionProducts(handle: string) {
  const collection = getSeedburoCollection(handle);
  return (collection?.productHandles || []).map((key) => byHandle.get(key)).filter((product): product is SeedburoProduct => Boolean(product));
}

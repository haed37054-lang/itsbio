import data from "@/data/bioplastics/catalog.json";
import { BIOPLASTICS_CATEGORIES, type BioplasticsCategory } from "./navigation";

type Pair = [string, string];
export type BioplasticsProduct = {
  sku: string;
  title: string;
  category: BioplasticsCategory;
  group: string;
  family: string;
  groupCode?: string;
  groupCodes?: string[];
  groups?: string[];
  configuration: string;
  pack: string;
  overview: string;
  specs: Record<string, string>;
  properties: Pair[];
  image: string | null;
  source: string;
  fitNote?: string;
  fitKey?: string;
};

export const BIOPLASTICS_PRODUCTS = data as unknown as BioplasticsProduct[];
function normalizeSearch(value: string) {
  return value.normalize("NFKC").replace(/[‐‑‒–—―−]/g, "-").toLowerCase().trim();
}

const bySku = new Map(BIOPLASTICS_PRODUCTS.map(product => [normalizeSearch(product.sku), product]));
const categoryLabels = new Map(BIOPLASTICS_CATEGORIES.map(({ key, label }) => [key, label]));
const searchIndex = BIOPLASTICS_PRODUCTS.map(product => ({
  product,
  text: normalizeSearch(["BIOplastics", categoryLabels.get(product.category), product.sku,
    product.title, product.group, ...(product.groups ?? []), product.family, product.pack].join(" ")),
}));

export function findBioplasticsProduct(sku: string) {
  return bySku.get(normalizeSearch(sku));
}

export function searchBioplasticsProducts(query: string, category?: BioplasticsCategory) {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  return searchIndex
    .filter(({ product, text }) => (!category || product.category === category) && terms.every(term => text.includes(term)))
    .map(({ product }) => product);
}

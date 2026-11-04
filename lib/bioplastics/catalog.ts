import data from "@/data/bioplastics/catalog.json";
import fitTables from "@/data/bioplastics/instruments.json";
import { BIOPLASTICS_CATEGORIES, type BioplasticsCategory } from "./navigation";

type Pair = [string, string];
export type BioplasticsProduct = {
  sku: string;
  title: string;
  category: BioplasticsCategory;
  group: string;
  family: string;
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

type InstrumentRow = [manufacturer: string, instrument: string, block: string, markers: string[]];

export const BIOPLASTICS_PRODUCTS = data as unknown as BioplasticsProduct[];
export const BIOPLASTICS_INSTRUMENTS = fitTables as unknown as Record<string, InstrumentRow[]>;

export function findBioplasticsProduct(sku: string) {
  return BIOPLASTICS_PRODUCTS.find((product) => product.sku.toLowerCase() === sku.toLowerCase().trim());
}

export function searchBioplasticsProducts(query: string, category?: BioplasticsCategory) {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return BIOPLASTICS_PRODUCTS.filter((product) => {
    if (category && product.category !== category) return false;
    const label = BIOPLASTICS_CATEGORIES.find(({ key }) => key === product.category)?.label;
    const searchable = ["BIOplastics", label, product.sku, product.title, product.group, product.family, product.pack].join(" ").toLowerCase();
    return terms.every((term) => searchable.includes(term));
  });
}

import catalog from "@/data/affinityimmuno/catalog.json";
import categories from "@/data/affinityimmuno/categories.json";
import referenceMedia from "@/data/affinityimmuno/reference-media.json";
import retained from "@/data/affinityimmuno/retained-workbook-products.json";

export type AffinityImage = { url: string; sourceUrl: string; alt: string; width: number; height: number; reference?: boolean };
export type AffinityProduct = {
  sku: string; slug: string; title: string; kind: "elisa" | "antibody";
  target: string; summary: string; unit: string; host: string; targetSpecies: string;
  clone: string; isotype: string; clonality: string; applications: string; categories: string[];
  specifications: [string, string][]; descriptionHtml: string; background: string;
  components: string[]; protocolSections: { title: string; body: string }[];
  images: AffinityImage[]; documents: { url: string; sourceUrl: string; label: string }[];
  relatedSkus: string[]; sourceUrl: string; sourceVerified: boolean;
  sourceRows: { sheet: string; row: number }[];
  catalogAliases?: string[];
};
export const AFFINITY_PRODUCTS: AffinityProduct[] = (catalog as unknown as AffinityProduct[]).map(product => ({
  ...product,
  images: [referenceMedia[product.kind], ...product.images],
}));
export const AFFINITY_RETAINED_PRODUCTS: AffinityProduct[] = (retained as unknown as AffinityProduct[]).map(product => ({...product,images:[referenceMedia[product.kind],...product.images]}));
export const AFFINITY_ALL_PRODUCTS = [...AFFINITY_PRODUCTS,...AFFINITY_RETAINED_PRODUCTS];
export const AFFINITY_CATEGORIES = categories;
export const affinityProductHref = (product: Pick<AffinityProduct, "slug">) => `/products/affinity/item/${encodeURIComponent(product.slug)}`;
export const affinityCategoryHref = (slug: string) => `/products/affinity/${slug}`;
export const getAffinityProduct = (slug: string) => AFFINITY_ALL_PRODUCTS.find(p => p.slug === slug);
const normalize = (value: string) => value.normalize("NFKC").replace(/[‐‑‒–—―−]/g, "-").toLowerCase().trim();
export function exactAffinityProducts(sku: string) {
  const key=normalize(sku);
  const primary=AFFINITY_ALL_PRODUCTS.filter(product=>normalize(product.sku)===key);
  return primary.length ? primary : AFFINITY_ALL_PRODUCTS.filter(product=>(product.catalogAliases || []).some(alias=>normalize(alias)===key));
}
export const exactAffinityProduct = (sku: string) => {const matches=exactAffinityProducts(sku);return matches.length===1?matches[0]:undefined;};
export function searchAffinityProducts(query: string, products: AffinityProduct[] = AFFINITY_PRODUCTS) {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  return products.filter(p => tokens.every(token => normalize([p.sku, ...(p.catalogAliases || []), p.title, p.target, p.host, p.targetSpecies, p.clone, p.applications, p.isotype, ...p.specifications.flat()].join(" ")).includes(token)));
}

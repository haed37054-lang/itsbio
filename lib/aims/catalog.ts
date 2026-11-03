import catalog from "@/data/aims/catalog.json";
import categories from "@/data/aims/categories.json";

export type AimsImage = { url: string; sourceUrl: string; width: number; height: number; alt: string };
export type AimsModel = { sku: string; title: string; description: string };
export type AimsProduct = {
  slug: string; sku: string; title: string; summary: string; descriptionHtml: string;
  specifications: Array<[string, string]>; models: AimsModel[]; images: AimsImage[];
  documents: {url:string; sourceUrl:string; label:string}[];
  categories: string[]; relatedSlugs: string[]; sourceUrl: string;
};
export const AIMS_PRODUCTS = catalog as unknown as AimsProduct[];
export const AIMS_CATEGORIES = categories;
export const aimsProductHref = (slug: string) => `/products/aims/item/${encodeURIComponent(slug)}`;
export const getAimsProduct = (slug: string) => AIMS_PRODUCTS.find(product => product.slug === slug);
const normalize = (value: string) => value.normalize("NFKC").replace(/[‐‑‒–—―−]/g,"-").toUpperCase().trim();
export function exactAimsModel(sku: string) {
  const key = normalize(sku);
  if(!key) return undefined;
  const direct = AIMS_PRODUCTS.filter(product => normalize(product.sku) === key);
  if(direct.length===1){const product=direct[0];return{product,model:product.models[0],href:aimsProductHref(product.slug)};}
  const matches=AIMS_PRODUCTS.flatMap(product=>product.models.filter(model=>normalize(model.sku)===key).map(model=>({product,model,href:`${aimsProductHref(product.slug)}#model-${encodeURIComponent(model.sku)}`})));
  return matches.length===1?matches[0]:undefined;
}
export function searchAimsProducts(query: string) {
  const tokens=normalize(query).split(/\s+/).filter(Boolean);
  return AIMS_PRODUCTS.filter(product=>tokens.every(token=>normalize([product.sku,product.title,product.summary,product.descriptionHtml.replace(/<[^>]*>/g,' '),...product.specifications.flat(),...product.models.map(m=>m.sku)].join(' ')).includes(token)));
}

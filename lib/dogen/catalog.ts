import catalog from "@/data/dogen/catalog.json";
import categories from "@/data/dogen/categories.json";

export const DOGEN_PRODUCTS = catalog;
export const DOGEN_CATEGORIES = categories;
export type DogenProduct = (typeof catalog)[number];
export const dogenProductHref = (slug: string) => `/products/dogen/item/${slug}`;
export const dogenCategoryHref = (slug: string) => `/products/dogen/${slug}`;

const normalize = (value: string) =>
  value.normalize("NFKC").replace(/[‐‑‒–—―−]/g, "-").trim().toLowerCase();

export function exactDogenModel(query: string) {
  const code = normalize(query);
  for (const product of DOGEN_PRODUCTS) {
    const model = product.models.find(({ sku }) => normalize(sku) === code);
    if (model) {
      return { product, model, href: `${dogenProductHref(product.slug)}#model-${encodeURIComponent(model.sku)}` };
    }
  }
  return undefined;
}

export function searchDogenProducts(query: string) {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  return DOGEN_PRODUCTS.filter((product) => {
    const text = normalize(["DoGen DoGenBio 두젠바이오", product.title, product.summary, product.group, ...product.models.map(({ sku }) => sku)].join(" "));
    return tokens.every((token) => text.includes(token));
  });
}

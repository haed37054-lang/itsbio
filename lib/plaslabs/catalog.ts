import categories from "@/data/plaslabs/categories.json";
import products from "@/data/plaslabs/catalog.json";

export const PLASLABS_ROOT = "/products/plaslabs";
export const PLASLABS_CATEGORIES = categories;
export const PLASLABS_PRODUCTS = products;
export type PlasLabsProduct = (typeof products)[number];

export function plasLabsCategoryHref(slug: string) {
  return `${PLASLABS_ROOT}/${slug}`;
}

export function plasLabsProductHref(slug: string) {
  return `${PLASLABS_ROOT}/item/${slug}`;
}

export function searchPlasLabsProducts(query: string, category?: string) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return products.filter((product) => {
    if (category && product.category !== category) return false;
    const categoryTitle = categories.find(({ slug }) => slug === product.category)?.title;
    const searchable = ["PLAS-LABS", categoryTitle, product.title, product.summary, ...product.models].join(" ").toLowerCase();
    return words.every((word) => searchable.includes(word));
  });
}

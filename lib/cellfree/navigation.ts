export const CELLFREE_ROOT = "/products/cellfree";

export const CELLFREE_CATEGORIES = [
  { key: "expression-kits", label: "Protein Expression Kits" },
  { key: "reagents", label: "Reagents" },
  { key: "vectors", label: "pEU Vectors" },
  { key: "primers", label: "Split PCR Primers" },
  { key: "teaching", label: "Teaching Materials" },
  { key: "equipment", label: "Automated Protein Synthesizers" },
  { key: "services", label: "Services" },
] as const;

export type CellFreeCategory = (typeof CELLFREE_CATEGORIES)[number]["key"];

export function cellFreeCategoryHref(key: CellFreeCategory) {
  return `${CELLFREE_ROOT}?category=${key}`;
}

export function cellFreeProductHref(slug: string, sku?: string) {
  return `${CELLFREE_ROOT}/item/${slug}${sku ? `?sku=${encodeURIComponent(sku)}` : ""}`;
}

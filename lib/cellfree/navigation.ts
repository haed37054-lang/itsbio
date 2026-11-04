export const CELLFREE_ROOT = "/products/cellfree";
export const DIALYSIS_KIT_SLUG = "wepro7240-dialysis-core-kit";

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
  const path = `${CELLFREE_ROOT}/item/${slug}`;
  if (!sku) return path;
  return slug === DIALYSIS_KIT_SLUG ? `${path}#${sku.toLowerCase()}` : `${path}?sku=${encodeURIComponent(sku)}`;
}

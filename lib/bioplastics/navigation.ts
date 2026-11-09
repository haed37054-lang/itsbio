import groups from "@/data/bioplastics/groups.json";

export const BIOPLASTICS_ROOT = "/products/bioplastics";
export const BIOPLASTICS_GROUPS = groups;

export const BIOPLASTICS_CATEGORIES = [
  { key: "qpcr", label: "(q)PCR Products" },
  { key: "filter-tips", label: "Filtertips" },
  { key: "pipette-tips", label: "Pipette tips" },
  { key: "tubes", label: "Tubes" },
  { key: "racks-boxes", label: "Racks & Boxes" },
  { key: "debox", label: "DeBox" },
] as const;

export type BioplasticsCategory = (typeof BIOPLASTICS_CATEGORIES)[number]["key"];

export function bioplasticsCategoryHref(key: BioplasticsCategory) {
  return `${BIOPLASTICS_ROOT}?category=${key}`;
}

export function bioplasticsProductHref(sku: string) {
  return `${BIOPLASTICS_ROOT}/item/${encodeURIComponent(sku.toLowerCase())}`;
}

export function bioplasticsGroupHref(category: string, group: string) {
  return `${BIOPLASTICS_ROOT}?${new URLSearchParams({ category, group })}`;
}

import type { BioplasticsProduct } from "./catalog";

const download = (file: string) => `https://www.bioplastics.com/downloads/${file}`;

export const BIOPLASTICS_DOCUMENTS = [
  { label: "Firm Deck catalog", url: download("FirmDeckProducts.pdf") },
  { label: "(q)PCR sealing options", url: download("qPCR_Closure_options.pdf") },
  { label: "Work rack systems", url: download("Work_rack_systems.pdf") },
  { label: "DeBox family", url: download("DeBoxFamily.pdf") },
  { label: "Filtertips", url: download("filtertips.pdf") },
  { label: "Alu-Seal instructions", url: download("Alu-seal_manual_2020.pdf") },
  { label: "384-well plate family", url: download("Innovative_384-well_plate.pdf") },
];

export function bioplasticsProductDocuments(product: BioplasticsProduct) {
  const labels: string[] = [];
  if (product.sku === "157200") labels.push("Alu-Seal instructions", "(q)PCR sealing options");
  if (product.group === "384 Well Plates") labels.push("384-well plate family");
  if (product.category === "filter-tips") labels.push("Filtertips");
  if (product.category === "racks-boxes") labels.push("Work rack systems");
  if (product.category === "debox") labels.push("DeBox family");
  return BIOPLASTICS_DOCUMENTS.filter(({ label }) => labels.includes(label));
}

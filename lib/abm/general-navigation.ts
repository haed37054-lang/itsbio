import type { TreeNode } from "./sidebar-tree";

// Verified against the official General Materials navigation. Stable paths
// preserve existing links even when the supplier changes a marketing title.
const GENERAL_CATEGORIES = [
  ["pcr-enzymes", "PCR Enzymes", "PCR-Enzymes.html"],
  ["enzymes-and-kits", "Enzymes & Kits", "Molecular-Biology-Enzymes-and-Kits.html"],
  ["antibodies", "Antibodies", "antibodies.html"],
  ["biorepository", "Biorepository", "biorepository.html"],
  ["transfection-reagents", "Transfection Reagents", "Transfection-Reagent-Protocol-Efficiency.html"],
  ["dna-rna-purification", "DNA/RNA Purification", "DNA-RNA-Purification-Kits.html"],
  ["gel-documentation", "Gel Documentation", "Gel-Documentation.html"],
  ["rna-tracking", "RNA Tracking (RNA Mango)", "RNA-Mango.html"],
  ["buffers-and-general-chemicals", "Buffers & Chemicals", "Buffers-and-Chemicals.html"],
  ["equipment", "Equipment", "lab-equipment.html"],
  ["dna-and-protein-ladders", "DNA & Protein Ladders", "DNA-and-Protein-Ladders.html"],
] as const;

export const ABM_GENERAL_MENU_ITEMS = GENERAL_CATEGORIES.map(([slug, label]) => ({
  label, href: `/products/abm/general-materials/${slug}`,
}));

const CHILD_LABELS: Record<string, string> = {
  qpcr: "qPCR",
  "pcr-polymerase": "PCR Polymerase",
  "rt-and-rt-pcr": "RT & RT-PCR",
  "gel-imager": "Gel Imager",
  "dna-stains": "DNA Stains",
  "ihc-antibodies": "IHC Antibodies",
};
const CHILD_ORDER: Record<string, string[]> = {
  "pcr-enzymes": ["qpcr", "pcr-polymerase", "rt-and-rt-pcr"],
  antibodies: ["tag-antibodies", "ihc-antibodies", "loading-control-antibodies", "monoclonal-antibodies", "polyclonal-antibodies", "primary-antibodies", "secondary-antibodies"],
  "gel-documentation": ["gel-imager", "dna-stains"],
};

export function normalizeAbmGeneralSidebar(nodes: TreeNode[]): TreeNode[] {
  return GENERAL_CATEGORIES.map(([slug, title, source], order) => {
    const existing = nodes.find((node) => node.path[1] === slug);
    const path = ["general-materials", slug];
    const wanted = CHILD_ORDER[slug] || [];
    const children = (existing?.children || []).map((child) => ({
      ...child,
      title: CHILD_LABELS[child.path.at(-1) || ""] || child.title,
      aliases: [...(child.aliases || []), child.title],
    })).sort((a, b) => {
      const rank = (node: TreeNode) => {
        const index = wanted.indexOf(node.path.at(-1) || "");
        return index < 0 ? wanted.length : index;
      };
      return rank(a) - rank(b);
    });
    return {
      ...existing,
      _id: existing?._id || `verified-${path.join("-")}`,
      key: path.join("/"), path, title, order, children,
      aliases: [...(existing?.aliases || []), existing?.title || title],
      sourceUrl: `https://www.abmgood.com/${source}`,
    };
  });
}

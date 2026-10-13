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
  ["circrna", "circRNA", "abm-circRNA.html"],
] as const;

export const ABM_GENERAL_MENU_ITEMS = GENERAL_CATEGORIES.map(([slug, label]) => ({
  label, href: `/products/abm/general-materials/${slug}`,
}));

const ENZYMES = "/products/abm/general-materials/enzymes-and-kits";
const GEL = "/products/abm/general-materials/gel-documentation";
type ChildSpec = { slug: string; title: string; href?: string };
const CHILDREN: Record<string, ChildSpec[]> = {
  "pcr-enzymes": [
    { slug: "qpcr", title: "qPCR" },
    { slug: "pcr-polymerase", title: "PCR Polymerase" },
    { slug: "rt-and-rt-pcr", title: "RT & RT-PCR" },
  ],
  "enzymes-and-kits": [
    { slug: "cloning-applications", title: "Cloning Applications", href: `${ENZYMES}#Cloning-Applications` },
    { slug: "dna-and-rna-applications", title: "DNA & RNA Applications", href: `${ENZYMES}#DNA-RNA-Applications` },
    { slug: "proteases", title: "Proteases", href: `${ENZYMES}#in-vitro-Kits-Proteases` },
    { slug: "rnase-r", title: "RNase R", href: `/products/abm/staged/product/E049?from=${encodeURIComponent(ENZYMES)}` },
    { slug: "cas-proteins-and-crispr-screening", title: "Cas Proteins & CRISPR Screening", href: "/products/abm/genetic-materials/crispr/cas-proteins-and-crispr-screening" },
  ],
  antibodies: [
    { slug: "tag-antibodies", title: "Tag Antibodies" },
    { slug: "ihc-antibodies", title: "IHC Antibodies" },
    { slug: "loading-control-antibodies", title: "Loading Control Antibodies" },
    { slug: "monoclonal-antibodies", title: "Monoclonal Antibodies" },
    { slug: "polyclonal-antibodies", title: "Polyclonal Antibodies" },
    { slug: "primary-antibodies", title: "Primary Antibodies" },
    { slug: "secondary-antibodies", title: "Secondary Antibodies" },
  ],
  biorepository: [{ slug: "ffpe-tissue-sections", title: "FFPE Tissue Sections" }],
  "gel-documentation": [
    { slug: "gel-imager", title: "Gel Imager", href: `/products/abm/staged/product/E1001?from=${encodeURIComponent(GEL)}` },
    { slug: "dna-stains", title: "DNA Stains", href: `${GEL}#safeview-dna-stains` },
  ],
};

export function normalizeAbmGeneralSidebar(nodes: TreeNode[]): TreeNode[] {
  return GENERAL_CATEGORIES.map(([slug, title, source], order) => {
    const existing = nodes.find((node) => node.path[1] === slug);
    const path = ["general-materials", slug];
    const remaining = [...(existing?.children || [])];
    const children = (CHILDREN[slug] || []).map((spec, childOrder) => {
      const index = remaining.findIndex((node) => node.path.at(-1) === spec.slug);
      const child = index >= 0 ? remaining.splice(index, 1)[0] : undefined;
      const childPath = [...path, spec.slug];
      return {
        ...child,
        _id: child?._id || `verified-${childPath.join("-")}`,
        key: childPath.join("/"), path: childPath, title: spec.title, order: childOrder,
        href: spec.href || child?.href,
        aliases: [...(child?.aliases || []), child?.title || spec.title],
        children: child?.children || [],
      };
    });
    return {
      ...existing,
      _id: existing?._id || `verified-${path.join("-")}`,
      key: path.join("/"), path, title, order, children: [...children, ...remaining],
      aliases: [...(existing?.aliases || []), existing?.title || title],
      sourceUrl: `https://www.abmgood.com/${source}`,
    };
  });
}

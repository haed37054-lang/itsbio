import abmCellularTaxonomy from "@/data/abm-cellular-taxonomy.json";
const TARGETED_APOPTOSIS_PATH = ["genetic-materials", "specialized-vectors", "targeted-cell-apoptosis-adenoviruses"];
function humanizeSegment(seg: string) {
  if (seg === "RNAi-shRNA-sirna-shrna-rnai-lentivirus") return "siRNA";
  return (seg || "").replaceAll("-", " ").replaceAll("_", " ").trim();
}

export type CatLite = { _id: string; title: string; path: string[]; order?: number; sourceUrl?: string };

/** -------------------- Tree Builder -------------------- */

export type TreeNode = {
  key: string;
  _id: string;
  title: string;
  aliases?: string[];
  path: string[];
  order?: number;
  sourceUrl?: string;
  isVirtual?: boolean;
  children: TreeNode[];
};

function makeNodeKey(path: string[]) {
  return path.join("/");
}

export function buildTreeFromDescendants(rootPath: string[], descendants: CatLite[]) {
  const rootKey = makeNodeKey(rootPath);
  const nodes = new Map<string, TreeNode>();

  function ensureNode(path: string[], meta?: Partial<CatLite>) {
    const key = makeNodeKey(path);
    const seg = path[path.length - 1] || "";

    if (!nodes.has(key)) {
      nodes.set(key, {
        key,
        _id: meta?._id || `virtual-${key}`,
        title: meta?.title || humanizeSegment(seg),
        path,
        order: meta?.order,
        sourceUrl: meta?.sourceUrl,
        isVirtual: !meta?._id,
        children: [],
      });
    } else if (meta?._id) {
      const cur = nodes.get(key)!;
      nodes.set(key, {
        ...cur,
        _id: meta._id,
        title: meta.title || cur.title,
        order: typeof meta.order === "number" ? meta.order : cur.order,
        sourceUrl: meta?.sourceUrl || cur.sourceUrl,
        isVirtual: false,
      });
    }

    return nodes.get(key)!;
  }

  ensureNode(rootPath, {
    _id: `virtual-${rootKey}`,
    title: humanizeSegment(rootPath[rootPath.length - 1] || ""),
  });

  for (const d of descendants) {
    if (!Array.isArray(d.path) || d.path.length <= rootPath.length) continue;
    const prefixOk = rootPath.every((seg, i) => d.path[i] === seg);
    if (!prefixOk) continue;

    for (let i = rootPath.length; i < d.path.length; i++) {
      const p = d.path.slice(0, i + 1);
      if (i === d.path.length - 1) ensureNode(p, d);
      else ensureNode(p);
    }
  }

  for (const [key, node] of nodes.entries()) {
    if (key === rootKey) continue;
    const parentPath = node.path.slice(0, node.path.length - 1);
    const parentKey = makeNodeKey(parentPath);
    const parent = nodes.get(parentKey);
    if (parent) parent.children.push(node);
  }

  function sortRec(n: TreeNode) {
    n.children.sort((a, b) => {
      const ao = typeof a.order === "number" ? a.order : 999999;
      const bo = typeof b.order === "number" ? b.order : 999999;
      if (ao !== bo) return ao - bo;
      return String(a.title).localeCompare(String(b.title));
    });
    n.children.forEach(sortRec);
  }

  const root = nodes.get(rootKey)!;
  sortRec(root);

  return root.children;
}

export function buildTreeFromAllCategories(roots: CatLite[], descendants: CatLite[]) {
  const nodes = new Map<string, TreeNode>();

  function ensureNode(path: string[], meta?: Partial<CatLite>) {
    const key = makeNodeKey(path);
    const seg = path[path.length - 1] || "";

    if (!nodes.has(key)) {
      nodes.set(key, {
        key,
        _id: meta?._id || `virtual-${key}`,
        title: meta?.title || humanizeSegment(seg),
        path,
        order: meta?.order,
        sourceUrl: meta?.sourceUrl,
        isVirtual: !meta?._id,
        children: [],
      });
    } else if (meta?._id) {
      const cur = nodes.get(key)!;
      nodes.set(key, {
        ...cur,
        _id: meta._id,
        title: meta.title || cur.title,
        order: typeof meta.order === "number" ? meta.order : cur.order,
        sourceUrl: meta?.sourceUrl || cur.sourceUrl,
        isVirtual: false,
      });
    }

    return nodes.get(key)!;
  }

  for (const r of roots) {
    if (!Array.isArray(r.path) || r.path.length !== 1) continue;
    ensureNode(r.path, r);
  }

  for (const d of descendants) {
    if (!Array.isArray(d.path) || d.path.length < 2) continue;

    for (let i = 0; i < d.path.length; i++) {
      const p = d.path.slice(0, i + 1);
      if (i === d.path.length - 1) ensureNode(p, d);
      else ensureNode(p);
    }
  }

  for (const node of nodes.values()) {
    if (node.path.length === 1) continue;
    const parentPath = node.path.slice(0, node.path.length - 1);
    const parentKey = makeNodeKey(parentPath);
    const parent = nodes.get(parentKey);
    if (parent) parent.children.push(node);
  }

  function sortRec(n: TreeNode) {
    n.children.sort((a, b) => {
      const ao = typeof a.order === "number" ? a.order : 999999;
      const bo = typeof b.order === "number" ? b.order : 999999;
      if (ao !== bo) return ao - bo;
      return String(a.title).localeCompare(String(b.title));
    });
    n.children.forEach(sortRec);
  }

  const rootNodes = [...nodes.values()].filter((n) => n.path.length === 1);
  rootNodes.sort((a, b) => {
    const ao = typeof a.order === "number" ? a.order : 999999;
    const bo = typeof b.order === "number" ? b.order : 999999;
    if (ao !== bo) return ao - bo;
    return String(a.title).localeCompare(String(b.title));
  });
  rootNodes.forEach(sortRec);

  return rootNodes;
}

type AbmCellularTaxonomyNode = {
  slug: string;
  title: string;
  sourceUrl: string;
  children?: AbmCellularTaxonomyNode[];
};

export function normalizeAbmCellularSidebar(nodes: TreeNode[]) {
  const existingByPath = new Map<string, TreeNode>();
  const visit = (items: TreeNode[]) => items.forEach((node) => {
    existingByPath.set(node.path.join("/"), node);
    visit(node.children || []);
  });
  visit(nodes);

  const build = (
    items: AbmCellularTaxonomyNode[],
    parentPath: string[],
  ): TreeNode[] => items.map((item, order) => {
    const path = [...parentPath, item.slug];
    const key = path.join("/");
    const existing = existingByPath.get(key);
    return {
      key,
      _id: existing?._id || `virtual-${key}`,
      title: item.title,
      path,
      order,
      sourceUrl: item.sourceUrl,
      isVirtual: !existing?._id,
      children: build(item.children || [], path),
    };
  });

  return build(abmCellularTaxonomy as AbmCellularTaxonomyNode[], ["cellular-materials"]);
}


type AbmGeneticNavSpec = {
  title: string;
  aliases?: string[];
  children?: AbmGeneticNavSpec[];
};

const ABM_GENETIC_NAV_SPECS: AbmGeneticNavSpec[] = [
  {
    title: "Expression-Ready Libraries",
    aliases: ["Expression Ready Libraries"],
    children: [
      { title: "Lentiviral Vectors & Virus", aliases: ["Lentiviral Vectors and Virus", "Lentiviral Vectors and Viruses"] },
      { title: "AAV Vectors & Virus", aliases: ["AAV Vectors and Virus", "AAV Vectors and Viruses"] },
      { title: "Adenovirus" },
      {
        title: "siRNA",
        children: [
          { title: "siRNA Lentivirus", aliases: ["Lentivirus siRNA Library"] },
          { title: "siRNA AAV", aliases: ["AAV siRNA Library"] },
          { title: "siRNA dsRNA Oligo", aliases: ["siRNA Oligo", "dsRNA Oligo"] },
        ],
      },
      { title: "miRNA", aliases: ["microRNA"] },
      { title: "ORF Vectors", aliases: ["ORF Vector"] },
      { title: "circRNA", aliases: ["Circular RNA"] },
      { title: "Control Vectors & Viruses", aliases: ["Control Vectors and Viruses", "Control Vectors"] },
    ],
  },
  {
    title: "CRISPR",
    aliases: ["CRISPR Products for Genome Editing"],
    children: [
      {
        title: "CRISPR KO Vectors & Virus",
        aliases: [
          "CRISPR KO Vectors and Virus",
          "CRISPR KO Vectors and Viruses",
          "CRISPR Knockout sgRNA Vectors & Viruses",
          "CRISPR Knockout sgRNA Vectors and Viruses",
          "CRISPR sgRNA Library",
          "CRISPR Knockout Library",
        ],
      },
      {
        title: "CRISPR Activation Vectors",
        aliases: ["CRISPR Activation", "CRISPR Activation/Repression", "CRISPRa Vectors"],
      },
      {
        title: "Cas9 Vectors & Virus",
        aliases: [
          "Cas9 Vectors and Virus",
          "Cas9 Vectors and Viruses",
          "Cas9 Expression Vectors and Virus",
          "Cas9 Expression Vectors and Viruses",
        ],
      },
      {
        title: "Cas Proteins & CRISPR Screening",
        aliases: ["Cas Proteins and CRISPR Screening", "Cas9 Proteins", "Cas Proteins"],
      },
    ],
  },
  {
    title: "Expression Systems",
    children: [
      { title: "Lentiviral Vectors & Virus", aliases: ["Lentiviral Vectors", "Lentivirus Expression System"] },
      { title: "AAV Vectors", aliases: ["AAV Expression System"] },
      { title: "Adenoviral Vectors", aliases: ["Adenovirus Vectors", "Adenoviral Expression Vectors"] },
      { title: "Retroviral Vectors", aliases: ["Retrovirus Vectors"] },
    ],
  },
  {
    title: "Specialized Vectors",
    aliases: ["Specialized Vectors & Viruses", "Specialized Vectors and Viruses"],
    children: [
      { title: "Targeted Cell Apoptosis Adenoviruses", aliases: ["Targeted Cell Apoptosis Adenovirus"] },
      { title: "iPSC Reporters", aliases: ["iPSC Reporter"] },
    ],
  },
  {
    title: "Kits for Viral Vectors",
    aliases: ["Kits Related to Recombinant Virus", "Recombinant Virus Kits"],
    children: [
      { title: "Virus Packaging DNA Mixes", aliases: ["Virus Packaging Mixes"] },
      { title: "qPCR Virus Titer Kits", aliases: ["Virus Titer Kits", "qPCR Viral Titer Kits"] },
      { title: "Virus Transduction Enhancer", aliases: ["Virus Transduction Enhancers"] },
      { title: "Virus Purification Kits", aliases: ["Virus Purification Kit"] },
      { title: "Lentivirus Bundles", aliases: ["Lentiviral Bundles"] },
    ],
  },
];

export function normalizeAbmGeneticNavLabel(value: string) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[™®©]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function normalizeAbmGeneticSidebar(nodes: TreeNode[]) {
  const arrange = (items: TreeNode[], specs: AbmGeneticNavSpec[]): TreeNode[] => {
    const remaining = items.map((node) => ({
      ...node,
      children: (node.children || []).map((child) => ({ ...child })),
    }));
    const canonicalSiRna = remaining.find((node) => node.path.join("/") === "genetic-materials/expression-ready-libraries/sirna");
    const legacySiRnaIndex = remaining.findIndex((node) => node.path.join("/") === "genetic-materials/expression-ready-libraries/RNAi-shRNA-sirna-shrna-rnai-lentivirus");
    if (canonicalSiRna && legacySiRnaIndex >= 0) {
      const [legacySiRna] = remaining.splice(legacySiRnaIndex, 1);
      canonicalSiRna.children = [...(canonicalSiRna.children || []), ...(legacySiRna.children || [])];
    }
    const ordered: TreeNode[] = [];

    specs.forEach((spec, order) => {
      const accepted = [spec.title, ...(spec.aliases || [])].map(normalizeAbmGeneticNavLabel);
      const index = remaining.findIndex((node) => {
        const title = normalizeAbmGeneticNavLabel(node.title);
        const slug = normalizeAbmGeneticNavLabel(node.path.at(-1) || "");
        return accepted.includes(title) || accepted.includes(slug);
      });
      if (index < 0) return;

      const [node] = remaining.splice(index, 1);
      ordered.push({
        ...node,
        title: spec.title,
        aliases: [node.title, ...(spec.aliases || [])],
        order,
        children: spec.children?.length ? arrange(node.children || [], spec.children) : node.children || [],
      });
    });

    return [...ordered, ...remaining];
  };

  return arrange(nodes, ABM_GENETIC_NAV_SPECS);
}

export function includeVerifiedSpecializedVectorPages(nodes: TreeNode[]): TreeNode[] {
  return nodes.map((node) => {
    const children = includeVerifiedSpecializedVectorPages(node.children || []);
    if (normalizeAbmGeneticNavLabel(node.title) !== normalizeAbmGeneticNavLabel("Specialized Vectors")) {
      return { ...node, children };
    }

    const targetKey = TARGETED_APOPTOSIS_PATH.join("/");
    const target = children.find((child) => child.path.join("/") === targetKey) || {
      key: targetKey,
      _id: `verified-${targetKey}`,
      title: "Targeted Cell Apoptosis Adenoviruses",
      path: TARGETED_APOPTOSIS_PATH,
      order: 0,
      sourceUrl: "https://www.abmgood.com/Targeted-Cell-Apoptosis-Adenoviruses.html",
      isVirtual: false,
      children: [],
    };
    const others = children.filter((child) => child.path.join("/") !== targetKey);
    return { ...node, children: [target, ...others] };
  });
}

export function findTreeNodeByPath(nodes: TreeNode[], path: string[]): TreeNode | undefined {
  const wanted = path.join("/");
  for (const node of nodes) {
    if (node.path.join("/") === wanted) return node;
    const nested = findTreeNodeByPath(node.children || [], path);
    if (nested) return nested;
  }
  return undefined;
}


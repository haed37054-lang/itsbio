import { ABM_PRODUCT_GROUPS } from "./catalog-taxonomy";
import type { TreeNode } from "./sidebar-tree";

function findTreeNodeByPath(nodes: TreeNode[], path: string[]): TreeNode | undefined {
  for (const node of nodes) {
    if (node.path.join("/") === path.join("/")) return node;
    const child = findTreeNodeByPath(node.children, path);
    if (child) return child;
  }
}

export function abmProductCategoryPath(value?: string): string[] {
  if (!value?.startsWith("/products/abm/")) return [];
  try {
    const path = new URL(value, "https://www.itsbio.co.kr").pathname
      .split("/").slice(3).filter(Boolean).map(decodeURIComponent);
    return ABM_PRODUCT_GROUPS.some((group) => group.slug === path[0]) ? path : [];
  } catch {
    return [];
  }
}

function normalized(label: string) {
  return label.normalize("NFKC").replace(/[™®©]/g, "")
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/gi, " ").trim().toLowerCase();
}

// A product can appear in several lists. An explicit, valid source category
// takes precedence; direct links fall back to the record's reviewed taxonomy.
export function resolveAbmProductPath({ trees, paths, hints, from, matchingCategoryPaths = [] }: {
  trees: TreeNode[];
  paths: string[][];
  hints: string[];
  from?: string;
  matchingCategoryPaths?: string[][];
}): string[] {
  const requested = abmProductCategoryPath(from);
  if (requested.length && findTreeNodeByPath(trees, requested)) return requested;

  const labels = new Set([...paths.flat(), ...hints].map(normalized).filter(Boolean));
  const all: TreeNode[] = [];
  const visit = (nodes: TreeNode[]) => nodes.forEach((node) => { all.push(node); visit(node.children); });
  visit(trees);
  const roots = ABM_PRODUCT_GROUPS.filter((group) => labels.has(normalized(group.title))).map((group) => group.slug);
  const matches = new Set(matchingCategoryPaths.map((path) => path.join("/")));
  const labelMatches = (node: TreeNode) => [node.title, node.path.at(-1) || "", ...(node.aliases || [])]
    .some((label) => labels.has(normalized(label)));
  const score = (node: TreeNode) => node.path.reduce((total, _, index) => {
    const ancestor = findTreeNodeByPath(trees, node.path.slice(0, index + 1));
    return total + (ancestor && labelMatches(ancestor) ? 1 : 0);
  }, 0);
  const candidates = all.filter((node) => (!roots.length || roots.includes(node.path[0]))
    && (matches.has(node.path.join("/")) || labelMatches(node)));
  candidates.sort((a, b) => score(b) - score(a)
    || Number(matches.has(b.path.join("/"))) - Number(matches.has(a.path.join("/")))
    || b.path.length - a.path.length);
  return candidates[0]?.path || (roots[0] ? [roots[0]] : []);
}

export function productCategoryBreadcrumbs(trees: TreeNode[], path: string[]) {
  return path.flatMap((_, index) => {
    const node = findTreeNodeByPath(trees, path.slice(0, index + 1));
    return node ? [{ label: node.title, href: `/products/abm/${node.path.join("/")}` }] : [];
  });
}

export function withAbmProductSource(href: string, category: string): string {
  if (!abmProductCategoryPath(category).length) return href;
  try {
    const url = new URL(href, "https://www.itsbio.co.kr");
    if (url.origin !== "https://www.itsbio.co.kr" || !/^\/products\/abm\/(?:staged\/product\/[^/]+|item\/.+|resolve)$/.test(url.pathname)) return href;
    url.searchParams.set("from", category);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return href;
  }
}

import { NextResponse } from "next/server";

import { PUBLIC_CATALOG_CACHE, sanityCdnClient } from "@/lib/sanity/sanity.client";
import { normalizeAbmGeneralSidebar } from "@/lib/abm/general-navigation";
import { buildTreeFromDescendants, includeVerifiedSpecializedVectorPages, normalizeAbmCellularSidebar, normalizeAbmGeneticSidebar, type TreeNode } from "@/lib/abm/sidebar-tree";

const ROOTS = ["general-materials", "cellular-materials", "genetic-materials"] as const;

const QUERY = `
*[
  _type == "category"
  && (!defined(isActive) || isActive == true)
  && (
    brandSlug == "abm"
    || themeKey == "abm"
    || brand->themeKey == "abm"
    || brand->slug.current == "abm"
  )
  && count(path) > 1
  && path[0] in $roots
]
| order(path[0] asc, order asc, title asc) {
  _id,
  title,
  path,
  order,
  sourceUrl
}
`;

type Row = {
  _id: string;
  title?: string;
  path?: string[];
  order?: number;
};

export async function GET() {
  const rows = await sanityCdnClient.fetch<Row[]>(QUERY, { roots: ROOTS }, PUBLIC_CATALOG_CACHE);

  const categories = (Array.isArray(rows) ? rows : []).flatMap((row) =>
    Array.isArray(row.path) && row.path.length > 1
      ? [{ ...row, title: String(row.title || "").trim(), path: row.path }] : []);
  const items: Array<{ id: string; title: string; path: string[]; href: string }> = [];
  const flatten = (nodes: TreeNode[]) => nodes.forEach((node) => {
    items.push({ id: node._id, title: node.title, path: node.path,
      href: node.href || `/products/abm/${node.path.map(encodeURIComponent).join("/")}` });
    flatten(node.children);
  });
  for (const root of ROOTS) {
    const nodes = buildTreeFromDescendants([root], categories);
    flatten(root === "general-materials" ? normalizeAbmGeneralSidebar(nodes)
      : root === "cellular-materials" ? normalizeAbmCellularSidebar(nodes)
      : includeVerifiedSpecializedVectorPages(normalizeAbmGeneticSidebar(nodes)));
  }

  return NextResponse.json(
    { items },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      },
    },
  );
}

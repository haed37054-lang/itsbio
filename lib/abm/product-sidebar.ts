import { PUBLIC_CATALOG_CACHE, sanityCdnClient } from "@/lib/sanity/sanity.client";
import { ABM_PRODUCT_GROUPS } from "./catalog-taxonomy";
import { buildTreeFromDescendants, includeVerifiedSpecializedVectorPages, normalizeAbmCellularSidebar, normalizeAbmGeneticSidebar, type CatLite, type TreeNode } from "./sidebar-tree";

export async function getAbmProductSidebar(sku: string) {
  const categories = await sanityCdnClient.fetch<Array<CatLite & { productHtml?: string[] }>>(`*[
    _type == "category" && (!defined(isActive) || isActive == true)
    && (brandSlug == "abm" || themeKey == "abm" || brand->themeKey == "abm" || brand->slug.current == "abm")
    && path[0] in ["general-materials", "cellular-materials", "genetic-materials"]
  ] | order(order asc, title asc) {
    _id, title, path, order, sourceUrl,
    "productHtml": contentBlocks[html match $sku].html
  }`, { sku }, PUBLIC_CATALOG_CACHE);
  const roots: CatLite[] = ABM_PRODUCT_GROUPS.map((group) =>
    categories.find((category) => category.path.length === 1 && category.path[0] === group.slug)
      || { _id: group.slug, title: group.title, path: [group.slug] });
  const trees: TreeNode[] = roots.map((root) => {
    let children = buildTreeFromDescendants(root.path, categories);
    if (root.path[0] === "cellular-materials") children = normalizeAbmCellularSidebar(children);
    if (root.path[0] === "genetic-materials") children = includeVerifiedSpecializedVectorPages(normalizeAbmGeneticSidebar(children));
    return { ...root, key: root.path.join("/"), children };
  });
  // Exact catalog boundaries avoid confusing LV003 with LV0030.
  const escapedSku = sku.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const exactSku = new RegExp(`(^|[^a-z0-9])${escapedSku}($|[^a-z0-9])`, "i");
  const matchingCategoryPaths = categories.filter((category) =>
    category.productHtml?.some((html) => exactSku.test(html))).map((category) => category.path);
  return { roots, trees, matchingCategoryPaths };
}

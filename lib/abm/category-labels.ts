const LENTIVIRAL_CATEGORY_PATHS = new Set([
  "/products/abm/genetic-materials/expression-ready-libraries/lentiviral-vectors-and-virus",
  "/products/abm/genetic-materials/expression-systems/lentiviral-vectors",
]);

export function abmCategoryLabel(pathname: string, fallback: string) {
  const path = pathname.replace(/\/$/, "");
  if (path === "/products/abm/genetic-materials/expression-ready-libraries/RNAi-shRNA-sirna-shrna-rnai-lentivirus") return "siRNA";
  return LENTIVIRAL_CATEGORY_PATHS.has(path)
    ? "Lentiviral Vectors & Virus"
    : fallback;
}

/** The active category menu is the display-name authority, rather than an
 * imported marketing headline. Product names and subsection titles are kept. */
export function normalizeAbmCategoryTitle(doc: Document, pathname: string) {
  if (!pathname.startsWith("/products/abm/") || /\/(?:item|staged|resource|resolve)(?:\/|$)/.test(pathname)) return;
  const active = Array.from(doc.querySelectorAll<HTMLAnchorElement>("aside a[href]")).find((anchor) => {
    try {
      return new URL(anchor.getAttribute("href") || "", doc.baseURI).pathname.replace(/\/$/, "") === pathname.replace(/\/$/, "");
    } catch {
      return false;
    }
  });
  if (!active) return;
  const menuText = active.cloneNode(true) as HTMLElement;
  menuText.querySelectorAll('[aria-hidden="true"], svg').forEach((icon) => icon.remove());
  const label = abmCategoryLabel(pathname, (menuText.textContent || "").replace(/\s+/g, " ").trim());
  if (!label) return;
  const primary = Array.from(doc.querySelectorAll<HTMLElement>("main h1, main .itsbio-html h2, main .qv-titer-lp h1"))
    .find((heading) => !heading.closest("aside, nav, table, svg, dialog"));
  if (primary && primary.textContent?.trim() !== label) primary.textContent = label;
  doc.querySelectorAll<HTMLElement>('nav[aria-label="Breadcrumb"] [aria-current="page"]').forEach((crumb) => {
    if (crumb.textContent?.trim() !== label) crumb.textContent = label;
    if (crumb.title !== label) crumb.title = label;
  });
}

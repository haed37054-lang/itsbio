import { load } from "cheerio";

type ProductRoute = { sourceUrl: string; href: string };

// Keep the source copy and downloadable assets, while product navigation stays
// inside ITS BIO. An unmigrated manufacturer page remains readable as plain text.
export function localizeManufacturerLinks(html: string, sourceUrl: string, routes: ProductRoute[], aliases: string[] = []) {
  if (!html) return html;
  const source = new URL(sourceUrl);
  const host = (value: string) => value.toLowerCase().replace(/^www\./, "");
  const hosts = new Set([host(source.hostname), ...aliases.map(host)]);
  const pathname = (value: string) => decodeURIComponent(new URL(value, source).pathname).replace(/\/$/, "").toLowerCase();
  const known = new Map(routes.map(route => [pathname(route.sourceUrl), route.href]));
  const $ = load(html, {}, false);
  $("a[href]").each((_, element) => {
    const link = $(element);
    const href = link.attr("href") || "";
    if (!href || href.startsWith("#") || /^(?:mailto:|tel:)/i.test(href)) return;
    if (/^\/(?:quote|contact|about|search|privacy|terms)(?:[/?#]|$)/i.test(href)) return;
    let url: URL;
    try { url = new URL(href, source); } catch { return; }
    if (!hosts.has(host(url.hostname))) return;
    const internal = known.get(pathname(url.href));
    if (internal) {
      link.attr("href", `${internal}${url.hash}`).removeAttr("target").removeAttr("rel");
    } else if (/\.(?:pdf|jpe?g|png|webp|gif|svg|mp4|webm|mov|zip|docx?|xlsx?|pptx?|txt|fasta|gbk?)(?:$|\?)/i.test(url.pathname) || /\/download\//i.test(url.pathname)) {
      link.attr("href", url.href);
    } else if (!/^\/products\/(?:abm|kent|cleaver|seedburo|affinity|aims|animalid|itschem|dogen|plaslabs|cellfree|bioplastics)(?:\/|$)/i.test(href)) {
      link.replaceWith(link.contents());
    }
  });
  return $.html();
}

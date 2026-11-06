import { load, type CheerioAPI } from "cheerio";
import type { AnyNode, Element } from "domhandler";
import type { PlasLabsProduct } from "@/lib/plaslabs/catalog";
import { PLASLABS_PRODUCTS, plasLabsProductHref } from "@/lib/plaslabs/catalog";
import { localizeManufacturerLinks } from "@/lib/manufacturer-links";

function leadingPhotos($: CheerioAPI, cell: Element, heading?: Element) {
  return $(cell).find("img").toArray().filter((photo) => {
    for (let node: AnyNode | null = photo; node && node !== cell; node = node.parent) {
      if (heading && node.parent === heading) continue;
      for (let previous = node.prev; previous; previous = previous.prev) {
        if (previous !== heading && $(previous).text().trim()) return false;
      }
    }
    return true;
  });
}

function specificationFields($: CheerioAPI, model: Element) {
  const column = $(model);
  const heading = column.children("h2, h3, h4").first();
  if (!heading.length || column.contents().toArray().some((node) => node.type === "text" && node.data.trim())) return;

  function rows(node: Element): Element[] {
    const children = $(node).children().toArray();
    const hasText = $(node).contents().toArray().some((child) => child.type === "text" && child.data.trim());
    if (children.length && !hasText && children.every((child) => child.name === "div" || child.name === "p")) {
      return children.flatMap(rows);
    }
    return [node];
  }

  const content = heading.nextAll().toArray().flatMap(rows);
  if (content.some((node) => $(node).find("img, table, ul, ol").length)) return;

  const fields: { label: string; nodes: Element[] }[] = [];
  let field = { label: "", nodes: [] as Element[] };
  for (const node of content) {
    const label = $(node).find(".plas-label").first().text().trim();
    if (label && !label.startsWith("(") && $(node).text().trim().startsWith(label)) {
      if (field.nodes.length) fields.push(field);
      field = { label: label.replace(/[:\s]+$/g, "").toLowerCase(), nodes: [] };
    }
    field.nodes.push(node);
  }
  if (field.nodes.length) fields.push(field);
  if (fields.filter(({ label }) => label).length < 2) return;
  return { heading, fields };
}

function alignDetailGrids($: CheerioAPI) {
  for (const grid of $(".plas-grid").toArray()) {
    const columns = $(grid).children('div[class*="plas-span-"]').toArray();
    const cells = columns.filter((cell) => $(cell).text().trim() || $(cell).find("img, table").length);
    const headings = cells.map((cell) => $(cell).children().filter((_, element) =>
      Boolean($(element).text().trim() || $(element).find("img, table").length),
    ).first());
    const leading = cells.map((cell) => leadingPhotos($, cell));
    const titled = cells.length > 1 && leading.every((group) => !group.length) &&
      headings.every((heading) => heading.is("h2, h3, h4") && heading.text().trim());
    const photos = titled ? cells.map((cell, index) => leadingPhotos($, cell, headings[index][0])) : leading;
    const comparison = $(grid).closest(".plas-specifications").length > 0;
    const hasPhotoRow = cells.length > 1 && (photos.every((group) => group.length > 0) ||
      (comparison && photos.some((group) => group.length > 0) &&
        cells.every((cell) => $(cell).children("h2, h3, h4").length > 0)));
    if (!hasPhotoRow) continue;

    $(grid).addClass("plas-photo-grid");
    if (titled) {
      $(grid).addClass("plas-titled-photo-grid");
      $(columns.filter((column) => !cells.includes(column))).remove();
    }
    for (const [index, cell] of cells.entries()) {
      const column = $(cell);
      const media = $("<figure>").addClass("plas-grid-photo");
      for (const image of photos[index]) {
        const link = $(image).parent("a");
        media.append(link.length && !link.text().trim() ? link : $(image));
      }
      column.children("p, div, h2, h3, h4").filter((_, block) =>
        !$(block).text().trim() && !$(block).find("img, table, ul, ol").length,
      ).remove();
      column.children("p, div, h2, h3, h4").each((_, block) => {
        for (const node of $(block).contents().toArray()) {
          if (node.type === "text" && !node.data.trim()) continue;
          if (node.type !== "tag" || node.name !== "br") break;
          $(node).remove();
        }
      });
      if (titled) {
        const heading = headings[index];
        column.addClass("plas-titled-photo-card");
        heading.after(media);
        const nodes = column.contents().toArray();
        const body = $("<div>").addClass("plas-titled-photo-body").append(nodes.slice(nodes.indexOf(media[0]) + 1));
        media.after(body);
      } else {
        column.prepend(media);
      }
    }

    if (!comparison || titled) continue;
    const layouts = cells.map((cell) => specificationFields($, cell));
    const first = layouts[0];
    if (!first || layouts.some((layout) =>
      !layout || layout.fields.map(({ label }) => label).join("|") !== first.fields.map(({ label }) => label).join("|"),
    )) continue;

    $(grid).addClass("plas-model-grid");
    for (const [index, cell] of cells.entries()) {
      const layout = layouts[index];
      if (!layout) continue;
      const column = $(cell).addClass("plas-model").attr("style", `--plas-model-rows: ${layout.fields.length + 2}`);
      layout.heading.addClass("plas-model-name");
      layout.heading.nextAll().remove();
      for (const { nodes } of layout.fields) column.append($("<div>").addClass("plas-model-field").append(nodes));
    }
  }
}

export function getPlasLabsDetailLayout(product: PlasLabsProduct) {
  const html = localizeManufacturerLinks(product.html, product.sourceUrl, PLASLABS_PRODUCTS.map(entry => ({ sourceUrl: entry.sourceUrl, href: plasLabsProductHref(entry.slug) })));
  const $ = load(html, {}, false);
  const overview = $(".plas-overview").first();
  const overviewPhotos = new Set(overview.find("img").map((_, image) => $(image).attr("src")).get());
  const images = product.images.filter((url) => overviewPhotos.has(url)).map((url) => ({ url }));

  const galleryUrls = new Set(images.map(({ url }) => url));
  for (const image of overview.find("img").toArray()) {
    if (!galleryUrls.has($(image).attr("src") || "")) continue;
    const imageLink = $(image).parent("a.plas-image-link");
    if (imageLink.length) imageLink.remove();
    else $(image).remove();
  }

  const lead = overview.children("p").first();
  const leadHtml = images.length && lead.text().trim().length > 55 && !lead.find("img, a").length ? lead.html() : null;
  if (leadHtml) lead.remove();
  overview.children("p").filter((_, element) => !$(element).text().trim() && !$(element).find("img").length).remove();

  const quote = $(".plas-quote").first();
  const quoteHref = images.length ? quote.find('a[href^="/quote?"]').first().attr("href") : undefined;
  if (quoteHref) quote.remove();

  if (product.slug === "830-series") {
    $(".plas-features li").filter((_, element) => $(element).text().includes("#830-FILTER")).each((_, element) => {
      const feature = $(element);
      feature.html(feature.html()?.replace("#830-FILTER", '<a href="#830-FILTER">#830-FILTER</a>') || "");
    });
    $(".plas-features p").filter((_, element) => $(element).text().trim() === "830-Filter and pop-valve")
      .attr("id", "830-FILTER")
      .after('<ul class="plas-replacement-parts"><li><a href="/products/plaslabs/item/filtration">Reorder HEPA canister</a></li><li><a href="/products/plaslabs/item/pressure-valves">Reorder Pressure Relief valve</a></li></ul>');
  }

  alignDetailGrids($);

  if (!overview.text().trim() && !overview.find("img").length) overview.remove();

  return { images, leadHtml, quoteHref, detailsHtml: $.html() };
}

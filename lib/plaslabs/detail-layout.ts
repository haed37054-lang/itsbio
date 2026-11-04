import { load } from "cheerio";
import type { PlasLabsProduct } from "@/lib/plaslabs/catalog";

export function getPlasLabsDetailLayout(product: PlasLabsProduct) {
  const $ = load(product.html, {}, false);
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

    const specs = $(".plas-specifications .plas-grid").first().addClass("plas-model-grid");
    for (const element of specs.children(".plas-span-3").toArray()) {
      const model = $(element).addClass("plas-model");
      const photo = model.children("h2").first();
      photo.replaceWith($("<figure>").append(photo.find("img")));
      const title = model.children("h2").first();
      title.replaceWith($("<h3>").text(title.text().trim()));

      const fields = $("<dl>");
      let field = $("<div>");
      for (const detail of model.children("div").toArray()) {
        const row = $(detail);
        if (row.find(".plas-label").length) {
          field = $("<div>").append($("<dt>").text(row.text().trim()));
          fields.append(field);
        } else {
          field.append($("<dd>").text(row.text().replace(/\s+/g, " ").trim()));
        }
        row.remove();
      }
      model.append(fields);
    }
  }

  if (!overview.text().trim() && !overview.find("img").length) overview.remove();

  return { images, leadHtml, quoteHref, detailsHtml: $.html() };
}

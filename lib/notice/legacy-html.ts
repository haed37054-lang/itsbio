import { load } from "cheerio";

/** Replace imported floating image cards and their obsolete lazy-load spacers. */
export function normalizeLegacyNoticeHtml(html: string) {
  const $ = load(html, {}, false);
  let changed = false;
  let grid: ReturnType<typeof $> | undefined;

  for (const element of $.root().children().toArray()) {
    const node = $(element);
    const link = node.children("a[href]");
    const image = link.find("img");
    const caption = link.find("p");
    const label = caption.text().replace(/\s+/g, " ").trim();
    const text = node.text().replace(/\s+/g, " ").trim();
    const isImageCard = element.tagName === "div"
      && /(?:^|;)\s*float\s*:\s*(?:left|right)\s*(?:;|$)/i.test(node.attr("style") || "")
      && node.children().length === 1
      && link.length === 1
      && image.length === 1
      && caption.length === 1
      && label.length > 0
      && text === label;

    if (!isImageCard) {
      grid = undefined;
      continue;
    }

    if (!grid) {
      grid = $('<div class="legacy-notice-card-grid"></div>');
      node.before(grid);
    }

    const card = link.clone().removeAttr("style").addClass("legacy-notice-card").empty();
    const picture = image.clone()
      .removeAttr("style width height srcset sizes data-srcset data-widths data-aspectratio data-sizes")
      .attr("loading", "lazy");
    card.append($('<div class="legacy-notice-card-media"></div>').append(picture));
    card.append($('<p class="legacy-notice-card-caption"></p>').text(label));
    grid.append(card);
    node.remove();
    changed = true;
  }

  return changed ? $.root().html() || "" : html;
}

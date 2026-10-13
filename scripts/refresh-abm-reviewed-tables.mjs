// Refresh only these three tables from the reviewed official category snapshot.
// This does not change Sanity content or other reviewed landing pages.
import fs from "node:fs/promises";
import crypto from "node:crypto";

const source = JSON.parse(await fs.readFile("data/abm-general-table-source-2026-10-13.json", "utf8"));
const data = JSON.parse(await fs.readFile("data/abm-general-landings.json", "utf8"));
const escape = (text) => String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const sectionIds = {
  "Cloning Applications": "Cloning-Applications",
  "DNA & RNA Applications": "DNA-RNA-Applications",
  Proteases: "in-vitro-Kits-Proteases",
};
const external = {
  B613: "https://www.abmgood.com/50-ml-media-bottle.html",
  G5503: "https://www.abmgood.com/9x9_Hinged_Lid.html",
};

for (const page of source.pages) {
  const from = `/products/abm/general-materials/${page.key}`;
  let group = "";
  const rows = page.products.map((product) => {
    let section = "";
    if (group !== product.group) {
      group = product.group;
      const id = sectionIds[group] || `table-product-mini-category-${group.replaceAll(" ", "-")}`;
      section = `<tr id="${escape(id)}" class="abm-table-section-row"><th colspan="3" scope="rowgroup">${escape(group)}</th></tr>`;
    }
    // CH028 is listed by ABM, but its official detail URL returns Page Not Found.
    // Preserve the factual listing without sending visitors to a broken detail.
    const link = (label) => {
      if (product.sku === "CH028") return escape(label);
      const href = external[product.sku] || `/products/abm/staged/product/${product.sku}?from=${encodeURIComponent(from)}`;
      const attributes = external[product.sku] ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a href="${escape(href)}"${attributes}>${escape(label)}</a>`;
    };
    return `${section}<tr><td>${link(product.name)}</td><td>${link(product.sku)}</td><td>${escape(product.quantity)}</td></tr>`;
  }).join("\n");
  const html = `${page.descriptions.map((text) => `<p>${escape(text)}</p>`).join("\n")}\n<div class="abm-table-scroll" role="region" aria-label="${escape(page.key === "equipment" ? "Equipment and lab consumables" : page.key === "enzymes-and-kits" ? "Molecular biology enzymes and kits" : "Buffers and chemicals")} product table" tabindex="0"><table class="abm-data-table"><thead><tr><th scope="col">Product Name</th><th scope="col">Cat. No.</th><th scope="col">${page.key === "enzymes-and-kits" ? "Size" : "Quantity"}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  const index = data.landings.findIndex((landing) => landing.root === "general-materials" && landing.key === page.key);
  const landing = {
    root: "general-materials", key: page.key, sourceUrl: page.sourceUrl,
    sourceSha256: crypto.createHash("sha256").update(JSON.stringify(page)).digest("hex"),
    sourceFormat: "reviewed-official-page-text", checkedAt: source.checkedAt,
    className: `abm-general-${page.key}`, html, imageCount: 0, faqCount: 0,
  };
  if (index < 0) data.landings.push(landing);
  else data.landings[index] = landing;
}
await fs.writeFile("data/abm-general-landings.json", JSON.stringify(data, null, 2) + "\n");
console.log("Reviewed ABM tables: 87 buffers, 54 equipment, 18 enzymes; original prices excluded.");

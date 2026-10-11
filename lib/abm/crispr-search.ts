export type CrisprSearchKind = "all" | "knockout" | "activation";

// Verified against ABM's native search/filter UI on 2026-10-11. The category
// landing pages use AJAX only; /search accepts query and fc_ids[] on navigation.
const SEARCH_CATEGORIES: Record<CrisprSearchKind, readonly string[]> = {
  all: ["57", "67"],
  knockout: ["57", "67", "68"],
  activation: ["57", "67", "69"],
};
const SEARCH_LABELS: Record<CrisprSearchKind, string> = {
  all: "CRISPR",
  knockout: "CRISPR knockout",
  activation: "CRISPR activation",
};

/** Use a native GET form so Enter and the button both open the same filtered
 * result in a new tab without a popup dependency or an internal resolver. */
export function createAbmCrisprSearchForm(doc: Document, kind: CrisprSearchKind) {
  const form = doc.createElement("form");
  form.className = "itsbio-crispr-search";
  form.method = "get";
  form.action = "https://www.abmgood.com/search";
  form.target = "_blank";
  form.rel = "noopener noreferrer";
  form.dataset.itsbioCrisprSearchForm = "true";

  for (const [name, value] of [
    ["search_mode", "exact"],
    ...SEARCH_CATEGORIES[kind].map((value) => ["fc_ids[]", value]),
  ]) {
    const field = doc.createElement("input");
    field.type = "hidden";
    field.name = name;
    field.value = value;
    form.appendChild(field);
  }

  const input = doc.createElement("input");
  input.type = "search";
  input.name = "query";
  input.required = true;
  input.autocomplete = "off";
  input.placeholder = "Gene name, symbol, or accession number";
  input.setAttribute("aria-label", `Search ABM ${SEARCH_LABELS[kind]} vectors`);

  const button = doc.createElement("button");
  button.type = "submit";
  button.textContent = "Search";
  button.setAttribute("aria-label", `Search ABM ${SEARCH_LABELS[kind]} products (opens in a new tab)`);
  form.append(input, button);
  return form;
}

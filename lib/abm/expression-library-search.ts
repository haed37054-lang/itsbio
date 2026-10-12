/** Category and species fields verified against ABM's public search UI. */
export const EXPRESSION_LIBRARY_OPTIONS = [
  { key: "all", label: "All Expression Libraries", categories: ["57", "58"] },
  { key: "lenti", label: "Lentiviral Vectors & Virus", categories: ["57", "58", "59"] },
  { key: "aav", label: "AAV Vectors & Virus", categories: ["57", "58", "60"] },
  { key: "adeno", label: "Adenovirus", categories: ["57", "58", "61"] },
  { key: "sirna", label: "siRNA — All Formats", categories: ["57", "58", "62"] },
  { key: "sirna-lenti", label: "siRNA Lentivirus", categories: ["57", "58", "62", "104"] },
  { key: "sirna-aav", label: "siRNA AAV", categories: ["57", "58", "62", "105"] },
  { key: "sirna-oligo", label: "siRNA dsRNA Oligo", categories: ["57", "58", "62", "106"] },
  { key: "mirna", label: "miRNA", categories: ["57", "58", "63"] },
  { key: "orf", label: "ORF Vectors", categories: ["57", "58", "64"] },
  { key: "circrna", label: "circRNA", categories: ["57", "58", "65"] },
  { key: "sgrna", label: "CRISPR sgRNA", categories: ["57", "67"] },
] as const;

export function createAbmExpressionLibrarySearchForm(doc: Document, defaultLibrary = "all") {
  const form = doc.createElement("form");
  form.className = "itsbio-expression-search";
  form.action = "https://www.abmgood.com/search";
  form.method = "get";
  form.target = "_blank";
  form.rel = "noopener noreferrer";
  const hidden = doc.createElement("span");
  hidden.hidden = true;
  const field = (label: string) => {
    const element = doc.createElement("label");
    const text = doc.createElement("span");
    text.textContent = label;
    element.appendChild(text);
    return element;
  };
  const libraryLabel = field("Library");
  const library = doc.createElement("select");
  library.setAttribute("aria-label", "Choose expression library");
  for (const item of EXPRESSION_LIBRARY_OPTIONS) {
    const option = doc.createElement("option");
    option.value = item.key;
    option.textContent = item.label;
    library.appendChild(option);
  }
  library.value = EXPRESSION_LIBRARY_OPTIONS.some(item => item.key === defaultLibrary) ? defaultLibrary : "all";
  libraryLabel.appendChild(library);
  const geneLabel = field("Gene name, symbol or accession number");
  const gene = doc.createElement("input");
  gene.type = "search";
  gene.name = "query";
  gene.placeholder = "Gene Name, Symbol or Accession Number";
  gene.required = true;
  gene.pattern = ".*\\S.*";
  geneLabel.appendChild(gene);
  const speciesLabel = field("Species");
  const species = doc.createElement("select");
  species.setAttribute("aria-label", "Choose species");
  for (const [value, label] of [["", "All Species"], ["Human", "Human"], ["Mouse", "Mouse"], ["Rat", "Rat"], ["Human (H. sapiens)", "Human (H. sapiens)"], ["Mouse (M. musculus)", "Mouse (M. musculus)"], ["Rat (R. norvegicus)", "Rat (R. norvegicus)"]]) {
    const option = doc.createElement("option");
    option.value = value;
    option.textContent = label;
    species.appendChild(option);
  }
  speciesLabel.appendChild(species);
  const syncFilters = () => {
    hidden.replaceChildren();
    const add = (name: string, value: string) => {
      const input = doc.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      hidden.appendChild(input);
    };
    add("search_mode", "exact");
    const selected = EXPRESSION_LIBRARY_OPTIONS.find(item => item.key === library.value) || EXPRESSION_LIBRARY_OPTIONS[0];
    selected.categories.forEach(value => add("fc_ids[]", value));
    if (species.value) {
      add("sp[]", species.value);
    }
  };
  library.addEventListener("change", syncFilters);
  species.addEventListener("change", syncFilters);
  syncFilters();
  const button = doc.createElement("button");
  button.type = "submit";
  button.textContent = "Search ABM ↗";
  form.append(hidden, libraryLabel, geneLabel, speciesLabel, button);
  return form;
}

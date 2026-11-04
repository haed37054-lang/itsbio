import { CELLFREE_CATEGORIES, type CellFreeCategory } from "./navigation";

type Document = { label: string; url: string };
type Component = [name: string, concentration: string, volume: string, quantity: string];
type Fact = [label: string, value: string];
type Option = {
  sku: string;
  name: string;
  size: string;
  description?: string;
  composition?: { title: string; rows: Component[] }[];
  documents?: Document[];
};

export type CellFreeProduct = {
  slug: string;
  title: string;
  category: CellFreeCategory;
  summary: string;
  sourceUrl: string;
  image?: string;
  workflow?: { src: string; width: number; height: number };
  overview?: { title: string; text: string }[];
  options: Option[];
  facts?: Fact[];
  components?: Component[];
  consumables?: { sku: string; rows: [name: string, quantity: string][] };
  vectors?: [name: string, position: string, cleavage: string][];
  documents?: Document[];
  related?: string[];
};

const source = "https://www.cfsciences.com/eg";
const sourceAsset = (path: string) => `${source}/images/${path}`;
const image = (path: string) => `/images/cellfree/${path.split("/").at(-1)?.replace(/\.[^.]+$/, ".webp")}`;
const workflowImage = (path: string, width: number, height: number) => ({ src: image(path), width, height });
const coreWorkflow = workflowImage("kit/WEPRO7240_Expression_Kit_img_en.png", 1450, 1120);
const page = (path: string) => `${source}/products/${path}`;
const manual = (path: string) => ({ label: "Instruction manual", url: sourceAsset(`kit/${path}`) });
const sds = (path: string) => ({ label: "Safety data sheet (SDS)", url: sourceAsset(`sds/${path}`) });
const coreManual = manual("W7240_Core_Kit_Manual_v10_26-7-2019MH.pdf");
const frozen: Fact = ["Storage", "−80 °C"];
const bufferPreparation: Fact = ["1× SUB-AMIX SGC preparation", "Use equal amounts of S1–S4 to prepare the working solution. Dilute each component into water to avoid precipitation."];
const coreCapacity: Fact = ["Kit capacity", "4 × 6 mL, 20 × 1.2 mL, or 96 × 226 µL"];
const coreApplications = {
  title: "Recommended applications",
  text: "Use for parallel soluble protein expression, screening, crystallography, interaction or functional assays, and co-expression of protein complexes. Choose a reaction scale based on the number of samples and the amount of protein required.",
};
const sgcComponents = (volume: string): Component[] =>
  [1, 2, 3, 4].map((n) => [`SUB-AMIX SGC S${n}`, "40×", volume, "1"]);
const transcriptionComponents = (bufferVolume: string): Component[] => [
  ["SP6 RNA polymerase", "80 U/µL", "15 µL", "1"],
  ["RNase inhibitor", "80 U/µL", "15 µL", "1"],
  ["NTP Mix", "25 mM", "120 µL", "1"],
  ["5× Transcription Buffer LM", "5×", bufferVolume, "1"],
];
const creatineKinase: Component = ["Creatine kinase", "20 mg/mL", "20 µL", "1"];
const coreComponents = (extract: string): Component[] => [
  [extract, "240 OD", "1 mL", "1"],
  ...sgcComponents("600 µL"),
  creatineKinase,
  ...transcriptionComponents("240 µL"),
];

function dialysisOption(sku: string, extract: string, description: string): Option {
  return {
    sku,
    name: `${extract} Dialysis Core Kit`,
    size: "1 set",
    description,
    composition: [
      { title: "Core kit · Transcription reagents", rows: transcriptionComponents("120 µL") },
      { title: "Core kit · Translation reagents", rows: [[extract, "240 OD", "1 mL", "1"], creatineKinase, ...sgcComponents("600 µL")] },
      { title: "Included transcription reagent set", rows: transcriptionComponents("240 µL") },
      { title: "External dialysis buffer reagents", rows: sgcComponents("7 mL") },
    ],
    documents: [{ ...sds(`2019_${extract}_Dialysis_Kit_SDS_v1.pdf`), label: `Safety data sheet (SDS) · ${sku}` }],
  };
}

export const CELLFREE_PRODUCTS: CellFreeProduct[] = [
  {
    slug: "premium-one-expression-kit",
    title: "Premium ONE Expression Kit",
    category: "expression-kits",
    summary: "Premixed wheat germ reagents for small-scale, coupled transcription and translation. Use it to screen whether a target protein expresses before scaling up.",
    sourceUrl: page("kit/137-kit/products-for-research-coupled-kit/444-premium-one-expression-kit"),
    image: image("kit/Premium_ONE_Expression_Kit_3.png"),
    workflow: workflowImage("kit/Premium_ONE_Expression_kit_en_img2_2.png", 800, 875),
    overview: [
      { title: "Template preparation", text: "Start from an expression vector or a linear DNA template. The kit includes sense primers and a PCR protocol for testing expression of different protein fragments." },
      { title: "Expression and detection", text: "The premixed WEPRO TT reagent couples transcription and translation. Fluorescent lysine labeling or Western blotting can detect suitable targets after a two-hour reaction. For SDS-PAGE with Coomassie staining, the manufacturer indicates 12–24 hours depending on protein yield." },
      { title: "Recommended applications", text: "Screen a target for expression in the wheat germ system or prepare small quantities for testing and analysis." },
    ],
    options: [{ sku: "CFS-EDX-ONE", name: "Premium ONE Expression Kit", size: "24 reactions" }],
    facts: [["Reaction volume", "55 µL"], ["Fluorescent labeling reagent", "Supplied for up to 8 reactions"], frozen],
    components: [
      ["pEU-E01-MCS", "1 µg/µL", "5 µL", "1"],
      ["pEU-E01-DYKDDDDK-DHFR (positive control)", "15 ng/µL", "10 µL", "1"],
      ["SPU (PCR sense primer)", "1 µM", "100 µL", "1"],
      ["deSP6E01 (PCR sense primer)", "10 nM", "100 µL", "1"],
      ["WEPRO TTmix", "—", "70 µL", "1"],
      ["SUB-AMIX TT", "—", "1.3 mL", "1"],
      ["FluoroTect GreenLys tRNA", "—", "4 µL", "1"],
    ],
    documents: [manual("Premium_ONE_Kit_Manual_v20_5-6-2020MH.pdf"), sds("2019_Premium_ONE_Expression_Kit_SDS_v5.pdf")],
    related: ["wepro7240-core-kit", "wepro7240h-core-kit"],
  },
  {
    slug: "wepro7240-core-kit",
    title: "WEPRO7240 Core Kit",
    category: "expression-kits",
    summary: "General-purpose wheat germ expression kit for screening multiple proteins at small scale or scaling up production of a selected protein.",
    sourceUrl: page("kit/139-kit/products-for-research-core-kit/458-wepro7240-core-kit"),
    image: image("kit/WEPRO7240_Core_Kit_2.png"),
    workflow: coreWorkflow,
    overview: [coreApplications, { title: "Detection", text: "Use SDS-PAGE with Coomassie staining to check expression. Assess solubility, activity and purification as needed for the target." }],
    options: [{ sku: "CFS-C7", name: "WEPRO7240 Core Kit", size: "1 set" }],
    facts: [coreCapacity, frozen, bufferPreparation],
    components: coreComponents("WEPRO7240"),
    documents: [coreManual, sds("2019_WEPRO7240_Core_Kit_SDS_v1.pdf")],
    related: ["wepro7240h-core-kit", "wepro7240-dialysis-core-kit"],
  },
  {
    slug: "wepro7240h-core-kit",
    title: "WEPRO7240H Core Kit",
    category: "expression-kits",
    summary: "Wheat germ expression kit with the WEPRO7240H extract for producing His-tagged proteins and preparing them for affinity purification.",
    sourceUrl: page("kit/139-kit/products-for-research-core-kit/469-wepro7240h-core-kit"),
    image: image("kit/WEPRO7240H_Core_Kit_2.png"),
    workflow: coreWorkflow,
    overview: [
      { title: "His-tag purification", text: "The WEPRO7240H extract reduces background from wheat germ proteins that bind during His-tag affinity purification. Use SDS-PAGE with Coomassie staining to check expression." },
      coreApplications,
    ],
    options: [{ sku: "CFS-C7H", name: "WEPRO7240H Core Kit", size: "1 set" }],
    facts: [["Affinity tag", "His-tag"], coreCapacity, frozen, bufferPreparation],
    components: coreComponents("WEPRO7240H"),
    documents: [coreManual, sds("2019_WEPRO7240H_Core_Kit_SDS.pdf")],
    related: ["wepro7240-core-kit", "split-pcr-primers"],
  },
  {
    slug: "wepro7240-dialysis-core-kit",
    title: "WEPRO7240 Series Dialysis Core Kit",
    category: "expression-kits",
    summary: "Reagents for wheat germ cell-free expression using dialysis. Choose standard, GST-tag or His-tag formulations for the planned expression and purification workflow.",
    sourceUrl: page("kit/139-kit/products-for-research-core-kit/626-wepro7240series-dialysis-core-kit"),
    image: image("kit/WEPRO7240_Core_Kit_2.png"),
    workflow: workflowImage("kit/wepro7240series-dialysis-core-kit_img1_en_.png", 800, 1296),
    overview: [
      { title: "Features and applications", text: "Dialysis can increase yield compared with the bilayer method, particularly for soluble targets. Use the kit to scale up production or obtain enough protein from one batch for multiple assays. Reaction volume depends on the dialysis device." },
      { title: "Required separately", text: "Supply an expression template and a suitable dialysis device. The manual uses a 0.5 mL Slide-A-Lyzer MINI for 50 µL reactions and a 3 mL cassette for 3 mL reactions, both with a 10 kDa molecular weight cutoff." },
    ],
    options: [
      dialysisOption("CFS-D7", "WEPRO7240", "General-purpose kit for synthesizing a wide range of proteins."),
      dialysisOption("CFS-D7G", "WEPRO7240G", "Provides higher purity for GST-tagged fusion proteins than the standard kit. The extract is precleared to reduce background binding to glutathione resin."),
      dialysisOption("CFS-D7H", "WEPRO7240H", "Provides higher purity for His-tagged fusion proteins than the standard kit. The extract is precleared to reduce background binding to nickel resin."),
    ],
    facts: [
      ["Kit capacity", "2 × 3 mL or 60 × 50 µL"],
      ["Test-then-scale protocol", "Up to 20 × 50 µL screening reactions, followed by up to 2 × 3 mL preparative reactions"],
      ["Dialysis device", "Required separately"],
      frozen,
      bufferPreparation,
    ],
    documents: [manual("W7240_Dialysis_Core-Kit_Manual_v2.0-E.pdf")],
    related: ["wepro7240-core-kit", "wepro7240h-core-kit", "peu-vector-set"],
  },
  {
    slug: "wepro7240",
    title: "WEPRO7240 Wheat Germ Extract",
    category: "reagents",
    summary: "General-purpose wheat germ extract supplying translation factors for cell-free protein synthesis.",
    sourceUrl: page("kit/110-reagent/komugi/459-wepro7240"),
    image: image("shiyaku/WEPRO7240.png"),
    options: [{ sku: "CFS-WGE-7240", name: "WEPRO7240", size: "1 mL" }],
    facts: [frozen, ["Handling", "Aliquot at first use when needed. Avoid more than three freeze–thaw cycles."]],
    documents: [manual("WEPRO7240_31-5-2022MH.pdf"), sds("2018_WEPRO7240_SDS.pdf")],
    related: ["sub-amix-sg", "wepro7240-core-kit"],
  },
  {
    slug: "sub-amix-sg",
    title: "SUB-AMIX SG Translation Buffer",
    category: "reagents",
    summary: "Translation buffer for WEPRO7240, WEPRO7240G and WEPRO7240H extracts, formulated for the Filter & Feed protein synthesis method.",
    sourceUrl: page("kit/98-reagent/honyaku/404-sub-amix-sg"),
    image: image("shiyaku/SUB-AMIX_SG-2.png"),
    options: [{ sku: "CFS-SUB-SG", name: "SUB-AMIX SG", size: "1 set" }],
    facts: [["Storage", "−20 °C"], ["Working concentration", "Use equal quantities of S1–S4 when preparing 1× buffer."]],
    components: [1, 2, 3, 4].map((n): Component => [`SUB-AMIX SG S${n}`, "40×", "12.5 mL", "1"]),
    documents: [manual("SUB-AMIX-SG_31-5-2022MH.pdf"), sds("2018_40x_SUB_AMIX_SG_S1_S4_SDS_v3.pdf")],
    related: ["wepro7240"],
  },
  {
    slug: "peu-vector-set",
    title: "pEU Vector Set",
    category: "vectors",
    summary: "Expression vector set for the wheat germ system. The vectors use an SP6 promoter and E01 translational enhancer and cover untagged, His-tag, GST-tag and DYKDDDDK-tag constructs.",
    sourceUrl: page("vector"),
    image: image("vector/peu2.png"),
    options: [{ sku: "CFS-PEU-v1.0", name: "pEU Vector set", size: "1 set" }],
    facts: [["Supplied volume", "10 µL each"], ["Vector concentration", "0.3 mg/mL"], ["Positive control", "pEU-E01-DHFR, 1.0 mg/mL"]],
    vectors: [
      ["pEU-E01-MCS", "—", "—"],
      ["pEU-E01-His-TEV-MCS-N1", "N-terminus", "TEV"],
      ["pEU-E01-His-TEV-MCS-N2", "N-terminus", "TEV"],
      ["pEU-E01-His-TEV-MCS-N3", "N-terminus", "TEV"],
      ["pEU-E01-MCS-TEV-His-C1", "C-terminus", "TEV"],
      ["pEU-E01-MCS-TEV-His-C2", "C-terminus", "TEV"],
      ["pEU-E01-MCS-TEV-His-C3", "C-terminus", "TEV"],
      ["pEU-E01-GST-PS-MCS-N1", "N-terminus", "PreScission"],
      ["pEU-E01-GST-PS-MCS-N2", "N-terminus", "PreScission"],
      ["pEU-E01-GST-PS-MCS-N3", "N-terminus", "PreScission"],
      ["pEU-E01-MCS-PS-GST-C1", "C-terminus", "PreScission"],
      ["pEU-E01-MCS-PS-GST-C2", "C-terminus", "PreScission"],
      ["pEU-E01-DYKDDDDK-MCS-N1", "N-terminus", "—"],
      ["pEU-E01-DYKDDDDK-MCS-N2", "N-terminus", "—"],
      ["pEU-E01-DYKDDDDK-MCS-N3", "N-terminus", "—"],
      ["pEU-E01-DHFR", "Positive control", "—"],
    ],
    documents: [
      { label: "pEU Vector Set instruction manual", url: sourceAsset("vector/CFS_vectors_27-8-2019MH.pdf") },
      { label: "pEU Vector Set safety data sheet (SDS)", url: sourceAsset("vector/2019_pEU_Vector_Set_SDS.pdf") },
      { label: "Untagged pEU-E01-MCS vector map", url: "https://www.cfsciences.com/images/vector/pEU-E01-MCS_map_v2.pdf" },
      { label: "His-tag N-terminal vector maps", url: sourceAsset("vector/pEU-E01-His-TEV-MCS_map_v4.pdf") },
      { label: "His-tag C-terminal vector maps", url: sourceAsset("vector/pEU-E01-MCS-TEV-His_map_v3.pdf") },
      { label: "GST-tag N-terminal vector maps", url: sourceAsset("vector/pEU-E01-GST-PS-MCS_map_v3.pdf") },
      { label: "GST-tag C-terminal vector maps", url: sourceAsset("vector/pEU-E01-MCS-PS-GST_map_v4.pdf") },
      { label: "DYKDDDDK-tag vector maps", url: "https://www.cfsciences.com/images/vector/pEU-E01-DYKDDDDK-MCS_map_v2.pdf" },
      { label: "pEU-E01-MCS full sequence · manufacturer manual appendix C", url: sourceAsset("kit/ProteoLiposome_PLUS_Expression_Kit_E_ver_1.1.pdf#page=27") },
    ],
    related: ["split-pcr-primers", "premium-one-expression-kit"],
  },
  {
    slug: "split-pcr-primers",
    title: "Split PCR Primers Set",
    category: "primers",
    summary: "Primer set for building linear DNA expression templates in two PCR steps. The workflow adds an SP6 promoter, an E01 enhancer and a 3′ UTR for wheat germ expression.",
    sourceUrl: page("split-pcr-primers-set"),
    image: image("kit/Split_PCR_Primers_set.png"),
    workflow: workflowImage("kit/Overview_of_the_Split_Primer_PCR_Method.png", 801, 468),
    options: [{ sku: "CFS-SPCR-01", name: "Split PCR Primers set", size: "1 set" }],
    facts: [["Included primers", "SPU, deSP6E01, deSP6E01His6"], ["Tagged templates", "deSP6E01His6 supports His-tagged fusion proteins."]],
    related: ["wepro7240h-core-kit", "peu-vector-set"],
  },
  {
    slug: "protein-expression-reagent-kit",
    title: "Protein Expression Reagent Kit",
    category: "teaching",
    summary: "Classroom kit for demonstrating transcription and translation from DNA. Students can observe protein production using green fluorescent protein.",
    sourceUrl: page("kit/111-teaching/teaching-kit/327-2018-04-05-15-46-34"),
    image: image("Protein_Expression_Reagent_Kit.jpg"),
    workflow: workflowImage("kyouzai/Protein_Expression_Reagent_Kit_img2_en.png", 1450, 1950),
    overview: [{ title: "Classroom experiment", text: "Students follow DNA transcription and translation and use GFP fluorescence to observe protein synthesis. The kit supplies reagents for 20 students working in 10 pairs." }],
    options: [
      { sku: "CFS-EDU", name: "Protein Expression Reagent Kit", size: "1 set" },
      { sku: "CFS-EDU-N", name: "Protein Expression Reagent Kit without plastic consumables", size: "1 set" },
    ],
    facts: [frozen, ["Separate reagent outside Japan", "Quant-iT RiboGreen RNA Reagent (R11491)"]],
    components: [
      ["Distilled water", "—", "1,200 µL", "1"],
      ["Transcription buffer", "—", "200 µL", "1"],
      ["Ribonucleotides", "—", "100 µL", "1"],
      ["RNase", "10 mg/mL", "35 µL", "1"],
      ["RNase inhibitor", "10,000 U/mL", "68 µL", "1"],
      ["RNA polymerase", "10,000 U/mL", "99 µL", "1"],
      ["Plasmid DNA", "1 mg/mL", "66 µL", "1"],
      ["Wheat germ extract", "—", "330 µL", "1"],
      ["Translation buffer with amino acids", "—", "1,050 µL", "5"],
    ],
    consumables: {
      sku: "CFS-EDU",
      rows: [["1.5 mL microtube", "170"], ["Plastic pipette tip (2–200 µL)", "4 × 96"], ["Clear flat-bottom tube with cap", "22"]],
    },
    documents: [manual("Teaching_kit_E_ver.2.1.pdf"), sds("2018_Protein_Expression_Reagent_Kit_SDS_v2.pdf")],
  },
  {
    slug: "protemist-dt-ii",
    title: "Protemist DTⅡ",
    category: "equipment",
    summary: "Automated bilayer wheat germ system that can run transcription, translation and affinity purification for up to six samples in a single run.",
    sourceUrl: page("synthesizing/92-synthesizing-2/335-protemist-dt2"),
    image: image("service/ProtemistDT2.png"),
    overview: [
      { title: "Availability", text: "CellFree Sciences states that Protemist DTⅡ will be discontinued when its remaining stock is sold." },
      { title: "Automation and screening", text: "The system runs transcription, translation and affinity purification with temperature control for heat-sensitive targets. It also supports screening up to 24 crude samples. CellFree Sciences reports approximately 900 µg of purified GFP from a 6 mL example reaction." },
    ],
    options: [{ sku: "CFS-DTⅡ", name: "Protemist DTⅡ", size: "1 set" }],
    facts: [
      ["Expression with purification", "1–6 samples at 6 mL each"],
      ["Expression only", "1–24 samples at 1.2 mL each"],
      ["Reaction volumes", "6 mL with purification. 1.2 mL or 6 mL for transcription and translation."],
      ["Control PC", "Core 2 Duo T7100 (1.8 GHz) or higher, 60 GB storage, 512 MB RAM, English-language Windows XP and a 14.1-inch monitor"],
      ["Installation temperature", "15–30 °C"],
      ["Installation humidity", "≤75%, non-condensing"],
      ["Dimensions", "700 × 790 × 500 mm (W × H × D)"],
      ["Weight", "100 kg"],
      ["Power supply", "AC 100–240 V"],
      ["Line voltage tolerance", "±10%"],
      ["Power consumption", "≤350 VA"],
    ],
    documents: [
      { label: "Quick manual", url: sourceAsset("synthesizer/Protemist_DT_II_quick_manual_E_ver.1.9.pdf") },
      { label: "Reagent manual", url: sourceAsset("synthesizer/Protemist_DT_II_reagent_manual_ver.2.5.pdf") },
    ],
  },
  {
    slug: "protein-synthesis-service",
    title: "Protein Synthesis Service",
    category: "services",
    summary: "Custom wheat germ cell-free protein expression. The service can include expression screening, solubility assessment and affinity purification of the target.",
    sourceUrl: page("entrustment"),
    options: [],
    overview: [
      { title: "Expression, solubility and purification testing", text: "Submit an inquiry and receive an estimate. After the order and sample are received, CellFree Sciences prepares a template in its wheat germ expression vector, runs the tests and delivers an evaluation report with the sample." },
      { title: "Scaled-up production", text: "CellFree Sciences prepares a separate estimate based on the test results. After the order, it scales production to the requested amount and delivers the product with a production report. Customers can specify buffer and protein concentration requirements." },
    ],
    facts: [
      ["Affinity purification", "GST-tag or His-tag"],
      ["Membrane proteins", "The service excludes solubility testing for membrane proteins."],
      ["Activity assessment", "The customer evaluates activity of the delivered target protein."],
      ["Estimated lead time", "At least one month each for template generation, screening and scale-up, per the manufacturer’s service schedule."],
      ["Research use", "Custom proteins are supplied for research use."],
      ["Request details", "Provide the target protein and intended application when requesting a quote."],
    ],
  },
];

function normalize(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/[‐‑‒–—―−]/g, "-").trim();
}

export function exactCellFreeOption(query: string) {
  const normalized = normalize(query);
  for (const product of CELLFREE_PRODUCTS) {
    const option = product.options.find(({ sku }) => normalize(sku) === normalized);
    if (option) return { product, option };
  }
}

export function searchCellFreeProducts(query: string, category?: CellFreeCategory) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return CELLFREE_PRODUCTS.filter((product) => {
    if (category && product.category !== category) return false;
    const categoryLabel = CELLFREE_CATEGORIES.find(({ key }) => key === product.category)?.label ?? "";
    const value = normalize(["CellFree Sciences", categoryLabel, product.title, product.summary, ...product.options.flatMap(({ sku, name }) => [sku, name]), ...(product.vectors?.map(([name]) => name) ?? [])].join(" "));
    return terms.every((term) => value.includes(term));
  });
}

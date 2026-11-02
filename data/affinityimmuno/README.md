# AffinityImmuno manufacturer catalog

The active catalog follows https://affinityimmuno.com/product-category/ in full: **310 distinct product pages**, comprising **117 ELISA kits** and **193 antibodies**. The supplied workbook remains a supplementary source for fields absent from matching manufacturer pages; it no longer limits catalog membership.

The manufacturer publishes 309 distinct catalog-number strings across its 310 pages. Two different Filgrastim/GCSF-PEG products share `EL-1611-73196`. Both receive separate product routes, and searching the shared number returns both choices. The longer GCSF-PEG catalog name in the manufacturer's title is retained as a search alias. React keys, result deduplication and internal links use product routes rather than assuming SKU uniqueness.

All ten current manufacturer categories are represented with exact source-page membership, including Biomarker ELISAs (93) and Biosimilar ELISAs (24). Earlier pharmacokinetic, immunogenicity and COVID category URLs are retained as legacy views, outside the current sidebar and mega menu. Sidebar item counts remain hidden. The shared ABM/Cleaver banner proportions, AffinityImmuno logo and original manufacturer antibody/ELISA packshots are preserved.

Eight workbook-only product records retain their original detail routes in `retained-workbook-products.json`. They do not inflate the current 310-product catalog. No discontinuation or availability claim is inferred from their absence on the manufacturer list.

## Collection and validation

```sh
node scripts/collect-affinity-catalog.mjs
node scripts/audit-affinity-catalog.mjs
npm run build
```

The collector uses a scoped source cache under ignored `.cache/affinity/full-review/pages/`. Remove that cache directory only for an intentional fresh manufacturer review. `official-inventory.json` records all 310 source URLs, category membership, normalized body-text digests and the digests of 3,055 source specification fields. The offline build audit checks the catalog against that independent evidence, validates all local image/PDF files, verifies document-link checks and preserves both products sharing a catalog number.

Product-specific figures are mirrored without pixel changes. The original manufacturer packshots and logo are stored locally. Existing local PDFs are preserved; additional manufacturer PDFs use their verified official URLs, opening in a new tab. Additional official resources found outside the current detail-page links are recorded in `additional-source-resources.json`, with byte-signature verification performed by the collector. Source bodies preserve manufacturer content and captions; product links are rewritten to the matching local route, while verified external resources open in a new tab. Prices, order controls and vendor checkout interfaces are excluded.

The review found validated PDF resources for 116 of the 117 ELISA products. The current Pembrolizumab page (`EL-1611-161`) does not provide a size or a discoverable product-sheet link; neither is invented. This source limitation is recorded in `migration-report.json`. Manufacturer values take priority over conflicting workbook values. The workbook input retains its original provenance and excludes prices/currency from the public snapshot.

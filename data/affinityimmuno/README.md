# AffinityImmuno catalog

Scope: the supplied `2026_AffinityImmuno ELISA and Antibody products ITSBio.xlsx`.
Its SHA-256 and original sheet/row references are recorded in the input snapshot and migration report.
There are 217 unique catalog numbers: 19 ELISA kits and 198 antibodies. Two identical ELISA rows were deduplicated. No website-only products were added.

The workbook owns catalog membership, product identity, size and supplied specifications. Matching current manufacturer pages supplement descriptions, figures, documents and additional specifications. Price and currency fields are excluded from the public input snapshot and rendered catalog. Unspecified applications and clones remain unspecified.

## Rebuild

From the repository root:

```sh
python scripts/extract-affinity-workbook.py /path/to/source.xlsx
node scripts/collect-affinity-catalog.mjs
node scripts/audit-affinity-catalog.mjs
```

The collector caches source responses under ignored `.cache/affinity/`. Delete only the relevant cache entry when a current source requires a deliberate refresh. Product pages are accepted only when the returned Cat.No matches the workbook SKU. Manufacturer antibody and ELISA kit packshots are retained in `reference-media.json` and displayed across their corresponding product families, as on the manufacturer site. Product-specific figures remain in each catalog record. Packshots, figures and PDF files are mirrored byte-for-byte into `public/affinityimmuno/` and validated before being linked. The source logo is mirrored from `https://affinityimmuno.com/images/logo.png`.

## Source limitations

209 current manufacturer product pages match the supplied catalog numbers. Eight entries remain supported by the workbook because a matching current detail page was not found: `EL-1611-32214`, `ab-131-437`, `ab-131-430`, `ab-131-295-PAIR`, `ab-131-294`, `ab-131-294-hrp`, `ab-131-294-gold`, and `ab-131-296`. They remain in this catalog, without unsupported discontinuation/stock claims or links to known mismatched/404 pages. The manufacturer PDF for `EL-1611-32214` was found and retained independently. All 19 ELISA kits have validated local product-sheet PDFs.

Source differences are recorded in `migration-report.json`. The supplied Tocilizumab summary contains an unrelated Trastuzumab sentence; that sentence is excluded from displayed assay information. Numeric clone `2.4300000000000002` is displayed as `2.43`, confirmed by its matching manufacturer page. The original input values remain in the input snapshot. Generic safety, purity, availability, certifications and application claims are never added to records lacking source evidence.

Categories are based on supplied product names, general categories and target species. Their counts overlap where a product reacts with multiple species. Pagination and filters are computed from the same 217 records as the detail routes, exact-SKU search, quote context and sitemap.

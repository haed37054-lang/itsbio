Seedburo product catalog

Source: https://seedburo.com/

The product scope follows the public product sitemap and visible collection memberships. Global Shopify product JSON also includes SKU-only and draft/unlisted records; those are not emitted as additional empty product pages. Product models retain their original SKU and variant image associations. Collection membership comes from the actual collection endpoints, not inferred title matching.

Refresh into a new cache directory:

```sh
python scripts/collect-seedburo-catalog.py --cache=/path/to/new-cache
python scripts/collect_seedburo_sections.py --cache=/path/to/new-cache
python scripts/audit-seedburo-image-sources.py --cache=/path/to/new-cache
python scripts/build-seedburo-catalog.py --cache=/path/to/new-cache
python scripts/collect-seedburo-recommendations.py --cache=/path/to/new-cache
npm run seedburo:audit
```

The collector reads public source endpoints only. It does not use account credentials or mutate the source store. The generated catalog excludes prices, purchase controls and stock claims. Product descriptions and additional document/media tabs are collected separately. Existing source photos are preserved; a source product without a photo is not assigned another product's image.

`migration-report.json` records the source census and request failures. The build audit checks route identities, every collection-to-product link, model counts, menu targets and sanitized product content. Deployments still require a visual review of representative category, model, gallery, document and video flows.

Presentation retains all source records, including spare parts with little information. Product cards reserve the same photo and text areas. Records with an actual source photograph appear first; records without one remain searchable and have an explicit manufacturer-photo-unavailable message. Known source NOPICTURE / No_Image_Available graphics are not product photographs and are omitted in presentation. SKU-only headings use the existing source description or exact variant name, while handles and Cat.Nos remain unchanged. No specifications or substitute product photographs are generated.

Recommendations are collected from the separate source recommendation section with `python scripts/collect-seedburo-recommendations.py --cache=/path/to/new-cache`. The first nonempty original block is retained in source order: Customers who bought this item also bought, otherwise the source Best sellers fallback. Recommendations are never inferred from shared categories. They use local product routes and the existing source photographs; purchase/price markup is not copied. `recommendations-report.json` records full product coverage and missing targets. Refresh this snapshot after regenerating the catalog.

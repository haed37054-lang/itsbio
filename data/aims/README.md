# AIMS Lab Products catalog

The active AIMS catalog follows **https://aimslabproducts.com/**. The previously migrated animalid.com tattoo systems are excluded from the active catalog, navigation, brand descriptions and search. Their three old detail URLs redirect to the AIMS Lab Products catalog; they are not mapped to unrelated equipment.

The official Shop has 50 distinct entries. 39 have substantive product descriptions; 11 are empty-description product-family links. All 50 are covered: 39 local detail pages plus 11 family links mapped to local categories. This is a count of source product pages, not a claim of 39 unique physical model numbers. Some manufacturer pages cover multiple models or overlap with a separate model page.

Navigation retains six manufacturer families and 22 categories, including the three-level Surgery Boards hierarchy. Parent membership includes the products of its source-linked child categories. GETP and LLSW are present in the official Shop but absent from the reviewed menu category listings; both remain in All products, without inventing a category assignment.

Product text is preserved from the manufacturer description panel. Images use the original source gallery files and the largest explicitly listed body-image source. The local snapshot contains 80 distinct images (including the logo) and 16 original PDF files; 38 product pages have linked documents. The combined Grace Procedure / Dissection Boards page has no source PDF link, so none is invented. The source pages contain no embedded product video. Manufacturer reference text is retained when an external AVMA PDF could not be verified; an invalid HTML response is never published as a PDF.

Original descriptions, tables, model codes, image captions, related-product references, PDF files and the correct red AIMS Lab Products logo are retained. Product and category links in descriptions are rewritten to local routes. Vendor checkout controls, prices, login prompts and external manufacturer-page footer links are not displayed.

```sh
node scripts/collect-aims-lab.mjs
npm run aims:audit
npm run build
```

The collector caches source HTML in ignored `.cache/aims-lab-review/`. `official-inventory.json` records source membership and normalized text digests independent of the rendered pages. The offline audit validates all 39 descriptions, family routes, navigation, source provenance, original image dimensions and PDF byte signatures. Shared product information tabs retain the AffinityImmuno cyan theme and use the AIMS red theme for this catalog.

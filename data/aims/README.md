AIMS catalog scope

Three independently listed systems are published: ATS-3, NEO-9 and ATS-3L. NEO-AP and LLA-AP are manufacturer-listed upgrades for an existing ATS-3 and remain selectable options on that product, with their own Cat.Nos and quote metadata. No unverified standalone accessory SKUs or substitute photographs are added.

Catalog descriptions are concise editorial summaries of the official product pages and linked brochures. `source-media.json` records exact official media references. Equipment photographs use the largest image explicitly present in the original srcset. Application galleries retain the original source images. Canonical animalid.com references are used for the same uploaded files, rather than obsolete new.animalid.com links; every asset is checked before publication. Native product videos remain on their source host and load on demand.

To collect fresh official references into a new source cache (requires Python Pillow):

```sh
python scripts/collect-aims-media.py /path/to/new-cache
npm run aims:audit
```

Review changes to `catalog.json` against these sources before updating specifications or models:

- https://animalid.com/portfolio/ats-3-general-rodent-tattoo-system/
- https://animalid.com/portfolio/neo-9-neonate-rodent-tattooing-system/
- https://animalid.com/portfolio/ats-3l-large-animal-tattoo-system/

Public training manuals mentioned in kit contents are not fabricated as downloadable files. The Documents section links only to the actual manufacturer brochures. ATS-3L has no product video on the reviewed source page, so its page has no empty or substituted video section.

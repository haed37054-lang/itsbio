AIMS catalog scope

Three independently listed systems are published: ATS-3, NEO-9 and ATS-3L. NEO-AP and LLA-AP are manufacturer-listed upgrades for an existing ATS-3 and remain selectable options on that product, with their own Cat.Nos and quote metadata. No unverified standalone accessory SKUs or substitute photographs are added.

Catalog descriptions are editorial summaries of the official product pages and linked brochures. `source-media.json` records exact official media references. Equipment photographs use the largest image explicitly present in the original srcset. Application galleries retain the original source images. Canonical animalid.com references are used for the same uploaded files, rather than obsolete new.animalid.com links; every asset is checked before publication. Native product videos remain on their source host and load on demand.

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

Content review — 2026-10-30

The initial migration compressed product text too aggressively. The second pass adds separate applications, kit contents, model-specific instruction volumes, quantitative brochure facts, a system comparison and manufacturer training/care summaries. Original media and Cat.No/quote behavior remain intact.

Additional fact sources:

- ATS-3 brochure: https://animalid.com/wp-content/uploads/2022/04/AIMS-ATS-3-Document.pdf — approximate initial supplies for 3,000 mice/rats; Vol. 2 and instructional DVD; upgrade guide volumes.
- NEO-9 brochure: https://animalid.com/wp-content/uploads/2022/04/AIMS-NEO-9-Brochure.pdf — 4× magnification; schemes up to 10,000 IDs; initial supplies for approximately 2,000 neonates; Vol. 1 and instructional DVD.
- ATS-3L brochure: https://animalid.com/wp-content/uploads/2022/04/AIMS-ATS-3L-Brochure.pdf — ultra-light handpiece, foot pedal, HDUI supply/controller, calibrated needle tubes, Vol. 3.
- https://animalid.com/training/ — manufacturer on-site program, six-person minimum, equipment/supplies and assessment requirements.
- https://animalid.com/equipment-care/ — annual handpiece service recommendation and inspection/calibration scope.

Supply quantities are attributed to the 2022 brochures and are approximate, not lifetime throughput guarantees. The training program is described as the manufacturer's service; local availability is not promised. Instructional books/DVDs listed as kit materials are not presented as public downloads. No equipment dimensions, consumable SKUs or safety guarantees are inferred from photographs.

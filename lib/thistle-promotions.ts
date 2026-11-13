import brochures from "@/data/thistle-special-offer-2026.json";

const assetDirectory = "/promotions/thistle-special-offer-2026";
const brochurePdf = "thistle-scientific-special-offer-2026.pdf";

export const thistlePromotions = brochures.map(({ cover, pages, ...promotion }) => ({
  ...promotion,
  _id: promotion.slug,
  campaignLabel: "Thistle Scientific Special Offers",
  coverPath: `${assetDirectory}/${cover}`,
  dateText: `Ends ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(promotion.endDate))}`,
  attachments: [{
    asset: {
      url: `${assetDirectory}/${brochurePdf}`,
      originalFilename: brochurePdf,
      mimeType: "application/pdf",
    },
  }],
  gallery: pages.map(({ number, image }) => ({
    _key: String(number),
    localPath: `${assetDirectory}/${image}`,
    alt: `${promotion.title} brochure, page ${number}`,
  })),
}));

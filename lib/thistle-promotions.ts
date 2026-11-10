import brochures from "@/data/thistle-special-offer-2026.json";

const assetDirectory = "/promotions/thistle-special-offer-2026";
const brochurePdf = "thistle-scientific-special-offer-2026.pdf";

export const thistlePromotions = brochures.map(({ cover, pages, ...promotion }) => ({
  ...promotion,
  _id: promotion.slug,
  campaignLabel: "ThistleScientific 할인행사",
  coverPath: `${assetDirectory}/${cover}`,
  dateText: `${promotion.endDate.replaceAll("-", ".")}까지`,
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
    alt: `${promotion.title} 브로슈어 ${number}쪽`,
  })),
}));

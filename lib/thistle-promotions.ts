import brochures from "@/data/thistle-special-offer-2026.json";

const assetDirectory = "/promotions/thistle-special-offer-2026";

export const thistlePromotions = brochures.map(({ cover, pdf, pages, ...promotion }) => ({
  ...promotion,
  _id: promotion.slug,
  coverPath: `${assetDirectory}/${cover}`,
  dateText: `${promotion.endDate.replaceAll("-", ".")}까지`,
  attachments: [{
    asset: {
      url: `${assetDirectory}/${pdf}`,
      originalFilename: pdf,
      mimeType: "application/pdf",
    },
  }],
  gallery: pages.map(({ number, image, caption }) => ({
    _key: String(number),
    localPath: `${assetDirectory}/${image}`,
    alt: `${promotion.title} 브로슈어 ${number}쪽`,
    caption: `${number}쪽 · ${caption}`,
  })),
}));

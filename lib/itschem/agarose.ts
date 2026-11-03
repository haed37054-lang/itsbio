export const ITS_AGAROSE = {
  title: "ItsAgarose Tablets",
  href: "/products/itschem",
  summary: "0.5 g 정제로, 별도 계량 없이 원하는 농도의 agarose gel을 준비할 수 있습니다.",
  packages: [
    { sku: "ITS0001", label: "200 tablets", detail: "20 blisters / box" },
    { sku: "ITS0002", label: "1,000 tablets", detail: "5 × ITS0001" },
  ],
} as const;

export function itsAgarosePackageHref(sku: string) {
  return `${ITS_AGAROSE.href}#model-${encodeURIComponent(sku)}`;
}

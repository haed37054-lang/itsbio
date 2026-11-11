import { productSearchMetadata } from "@/lib/product-search";
import ProductSearchInfo from "@/components/products/ProductSearchInfo";
import Image from "next/image";
import Link from "next/link";
import Breadcrumb from "@/components/site/Breadcrumb";
import AgarosePackageSelector from "@/components/products/itschem/AgarosePackageSelector";
import { ITS_AGAROSE, itsAgarosePackageHref } from "@/lib/itschem/agarose";

export const metadata = productSearchMetadata({ name: ITS_AGAROSE.title, brand: "ITSChem", path: ITS_AGAROSE.href,
  description: ITS_AGAROSE.summary, modelNumbers: ITS_AGAROSE.packages.map((pack) => pack.sku) });

const bufferVolumes = [
  ["0.8%", 63, 125, 188],
  ["1.0%", 50, 100, 150],
  ["1.2%", 42, 83, 125],
  ["1.3%", 38, 77, 115],
  ["1.5%", 33, 67, 100],
  ["1.8%", 28, 56, 83],
  ["2.0%", 25, 50, 75],
] as const;

const specifications = [
  ["CAS", "9012-36-6"],
  ["Appearance", "White to off-white powder"],
  ["EEO", "< 0.13"],
  ["Gelling point", "36°C ± 1.5°C (1.5% gel)"],
  ["Melting point", "88°C ± 1.5°C (1.5% gel)"],
  ["Solubility", "Clear colorless solution at 1 g in 100 mL water"],
  ["Moisture", "≤ 10%"],
  ["Gel strength", "≥ 1,200 g/cm²"],
  ["Sulfate", "≤ 0.15%"],
  ["Ash", "≤ 0.5%"],
  ["DNase / RNase / Protease", "Not detectable"],
] as const;

const relatedProducts = [
  { sku: "G108", title: "SafeView™ Classic" },
  { sku: "G108-G", title: "Safe-Green™" },
  { sku: "G108-R", title: "Safe-Red™" },
];

const sectionHeading = "border-b border-slate-200 pb-3 text-2xl font-semibold tracking-tight text-slate-950";

export default function ItsChemPage() {
  return (
    <>
      <section aria-label="ITSChem" className="relative overflow-hidden border-b border-rose-200/70 bg-rose-50">
        <div className="absolute inset-0 bg-[linear-gradient(110deg,#ffffff_0%,#fff8fa_58%,#ffeef3_100%)]" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-[9%] -top-[55%] h-[440px] w-[440px] rounded-full bg-rose-600/10 md:right-[2%]" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-[85%] right-[15%] h-[430px] w-[430px] rounded-full border-[70px] border-rose-600/[0.055]" aria-hidden="true" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-[7px] bg-rose-600" aria-hidden="true" />

        <div className="relative mx-auto grid min-h-[220px] max-w-[1320px] items-center gap-8 px-6 py-10 md:min-h-[280px] md:grid-cols-[minmax(0,1fr)_360px] md:py-14">
          <div className="max-w-3xl">
            <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-rose-800">
              <span className="h-px w-8 bg-rose-600" aria-hidden="true" />
              ITS BIO
            </p>
            <p className="mt-4 max-w-[820px] text-3xl font-semibold leading-[1.12] tracking-[-0.035em] text-slate-950 md:text-[44px]">ITSChem</p>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 md:text-[15px]">Agarose tablets for gel electrophoresis</p>
          </div>
          <div className="hidden justify-self-end md:block">
            <div className="flex h-[126px] w-[330px] items-center justify-center rounded-[22px] border border-rose-200 bg-white px-8 shadow-[0_18px_50px_rgba(159,18,57,0.10)]">
              <Image src="/partners/itschem-logo.png" alt="ITSChem" width={240} height={100} priority className="h-auto max-h-[82px] w-auto max-w-[255px] object-contain" />
            </div>
          </div>
        </div>
      </section>
      <main className="mx-auto max-w-[1320px] px-6 pb-16">
        <div className="my-7">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Products", href: "/products" }, { label: "ITSChem" }]} />
        </div>
        <article className="mx-auto max-w-[1080px]">
          <section className="grid items-start gap-8 md:grid-cols-[minmax(250px,0.85fr)_minmax(0,1.15fr)]">
            <figure className="flex min-h-60 items-center justify-center rounded-xl border border-slate-200 bg-white p-6 md:min-h-80">
              <Image src="/itschem/itsagarose-packaging.png" alt="ItsAgarose Tablets boxes and blister packs" width={166} height={144} priority unoptimized className="h-auto w-48 max-w-full" />
            </figure>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-rose-800">ITSChem</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">{ITS_AGAROSE.title}</h1>
              <p lang="ko" className="mt-3 text-sm leading-7 text-slate-600">{ITS_AGAROSE.summary}</p>
              <AgarosePackageSelector />
              <ul lang="ko" className="mt-5 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600 marker:text-rose-700">
                <li>High Purity Low EEO (LE) agarose</li>
                <li>0.5 g/tablet, 10 tablets/blister</li>
                <li>직접 작업 시간 1분 미만</li>
                <li>목표 gel 농도에 맞춰 tablet 수와 buffer 양을 조절</li>
                <li>환경오염 요소를 줄인 생산 방식</li>
              </ul>
            </div>
          </section>

          <section aria-labelledby="agarose-protocol" className="mt-12">
            <h2 id="agarose-protocol" className={sectionHeading}>Protocol</h2>
            <ol lang="ko" className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>준비하는 용액 부피의 2~4배 정도인 플라스크를 사용하십시오.</li>
              <li>아래 표에서 원하는 gel 농도에 맞는 양의 buffer를 넣고, 정제를 약 2분 동안 불린 뒤 가열합니다.</li>
              <li>Water bath를 이용할 경우, 가열하면서 agarose가 완전히 녹을 때까지 5~10분 동안 계속 저어 줍니다.</li>
            </ol>
            <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-80 text-center text-sm">
                <caption className="bg-white px-4 py-3 text-left font-medium text-slate-800">Buffer volume by gel concentration</caption>
                <thead className="bg-rose-50 text-slate-900">
                  <tr>{["Gel %", "1 tablet", "2 tablets", "3 tablets"].map((label) => <th key={label} scope="col" className="px-3 py-3 font-semibold">{label}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {bufferVolumes.map(([concentration, ...volumes]) => (
                    <tr key={concentration}>
                      <th scope="row" className="bg-slate-50 px-3 py-2.5 font-medium">{concentration}</th>
                      {volumes.map((volume) => <td key={volume} className="px-3 py-2.5">{volume} mL</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div lang="ko" className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-950">전자레인지를 이용할 경우</h3>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-7 text-slate-700">
                <li>끓기 시작할 때까지 고출력으로 가열하고 30초 동안 끓입니다.</li>
                <li>플라스크를 부드럽게 흔들어 남아 있는 agarose를 용해합니다.</li>
                <li>결정이 없이 투명해질 때까지 고출력으로 재가열합니다.</li>
                <li>플라스크를 꺼내 서서히 흔들어 줍니다. 뜨거우니 주의하십시오.</li>
                <li>Gel을 붓기 전에 60°C까지 식힙니다.</li>
              </ol>
            </div>
          </section>

          <section aria-labelledby="agarose-specifications" className="mt-10">
            <h2 id="agarose-specifications" className={sectionHeading}>Specifications</h2>
            <dl className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200">
              {specifications.map(([label, value]) => (
                <div key={label} className="grid text-sm sm:grid-cols-[220px_minmax(0,1fr)]">
                  <dt className="bg-slate-50 px-4 py-2.5 font-medium text-slate-900">{label}</dt>
                  <dd className="px-4 py-2.5 text-slate-700">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="agarose-ordering" className="mt-10">
            <h2 id="agarose-ordering" className={sectionHeading}>Ordering Information</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <figure className="flex items-center gap-4 rounded-lg border border-slate-200 p-4">
                <Image src="/itschem/itsagarose-tablets.png" alt="Two ItsAgarose tablets" width={149} height={100} unoptimized className="h-auto w-28" />
                <figcaption className="text-sm text-slate-700">0.5 g per tablet</figcaption>
              </figure>
              <figure className="flex items-center gap-4 rounded-lg border border-slate-200 p-4">
                <Image src="/itschem/itsagarose-blister.png" alt="ItsAgarose blister pack with 10 tablets" width={181} height={103} unoptimized className="h-auto w-28" />
                <figcaption className="text-sm text-slate-700">10 tablets per blister</figcaption>
              </figure>
            </div>
            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-80 text-left text-sm">
                <thead className="bg-slate-50 text-slate-900"><tr>{["Cat.No", "Quantity", "Packaging"].map((label) => <th key={label} scope="col" className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {ITS_AGAROSE.packages.map((option) => (
                    <tr key={option.sku}>
                      <th scope="row" className="px-4 py-3 font-semibold"><a href={itsAgarosePackageHref(option.sku)} className="text-rose-800 underline-offset-4 hover:underline">{option.sku}</a></th>
                      <td className="px-4 py-3">{option.label}</td>
                      <td className="px-4 py-3">{option.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="agarose-related" className="mt-10">
            <h2 id="agarose-related" className={sectionHeading}>Related Products</h2>
            <p lang="ko" className="mt-4 text-sm leading-7 text-slate-700">Agarose gel 전기영동에 함께 사용할 수 있는 ABM의 EtBr 대체 염색 시약입니다.</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {relatedProducts.map((product) => (
                <li key={product.sku}>
                  <Link href={`/products/abm/staged/product/${product.sku}`} prefetch={false} className="block rounded-lg border border-slate-200 p-4 transition hover:border-rose-300 hover:bg-rose-50/40">
                    <span className="block text-xs font-semibold text-rose-800">{product.sku}</span>
                    <span className="mt-1 block text-sm font-semibold text-slate-900">{product.title}</span>
                    <span className="mt-1 block text-sm text-slate-600">1 mL</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </article>
        <ProductSearchInfo info={{ name: ITS_AGAROSE.title, brand: "ITSChem", path: ITS_AGAROSE.href,
          description: ITS_AGAROSE.summary, modelNumbers: ITS_AGAROSE.packages.map((pack) => pack.sku) }} brandHref="/products" />
      </main>
    </>
  );
}

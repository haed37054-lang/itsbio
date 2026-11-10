import type { Metadata } from "next";
import Link from "next/link";

import BrandsShowcase from "@/components/site/home/BrandsShowcase";
import { getNoticePage, getPromotionPage, type NoticePost, type PromotionPost } from "@/lib/editorial-posts";
import { urlFor } from "@/lib/sanity/image";

export const metadata: Metadata = {
  title: { absolute: "ITS BIO 이츠바이오 | 생명과학 연구용 제품 및 실험장비" },
  description: "이츠바이오는 ABM, Kent Scientific 등 생명과학 연구용 시약, 세포주 및 동물실험 장비를 국내에 공급합니다. 제품명과 Cat.No.로 제품을 찾을 수 있습니다.",
  alternates: { canonical: "/" },
  verification: { google: "XahSFa1hvkNGWIkAtZjXg0nTubB66Lq5-IlhWnFQmNc" },
};

function formatDate(value: string) {
  return new Date(value).toISOString().slice(0, 10).replaceAll("-", ".");
}

function SectionHeading({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">{title}</h2>
      <Link
        href={href}
        aria-label={`View all ${title.toLowerCase()} posts`}
        className="shrink-0 text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-orange-700 hover:decoration-current"
      >
        View all
      </Link>
    </div>
  );
}

function HomePromotions({ promotions }: { promotions: PromotionPost[] }) {
  return (
    <section className="border-t border-slate-200 bg-[#fffdfb] py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading title="Promotion" href="/promotions" />
        {promotions.length > 0 ? (
          <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-7 sm:gap-x-6 lg:grid-cols-4">
            {promotions.map((promotion) => {
              const href = promotion.slug ? `/promotions/${promotion.slug}` : "/promotions";
              const image = promotion.coverPath ?? (promotion.cover
                ? urlFor(promotion.cover).width(640).height(400).fit("crop").auto("format").url()
                : "/home/promo-bundle.jpg");

              return (
                <li key={promotion._id} className="min-w-0">
                  <Link href={href} className="group block h-full border-b border-slate-200 pb-4">
                    <div className="aspect-[16/10] overflow-hidden border border-slate-200 bg-white">
                      <img src={image} alt="" className="h-full w-full object-contain" loading="lazy" />
                    </div>
                    {promotion.campaignLabel ? (
                      <p className="mt-3 text-xs font-semibold text-orange-700">{promotion.campaignLabel}</p>
                    ) : null}
                    <h3 className="mt-1.5 text-sm font-semibold leading-snug text-slate-950 group-hover:text-orange-700 sm:text-base">
                      {promotion.title}
                    </h3>
                    {promotion.summary ? (
                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">{promotion.summary}</p>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-6 border-y border-slate-200 py-8 text-sm text-slate-600">
            새로운 프로모션을 준비하고 있습니다.
          </p>
        )}
      </div>
    </section>
  );
}

function HomeNotices({ notices }: { notices: NoticePost[] }) {
  return (
    <section className="border-y border-slate-200 bg-white py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading title="Notice" href="/notice" />
        <ul className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
          {notices.map((notice) => {
            const date = notice.publishedAt ?? notice._createdAt;
            return (
              <li key={notice._id}>
                <Link
                  href={`/notice/${notice.slug}`}
                  className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4 sm:gap-8"
                >
                  <span className="min-w-0 text-sm font-medium leading-6 text-slate-800 group-hover:text-orange-700 md:text-base">
                    {notice.isPinned ? (
                      <span className="mr-2 inline-block border border-orange-200 px-1.5 py-0.5 align-middle text-[10px] font-semibold leading-none text-orange-700">
                        공지
                      </span>
                    ) : null}
                    {notice.title}
                  </span>
                  <time dateTime={date} className="text-xs tabular-nums text-slate-500 sm:text-sm">
                    {formatDate(date)}
                  </time>
                </Link>
              </li>
            );
          })}
          {notices.length === 0 ? (
            <li className="py-8 text-sm text-slate-600">등록된 공지가 없습니다.</li>
          ) : null}
        </ul>
      </div>
    </section>
  );
}

export default async function Home() {
  const [{ promotions }, { items: notices }] = await Promise.all([
    getPromotionPage(),
    getNoticePage(),
  ]);

  return (
    <main className="bg-white">
      <BrandsShowcase />
      <HomePromotions promotions={promotions.slice(0, 4)} />
      <HomeNotices notices={notices.slice(0, 5)} />
    </main>
  );
}

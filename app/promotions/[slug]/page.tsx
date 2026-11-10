// app/promotions/[slug]/page.tsx
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import Breadcrumb from "@/components/site/Breadcrumb";
import PageHero from "@/components/site/PageHero";

import { PUBLIC_CATALOG_CACHE, sanityCdnClient } from "@/lib/sanity/sanity.client";
import { urlFor } from "@/lib/sanity/image";
import { thistlePromotions } from "@/lib/thistle-promotions";

import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";

export const revalidate = 300;

type PromotionDetail = {
  _id: string;
  title: string;
  publishedAt?: string;
  _createdAt?: string;
  gallery?: any[];
  attachments?: any[];
  content?: PortableTextBlock[];
};

const DETAIL_QUERY = `
*[_type=="promotion" && slug.current==$slug][0]{
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  _createdAt,

  image{
    ...,
    asset->{
      _id,
      url,
      originalFilename,
      mimeType,
      metadata{ dimensions }
    }
  },

  gallery[]{
    _key,
    _type,
    ...,
    alt,
    caption,
    asset->{
      _id,
      url,
      originalFilename,
      mimeType,
      metadata{ dimensions }
    }
  },

  attachments[]{
    _key,
    _type,
    ...,
    asset->{
      _id,
      url,
      originalFilename,
      mimeType,
      size
    }
  },

  content
}
`;

// ✅ Notice와 동일한 기준 (목록이 최신이 위)
// - PREV = 더 과거(<dt) 중 가장 가까운 글
// - NEXT = 더 미래(>dt) 중 가장 가까운 글
const PREV_QUERY = `
*[
  _type=="promotion" &&
  coalesce(isActive,true)==true &&
  slug.current != $slug &&
  coalesce(publishedAt, _createdAt) < $dt
]
| order(coalesce(publishedAt, _createdAt) desc)[0]{
  "slug": slug.current
}
`;

const NEXT_QUERY = `
*[
  _type=="promotion" &&
  coalesce(isActive,true)==true &&
  slug.current != $slug &&
  coalesce(publishedAt, _createdAt) > $dt
]
| order(coalesce(publishedAt, _createdAt) asc)[0]{
  "slug": slug.current
}
`;

function fmtDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

function PaperclipIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21.44 11.05l-8.49 8.49a5 5 0 01-7.07-7.07l9.19-9.19a3.5 3.5 0 014.95 4.95l-9.19 9.19a2 2 0 01-2.83-2.83l8.49-8.49" />
    </svg>
  );
}

function FileTypePill({ mime, name }: { mime?: string; name?: string }) {
  const lower = (name ?? "").toLowerCase();
  const isPdf = mime === "application/pdf" || lower.endsWith(".pdf");
  const isImage = (mime ?? "").startsWith("image/") || /\.(png|jpg|jpeg|webp|gif)$/i.test(lower);
  const label = isPdf ? "PDF" : isImage ? "IMG" : "FILE";

  return (
    <span className="inline-flex h-6 items-center justify-center rounded-full bg-orange-50 px-2 text-[11px] font-semibold text-orange-700 ring-1 ring-orange-100">
      {label}
    </span>
  );
}

/** ✅ 알약 버튼 아이콘 (<< / >> 느낌) — Notice와 동일 */
function DoubleChevron({ dir, className = "" }: { dir: "left" | "right"; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {dir === "left" ? (
        <>
          <path d="M14 7l-5 5 5 5" />
          <path d="M19 7l-5 5 5 5" />
        </>
      ) : (
        <>
          <path d="M10 7l5 5-5 5" />
          <path d="M5 7l5 5-5 5" />
        </>
      )}
    </svg>
  );
}

/** ✅ 하단 네비: Notice와 동일한 “알약 + 원형 아이콘” */
function PillNavButton({
  href,
  label,
  dir,
}: {
  href?: string;
  label: "PREV" | "NEXT";
  dir: "prev" | "next";
}) {
  const disabled = !href;

  const wrap =
    "inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-extrabold tracking-wide shadow-sm transition";
  const iconCircle =
    "grid h-10 w-10 place-items-center rounded-full bg-white/95 ring-1 ring-white/60";

  if (disabled) {
    return (
      <span
        className={[
          wrap,
          "bg-orange-100 text-orange-300 shadow-none",
          "cursor-not-allowed select-none",
        ].join(" ")}
      >
        {dir === "prev" ? (
          <span className={iconCircle}>
            <DoubleChevron dir="left" className="h-5 w-5 text-orange-200" />
          </span>
        ) : null}

        <span>{label}</span>

        {dir === "next" ? (
          <span className={iconCircle}>
            <DoubleChevron dir="right" className="h-5 w-5 text-orange-200" />
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <Link
      href={href!}
      className={[wrap, "bg-orange-500 text-white", "hover:bg-orange-600 active:bg-orange-700"].join(" ")}
    >
      {dir === "prev" ? (
        <span className={iconCircle}>
          <DoubleChevron dir="left" className="h-5 w-5 text-orange-600" />
        </span>
      ) : null}

      <span>{label}</span>

      {dir === "next" ? (
        <span className={iconCircle}>
          <DoubleChevron dir="right" className="h-5 w-5 text-orange-600" />
        </span>
      ) : null}
    </Link>
  );
}

export default async function PromotionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = await params;
  const slug = p?.slug;
  if (!slug) return notFound();

  const brochureIndex = thistlePromotions.findIndex((promotion) => promotion.slug === slug);
  const brochure = thistlePromotions[brochureIndex];
  const doc: PromotionDetail | null = brochure
    ?? await sanityCdnClient.fetch<PromotionDetail | null>(DETAIL_QUERY, { slug }, PUBLIC_CATALOG_CACHE);
  if (!doc) return notFound();

  const dateIso = doc.publishedAt ?? doc._createdAt;
  const dateText = fmtDate(dateIso);
  const authorText = "itsbio";

  const attachments: any[] = Array.isArray(doc.attachments) ? doc.attachments : [];
  const gallery: any[] = Array.isArray(doc.gallery) ? doc.gallery : [];

  // prev/next (notice와 동일 방식)
  const [prevDoc, nextDoc] = brochure ? [
    thistlePromotions[brochureIndex + 1],
    thistlePromotions[brochureIndex - 1],
  ] : await Promise.all([
    dateIso ? sanityCdnClient.fetch(PREV_QUERY, { slug, dt: dateIso }, PUBLIC_CATALOG_CACHE) : null,
    dateIso ? sanityCdnClient.fetch(NEXT_QUERY, { slug, dt: dateIso }, PUBLIC_CATALOG_CACHE) : null,
  ]);

  return (
    <main className="bg-white">
      <PageHero
        eyebrow="PROMOTIONS"
        title="Promotions"
        description="Latest offers, events, and announcements from ITS BIO."
        variant="promotions"
        cta={{ label: "Back to promotions", href: "/promotions" }}
      />

      {/* Breadcrumb: Home / Promotions까지만 */}
      <div className="mx-auto mt-6 flex max-w-6xl justify-end px-4">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Promotions" }]} />
      </div>

      {/* CONTENT */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 md:pt-12">
        <header className="max-w-4xl">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            {doc.title}
          </h2>

          <div className="mt-3 text-sm text-slate-500">
            <span className="font-medium text-slate-700">{authorText}</span>
            {dateText ? <span className="text-slate-400"> · {dateText}</span> : null}
          </div>

          {brochure ? (
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p>{brochure.summary}</p>
              <p className="font-semibold text-orange-700">행사 기간 · {brochure.dateText}</p>
            </div>
          ) : null}

          {/* 첨부파일: 새 탭으로 열기 */}
          {attachments.length > 0 ? (
            <section className="mt-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <PaperclipIcon className="h-4 w-4 text-orange-600" />
                첨부파일
                <span className="text-xs font-semibold text-slate-500">({attachments.length})</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {attachments.map((att, idx) => {
                  const url = att?.asset?.url as string | undefined;
                  const name =
                    (att?.asset?.originalFilename as string | undefined) ?? `attachment-${idx + 1}`;
                  const mime = att?.asset?.mimeType as string | undefined;
                  if (!url) return null;

                  return (
                    <a
                      key={att?._key ?? `${doc._id}-att-${idx}`}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                      title="새 탭에서 열립니다."
                    >
                      <FileTypePill mime={mime} name={name} />
                      <span className="max-w-[360px] truncate">{name}</span>
                    </a>
                  );
                })}
              </div>
            </section>
          ) : null}

          {/* 오렌지 구분선 */}
          <div className="mt-6 h-px w-full bg-gradient-to-r from-orange-500/70 via-orange-200/50 to-transparent" />
        </header>

        {/* 갤러리: 올린 순서대로 + 노티와 동일 폭(max-w-4xl) */}
        {gallery.length > 0 ? (
          <section className="mt-8">
            <div className="mx-auto max-w-4xl space-y-6">
              {gallery.map((g: any, i: number) => {
                const imgUrl = g?.localPath ?? (g?.asset
                  ? urlFor(g).width(2000).fit("max").auto("format").url()
                  : null);
                if (!imgUrl) return null;

                return (
                  <figure
                    key={g?._key ?? `${doc._id}-g-${i}`}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                  >
                    <Image
                      src={imgUrl}
                      alt={g?.alt ?? doc.title}
                      width={g?.localPath ? 1571 : 1600}
                      height={g?.localPath ? 2222 : 900}
                      className="w-full h-auto"
                      sizes="(max-width: 768px) 100vw, 896px"
                      priority={i === 0}
                      unoptimized={Boolean(g?.localPath)}
                    />
                    {g?.caption ? (
                      <figcaption className="px-5 py-3 text-sm text-slate-600">
                        {g.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* 본문 */}
        {Array.isArray(doc.content) && doc.content.length > 0 ? (
          <article className="prose prose-slate mt-10 max-w-none">
            <PortableText value={doc.content} />
          </article>
        ) : null}

        {/* ✅ 하단 네비: Notice와 동일 */}
        <section className="mt-14 flex items-center justify-between gap-4">
          <PillNavButton
            href={prevDoc?.slug ? `/promotions/${prevDoc.slug}` : undefined}
            label="PREV"
            dir="prev"
          />
          <PillNavButton
            href={nextDoc?.slug ? `/promotions/${nextDoc.slug}` : undefined}
            label="NEXT"
            dir="next"
          />
        </section>
      </section>
    </main>
  );
}

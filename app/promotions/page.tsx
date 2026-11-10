import Link from "next/link";
import Breadcrumb from "@/components/site/Breadcrumb";
import PageHero from "@/components/site/PageHero";
import { PUBLIC_CATALOG_CACHE, sanityCdnClient } from "@/lib/sanity/sanity.client";
import { urlFor } from "@/lib/sanity/image";
import { thistlePromotions } from "@/lib/thistle-promotions";

type PromotionDoc = {
  _id: string;
  title: string;
  summary?: string;
  publishedAt?: string;
  order?: number;
  ctaLabel?: string;
  cover?: any;
  coverPath?: string;
  dateText?: string;
  startDate?: string;
  endDate?: string;
  slug?: string;
};

type SP = { q?: string; page?: string };
const PAGE_SIZE = 9;

function formatDot(dateIso?: string) {
  if (!dateIso) return "";
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function promotionDateLabel(p: PromotionDoc) {
  if (p.dateText && p.dateText.trim().length) return p.dateText;
  if (p.startDate || p.endDate) {
    const a = formatDot(p.startDate);
    const b = formatDot(p.endDate);
    if (a && b) return `${a} ~ ${b}`;
    if (a) return `${a} ~`;
    if (b) return `~ ${b}`;
  }
  return formatDot(p.publishedAt) || "Ongoing";
}

function escapeForGROQ(input: string) {
  return input.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function clampInt(value: string | undefined, fallback: number, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function buildHref(basePath: string, q: string, page: number) {
  const sp = new URLSearchParams();
  if (q.trim()) sp.set("q", q.trim());
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function getPageWindow(current: number, total: number) {
  const windowSize = 7;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(total, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return {
    pages,
    showFirst: start > 1,
    showLast: end < total,
    showLeftEllipsis: start > 2,
    showRightEllipsis: end < total - 1,
  };
}

export default async function PromotionsPage({ searchParams }: { searchParams?: Promise<SP> }) {
  const sp = (await searchParams) ?? {};
  const qRaw = (sp.q ?? "").trim();
  const qSafe = qRaw ? escapeForGROQ(qRaw) : "";
  const pageParam = clampInt(sp.page, 1, 1, 999);
  const filter = qSafe ? `&& (title match "*${qSafe}*")` : "";
  const searchTerms = qRaw.toLowerCase().split(/\s+/);
  const brochures = thistlePromotions.filter((promotion) =>
    searchTerms.every((term) => promotion.title.toLowerCase().includes(term)),
  );

  const TOTAL_QUERY = `count(*[_type=="promotion" && coalesce(isActive,true)==true ${filter}])`;
  const total = brochures.length + await sanityCdnClient.fetch<number>(TOTAL_QUERY, {}, PUBLIC_CATALOG_CACHE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(pageParam, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const cmsStart = Math.max(0, start - brochures.length);
  const cmsEnd = Math.max(0, end - brochures.length);

  const PROMOTIONS_QUERY = `
    *[_type=="promotion" && coalesce(isActive,true)==true ${filter}]
      | order(defined(order) desc, order desc, publishedAt desc, _createdAt desc)
      [${cmsStart}...${cmsEnd}]{
        _id, title, summary, publishedAt, order, ctaLabel, dateText, startDate, endDate,
        "slug": slug.current,
        "cover": coalesce(image, gallery[0])
      }
  `;

  const cmsPromotions = await sanityCdnClient.fetch<PromotionDoc[]>(PROMOTIONS_QUERY, {}, PUBLIC_CATALOG_CACHE);
  const promotions: PromotionDoc[] = [...brochures.slice(start, end), ...cmsPromotions];
  const showingFrom = total === 0 ? 0 : start + 1;
  const showingTo = Math.min(start + promotions.length, total);
  const { pages, showFirst, showLast, showLeftEllipsis, showRightEllipsis } = getPageWindow(currentPage, totalPages);

  return (
    <div className="bg-white">
      <PageHero
        eyebrow="PROMOTIONS"
        title="Featured offers from our scientific brands"
        description="Explore current promotions, partner highlights, and limited-time opportunities across the ITS BIO portfolio."
        variant="promotions"
        cta={{ label: "View current offers", href: "#promotions-list" }}
      />

      <div className="mx-auto max-w-6xl px-6"><div className="mt-6 flex justify-end"><Breadcrumb /></div></div>

      <main id="promotions-list" className="mx-auto max-w-6xl scroll-mt-24 px-6 pb-16 pt-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Current promotions</h2>
            <div className="mt-2 text-sm text-slate-600">
              {qRaw ? <><span className="font-semibold text-slate-900">“{qRaw}”</span> · </> : null}
              <span className="font-semibold text-slate-900">{total}</span> results · {showingFrom}–{showingTo}
            </div>
          </div>

          <form action="/promotions" method="GET" className="flex w-full gap-2 sm:w-auto">
            <input name="q" aria-label="Search promotions" defaultValue={qRaw} placeholder="Search promotions..." className="h-11 w-full min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-50 sm:w-[330px]" />
            <button type="submit" className="h-11 shrink-0 rounded-full bg-orange-600 px-6 text-sm font-semibold text-white transition hover:bg-orange-700">Search</button>
            {qRaw ? <Link href="/promotions" className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Clear</Link> : null}
          </form>
        </div>

        {promotions.length > 0 ? (
          <ul role="list" className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
            {promotions.map((p) => {
              const href = p.slug ? `/promotions/${p.slug}` : "/promotions";
              const imgUrl = p.coverPath ?? (p.cover ? urlFor(p.cover).width(480).height(300).fit("crop").auto("format").url() : "");
              return (
                <li key={p._id}>
                  <Link
                    href={href}
                    className="group grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-2 py-4 transition-colors hover:bg-orange-50/70 focus-visible:bg-orange-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-orange-600 sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:gap-x-5 sm:px-4 lg:grid-cols-[10rem_minmax(0,1fr)_auto_auto] lg:gap-x-7"
                  >
                    <div aria-hidden="true" className="row-span-2 aspect-[16/10] self-start overflow-hidden rounded-lg bg-orange-50 sm:self-center lg:row-span-1">
                      {imgUrl ? <img src={imgUrl} alt="" width={480} height={300} className="h-full w-full object-cover" loading="lazy" /> : null}
                    </div>
                    <div className="min-w-0">
                      <h3 className="break-words text-base font-semibold leading-snug text-slate-950 group-hover:text-orange-800 sm:text-lg">{p.title}</h3>
                      {p.summary ? <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">{p.summary}</p> : null}
                    </div>
                    <span className="col-start-2 row-start-2 text-xs font-semibold text-orange-800 lg:col-start-3 lg:row-start-1 lg:text-sm">
                      {promotionDateLabel(p)}
                    </span>
                    <span className="col-start-3 row-span-2 row-start-1 inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-orange-800 lg:col-start-4 lg:row-span-1">
                      <span className="hidden sm:inline">{p.ctaLabel || "View details"}</span>
                      <span aria-hidden="true" className="text-lg transition-transform group-hover:translate-x-0.5">→</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 px-6 py-14 text-center text-sm text-slate-500">No promotions matched this search.</div>
        )}

        {totalPages > 1 ? (
          <nav className="mt-12 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
            <Link href={buildHref("/promotions", qRaw, Math.max(1, currentPage - 1))} aria-disabled={currentPage === 1} className={`inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-semibold ${currentPage === 1 ? "pointer-events-none border-slate-200 bg-slate-50 text-slate-400" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>Prev</Link>
            {showFirst ? <Link href={buildHref("/promotions", qRaw, 1)} className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">1</Link> : null}
            {showLeftEllipsis ? <span className="px-1 text-slate-400">…</span> : null}
            {pages.map((pg) => <Link key={pg} href={buildHref("/promotions", qRaw, pg)} aria-current={pg === currentPage ? "page" : undefined} className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-semibold ${pg === currentPage ? "border-orange-200 bg-orange-50 text-orange-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>{pg}</Link>)}
            {showRightEllipsis ? <span className="px-1 text-slate-400">…</span> : null}
            {showLast ? <Link href={buildHref("/promotions", qRaw, totalPages)} className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">{totalPages}</Link> : null}
            <Link href={buildHref("/promotions", qRaw, Math.min(totalPages, currentPage + 1))} aria-disabled={currentPage === totalPages} className={`inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-semibold ${currentPage === totalPages ? "pointer-events-none border-slate-200 bg-slate-50 text-slate-400" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>Next</Link>
          </nav>
        ) : null}
      </main>
    </div>
  );
}

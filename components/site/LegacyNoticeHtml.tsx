import { normalizeLegacyNoticeHtml } from "@/lib/notice/legacy-html";

type LegacyNoticeHtmlProps = {
  html: string;
};

export default function LegacyNoticeHtml({ html }: LegacyNoticeHtmlProps) {
  return (
    <div className="mt-10">
      <style>{`
        .legacy-notice-html {
          /* Keep imported floats inside the article, above navigation and footer. */
          display: flow-root;
          width: 100%;
          max-width: 860px;
          margin: 0 auto;
          color: #334155;
          font-size: 15px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }
        .legacy-notice-html * {
          box-sizing: border-box;
        }
        .legacy-notice-html table {
          border-collapse: collapse;
          max-width: 100%;
        }
        .legacy-notice-html td,
        .legacy-notice-html th {
          vertical-align: top;
        }
        .legacy-notice-html img {
          display: block;
          max-width: 100% !important;
          height: auto !important;
        }
        .legacy-notice-html p {
          max-width: 100%;
        }
        .legacy-notice-html a {
          color: #c2410c;
          text-decoration: none;
        }
        .legacy-notice-html a:hover {
          text-decoration: underline;
        }
        .legacy-notice-scroll {
          min-width: 0;
          max-width: 100%;
          overflow-x: auto;
        }
        .legacy-notice-card-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 28px 24px;
          margin: 24px 0;
        }
        .legacy-notice-card {
          display: block;
          min-width: 0;
          color: #0f172a !important;
          text-align: center;
        }
        .legacy-notice-card-media {
          display: flex;
          height: 200px;
          align-items: center;
          justify-content: center;
        }
        .legacy-notice-card-media img {
          width: 100%;
          height: 100% !important;
          object-fit: contain;
        }
        .legacy-notice-card-caption {
          margin: 12px 0 0;
          font-size: 15px;
          font-weight: 600;
          line-height: 1.5;
        }
        @media (max-width: 767px) {
          .legacy-notice-scroll {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .legacy-notice-html {
            min-width: 0;
            font-size: 14px;
          }
          .legacy-notice-html table {
            width: 100% !important;
          }
          .legacy-notice-html td,
          .legacy-notice-html th {
            max-width: 100%;
          }
          .legacy-notice-card-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 24px 16px;
          }
          .legacy-notice-card-media {
            height: 150px;
          }
        }
        @media (max-width: 479px) {
          .legacy-notice-card-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .legacy-notice-card-media {
            height: 200px;
          }
        }
      `}</style>
      <div className="legacy-notice-scroll">
        <div
          className="legacy-notice-html"
          dangerouslySetInnerHTML={{ __html: normalizeLegacyNoticeHtml(html) }}
        />
      </div>
    </div>
  );
}

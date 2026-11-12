import Script from "next/script";

export default function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  if (!measurementId || !/^G-[A-Z0-9]+$/.test(measurementId)) return null;
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="itsbio-google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}', {
  allow_google_signals: false,
  allow_ad_personalization_signals: false
});`}
      </Script>
    </>
  );
}

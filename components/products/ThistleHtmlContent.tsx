import sanitizeHtml from "sanitize-html";

// Manufacturer content must be present in the initial HTML for search engines
// and visitors with JavaScript disabled. Keep this a server component.
export default function ThistleHtmlContent({ html, className = "" }: { html: string; className?: string }) {
  const content = sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img"],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading"],
      th: ["colspan", "rowspan", "scope"],
      td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["https", "http", "mailto"],
    textFilter: (text) => text.replace(/Cleaver Scientific/g, "Thistle Scientific"),
    transformTags: {
      img: (_tagName, attributes) => ({
        tagName: "img",
        attribs: { ...attributes, src: attributes["data-lazy-src"] || attributes.src || "", loading: "lazy" },
      }),
      a: (_tagName, attributes) => ({ tagName: "a", attribs: { ...attributes, rel: "noopener noreferrer" } }),
    },
  });
  if (!content) return null;
  return <div className={`itsbio-html ${className}`} dangerouslySetInnerHTML={{ __html: content }} />;
}

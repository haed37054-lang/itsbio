// Remove duplicate navigation/resource sections without consuming earlier headings.
export function stripUnwantedAbmNav(html: string) {
  if (!html) return "";
  let out = html;
  if (/class="abm-(?:sirna|library)-official"/.test(out)) {
    return out.replace(/<script[\s\S]*?<\/script>/gi, "");
  }

  out = out.replace(/<ul[^>]*class=["'][^"']*\babm-page-category-nav-list\b[^"']*["'][\s\S]*?<\/ul>/gi, "");
  out = out.replace(
    /<h3[^>]*>(?:(?!<\/h3>)[\s\S])*?\bResources?\b(?:(?!<\/h3>)[\s\S])*?<\/h3>(?:(?!<h3\b)[\s\S])*?<ul[^>]*class=["'][^"']*\bhtmlcontent-home\b[^"']*["'][\s\S]*?<\/ul>[\s\S]*?(?=<h3\b|$)/gi,
    ""
  );
  out = out.replace(
    /<h3[^>]*>(?:(?!<\/h3>)[\s\S])*?\bTop\s*Publications\b(?:(?!<\/h3>)[\s\S])*?<\/h3>(?:(?!<h3\b)[\s\S])*?<table[\s\S]*?<\/table>[\s\S]*?(?=<h3\b|$)/gi,
    ""
  );

  out = out.replace(/<script[^>]*type=["']application\/ld\+json["'][\s\S]*?<\/script>/gi, "");
  out = out.replace(/<script[\s\S]*?<\/script>/gi, "");

  return out;
}


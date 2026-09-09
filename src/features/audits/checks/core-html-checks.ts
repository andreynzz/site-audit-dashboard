import type { HtmlAuditCheck } from "./types";

function value(
  document: Parameters<HtmlAuditCheck["run"]>[0],
  selector: string,
  attribute?: string,
) {
  const element = document(selector).first();
  return (attribute ? element.attr(attribute) : element.text())?.trim() ?? "";
}

export const titleCheck: HtmlAuditCheck = {
  id: "title",
  run: (document) => {
    const title = value(document, "title");
    if (!title)
      return {
        category: "seo",
        id: "title",
        message: "The page has no title element.",
        name: "Title",
        recommendation: "Add a concise, descriptive title for this page.",
        severity: "critical",
        status: "failed",
      };
    return {
      category: "seo",
      id: "title",
      message: "A page title is present.",
      name: "Title",
      severity: "info",
      status: "passed",
      value: title,
    };
  },
};

export const metaDescriptionCheck: HtmlAuditCheck = {
  id: "meta-description",
  run: (document) => {
    const description = value(document, 'meta[name="description"]', "content");
    if (!description)
      return {
        category: "seo",
        id: "meta-description",
        message: "The page has no meta description.",
        name: "Meta description",
        recommendation: "Add a concise description of the page content.",
        severity: "warning",
        status: "warning",
      };
    return {
      category: "seo",
      id: "meta-description",
      message: "A meta description is present.",
      name: "Meta description",
      severity: "info",
      status: "passed",
      value: description,
    };
  },
};

export const canonicalCheck: HtmlAuditCheck = {
  id: "canonical",
  run: (document) => {
    const canonical = value(document, 'link[rel="canonical"]', "href");
    if (!canonical)
      return {
        category: "seo",
        id: "canonical",
        message: "The page has no canonical URL.",
        name: "Canonical URL",
        recommendation:
          "Add a canonical link to identify the preferred URL for this page.",
        severity: "warning",
        status: "warning",
      };
    return {
      category: "seo",
      id: "canonical",
      message: "A canonical URL is present.",
      name: "Canonical URL",
      severity: "info",
      status: "passed",
      value: canonical,
    };
  },
};

export const robotsMetaCheck: HtmlAuditCheck = {
  id: "robots-meta",
  run: (document) => {
    const robots = value(document, 'meta[name="robots"]', "content");
    if (/noindex/i.test(robots))
      return {
        category: "seo",
        id: "robots-meta",
        message: "The robots meta tag blocks search indexing.",
        name: "Robots meta",
        recommendation:
          "Remove noindex if this page should appear in search results.",
        severity: "critical",
        status: "failed",
        value: robots,
      };
    if (!robots)
      return {
        category: "seo",
        id: "robots-meta",
        message: "No robots meta tag was found; default indexing rules apply.",
        name: "Robots meta",
        severity: "info",
        status: "passed",
      };
    return {
      category: "seo",
      id: "robots-meta",
      message: "The robots meta tag allows indexing.",
      name: "Robots meta",
      severity: "info",
      status: "passed",
      value: robots,
    };
  },
};

export const coreHtmlChecks = [
  titleCheck,
  metaDescriptionCheck,
  canonicalCheck,
  robotsMetaCheck,
];

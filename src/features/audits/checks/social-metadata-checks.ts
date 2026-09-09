import type { HtmlAuditCheck } from "./types";

function openGraphCheck(
  id: string,
  name: string,
  property: string,
  recommendation: string,
): HtmlAuditCheck {
  return {
    id,
    run: (document) => {
      const value = document(`meta[property="${property}"]`)
        .first()
        .attr("content")
        ?.trim();

      if (!value)
        return {
          category: "seo",
          id,
          message: `${name} is missing.`,
          name,
          recommendation,
          severity: "warning",
          status: "warning",
        };

      return {
        category: "seo",
        id,
        message: `${name} is present.`,
        name,
        severity: "info",
        status: "passed",
        value,
      };
    },
  };
}

export const openGraphTitleCheck = openGraphCheck(
  "open-graph-title",
  "Open Graph title",
  "og:title",
  "Add an Open Graph title for shared links.",
);

export const openGraphDescriptionCheck = openGraphCheck(
  "open-graph-description",
  "Open Graph description",
  "og:description",
  "Add an Open Graph description for shared links.",
);

export const openGraphImageCheck = openGraphCheck(
  "open-graph-image",
  "Open Graph image",
  "og:image",
  "Add an Open Graph image for shared links.",
);

export const faviconCheck: HtmlAuditCheck = {
  id: "favicon",
  run: (document) => {
    const value = document('link[rel~="icon"]').first().attr("href")?.trim();

    if (!value)
      return {
        category: "seo",
        id: "favicon",
        message: "No favicon link was found.",
        name: "Favicon",
        recommendation: "Add a favicon link for browser tabs and bookmarks.",
        severity: "warning",
        status: "warning",
      };

    return {
      category: "seo",
      id: "favicon",
      message: "A favicon is declared.",
      name: "Favicon",
      severity: "info",
      status: "passed",
      value,
    };
  },
};

export const socialMetadataChecks = [
  openGraphTitleCheck,
  openGraphDescriptionCheck,
  openGraphImageCheck,
  faviconCheck,
];

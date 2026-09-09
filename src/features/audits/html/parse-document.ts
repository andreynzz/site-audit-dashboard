import * as cheerio from "cheerio";

export function parseHtmlDocument(html: string) {
  return cheerio.load(html);
}

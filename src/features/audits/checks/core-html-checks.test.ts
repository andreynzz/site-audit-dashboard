import { describe, expect, it } from "vitest";
import { parseHtmlDocument } from "../html/parse-document";
import { coreHtmlChecks } from "./core-html-checks";
import { runHtmlChecks } from "./run-html-checks";

describe("core HTML checks", () => {
  it("passes valid metadata", () => {
    const results = runHtmlChecks(
      parseHtmlDocument(
        '<title>Example</title><meta name="description" content="Description"><link rel="canonical" href="https://example.com"><meta name="robots" content="index,follow"><meta property="og:title" content="Example"><meta property="og:description" content="Description"><meta property="og:image" content="https://example.com/image.png"><link rel="icon" href="/favicon.ico">',
      ),
      coreHtmlChecks,
    );
    expect(results.map((result) => result.status)).toEqual([
      "passed",
      "passed",
      "passed",
      "passed",
      "passed",
      "passed",
      "passed",
      "passed",
    ]);
  });

  it("reports missing metadata and noindex", () => {
    const results = runHtmlChecks(
      parseHtmlDocument('<meta name="robots" content="noindex">'),
      coreHtmlChecks,
    );
    expect(results.map((result) => result.status)).toEqual([
      "failed",
      "warning",
      "warning",
      "failed",
      "warning",
      "warning",
      "warning",
      "warning",
    ]);
  });
});

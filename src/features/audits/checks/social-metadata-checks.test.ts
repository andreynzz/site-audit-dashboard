import { describe, expect, it } from "vitest";
import { parseHtmlDocument } from "../html/parse-document";
import { runHtmlChecks } from "./run-html-checks";
import { socialMetadataChecks } from "./social-metadata-checks";

describe("social metadata checks", () => {
  it("passes when all social metadata is declared", () => {
    const document = parseHtmlDocument(`
      <meta property="og:title" content="Example title" />
      <meta property="og:description" content="Example description" />
      <meta property="og:image" content="https://example.com/image.png" />
      <link rel="icon" href="/favicon.ico" />
    `);

    expect(runHtmlChecks(document, socialMetadataChecks)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "open-graph-title", status: "passed" }),
        expect.objectContaining({
          id: "open-graph-description",
          status: "passed",
        }),
        expect.objectContaining({ id: "open-graph-image", status: "passed" }),
        expect.objectContaining({ id: "favicon", status: "passed" }),
      ]),
    );
  });

  it("warns when social metadata is missing", () => {
    const checks = runHtmlChecks(parseHtmlDocument(""), socialMetadataChecks);

    expect(checks.map((check) => check.status)).toEqual([
      "warning",
      "warning",
      "warning",
      "warning",
    ]);
  });
});

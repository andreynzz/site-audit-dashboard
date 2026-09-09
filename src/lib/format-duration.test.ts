import { describe, expect, it } from "vitest";
import { formatDuration } from "./format-duration";
describe("formatDuration", () => {
  it("formats milliseconds below one second", () =>
    expect(formatDuration(680)).toBe("680 ms"));
  it("formats seconds with one decimal place", () =>
    expect(formatDuration(1_250)).toBe("1.3 s"));
});

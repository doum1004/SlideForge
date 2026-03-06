import { describe, expect, it } from "bun:test";
import { buildSlideHtml, quickValidateHtml } from "../../src/renderer/html-builder.js";

describe("quickValidateHtml", () => {
  const VALID = `<!DOCTYPE html><html lang="ko"><head><style>
    body{overflow:hidden;word-break:keep-all}
  </style></head><body>
    <div class="card"><div class="bottom-bar">@test</div></div>
  </body></html>`;

  it("returns empty array for valid HTML", () => {
    expect(quickValidateHtml(VALID)).toEqual([]);
  });

  it("detects missing DOCTYPE", () => {
    const html = VALID.replace("<!DOCTYPE html>", "");
    const issues = quickValidateHtml(html);
    expect(issues).toContain("Missing <!DOCTYPE html>");
  });

  it("detects missing lang=ko", () => {
    const html = VALID.replace('lang="ko"', 'lang="en"');
    const issues = quickValidateHtml(html);
    expect(issues).toContain('Missing lang="ko" attribute');
  });

  it("detects missing overflow:hidden", () => {
    const html = VALID.replace("overflow:hidden", "overflow:auto");
    const issues = quickValidateHtml(html);
    expect(issues.some((i) => i.includes("overflow"))).toBe(true);
  });

  it("detects missing word-break:keep-all", () => {
    const html = VALID.replace("keep-all", "break-word");
    const issues = quickValidateHtml(html);
    expect(issues).toContain("Missing word-break:keep-all");
  });

  it("detects missing bottom-bar", () => {
    const html = VALID.replace("bottom-bar", "footer");
    const issues = quickValidateHtml(html);
    expect(issues).toContain("Missing .bottom-bar element");
  });

  it("detects external URL references", () => {
    const html = VALID.replace("@test", '<img src="https://example.com/img.png"/>');
    const issues = quickValidateHtml(html);
    expect(issues).toContain("Contains external URL reference");
  });

  it("detects http:// as well", () => {
    const html = VALID.replace("@test", '<img src="http://example.com/img.png"/>');
    const issues = quickValidateHtml(html);
    expect(issues).toContain("Contains external URL reference");
  });

  it("can report multiple issues at once", () => {
    const html = "<html><body>no doctype, no lang, no overflow, no keep-all, no bar</body></html>";
    const issues = quickValidateHtml(html);
    expect(issues.length).toBeGreaterThanOrEqual(4);
  });
});

describe("buildSlideHtml", () => {
  it("injects preview CSS into complete HTML", async () => {
    const input = `<!DOCTYPE html><html lang="ko"><head><style>
      body{margin:0}
    </style></head><body><div class="card"></div></body></html>`;

    const result = await buildSlideHtml(input, "default");

    expect(result).toContain("Browser preview");
    expect(result).toContain("CARD_W = 1080");
  });

  it("wraps fragment HTML in full document", async () => {
    const fragment = '<div class="card"><p>Hello</p></div>';
    const result = await buildSlideHtml(fragment, "default");

    expect(result).toContain("<!DOCTYPE html>");
    expect(result).toContain('lang="ko"');
    expect(result).toContain("Hello");
  });

  it("treats <html starting tag as complete", async () => {
    const input = `<html lang="ko"><head><style>body{}</style></head><body></body></html>`;
    const result = await buildSlideHtml(input, "default");

    expect(result).toContain("Browser preview");
    expect(result).not.toContain("<!DOCTYPE html>\n<html lang");
  });

  it("handles non-existent theme gracefully", async () => {
    const fragment = '<div class="card"><p>Test</p></div>';
    const result = await buildSlideHtml(fragment, "non-existent-theme-xyz");

    expect(result).toContain("<!DOCTYPE html>");
    expect(result).toContain("no theme overrides");
  });
});

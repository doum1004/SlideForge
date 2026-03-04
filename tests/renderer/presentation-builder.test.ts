import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { buildPresentation } from "../../src/renderer/presentation-builder.js";

const TMP = join(import.meta.dir, ".tmp-presentation-test");
const SLIDES_DIR = join(TMP, "slides");

const SLIDE_HTML = (n: number) => `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><style>
body{margin:0;width:1080px;height:1440px;overflow:hidden}
</style></head><body><h1>Slide ${n}</h1></body></html>`;

beforeAll(async () => {
  await mkdir(SLIDES_DIR, { recursive: true });
  await writeFile(join(SLIDES_DIR, "slide-01.html"), SLIDE_HTML(1));
  await writeFile(join(SLIDES_DIR, "slide-02.html"), SLIDE_HTML(2));
  await writeFile(join(SLIDES_DIR, "slide-03.html"), SLIDE_HTML(3));
});

afterAll(async () => {
  await rm(TMP, { recursive: true, force: true });
});

describe("buildPresentation", () => {
  it("generates presentation.html in parent directory", async () => {
    const result = await buildPresentation(SLIDES_DIR);
    expect(result).toBe(join(TMP, "presentation.html"));

    const content = await readFile(result, "utf-8");
    expect(content).toContain("<!DOCTYPE html>");
  });

  it("contains all slide content embedded as srcdoc data", async () => {
    const result = await buildPresentation(SLIDES_DIR);
    const content = await readFile(result, "utf-8");

    expect(content).toContain("Slide 1");
    expect(content).toContain("Slide 2");
    expect(content).toContain("Slide 3");
  });

  it("sets TOTAL to correct slide count", async () => {
    const result = await buildPresentation(SLIDES_DIR);
    const content = await readFile(result, "utf-8");

    expect(content).toContain("var TOTAL = 3;");
  });

  it("includes navigation controls", async () => {
    const result = await buildPresentation(SLIDES_DIR);
    const content = await readFile(result, "utf-8");

    expect(content).toContain("nav-prev");
    expect(content).toContain("nav-next");
    expect(content).toContain("thumb-strip");
    expect(content).toContain("btn-fullscreen");
  });

  it("includes keyboard navigation JS", async () => {
    const result = await buildPresentation(SLIDES_DIR);
    const content = await readFile(result, "utf-8");

    expect(content).toContain("ArrowRight");
    expect(content).toContain("ArrowLeft");
    expect(content).toContain("toggleFullscreen");
  });

  it("omits PNG toggle when no PNGs exist", async () => {
    const result = await buildPresentation(SLIDES_DIR);
    const content = await readFile(result, "utf-8");

    expect(content).toContain("var hasPngs = false;");
    expect(content).not.toContain('id="btn-html"');
    expect(content).not.toContain('id="btn-png"');
  });

  it("includes PNG toggle when PNGs exist", async () => {
    await writeFile(join(SLIDES_DIR, "slide-01.png"), Buffer.from("fake-png"));
    await writeFile(join(SLIDES_DIR, "slide-02.png"), Buffer.from("fake-png"));

    const result = await buildPresentation(SLIDES_DIR);
    const content = await readFile(result, "utf-8");

    expect(content).toContain("var hasPngs = true;");
    expect(content).toContain('id="btn-html"');
    expect(content).toContain('id="btn-png"');

    // PNG paths should be relative
    expect(content).toContain("slides/slide-01.png");
    expect(content).toContain("slides/slide-02.png");
  });

  it("throws when slides directory has no HTML files", async () => {
    const emptyDir = join(TMP, "empty-slides");
    await mkdir(emptyDir, { recursive: true });

    expect(buildPresentation(emptyDir)).rejects.toThrow("No slide HTML files found");
  });

  it("extracts title from parent directory name", async () => {
    const dated = join(TMP, "2026-01-01_12-00-00_my-cool-topic", "slides");
    await mkdir(dated, { recursive: true });
    await writeFile(join(dated, "slide-01.html"), SLIDE_HTML(1));

    const result = await buildPresentation(dated);
    const content = await readFile(result, "utf-8");

    expect(content).toContain("my cool topic");
  });

  it("escapes HTML entities in embedded slide content", async () => {
    const htmlWithEntities = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><style>
body{margin:0;width:1080px;height:1440px;overflow:hidden}
</style></head><body><h1>Tom &amp; Jerry's "Show"</h1></body></html>`;

    const escapeDir = join(TMP, "escape-test", "slides");
    await mkdir(escapeDir, { recursive: true });
    await writeFile(join(escapeDir, "slide-01.html"), htmlWithEntities);

    const result = await buildPresentation(escapeDir);
    const content = await readFile(result, "utf-8");

    expect(content).toContain("Tom &amp; Jerry");
    expect(content).toContain("<!DOCTYPE html>");
  });

  it("sorts slides by number", async () => {
    const outOfOrder = join(TMP, "unordered", "slides");
    await mkdir(outOfOrder, { recursive: true });
    await writeFile(join(outOfOrder, "slide-03.html"), SLIDE_HTML(3));
    await writeFile(join(outOfOrder, "slide-01.html"), SLIDE_HTML(1));
    await writeFile(join(outOfOrder, "slide-02.html"), SLIDE_HTML(2));

    const result = await buildPresentation(outOfOrder);
    const content = await readFile(result, "utf-8");

    const srcdocMatch = content.match(/var htmlSrcdocs = (\[[\s\S]*?\]);/);
    expect(srcdocMatch).toBeTruthy();
    const srcdocs: string[] = JSON.parse(srcdocMatch![1]);
    expect(srcdocs[0]).toContain("Slide 1");
    expect(srcdocs[1]).toContain("Slide 2");
    expect(srcdocs[2]).toContain("Slide 3");
  });
});

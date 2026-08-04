import { describe, it, expect } from "vitest";
import { resolveMarkdownAlternate, prefersMarkdown } from "../../worker/index";

// worker/index.ts's Accept-negotiation + RFC 8288 Link-header logic — a
// silent mistake here means either a Link header pointing at a markdown
// file that doesn't exist, or ordinary HTML page loads accidentally
// getting negotiated into markdown for real browsers.
describe("resolveMarkdownAlternate", () => {
  it("maps the homepage to the sitewide llms.txt index", () => {
    expect(resolveMarkdownAlternate("/")).toEqual({
      path: "/llms.txt",
      type: "text/plain",
    });
  });

  it("maps an article page to its own .md route", () => {
    expect(
      resolveMarkdownAlternate(
        "/guides-fixes/fix-eresolve-vite-8-peer-dependency-astro-7/",
      ),
    ).toEqual({
      path: "/guides-fixes/fix-eresolve-vite-8-peer-dependency-astro-7.md",
      type: "text/markdown",
    });
  });

  it("works without a trailing slash", () => {
    expect(resolveMarkdownAlternate("/dev-tools/some-post")).toEqual({
      path: "/dev-tools/some-post.md",
      type: "text/markdown",
    });
  });

  it("returns null for an unknown category", () => {
    expect(
      resolveMarkdownAlternate("/not-a-real-category/some-post/"),
    ).toBeNull();
  });

  it("returns null for category index pages, which have no markdown export", () => {
    expect(resolveMarkdownAlternate("/guides-fixes/")).toBeNull();
  });

  it("returns null for other static pages", () => {
    expect(resolveMarkdownAlternate("/about/")).toBeNull();
    expect(resolveMarkdownAlternate("/rss.xml")).toBeNull();
  });
});

describe("prefersMarkdown", () => {
  it("is false when there is no Accept header", () => {
    expect(prefersMarkdown(new Request("https://bytetech247.com/"))).toBe(
      false,
    );
  });

  it("is true for a bare 'Accept: text/markdown' request", () => {
    const request = new Request("https://bytetech247.com/", {
      headers: { Accept: "text/markdown" },
    });
    expect(prefersMarkdown(request)).toBe(true);
  });

  it("is false for an ordinary browser Accept header (no text/markdown token)", () => {
    const request = new Request("https://bytetech247.com/", {
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
    });
    expect(prefersMarkdown(request)).toBe(false);
  });

  it("is false when text/html has a higher q-value than text/markdown", () => {
    const request = new Request("https://bytetech247.com/", {
      headers: { Accept: "text/html, text/markdown;q=0.5" },
    });
    expect(prefersMarkdown(request)).toBe(false);
  });

  it("is true when text/markdown has a higher or equal q-value than text/html", () => {
    const request = new Request("https://bytetech247.com/", {
      headers: { Accept: "text/markdown, text/html;q=0.5" },
    });
    expect(prefersMarkdown(request)).toBe(true);
  });
});

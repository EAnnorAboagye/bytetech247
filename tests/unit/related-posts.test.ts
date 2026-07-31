import { describe, it, expect } from "vitest";
import { getRelatedPosts } from "../../src/lib/related-posts";

// Deliberately not importing CollectionEntry<"blog"> from astro:content
// here — that type only resolves inside Astro's own build graph, and this
// suite runs under plain Vitest. getRelatedPosts only reads .id and a
// handful of .data fields, so a minimal structural fake is enough and
// keeps this test independent of the content-collection pipeline.
interface FakePost {
  id: string;
  data: { relatedSlugs: string[]; tags: string[]; date: Date };
}

function post(
  id: string,
  tags: string[],
  relatedSlugs: string[] = [],
  date = new Date("2026-01-01"),
): FakePost {
  return { id, data: { relatedSlugs, tags, date } };
}

// build-spec.md Phase 3: "one system with a manual pin and an automatic
// fallback, not two competing sources" — these tests cover exactly that
// contract.
describe("getRelatedPosts", () => {
  it("shows manual relatedSlugs first, even with zero tag overlap", () => {
    const current = post("current", ["docker"], ["manual-pick"]);
    const manualPick = post("manual-pick", []);
    const tagMatch = post("tag-match", ["docker"]);

    const result = getRelatedPosts(
      current as never,
      [current, manualPick, tagMatch] as never,
      2,
    );

    expect(result.map((p) => p.id)).toEqual(["manual-pick", "tag-match"]);
  });

  it("fills remaining slots by tag-overlap score, highest first", () => {
    const current = post("current", ["docker", "git"]);
    const oneTag = post("one-tag", ["docker"]);
    const twoTags = post("two-tags", ["docker", "git"]);
    const noTags = post("no-tags", ["python"]);

    const result = getRelatedPosts(
      current as never,
      [current, oneTag, twoTags, noTags] as never,
      3,
    );

    expect(result.map((p) => p.id)).toEqual(["two-tags", "one-tag"]);
  });

  it("never includes the current post in its own related list", () => {
    const current = post("current", ["docker"]);
    const result = getRelatedPosts(current as never, [current] as never, 3);
    expect(result).toHaveLength(0);
  });

  it("caps the manual list at the display limit", () => {
    const current = post("current", [], ["a", "b", "c"]);
    const a = post("a", []);
    const b = post("b", []);
    const c = post("c", []);

    const result = getRelatedPosts(current as never, [current, a, b, c] as never, 2);

    expect(result).toHaveLength(2);
    expect(result.map((p) => p.id)).toEqual(["a", "b"]);
  });
});

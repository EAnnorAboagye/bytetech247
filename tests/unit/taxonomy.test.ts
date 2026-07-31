import { describe, it, expect } from "vitest";
import { slugifyTag } from "../../src/lib/taxonomy";

// slugifyTag backs the /tag/[tag] route (Stage 5 of the build pipeline) —
// a slug collision or a stray character here means a tag either 404s or
// silently merges with a different tag.
describe("slugifyTag", () => {
  it("lowercases and hyphenates multi-word tags", () => {
    expect(slugifyTag("Cloud Hosting")).toBe("cloud-hosting");
  });

  it("collapses runs of non-alphanumeric characters into one hyphen", () => {
    expect(slugifyTag("C++ / C#")).toBe("c-c");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugifyTag("  .NET  ")).toBe("net");
  });

  it("leaves already-slug-shaped tags unchanged", () => {
    expect(slugifyTag("json-ld")).toBe("json-ld");
  });

  it("produces the same slug for different casings of the same tag", () => {
    expect(slugifyTag("Docker")).toBe(slugifyTag("docker"));
  });
});

import type { CollectionEntry } from "astro:content";
import { render } from "astro:content";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { getContainerRenderer as getMdxRenderer } from "@astrojs/mdx/container-renderer";
import { loadRenderers } from "astro:container";
import { siteConfig } from "../config";
import Figure from "../components/Figure.astro";
import Callout from "../components/Callout.astro";
import CodeTabs from "../components/CodeTabs.astro";
import Benchmark from "../components/Benchmark.astro";

// Same mapping [category]/[slug].astro passes to its own <Content /> —
// every MDX post that reaches for one of these custom components without
// its own explicit import (the site's actual authoring convention) needs
// the container to supply the same mapping, or rendering fails outright
// with "Expected component `X` to be defined."
const MDX_COMPONENTS = { Figure, Callout, CodeTabs, Benchmark };

// Hand-rolled RSS 2.0 rather than pulling in @astrojs/rss — this is the
// entire feed logic in one place, shared by the sitewide and per-category
// feeds (build-spec.md Phase 9), with no extra dependency to keep in sync.
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// content:encoded's payload is arbitrary HTML, not XML — CDATA is what
// lets a "<" or "&" from the rendered article body sit in the feed without
// being (mis)parsed as markup, so this is a different escaping job from
// escapeXml() above. The one byte a CDATA section still can't contain
// literally is "]]>" itself (that's its own close delimiter); splitting it
// across two sections is the standard escape for that one edge case.
function escapeCdata(value: string): string {
  return value.replace(/]]>/g, "]]]]><![CDATA[>");
}

export function postUrl(post: CollectionEntry<"blog">): string {
  return `${siteConfig.url}/${post.data.category}/${post.id}/`;
}

// Renders a post's full MDX body to an HTML string at build time, via
// Astro's container API — the same `Content` component the article page
// itself renders (see [category]/[slug].astro), just rendered to a string
// outside of a normal page request instead of into a page response. Used
// so the RSS feed can carry the full article (content:encoded), not just
// the 160-char meta description — the feed was previously the one AI/GEO
// surface on this site that gave a reader nothing more than a search
// snippet would, sitting oddly next to the llms.txt/.md-export/Accept-
// negotiation machinery that was clearly built with the opposite intent.
// Container instance + MDX renderer are expensive to set up (module
// loading, not just object construction) — created once and reused across
// every post in a feed, not per-post, since a single feed build renders
// every post in the collection.
let containerPromise: ReturnType<typeof AstroContainer.create> | undefined;
async function getSharedContainer() {
  if (!containerPromise) {
    containerPromise = loadRenderers([getMdxRenderer()]).then((renderers) =>
      AstroContainer.create({ renderers }),
    );
  }
  return containerPromise;
}

// Ad markup (rehype-in-article-ads.mjs) is baked into every post's compiled
// MDX at the shared, build-time content-layer pipeline — there's no way to
// conditionally skip it only for this render call, since that pipeline also
// produces the real article page's Content. It has no business in an RSS
// feed regardless: feed readers never load global.css or the AdSense
// script, so a subscriber would see an empty, unstyled "Advertisement" box
// for every ad slot, and the feed would needlessly expose the real AdSense
// publisher ID in public XML. Stripped here instead. Safe as a non-greedy
// match — an .ad-slot div's only children are a <p> label and an empty
// <ins>, no nested </div> to stop the match early on.
function stripAdSlots(html: string): string {
  return html.replace(/<div class="ad-slot"[^>]*>[\s\S]*?<\/div>/g, "");
}

async function renderPostHtml(post: CollectionEntry<"blog">): Promise<string> {
  const { Content } = await render(post);
  const container = await getSharedContainer();
  const html = await container.renderToString(Content, {
    props: { components: MDX_COMPONENTS },
  });
  return stripAdSlots(html);
}

export async function buildRssFeed(options: {
  title: string;
  description: string;
  feedUrl: string;
  posts: CollectionEntry<"blog">[];
}): Promise<string> {
  const { title, description, feedUrl, posts } = options;

  const items = (
    await Promise.all(
      posts.map(async (post) => {
        const url = postUrl(post);
        // Full-article container rendering is new, more surface than the
        // plain-string description this feed used to carry — one post's
        // MDX misbehaving under the container (a component that assumes a
        // real page-request context, say) shouldn't fail the entire
        // Promise.all and take the whole feed down. Falls back to the
        // same description-only <item> shape this feed always had.
        let contentEncoded = "";
        try {
          const html = await renderPostHtml(post);
          contentEncoded = `\n      <content:encoded><![CDATA[${escapeCdata(html)}]]></content:encoded>`;
        } catch (err) {
          console.error(`rss: failed to render full content for ${url}`, err);
        }
        return `    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.data.description)}</description>${contentEncoded}
      <pubDate>${post.data.date.toUTCString()}</pubDate>
    </item>`;
      }),
    )
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${siteConfig.url}</link>
    <description>${escapeXml(description)}</description>
    <language>en-us</language>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { siteConfig, CATEGORIES, TOOLS } from "../config";
import { postUrl } from "../lib/rss";

// Auto-generated at build time from the content collection (build-spec.md
// Phase 9): H1 site name -> blockquote (same description used everywhere
// else, kept in sync by construction since it all reads from siteConfig)
// -> prioritized link list. Capped well under the ~8KB budget.
export const GET: APIRoute = async () => {
  const posts = (await getCollection("blog")).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  const lines: string[] = [];
  lines.push(`# ${siteConfig.name}`);
  lines.push("");
  lines.push(`> ${siteConfig.description}`);
  lines.push("");
  lines.push("## Categories");
  lines.push("");
  for (const category of CATEGORIES) {
    lines.push(`- [${category.name}](${siteConfig.url}/${category.slug}/)`);
  }
  lines.push("");
  lines.push("## Tools");
  lines.push("");
  for (const tool of TOOLS) {
    lines.push(
      `- [${tool.name}](${siteConfig.url}/tools/${tool.slug}/): ${tool.description}`,
    );
  }
  lines.push("");
  lines.push("## Posts");
  lines.push("");
  for (const post of posts.slice(0, 50)) {
    const markdownUrl = `${siteConfig.url}/${post.data.category}/${post.id}.md`;
    lines.push(
      `- [${post.data.title}](${postUrl(post)}): ${post.data.description} (Markdown: ${markdownUrl})`,
    );
  }
  lines.push("");
  lines.push(`## Feeds`);
  lines.push("");
  lines.push(`- [Sitewide RSS](${siteConfig.url}/rss.xml)`);
  lines.push(`- [Sitemap](${siteConfig.url}/sitemap.xml)`);

  const body = lines.join("\n") + "\n";

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { validateCoverImage } from "../../lib/validate-cover-image";
import { validateNoH1InBody } from "../../lib/validate-no-h1-in-body";

// A direct alternative to parsing rendered HTML — the raw post body as
// authored, not a re-rendered/stripped version. This is the single
// highest-leverage GEO technique for making content trivially citable by
// AI agents/answer engines: a plain-text, structured export they don't
// have to scrape a styled page to get.
export async function getStaticPaths() {
  const posts = await getCollection("blog");
  for (const post of posts) {
    validateCoverImage(post);
    validateNoH1InBody(post);
  }
  return posts.map((post) => ({
    params: { category: post.data.category, slug: post.id },
    props: { post },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const post = props.post as Awaited<
    ReturnType<typeof getCollection<"blog">>
  >[number];

  const frontmatter = [
    `title: ${post.data.title}`,
    `description: ${post.data.description}`,
    `date: ${post.data.date.toISOString()}`,
    `category: ${post.data.category}`,
    ...(post.data.tags.length > 0
      ? [`tags: ${post.data.tags.join(", ")}`]
      : []),
  ].join("\n");

  const body = `---\n${frontmatter}\n---\n\n${post.body ?? ""}\n`;

  return new Response(body, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { CATEGORIES, getCategoryName, siteConfig } from "../../config";
import { buildRssFeed } from "../../lib/rss";

export function getStaticPaths() {
  return CATEGORIES.map((category) => ({
    params: { category: category.slug },
  }));
}

export const GET: APIRoute = async ({ params }) => {
  const category = params.category as string;
  const categoryName = getCategoryName(category);

  const posts = (
    await getCollection("blog", (post) => post.data.category === category)
  ).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  const body = await buildRssFeed({
    title: `${siteConfig.name} — ${categoryName}`,
    description: `${categoryName} posts on ${siteConfig.name}.`,
    feedUrl: `${siteConfig.url}/${category}/rss.xml`,
    posts,
  });

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};

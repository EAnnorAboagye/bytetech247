import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { siteConfig } from "../config";
import { buildRssFeed } from "../lib/rss";

export const GET: APIRoute = async () => {
  const posts = (await getCollection("blog")).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  const body = await buildRssFeed({
    title: siteConfig.name,
    description: siteConfig.description,
    feedUrl: `${siteConfig.url}/rss.xml`,
    posts,
  });

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};

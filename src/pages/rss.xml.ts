import rss from "@astrojs/rss";
import { getCollection, type CollectionEntry } from "astro:content";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const site = context.site!;
  const feedUrl = new URL("/rss.xml", site).href;
  const hubUrl = new URL("/websub/hub", site).href;
  const articles = await getCollection("articles", ({ data }: { data: CollectionEntry<"articles">["data"] }) => !data.draft);
  const projects = await getCollection("projects", ({ data }: { data: CollectionEntry<"projects">["data"] }) => !data.draft);
  const notes = await getCollection("notes", ({ data }: { data: CollectionEntry<"notes">["data"] }) => !data.draft);

  const all = [
    ...articles.map((item: CollectionEntry<"articles">) => ({
      title: item.data.title,
      description: item.data.description,
      pubDate: item.data.pubDate,
      link: `/articles/${item.id}/`,
    })),
    ...projects.map((item: CollectionEntry<"projects">) => ({
      title: item.data.title,
      description: item.data.description,
      pubDate: item.data.pubDate,
      link: `/projects/${item.id}/`,
    })),
    ...notes.map((item: CollectionEntry<"notes">) => ({
      title: item.data.title,
      description: "",
      pubDate: item.data.pubDate,
      link: `/notes/${item.id}/`,
    })),
  ].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  return rss({
    title: "Datum Studio",
    description: "Design, craft, and building better spaces. Articles, projects, and notes from Datum Studio.",
    site,
    items: all,
    customData: [
      "<language>en-ca</language>",
      `<atom:link xmlns:atom="http://www.w3.org/2005/Atom" rel="hub" href="${hubUrl}" />`,
      `<atom:link xmlns:atom="http://www.w3.org/2005/Atom" rel="self" type="application/rss+xml" href="${feedUrl}" />`,
    ].join(""),
  });
}

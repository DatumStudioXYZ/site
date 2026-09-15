import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const articles = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/articles" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    author: reference("authors"),
    draft: z.boolean().default(false),
  }),
});

const authors = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/authors" }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    bio: z.string(),
    email: z.string().min(1).optional(),
    avatar: z.string().min(1),
    social: z.object({
      website: z.string().min(1).optional(),
      bluesky: z.string().min(1).optional(),
      nostr: z.string().optional(),
      linkedin: z.string().min(1).optional(),
      github: z.string().min(1).optional(),
    }).optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    status: z.enum(["in-progress", "completed", "archived"]).default("in-progress"),
    category: z.string().default(""),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const notes = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/notes" }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    image: z.object({
      src: z.string(),
      alt: z.string().min(1),
      caption: z.string().optional(),
    }).optional(),
    draft: z.boolean().default(true),
  }),
});

const shorts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/shorts" }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(''),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    videoUrl: z.url(),
    thumbnail: z.url().optional(),
    duration: z.number().optional(),
    draft: z.boolean().default(true),
  }),
});

const videos = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/videos" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    videoUrl: z.url(),
    thumbnail: z.url().optional(),
    duration: z.number().optional(),
    transcript: z.string().optional(),
    draft: z.boolean().default(true),
  }),
});

const site = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/site" }),
  schema: z.object({
    name: z.string().min(1),
    url: z.url(),
    email: z.email(),
    description: z.string().min(1),
    tagline: z.string().min(1),
    serviceArea: z.array(z.string().min(1)).min(1),
    serviceAreaLabel: z.string().min(1),
    defaultImage: z.url(),
    logo: z.url(),
    social: z.object({ bluesky: z.url(), rss: z.string().startsWith("/") }),
    socialLinks: z.array(z.object({
      label: z.string().min(1),
      href: z.string().min(1),
      icon: z.enum(["bluesky", "rss"]),
      rel: z.string().min(1).optional(),
      type: z.string().min(1).optional(),
    })).min(1),
    conversationCopy: z.object({ title: z.string().min(1), body: z.string().min(1), label: z.string().min(1) }),
  }),
});

const services = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/services" }),
  schema: z.object({
    number: z.string().regex(/^\d{2}$/, "must be a two-digit display order"),
    title: z.string().min(1),
    tagline: z.string().min(1),
    description: z.string().min(1),
    approach: z.string().min(1),
    includes: z.array(z.string().min(1)).min(1),
  }),
});

const process = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/process" }),
  schema: z.object({
    number: z.string().regex(/^\d{2}$/, "must be a two-digit display order"),
    title: z.string().min(1),
    summary: z.string().min(1),
    description: z.string().min(1),
    whatHappens: z.array(z.string().min(1)).min(1),
    clientExperience: z.string().min(1),
  }),
});

export const collections = { articles, authors, projects, notes, shorts, videos, site, services, process };

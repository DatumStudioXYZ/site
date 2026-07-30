import { site } from "../data/site";

export type JsonLd = Record<string, unknown>;

export function breadcrumbs(items: Array<{ name: string; path: string }>): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.path, site.url).href,
    })),
  };
}

export const organization = {
  "@type": "Organization",
  name: site.name,
  url: site.url,
} as const;

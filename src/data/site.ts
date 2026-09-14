export const site = {
  name: "Datum Studio",
  url: "https://datumstudio.xyz",
  email: "hello@datumstudio.xyz",
  description: "Datum accepts commissions for thoughtful spaces, custom pieces, and practical systems. Architecture, craft, and technology shaped around everyday life.",
  tagline: "Everything begins with a reference point.",
  serviceArea: ["Golden Horseshoe", "GTA", "Muskoka"],
  serviceAreaLabel: "Golden Horseshoe · GTA · Muskoka · Remote",
  defaultImage: "https://images.datumstudio.xyz/workshop-wide.avif?v=20260730",
  logo: "https://images.datumstudio.xyz/logo.avif",
  social: {
    bluesky: "https://bsky.app/profile/datumstudio.xyz",
    rss: "/rss.xml",
  },
} as const;

export const socialLinks = [
  { label: "Bluesky", href: site.social.bluesky, icon: "bluesky" as const },
  { label: "RSS", href: site.social.rss, icon: "rss" as const, rel: "alternate", type: "application/rss+xml" },
] as const;

export const conversationCopy = {
  title: "Have a project in mind?",
  body: "Datum is open for commissions. Tell us what you want to improve, where the project is, and any timing or budget you have in mind. The first conversation helps define the scope and whether the project is a good fit. Early ideas are welcome.",
  label: "Start a conversation",
} as const;

# Site Infrastructure Overview

Umbrella plan for the Datum site infrastructure work. Individual items are in the roadmap as separate handoff docs.

### Context

- Site project: `sites/datum/`
- Domain: `datumstudio.xyz`
- Images: R2 bucket `datum-images` via `images.datumstudio.xyz`
- Commands: `npm run check`, `npm run build`

### Architecture

```text
datumstudio.xyz (Astro static site on Cloudflare Pages)
├── images -> R2 bucket datum-images via images.datumstudio.xyz
├── /api/contact -> Cloudflare Pages Function (KV + Turnstile)
├── ActivityPub endpoints -> Cloudflare Worker (Fedify)
│   ├── WebFinger
│   ├── actor profile
│   ├── inbox/outbox
│   └── follower management
├── Nostr publishing -> Cloudflare Pages Function
│   ├── signs events with @noble/curves
│   └── publishes to configured relays
├── AT Protocol publishing -> Bluesky ecosystem
├── WebSub hub -> Cloudflare Worker (D1)
│   ├── subscription management
│   └── content distribution with HMAC
└── Auto-publish hook -> build-time or post-build trigger
```

### Decisions

1. **Relay selection** - `relay.damus.io`, `relay.nostr.band`, `nos.lol`.
2. **Fediverse content format** - Full article text in Note, not summary with link.
3. **Nostr content format** - NIP-23 kind 30023 for articles, kind 1 for notes.
4. **Actor identity** - ActivityPub accounts follow `acct:[AUTHOR]@datumstudio.xyz`; Gavin is the main author, so the first actor is `acct:gavin@datumstudio.xyz`.
5. **Content sync security** - Shared Cloudflare secret between Pages Function and AP Worker. Internal request, no GitHub involvement.
6. **Nostr trigger** - On build via `npm run build && npm run publish:nostr`.
7. **Fediverse visibility** - All outbox articles public with `to: ["https://www.w3.org/ns/activitystreams#Public"]`.
8. **HTML sanitization** - Strip `<script>` tags, event handlers, and `javascript:` URIs before publishing ActivityPub content.
9. **Video storage** - R2 bucket `datum-videos` via `videos.datumstudio.xyz`. Separate from images.
10. **Image crops** - 9:16 at 1080x1920 and 4:5 at 1080x1350, AVIF format, created at upload time.
11. **Thumbnails** - Video-independent images, same crop variants as regular images.
12. **Publishing matrix** - Articles/projects -> Nostr, ActivityPub, AT Protocol, Facebook. Notes -> all platforms. Shorts -> YouTube Shorts, TikTok, Instagram Reels, Facebook Reels. Video -> YouTube, Instagram, Facebook.
13. **Facebook** - Supports 9:16 natively for posts and vertical video.
14. **Build trigger** - `postbuild` may run publish automatically only after guardrails exist. `npm run publish` remains separate for testing.

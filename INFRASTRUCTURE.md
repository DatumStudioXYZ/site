# Site Infrastructure Overview

Umbrella plan for the Datum site infrastructure work. Individual items are in the roadmap as separate handoff docs.

### Context

- Site project: this repository (`/Users/gavin/Projects/Datum Workspace/site`)
- Domain: `datumstudio.xyz`
- Images: R2 bucket `datum-images` via `images.datumstudio.xyz`
- Commands: `npm run verify` before release; publishing commands are separate and opt-in.

### Implemented architecture

```text
datumstudio.xyz (Astro static site on Cloudflare Pages)
├── images -> R2 bucket datum-images via images.datumstudio.xyz
├── /api/contact -> Cloudflare Pages Function (Turnstile + KV retention)
├── ActivityPub endpoints -> separate Cloudflare Worker (planned; not verified here)
│   ├── WebFinger
│   ├── actor profile
│   ├── inbox/outbox
│   └── follower management
├── Nostr publishing -> local publishing script plus a site endpoint (partial; not release-critical)
│   ├── signs events with @noble/curves
│   └── publishes to configured relays
├── AT Protocol publishing -> separate local script (partial; articles and notes only)
├── WebSub hub -> Cloudflare Worker (planned)
│   ├── subscription management
│   └── content distribution with HMAC
└── Auto-publish hook -> not enabled; builds and previews do not publish
```

The contact endpoint stores accepted messages for 90 days after server-side Turnstile verification. A monitored inbox, notification delivery, and recovery process are not yet documented or verified; storage alone is not a completed inquiry workflow.

### Planned architecture

The remaining federation, multi-platform publishing, and automatic publishing concepts below are plans, not established release capabilities. Keep them out of the release path until a single documented distribution route has been verified end-to-end.

### Decisions

1. **Relay selection** - `relay.damus.io`, `relay.nostr.band`, `nos.lol`.
2. **Fediverse content format** - Full article text in Note, not summary with link.
3. **Nostr content format** - NIP-23 kind 30023 for articles, kind 1 for notes.
4. **Actor identity** - ActivityPub accounts follow `acct:[AUTHOR]@datumstudio.xyz`; Gavin is the main author, so the first actor is `acct:gavin@datumstudio.xyz`.
5. **Content sync security** - Shared Cloudflare secret between Pages Function and AP Worker. Internal request, no GitHub involvement.
6. **Nostr trigger** - Deferred. Builds must not trigger publishing.
7. **Fediverse visibility** - All outbox articles public with `to: ["https://www.w3.org/ns/activitystreams#Public"]`.
8. **HTML sanitization** - Strip `<script>` tags, event handlers, and `javascript:` URIs before publishing ActivityPub content.
9. **Video storage** - R2 bucket `datum-videos` via `videos.datumstudio.xyz`. Separate from images.
10. **Image crops** - 9:16 at 1080x1920 and 4:5 at 1080x1350, AVIF format, created at upload time.
11. **Thumbnails** - Video-independent images, same crop variants as regular images.
12. **Publishing matrix** - Deferred plan, not current capability. Choose and verify one distribution route before enabling other destinations.
13. **Facebook** - Supports 9:16 natively for posts and vertical video.
14. **Build trigger** - No automatic publication. `npm run verify` is release validation only; all publishing commands remain explicit and require an owner review.

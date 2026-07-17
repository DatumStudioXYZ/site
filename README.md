# Datum Studio

A static Astro brochure site for Datum Studio.

## Local development

```sh
npm install
npm run dev
```

## Production build

```sh
npm run build
```

Astro writes the deployable static site to `dist/`. There is no server runtime, React, database, or API dependency.

## Cloudflare Pages

Connect this repository in Cloudflare Pages and use:

- Build command: `npm run build`
- Build output directory: `dist`
- Node.js version: 22

The contact form submits to a Cloudflare Pages Function that stores submissions in KV. Set `TURNSTILE_SECRET` as an encrypted secret in the Cloudflare dashboard. Update `TURNSTILE_SITE_KEY` in `wrangler.jsonc` after creating the Turnstile widget.

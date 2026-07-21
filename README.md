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

## Secrets and configuration

The site keeps a committed example at `.env.example`. Local plaintext secrets should not be committed.

Current runtime secret:

- `TURNSTILE_SECRET` — Cloudflare Turnstile secret key for contact form verification. Store this as an encrypted Cloudflare Pages secret.

Public or non-secret configuration:

- `CLOUDFLARE_PAGES_PROJECT_NAME` — Cloudflare Pages project name.
- `NOSTR_RELAYS` — comma-separated public relay URLs.
- `BLUESKY_HANDLE` — public Bluesky handle.
- `R2_IMAGES_BUCKET` — public image bucket name.
- `R2_IMAGES_PUBLIC_URL` — public image CDN URL.
- `R2_VIDEOS_BUCKET` — public video bucket name.
- `R2_VIDEOS_PUBLIC_URL` — public video CDN URL.

Publishing and automation secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_PAGES_BUILD_HOOK_URL`
- `NOSTR_PRIVATE_KEY`
- `BLUESKY_APP_PASSWORD`
- `WEBSUB_HUB_SECRET`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REFRESH_TOKEN`
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- `TIKTOK_ACCESS_TOKEN`
- `TIKTOK_REFRESH_TOKEN`
- `INSTAGRAM_APP_ID`
- `INSTAGRAM_APP_SECRET`
- `INSTAGRAM_ACCESS_TOKEN`
- `INSTAGRAM_BUSINESS_ACCOUNT_ID`
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `FACEBOOK_PAGE_ID`
- `FACEBOOK_PAGE_ACCESS_TOKEN`
- `TWITTER_API_KEY`
- `TWITTER_API_SECRET`
- `TWITTER_ACCESS_TOKEN`
- `TWITTER_ACCESS_TOKEN_SECRET`
- `TWITTER_BEARER_TOKEN`

Root repository secrets are encrypted with SOPS. Set `DATUM_SOPS_AGE_KEY_FILE` to the local age private key file, then use the root `secretes` helper:

```sh
./secretes encrypt
./secretes decrypt
```

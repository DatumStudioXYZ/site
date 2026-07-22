# Publishing

How content gets from this repo to the public.

## Commands

| Command | What it does | Safe to run locally? |
|---|---|---|
| `npm run dev` | Local dev server. No publishing. | Yes |
| `npm run build` | Static build to `dist/`. No publishing. | Yes |
| `npm run publish:dry-run` | Shows what would publish without actually publishing. | Yes |
| `npm run publish:all` | Builds and publishes to all configured platforms. | **No — publishes publicly** |
| `npm run publish:platform` | Same as `publish:all` but only to a specific platform. | **No — publishes publicly** |
| `npm run publish` | Legacy Nostr-only publish (builds first). | **No — publishes publicly** |

### Publishing to a single platform

```bash
# Publish only to Nostr
npm run publish:platform -- --platform nostr
```

### Dry-run first

Always run the dry-run before a real publish to verify what will be sent:

```bash
npm run publish:dry-run
```

## Environment variables

Required before any real publish:

| Variable | Platform | Purpose |
|---|---|---|
| `NOSTR_PRIVATE_KEY` | Nostr | Hex-encoded private key for signing events |
| `NOSTR_RELAYS` | Nostr | Comma-separated relay URLs (optional, has defaults) |
| `BLUESKY_HANDLE` | Bluesky | Account handle; use `datumstudio.xyz` after domain verification |
| `BLUESKY_APP_PASSWORD` | Bluesky | App password used only by the publishing script |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare | Account ID for D1 access |
| `CLOUDFLARE_API_TOKEN` | Cloudflare | API token with D1 read/write permissions |

## Publish log

Every publish is recorded in a JSON log file (local) or D1 table (production).

- **Local:** `scripts/publish-log.json` — created automatically, gitignored.
- **Production:** D1 database — requires Cloudflare environment variables above.

The log tracks: what was published, when, which platform, and the event/content IDs returned.

## Bluesky setup

1. Create the Datum account with a temporary `bsky.social` handle.
2. In Bluesky, open **Settings → Account → Handle → I have my own domain**.
3. Add the requested `_atproto` TXT record to `datumstudio.xyz` in Cloudflare DNS, then verify it so the handle becomes `@datumstudio.xyz`.
4. Create an app password in **Settings → Privacy and Security → App Passwords**. Store it as `BLUESKY_APP_PASSWORD`; never use the account password in automation.
5. Confirm the credentials without publishing:

   ```sh
   npm run publish:atproto:dry-run
   ```

6. Publish only after reviewing the dry-run:

   ```sh
   npm run publish:atproto
   ```

The site links to `@datumstudio.xyz` and offers a no-authentication “Share on Bluesky” action on articles, notes, and project pages.

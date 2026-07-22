import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';

const SITE_URL = process.env.SITE_URL ?? 'https://datumstudio.xyz';
const BLUESKY_HANDLE = process.env.BLUESKY_HANDLE;
const BLUESKY_APP_PASSWORD = process.env.BLUESKY_APP_PASSWORD;

const CONTENT_DIR = join(import.meta.dirname ?? '.', '..', 'src', 'content');
const PUBLISH_LOG = join(import.meta.dirname ?? '.', '..', '.publish-log-atproto.json');

const DRY_RUN = process.argv.includes('--dry-run');
const MAX_POST_LENGTH = 300;

interface ContentItem {
  collection: 'articles' | 'notes';
  slug: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

interface PublishLog {
  published: Record<string, string>;
}

function parseFrontmatter(raw: string): { frontmatter: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: raw };

  const fm: Record<string, unknown> = {};
  let currentKey = '';
  let inArray = false;
  let arrayItems: string[] = [];

  for (const line of match[1].split('\n')) {
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kvMatch && !inArray) {
      currentKey = kvMatch[1];
      const val = kvMatch[2].trim();
      if (val === '' || val === '[]') {
        inArray = true;
        arrayItems = [];
      } else if (val === 'true') {
        fm[currentKey] = true;
      } else if (val === 'false') {
        fm[currentKey] = false;
      } else {
        fm[currentKey] = val.replace(/^["']|["']$/g, '');
      }
    } else if (inArray && line.match(/^  - (.+)$/)) {
      arrayItems.push(line.replace(/^  - /, '').replace(/^["']|["']$/g, ''));
    } else if (inArray && !line.match(/^  - /)) {
      fm[currentKey] = arrayItems;
      inArray = false;
      if (kvMatch) {
        currentKey = kvMatch[1];
        const val = kvMatch[2].trim();
        if (val === '' || val === '[]') {
          inArray = true;
          arrayItems = [];
        } else if (val === 'true') {
          fm[currentKey] = true;
        } else if (val === 'false') {
          fm[currentKey] = false;
        } else {
          fm[currentKey] = val.replace(/^["']|["']$/g, '');
        }
      }
    }
  }
  if (inArray) fm[currentKey] = arrayItems;

  return { frontmatter: fm, body: match[2] };
}

async function readCollection(dir: string): Promise<ContentItem[]> {
  const items: ContentItem[] = [];
  try {
    const files = await readdir(dir, { withFileTypes: true });
    for (const file of files) {
      if (!file.isFile()) continue;
      const ext = extname(file.name);
      if (ext !== '.md' && ext !== '.mdx') continue;
      const slug = basename(file.name, ext);
      const raw = await readFile(join(dir, file.name), 'utf-8');
      const { frontmatter, body } = parseFrontmatter(raw);
      items.push({ collection: dir.includes('articles') ? 'articles' : 'notes', slug, frontmatter, body });
    }
  } catch {
    // directory may not exist yet
  }
  return items;
}

async function loadPublishLog(): Promise<PublishLog> {
  try {
    const raw = await readFile(PUBLISH_LOG, 'utf-8');
    return JSON.parse(raw) as PublishLog;
  } catch {
    return { published: {} };
  }
}

async function savePublishLog(log: PublishLog): Promise<void> {
  await writeFile(PUBLISH_LOG, JSON.stringify(log, null, 2) + '\n');
}

function stripFrontmatter(body: string): string {
  return body.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
}

function graphemes(value: string): string[] {
  return [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(value)].map(({ segment }) => segment);
}

function fitPost(prefix: string, url: string): string {
  const separator = '\n\n';
  const reserved = graphemes(`${separator}${url}`).length;
  const available = MAX_POST_LENGTH - reserved;
  const prefixGraphemes = graphemes(prefix);

  if (prefixGraphemes.length <= available) return `${prefix}${separator}${url}`;

  return `${prefixGraphemes.slice(0, Math.max(0, available - 1)).join('').trimEnd()}…${separator}${url}`;
}

function buildArticlePost(item: ContentItem): string {
  const title = (item.frontmatter.title as string) ?? item.slug;
  const description = (item.frontmatter.description as string) ?? '';
  const url = `${SITE_URL}/articles/${item.slug}/`;
  return fitPost(description ? `${title}\n\n${description}` : title, url);
}

function buildNotePost(item: ContentItem): string {
  const text = stripFrontmatter(item.body);
  if (text.length <= MAX_POST_LENGTH) return text;
  const title = (item.frontmatter.title as string) ?? item.slug;
  const url = `${SITE_URL}/notes/${item.slug}/`;
  return fitPost(title, url);
}

async function main() {
  const log = await loadPublishLog();

  const articles = await readCollection(join(CONTENT_DIR, 'articles'));
  const notes = await readCollection(join(CONTENT_DIR, 'notes'));
  const all = [...articles, ...notes];

  if (!DRY_RUN && (!BLUESKY_HANDLE || !BLUESKY_APP_PASSWORD)) {
    console.error('BLUESKY_HANDLE and BLUESKY_APP_PASSWORD must be set');
    process.exit(1);
  }

  const { AtpAgent, RichText } = await import('@atproto/api');
  const agent = new AtpAgent({ service: 'https://bsky.social' });

  if (!DRY_RUN) {
    console.log(`Authenticating as ${BLUESKY_HANDLE}...`);
    await agent.login({ identifier: BLUESKY_HANDLE!, password: BLUESKY_APP_PASSWORD! });
    console.log('Authenticated.');
  }

  let published = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of all) {
    const isDraft = item.frontmatter.draft === true;
    if (isDraft) {
      console.log(`  skipped (draft): ${item.collection}/${item.slug}`);
      skipped++;
      continue;
    }

    const key = `${item.collection}/${item.slug}`;
    if (log.published[key]) {
      console.log(`  skipped (already published): ${key}`);
      skipped++;
      continue;
    }

    const text = item.collection === 'articles' ? buildArticlePost(item) : buildNotePost(item);

    if (DRY_RUN) {
      console.log(`  dry-run: ${key}`);
      console.log(`    text: ${text.slice(0, 80)}${text.length > 80 ? '...' : ''}`);
      published++;
      continue;
    }

    console.log(`  publishing: ${key}`);
    try {
      const richText = new RichText({ text });
      await richText.detectFacets(agent);

      const record = {
        $type: 'app.bsky.feed.post' as const,
        text: richText.text,
        facets: richText.facets,
        createdAt: new Date().toISOString(),
      };

      const res = await agent.post(record);
      log.published[key] = res.uri;
      await savePublishLog(log);
      published++;
      console.log(`    ok (${res.uri})`);
    } catch (err) {
      console.error(`    failed:`, err);
      failed++;
    }
  }

  console.log(`\nDone: ${published} published, ${skipped} skipped (draft/dup), ${failed} failed`);
}

main();

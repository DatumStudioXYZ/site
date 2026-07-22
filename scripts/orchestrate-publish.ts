import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import { CONTENT_COLLECTIONS, PUBLISH_MATRIX, getAvailablePlatforms, type CollectionType } from '../lib/platform-config.ts';
import { createPublisher, type ContentItem } from '../lib/publish-stub.ts';

const CONTENT_DIR = join(import.meta.dirname ?? '.', '..', 'src', 'content');
const PUBLISH_LOG_PATH = join(import.meta.dirname ?? '.', '..', '.publish-log.json');

const args = process.argv.slice(2);
const dryRun = !args.includes('--no-dry-run');
const platformIdx = args.indexOf('--platform');
const platformFilter = platformIdx !== -1 && args[platformIdx + 1] ? args[platformIdx + 1] : undefined;

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

async function readCollection(collection: CollectionType): Promise<ContentItem[]> {
  const dir = join(CONTENT_DIR, collection);
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
      items.push({ collection, slug, frontmatter, body });
    }
  } catch {
    // directory may not exist yet
  }
  return items;
}

interface LogEntry {
  content_id: string;
  collection: string;
  platform: string;
  status: string;
  external_id?: string;
  attempts: number;
  last_error?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

async function loadLog(): Promise<LogEntry[]> {
  try {
    const raw = await readFile(PUBLISH_LOG_PATH, 'utf-8');
    return JSON.parse(raw).entries ?? [];
  } catch {
    return [];
  }
}

async function saveLog(entries: LogEntry[]): Promise<void> {
  await writeFile(PUBLISH_LOG_PATH, JSON.stringify({ entries }, null, 2) + '\n');
}

function isPublished(log: LogEntry[], contentId: string, platform: string): boolean {
  return log.some((e) => e.content_id === contentId && e.platform === platform && e.status === 'success');
}

async function main() {
  console.log(`\nPublish orchestrator${dryRun ? ' (dry run)' : ''}\n`);

  const availablePlatforms = getAvailablePlatforms();
  if (availablePlatforms.length) {
    console.log(`Available platforms: ${availablePlatforms.join(', ')}`);
  } else {
    console.log(`Available platforms: none (set credentials in .env)`);
  }
  if (platformFilter) {
    console.log(`Platform filter: ${platformFilter}`);
  }

  const log = await loadLog();
  let draftsSkipped = 0;
  let alreadyPublished = 0;
  let wouldPublish = 0;
  let published = 0;
  let skippedNoCreds = 0;
  let failed = 0;

  for (const collection of CONTENT_COLLECTIONS) {
    const items = await readCollection(collection);
    const drafts = items.filter((i) => i.frontmatter.draft === true);
    const publishable = items.filter((i) => i.frontmatter.draft !== true);
    draftsSkipped += drafts.length;

    console.log(`\n${collection}: ${items.length} total, ${publishable.length} publishable, ${drafts.length} drafts`);

    for (const item of publishable) {
      const contentId = `${collection}/${item.slug}`;
      const eligiblePlatforms = [...PUBLISH_MATRIX[collection]]
        .filter((p) => !platformFilter || p === platformFilter);

      console.log(`\n  ${item.frontmatter.title ?? item.slug} (${contentId}):`);

      for (const platform of eligiblePlatforms) {
        if (isPublished(log, contentId, platform)) {
          console.log(`    ${platform}: already published`);
          alreadyPublished++;
          continue;
        }

        if (!availablePlatforms.includes(platform)) {
          console.log(`    ${platform}: skipped (no credentials)`);
          skippedNoCreds++;
          continue;
        }

        if (dryRun) {
          console.log(`    ${platform}: would publish`);
          wouldPublish++;
          continue;
        }

        const publisher = createPublisher(platform);
        console.log(`    ${platform}: publishing...`);
        try {
          const result = await publisher.publish(item);
          if (result.ok) {
            published++;
            console.log(`    ${platform}: ok${result.externalId ? ` (${result.externalId.slice(0, 8)}...)` : ''}`);
            log.push({
              content_id: contentId,
              collection,
              platform,
              status: 'success',
              external_id: result.externalId,
              attempts: 1,
              published_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          } else {
            failed++;
            console.log(`    ${platform}: failed: ${result.error}`);
            log.push({
              content_id: contentId,
              collection,
              platform,
              status: 'failed',
              last_error: result.error,
              attempts: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        } catch (err) {
          failed++;
          console.log(`    ${platform}: error: ${err}`);
        }
      }
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Drafts skipped:    ${draftsSkipped}`);
  console.log(`Already published: ${alreadyPublished}`);
  if (dryRun) {
    console.log(`Would publish:     ${wouldPublish}`);
  } else {
    console.log(`Published:         ${published}`);
  }
  console.log(`No credentials:    ${skippedNoCreds}`);
  console.log(`Failed:            ${failed}`);

  if (!dryRun && (published > 0 || failed > 0)) {
    await saveLog(log);
    console.log(`\nPublish log saved to .publish-log.json`);
  }

  console.log(dryRun ? `\nDry run complete. Use --no-dry-run to publish.` : `\nPublish complete.`);
}

main();

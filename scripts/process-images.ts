#!/usr/bin/env node
import sharp from 'sharp';
import { readdir, stat, mkdir } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';

const CROPS = [
  { name: '9x16', width: 1080, height: 1920, label: '9:16' },
  { name: '4x5', width: 1080, height: 1350, label: '4:5' },
] as const;

const OUTPUT_FORMAT = 'avif';
const OUTPUT_QUALITY = 80;

interface ProcessResult {
  original: string;
  variants: { name: string; width: number; height: number; path: string }[];
}

async function processImage(
  inputPath: string,
  outputDir: string
): Promise<ProcessResult> {
  const meta = await sharp(inputPath).metadata();
  const stem = basename(inputPath, extname(inputPath));

  await mkdir(outputDir, { recursive: true });

  const variants: ProcessResult['variants'] = [];

  for (const crop of CROPS) {
    const outputPath = join(outputDir, `${stem}-${crop.name}.${OUTPUT_FORMAT}`);

    await sharp(inputPath)
      .resize(crop.width, crop.height, {
        fit: 'cover',
        position: 'centre',
      })
      .avif({ quality: OUTPUT_QUALITY })
      .toFile(outputPath);

    variants.push({
      name: crop.name,
      width: crop.width,
      height: crop.height,
      path: outputPath,
    });
  }

  return { original: inputPath, variants };
}

async function processDirectory(
  inputDir: string,
  outputDir: string
): Promise<ProcessResult[]> {
  const results: ProcessResult[] = [];
  const entries = await readdir(inputDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = extname(entry.name).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) continue;

    const inputPath = join(inputDir, entry.name);
    const result = await processImage(inputPath, outputDir);
    results.push(result);
    console.log(`  ${entry.name} → ${result.variants.length} variants`);
  }

  return results;
}

async function main() {
  const inputArg = process.argv[2];
  const outputArg = process.argv[3] ?? 'processed-images';

  if (!inputArg) {
    console.error('Usage: process-images <input-path> [output-dir]');
    console.error('  input-path: image file or directory');
    console.error('  output-dir: defaults to processed-images/');
    process.exit(1);
  }

  const inputStat = await stat(inputArg);
  let results: ProcessResult[];

  if (inputStat.isDirectory()) {
    console.log(`Processing directory: ${inputArg}`);
    results = await processDirectory(inputArg, outputArg);
  } else {
    console.log(`Processing file: ${inputArg}`);
    const result = await processImage(inputArg, outputArg);
    results = [result];
  }

  console.log(`\nProcessed ${results.length} image(s):`);
  for (const r of results) {
    console.log(`  ${basename(r.original)}:`);
    for (const v of r.variants) {
      console.log(`    ${v.label} (${v.width}x${v.height}) → ${basename(v.path)}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

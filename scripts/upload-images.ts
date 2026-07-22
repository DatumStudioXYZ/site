#!/usr/bin/env node
import sharp from 'sharp';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { readFile, stat } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { writeFile, mkdir } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

const CROPS = [
  { name: '9x16', width: 1080, height: 1920 },
  { name: '4x5', width: 1080, height: 1350 },
] as const;

const OUTPUT_FORMAT = 'avif';
const OUTPUT_QUALITY = 80;

const R2_BUCKET = process.env.R2_IMAGES_BUCKET ?? 'datum-images';
const R2_PUBLIC_URL = process.env.R2_IMAGES_PUBLIC_URL ?? 'https://images.datumstudio.xyz';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID ?? ''}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
});

interface ImageMetadata {
  src: string;
  alt: string;
  variants: {
    name: string;
    width: number;
    height: number;
    src: string;
  }[];
}

async function keyExists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadToR2(key: string, body: Buffer, contentType: string): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

async function processAndUpload(
  inputPath: string,
  alt: string
): Promise<ImageMetadata> {
  const stem = basename(inputPath, extname(inputPath));
  const ext = extname(inputPath);
  const originalKey = `originals/${stem}${ext}`;
  const alreadyExists = await keyExists(originalKey);

  if (alreadyExists) {
    console.log(`  ${stem}: already uploaded, skipping`);
  } else {
    const originalBuffer = await readFile(inputPath);
    const contentType = getContentType(inputPath);
    await uploadToR2(originalKey, originalBuffer, contentType);
    console.log(`  ${stem}: uploaded original`);
  }

  const variants: ImageMetadata['variants'] = [];
  const tmpDir = join(tmpdir(), `datum-img-${randomBytes(4).toString('hex')}`);
  await mkdir(tmpDir, { recursive: true });

  for (const crop of CROPS) {
    const variantKey = `crops/${stem}-${crop.name}.${OUTPUT_FORMAT}`;
    const variantExists = await keyExists(variantKey);

    if (variantExists) {
      console.log(`  ${stem}: ${crop.name} variant exists, skipping`);
    } else {
      const tmpPath = join(tmpDir, `${stem}-${crop.name}.${OUTPUT_FORMAT}`);
      await sharp(inputPath)
        .resize(crop.width, crop.height, {
          fit: 'cover',
          position: 'centre',
        })
        .avif({ quality: OUTPUT_QUALITY })
        .toFile(tmpPath);

      const variantBuffer = await readFile(tmpPath);
      await uploadToR2(variantKey, variantBuffer, 'image/avif');
      console.log(`  ${stem}: uploaded ${crop.name} variant`);
    }

    variants.push({
      name: crop.name,
      width: crop.width,
      height: crop.height,
      src: `${R2_PUBLIC_URL}/${variantKey}`,
    });
  }

  return {
    src: `${R2_PUBLIC_URL}/${originalKey}`,
    alt,
    variants,
  };
}

function getContentType(path: string): string {
  const ext = extname(path).toLowerCase();
  const types: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
  };
  return types[ext] ?? 'application/octet-stream';
}

async function main() {
  const inputArg = process.argv[2];
  const altArg = process.argv[3];

  if (!inputArg || !altArg) {
    console.error('Usage: upload-images <image-path> <alt-text>');
    console.error('  image-path: local image file');
    console.error('  alt-text: descriptive alt text for the image');
    process.exit(1);
  }

  const inputStat = await stat(inputArg);
  if (!inputStat.isFile()) {
    console.error('Input must be a file, not a directory');
    process.exit(1);
  }

  if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    console.error('R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY must be set');
    process.exit(1);
  }

  console.log(`Processing and uploading: ${inputArg}`);
  const metadata = await processAndUpload(inputArg, altArg);

  console.log('\nMetadata for frontmatter:');
  console.log(JSON.stringify(
    {
      image: {
        src: metadata.src,
        alt: metadata.alt,
        variants: Object.fromEntries(
          metadata.variants.map((v) => [v.name, v.src])
        ),
      },
    },
    null,
    2
  ));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Halı thumb üretici
 * ------------------
 * assets/carpets içindeki görsellerden assets/carpets-thumbs altında webp thumbnail üretir.
 *
 * Kullanım:
 *   node scripts/generate-carpet-thumbs.js
 *
 * Opsiyonel env:
 *   THUMB_WIDTH=420
 *   THUMB_QUALITY=68
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC_DIR = path.join(__dirname, '..', 'assets', 'carpets');
const OUT_DIR = path.join(__dirname, '..', 'assets', 'carpets-thumbs');
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

const THUMB_WIDTH = Number(process.env.THUMB_WIDTH || 420);
const THUMB_QUALITY = Number(process.env.THUMB_QUALITY || 68);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function walkFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (IMAGE_EXTENSIONS.has(ext)) {
      files.push(fullPath);
    }
  }
  return files;
}

function toThumbPath(sourceFile) {
  const relative = path.relative(SRC_DIR, sourceFile);
  const parsed = path.parse(relative);
  return path.join(OUT_DIR, parsed.dir, `${parsed.name}.webp`);
}

async function generateOne(sourceFile) {
  const targetFile = toThumbPath(sourceFile);
  ensureDir(path.dirname(targetFile));
  await sharp(sourceFile)
    .rotate()
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: THUMB_QUALITY, effort: 4 })
    .toFile(targetFile);
  return targetFile;
}

async function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error('assets/carpets bulunamadi.');
    process.exit(1);
  }

  ensureDir(OUT_DIR);
  const files = walkFiles(SRC_DIR);
  if (files.length === 0) {
    console.log('Islenecek gorsel bulunamadi.');
    return;
  }

  console.log(`Thumb uretimi basliyor: ${files.length} dosya`);
  let done = 0;
  for (const file of files) {
    await generateOne(file);
    done += 1;
    if (done % 100 === 0 || done === files.length) {
      console.log(`  ${done}/${files.length}`);
    }
  }

  console.log(`Tamamlandi. Cikti klasoru: ${OUT_DIR}`);
}

main().catch((error) => {
  console.error('Thumb uretimi basarisiz:', error);
  process.exit(1);
});


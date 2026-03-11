#!/usr/bin/env node
/**
 * Generates data/landing-catalog.json from data/carpets.json
 * Picks 12 diverse carpets per brand (from different collections).
 * Run: node scripts/generate-landing-catalog.js
 * Also runs automatically via `npm run carpets:catalog`.
 */
const fs = require('fs');
const path = require('path');

const carpetsPath = path.join(__dirname, '..', 'data', 'carpets.json');
const outPath = path.join(__dirname, '..', 'data', 'landing-catalog.json');

const BRAND_DISPLAY = {
  Atlas: 'Atlas',
  Bahariye: 'Bahariye',
  Diora: 'Diora',
  Dolce_Vita: 'Dolce Vita',
  Elexus: 'Elexus',
  Empara: 'Empara',
  Ipek: 'İpek',
  Artemis: 'Artemis',
  Jusco: 'Jusco',
  Karmen: 'Karmen',
  Kreasyon: 'Kreasyon',
  Merinos: 'Merinos',
  Padisah: 'Padişah',
  Pierre_Cardin: 'Pierre Cardin',
  Royal_Hali: 'Royal Halı',
  Seyran: 'Seyran',
};

const carpets = JSON.parse(fs.readFileSync(carpetsPath, 'utf8'));

// Group by brand → collection
const brands = {};
for (const c of carpets) {
  const parts = c.imagePath.split('/');
  const brand = parts[1];
  const collection = parts[2];
  if (!brands[brand]) brands[brand] = {};
  if (!brands[brand][collection]) brands[brand][collection] = [];
  brands[brand][collection].push({ thumbPath: c.thumbPath, imagePath: c.imagePath });
}

// Pick 12 diverse carpets per brand (round-robin across collections)
const catalog = {};

for (const brand of Object.keys(brands).sort()) {
  const displayName = BRAND_DISPLAY[brand] || brand;
  const collections = Object.keys(brands[brand]);
  const picked = [];
  let ci = 0;

  while (picked.length < 12 && ci < collections.length * 3) {
    const col = collections[ci % collections.length];
    const idx = Math.floor(ci / collections.length);
    if (idx < brands[brand][col].length) {
      picked.push(brands[brand][col][idx]);
    }
    ci++;
  }

  catalog[displayName] = picked;
}

fs.writeFileSync(outPath, JSON.stringify(catalog, null, 2), 'utf8');

const brandCount = Object.keys(catalog).length;
const totalCarpets = Object.values(catalog).reduce((sum, arr) => sum + arr.length, 0);
console.log(`✅ landing-catalog.json: ${brandCount} brands, ${totalCarpets} carpets`);

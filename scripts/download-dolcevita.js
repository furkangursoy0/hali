#!/usr/bin/env node
/**
 * Dolce Vita Halı Görsel İndirici
 * --------------------------------
 * data/carpets-dolcevita.json'daki Shopify URL'lerini indirir ve
 * assets/carpets/Dolce_Vita/{Koleksiyon}/{Kod_Renk}.webp olarak kaydeder.
 *
 * Kullanım:
 *   npm run carpets:dolcevita:download
 *
 * Sonraki adımlar:
 *   npm run carpets:thumbs    → thumbnail üret
 *   npm run carpets:catalog   → carpets.json güncelle
 */

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

const CATALOG = path.join(__dirname, '..', 'data', 'carpets-dolcevita.json');
const OUT_DIR = path.join(__dirname, '..', 'assets', 'carpets', 'Dolce_Vita');

// Shopify CDN: orijinal URL'ye _1200x ekleyerek max 1200px indir
function shopifyResizeUrl(src) {
    // https://cdn.shopify.com/.../file.webp?v=123
    // → https://cdn.shopify.com/.../file_1200x.webp?v=123
    return src.replace(/(\.\w+)(\?|$)/, '_1200x$1$2');
}

// "8251 Satin Silver" → "8251_Satin_Silver.webp"
function toFilename(name) {
    return name.replace(/\s+/g, '_') + '.webp';
}

function downloadFile(url, dest, redirectCount = 0) {
    if (redirectCount > 5) return Promise.reject(new Error('Too many redirects'));
    return new Promise((resolve, reject) => {
        const mod = url.startsWith('https') ? https : http;
        mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return downloadFile(res.headers.location, dest, redirectCount + 1)
                    .then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                res.resume();
                return reject(new Error(`HTTP ${res.statusCode}`));
            }
            const tmp = dest + '.tmp';
            const file = fs.createWriteStream(tmp);
            res.pipe(file);
            file.on('finish', () => {
                file.close(() => {
                    fs.renameSync(tmp, dest);
                    resolve();
                });
            });
            file.on('error', (e) => { fs.unlink(tmp, () => {}); reject(e); });
        }).on('error', reject);
    });
}

async function main() {
    if (!fs.existsSync(CATALOG)) {
        console.error('❌ data/carpets-dolcevita.json bulunamadı. Önce çalıştır: npm run carpets:dolcevita');
        process.exit(1);
    }

    const carpets = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
    console.log(`\n📥 ${carpets.length} görsel indiriliyor → assets/carpets/Dolce_Vita/\n`);

    let downloaded = 0, skipped = 0, failed = 0;

    for (let i = 0; i < carpets.length; i++) {
        const c = carpets[i];

        // Koleksiyon klasörü: "La Via" → "La_Via"
        const colDir = path.join(OUT_DIR, c.collection.replace(/\s+/g, '_'));
        if (!fs.existsSync(colDir)) fs.mkdirSync(colDir, { recursive: true });

        const filename = toFilename(c.name);
        const dest     = path.join(colDir, filename);

        if (fs.existsSync(dest)) {
            skipped++;
            continue; // zaten var
        }

        const url = shopifyResizeUrl(c.imagePath);
        const label = `[${i + 1}/${carpets.length}] ${c.collection}/${filename}`;

        try {
            process.stdout.write(`   ${label}... `);
            await downloadFile(url, dest);
            console.log('✓');
            downloaded++;
        } catch (err) {
            console.log(`✗  (${err.message})`);
            failed++;
        }

        await new Promise(r => setTimeout(r, 30)); // saniyede ~33 istek, kibarca
    }

    console.log('\n─────────────────────────────────');
    console.log(`✅ İndirildi  : ${downloaded}`);
    console.log(`⏭  Atlandı   : ${skipped}`);
    console.log(`❌ Başarısız  : ${failed}`);
    console.log('─────────────────────────────────');
    console.log('\nSıradaki adımlar:\n');
    console.log('   npm run carpets:thumbs   → thumbnail üret');
    console.log('   npm run carpets:catalog  → carpets.json güncelle\n');
}

main().catch(e => {
    console.error('❌ Hata:', e.message);
    process.exit(1);
});

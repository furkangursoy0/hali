#!/usr/bin/env node
/**
 * Kreasyon Halı — Çek & İndir
 * ----------------------------
 * kreasyonhali.com Shopify mağazasından tüm ürünleri çeker,
 * parse eder ve assets/carpets/Kreasyon/{Koleksiyon}/ a indirir.
 *
 * Kullanım:
 *   npm run carpets:kreasyon
 *
 * Sonraki adımlar:
 *   npm run carpets:thumbs   → thumbnail üret
 *   npm run carpets:catalog  → carpets.json güncelle
 */

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

const STORE      = 'kreasyonhali.com';
const COLLECTION = 'all';
const BRAND      = 'Kreasyon';
const BRAND_DIR  = 'Kreasyon'; // assets/carpets/Kreasyon/
const OUT_DIR    = path.join(__dirname, '..', 'assets', 'carpets', BRAND_DIR);

// Ürün adının sonunu belirleyen pazarlama kelimeleri
const STOP_WORDS = new Set([
    'uzun', 'ömürlü', 'yumuşak', 'dokulu', 'yolluk', 'halı', 'hali',
    'kolay', 'temizlenir', 'kaymaz', 'antibakteriyel', 'özel', 'desenli',
    'dayanıklı', 'kalın', 'ince', 'kadife', 'şönil', 'sonil', 'kadifemsi',
    've', 'de', 'olan', 'için', 'ile',
]);

// ── Yardımcılar ─────────────────────────────────────────────────────────────

function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/**
 * Başlıktan koleksiyon adını çıkarır.
 * "Akasya AK002 Krem Uzun Ömürlü..." → "Akasya"
 * "Bravvo BR501 Gri..."               → "Bravvo"
 */
function parseCollection(title) {
    const words = title.trim().split(/\s+/);
    return capitalize(words[0] || 'Genel');
}

/**
 * Başlıktan model adını çıkarır.
 * "Akasya AK002 Krem Uzun Ömürlü..." → "AK002 Krem"
 */
function parseName(title, collection) {
    let s = title.trim();
    // Koleksiyon adını baştan çıkar (büyük-küçük harf duyarsız)
    s = s.replace(new RegExp('^' + collection.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*', 'i'), '').trim();

    const words     = s.split(/\s+/);
    const nameWords = [];
    for (const w of words) {
        if (STOP_WORDS.has(w.toLowerCase())) break;
        nameWords.push(w);
        if (nameWords.length >= 3) break; // maks 3 kelime
    }
    return nameWords.join(' ').trim() || words.slice(0, 2).join(' ');
}

/** URL'den dosya uzantısını al (.jpg, .webp, .png) */
function extFromUrl(url) {
    const match = url.match(/\.(\w+)(?:\?|$)/);
    return match ? '.' + match[1].toLowerCase() : '.jpg';
}

/** Shopify CDN: max 1200px versiyonu iste */
function shopifyResizeUrl(src) {
    return src.replace(/(\.\w+)(\?|$)/, '_1200x$1$2');
}

// ── HTTP ─────────────────────────────────────────────────────────────────────

function fetchJSON(page) {
    return new Promise((resolve, reject) => {
        const url = `https://${STORE}/collections/${COLLECTION}/products.json?limit=250&page=${page}`;
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let body = '';
            res.on('data',  c => body += c);
            res.on('end',   ()  => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
            res.on('error', reject);
        }).on('error', reject);
    });
}

function downloadFile(url, dest, hops = 0) {
    if (hops > 5) return Promise.reject(new Error('Too many redirects'));
    return new Promise((resolve, reject) => {
        const mod = url.startsWith('https') ? https : http;
        mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return downloadFile(res.headers.location, dest, hops + 1).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                res.resume();
                return reject(new Error(`HTTP ${res.statusCode}`));
            }
            const tmp  = dest + '.tmp';
            const file = fs.createWriteStream(tmp);
            res.pipe(file);
            file.on('finish', () => file.close(() => { fs.renameSync(tmp, dest); resolve(); }));
            file.on('error', e  => { fs.unlink(tmp, () => {}); reject(e); });
        }).on('error', reject);
    });
}

// ── Ana işlev ────────────────────────────────────────────────────────────────

async function main() {
    // 1. Tüm ürünleri çek
    console.log(`\n🛍️  Kreasyon Halı ürünleri çekiliyor...\n`);
    const allProducts = [];
    for (let page = 1; page <= 20; page++) {
        process.stdout.write(`📥 Sayfa ${page}... `);
        const data     = await fetchJSON(page);
        const products = data.products || [];
        if (products.length === 0) { console.log('bitti.\n'); break; }
        allProducts.push(...products);
        console.log(`${products.length} ürün  (toplam: ${allProducts.length})`);
        if (products.length < 250) break;
        await new Promise(r => setTimeout(r, 350));
    }
    console.log(`\n✅ ${allProducts.length} ürün alındı\n`);

    // 2. Parse et
    const parsed = allProducts.map(p => {
        const img = p.images?.[0]?.src;
        if (!img) return null;
        const collection = parseCollection(p.title);
        const name       = parseName(p.title, collection);
        const ext        = extFromUrl(img);
        return { collection, name, ext, url: shopifyResizeUrl(img) };
    }).filter(Boolean);

    // 3. İndir
    console.log(`📥 ${parsed.length} görsel indiriliyor → assets/carpets/Kreasyon/\n`);
    let downloaded = 0, skipped = 0, failed = 0;

    for (let i = 0; i < parsed.length; i++) {
        const { collection, name, ext, url } = parsed[i];
        const colDir = path.join(OUT_DIR, collection.replace(/\s+/g, '_'));
        if (!fs.existsSync(colDir)) fs.mkdirSync(colDir, { recursive: true });

        const filename = name.replace(/\s+/g, '_') + ext;
        const dest     = path.join(colDir, filename);

        if (fs.existsSync(dest)) { skipped++; continue; }

        try {
            process.stdout.write(`   [${i + 1}/${parsed.length}] ${collection}/${filename}... `);
            await downloadFile(url, dest);
            console.log('✓');
            downloaded++;
        } catch (err) {
            console.log(`✗  (${err.message})`);
            failed++;
        }
        await new Promise(r => setTimeout(r, 30));
    }

    // 4. Özet + koleksiyonlar
    const collections = [...new Set(parsed.map(c => c.collection))].sort();
    console.log('\n─────────────────────────────────');
    console.log(`📦 Marka        : ${BRAND}`);
    console.log(`📁 Koleksiyonlar: ${collections.length}`);
    console.log(`✅ İndirildi    : ${downloaded}`);
    console.log(`⏭  Atlandı     : ${skipped}`);
    console.log(`❌ Başarısız    : ${failed}`);
    console.log('─────────────────────────────────');
    console.log('\nSıradaki adımlar:\n');
    console.log('   npm run carpets:thumbs   → thumbnail üret');
    console.log('   npm run carpets:catalog  → carpets.json güncelle\n');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

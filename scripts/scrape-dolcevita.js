#!/usr/bin/env node
/**
 * Dolce Vita Halı Ürün Çekici
 * ----------------------------
 * dolcevitahali.com Shopify mağazasından tüm halı ürünlerini çeker,
 * her ürünün Shopify CDN görsel URL'ini imagePath olarak saklar ve
 * data/carpets-dolcevita.json dosyasına yazar.
 *
 * Kullanım:
 *   npm run carpets:dolcevita
 *
 * Sonra birleştirmek için:
 *   npm run carpets:dolcevita:merge
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const STORE      = 'dolcevitahali.com';
const COLLECTION = 'dolce-vita-hali-tum-halilar';
const OUT        = path.join(__dirname, '..', 'data', 'carpets-dolcevita.json');
const BRAND      = 'Dolce Vita';

// Ürün adının sonunu belirleyen pazarlama anahtar kelimeleri
const STOP_WORDS = new Set([
    'modern', 'salon', 'halısı', 'hali', 'halı', 'iskandınav', 'i̇skandinav',
    'exclusive', 'premium', 'viskon', 'kilim', 'şönil', 'sonil', 'özel',
    'klasik', 'geometrik', 'çiçekli', 'desenli', 'kaymaz', 'yumuşak',
]);

// ── Yardımcılar ─────────────────────────────────────────────────────────────

function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}

/**
 * Handle'dan koleksiyon adını çıkarır.
 * "dolce-vita-hali-donna-8251-pearl"  → "Donna"
 * "dolce-vita-hali-la-via-100-blue"   → "La Via"
 * "dolce-vita-hali-bohem-381-ash-..."  → "Bohem"
 */
function parseCollection(handle) {
    const bare  = handle.replace(/^dolce-vita-hali-/i, '');
    const parts = bare.split('-');
    // İlk rakamla başlayan segmentin öncesi koleksiyon adıdır
    const codeIdx = parts.findIndex(p => /^\d/.test(p));
    if (codeIdx <= 0) return capitalize(parts[0] || 'Genel');
    return parts.slice(0, codeIdx).map(capitalize).join(' ');
}

/**
 * Ürün başlığından model adını çıkarır.
 * "Dolce Vita Halı Donna 8251 Pearl Modern Salon Halısı" → "8251 Pearl"
 * "Dolce Vita Halı Bohem 381 Ash Modern Halı"            → "381 Ash"
 */
function parseName(title, collection) {
    let s = title.replace(/^Dolce\s+Vita\s+Halı\s+/i, '').trim();
    const colEsc = collection.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    s = s.replace(new RegExp('^' + colEsc + '\\s+', 'i'), '').trim();

    const words     = s.split(/\s+/);
    const nameWords = [];
    for (const w of words) {
        if (STOP_WORDS.has(w.toLowerCase())) break;
        nameWords.push(w);
        if (nameWords.length >= 4) break; // maks 4 kelime
    }
    return nameWords.join(' ').trim() || words.slice(0, 2).join(' ');
}

// ── HTTP yardımcısı ─────────────────────────────────────────────────────────

function fetchPage(page) {
    return new Promise((resolve, reject) => {
        const url = `https://${STORE}/collections/${COLLECTION}/products.json?limit=250&page=${page}`;
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; catalog-scraper/1.0)',
                'Accept'    : 'application/json',
            },
        }, (res) => {
            let body = '';
            res.on('data',  c => body += c);
            res.on('end',   ()  => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
            res.on('error', reject);
        }).on('error', reject);
    });
}

// ── Ana işlev ───────────────────────────────────────────────────────────────

async function main() {
    console.log('\n🛍️  Dolce Vita Halı ürünleri çekiliyor...\n');

    const allProducts = [];

    for (let page = 1; page <= 20; page++) {
        process.stdout.write(`📥 Sayfa ${page}... `);
        const data     = await fetchPage(page);
        const products = data.products || [];

        if (products.length === 0) {
            console.log('bitti.\n');
            break;
        }

        allProducts.push(...products);
        console.log(`${products.length} ürün  (toplam: ${allProducts.length})`);

        if (products.length < 250) break; // son sayfa
        await new Promise(r => setTimeout(r, 350)); // kibarca bekle
    }

    console.log(`\n✅ ${allProducts.length} ürün alındı — dönüştürülüyor...\n`);

    const carpets = [];
    for (const p of allProducts) {
        const imgSrc = p.images?.[0]?.src;
        if (!imgSrc) continue; // görseli olmayan ürünü atla

        const collection = parseCollection(p.handle);
        const name       = parseName(p.title, collection);
        const id         = p.handle.replace(/^dolce-vita-hali-/i, '');
        const imageKey   = `DolceVita__${collection}__${id}`.replace(/[^a-zA-Z0-9_]/g, '_');

        carpets.push({
            id,
            name,
            brand     : BRAND,
            collection,
            size      : '',
            material  : '',
            image     : imageKey,
            imagePath : imgSrc,  // Shopify CDN URL (https://cdn.shopify.com/...)
            thumbPath : '',      // Boş — getCarpetThumbnailUrl wsrv.nl kullanır
        });
    }

    // ── İstatistikler ────────────────────────────────────────────────────────
    const collections = [...new Set(carpets.map(c => c.collection))].sort();
    console.log(`📦 Marka   : ${BRAND}`);
    console.log(`📁 Koleksiyonlar (${collections.length}):`);
    for (const col of collections) {
        const n = carpets.filter(c => c.collection === col).length;
        console.log(`   ${col.padEnd(20)} ${n} halı`);
    }
    console.log(`\n🪄 Toplam  : ${carpets.length} halı\n`);

    // ── Yaz ─────────────────────────────────────────────────────────────────
    fs.writeFileSync(OUT, JSON.stringify(carpets, null, 2), 'utf8');
    console.log(`✅ ${path.relative(process.cwd(), OUT)} yazıldı\n`);
    console.log('ℹ️  Mevcut katalogla birleştirmek için:\n');
    console.log('   npm run carpets:dolcevita:merge\n');
}

main().catch(e => {
    console.error('❌ Hata:', e.message);
    process.exit(1);
});

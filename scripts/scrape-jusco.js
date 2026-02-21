#!/usr/bin/env node
/**
 * Jusco Halı - Görsel İndirici
 * --------------------------------
 * WordPress tabanlı site için kategori sayfalarından
 * ürün görsellerini otomatik çeker ve indirir.
 *
 * Kullanım:
 *   node scripts/scrape-jusco.js noble
 *   node scripts/scrape-jusco.js all
 *
 * İndirilen görseller:
 *   assets/carpets/Jusco/KOLEKSIYON/KOD.jpg
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://juscohali.com';

// Tüm koleksiyonlar (slug → klasör adı)
const COLLECTIONS = {
    arven: 'ARVEN',
    avilla: 'AVILLA',
    borneo: 'BORNEO',
    carell: 'CARELL',
    efnan: 'EFNAN',
    elegant: 'ELEGANT',
    etna: 'ETNA',
    gloria: 'GLORIA',
    history: 'HISTORY',
    iklim: 'IKLIM',
    lapis: 'LAPIS',
    motto: 'MOTTO',
    noble: 'NOBLE',
    nora: 'NORA',
    orion: 'ORION',
    otantik: 'OTANTIK',
    ottoman: 'OTTOMAN',
    pena: 'PENA',
    perla: 'PERLA',
    picasso: 'PICASSO',
    porto: 'PORTO',
    ruba: 'RUBA',
    summer: 'SUMMER',
    vivense: 'VIVENSE',
};

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return fetchUrl(res.headers.location).then(resolve).catch(reject);
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        }).on('error', reject);
    });
}

function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                file.close();
                fs.unlink(destPath, () => { });
                return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
            }
            if (res.statusCode === 200) {
                res.pipe(file);
                file.on('finish', () => { file.close(); resolve(true); });
            } else {
                file.close();
                fs.unlink(destPath, () => { });
                resolve(false);
            }
        }).on('error', (err) => {
            fs.unlink(destPath, () => { });
            reject(err);
        });
    });
}

function extractProductLinks(html, categorySlug) {
    // WooCommerce ürün linklerini çek
    const productLinks = new Set();
    const regex = new RegExp(`href="(https://juscohali\\.com/urun/[^"]+)"`, 'g');
    let m;
    while ((m = regex.exec(html)) !== null) {
        productLinks.add(m[1]);
    }
    return [...productLinks];
}

function extractMainImage(html) {
    // Ürün detay sayfasındaki ana görseli çek
    // wp-post-image veya woocommerce-product-gallery__image
    const patterns = [
        // scaled versiyonu (tam boy)
        /wp:image[^}]*"url":"([^"]+(?:scaled|full)[^"]*\.(?:jpg|jpeg|png|webp))"/,
        // woocommerce ana ürün görseli
        /<img[^>]+class="[^"]*wp-post-image[^"]*"[^>]+src="([^"]+)"/,
        // og:image meta
        /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/,
    ];

    for (const pattern of patterns) {
        const m = html.match(pattern);
        if (m) return m[1];
    }

    // Fallback: uploads klasöründeki ilk büyük görsel
    const uploadImages = html.match(/https:\/\/juscohali\.com\/wp-content\/uploads\/[^\s"']+\.(?:jpg|jpeg|png|webp)/g);
    if (uploadImages) {
        // -scaled versiyonu tercih et
        const scaled = uploadImages.find(u => u.includes('-scaled'));
        if (scaled) return scaled;
        return uploadImages[0];
    }

    return null;
}

function slugToCode(productUrl, collectionFolder) {
    // URL slug'ından kodu çıkar: noble-1027 → NOBLE-1027
    const slug = productUrl.replace(/\/$/, '').split('/').pop();
    return slug.replace(/-/g, '_').toUpperCase();
}

async function downloadCollection(slug) {
    const folderName = COLLECTIONS[slug];
    if (!folderName) {
        console.error(`❌ "${slug}" koleksiyonu bulunamadı.`);
        process.exit(1);
    }

    const destDir = path.join(__dirname, '..', 'assets', 'carpets', 'Jusco', folderName);
    fs.mkdirSync(destDir, { recursive: true });

    console.log(`\n🏪 Jusco - ${folderName} koleksiyonu indiriliyor...`);
    console.log(`📁 Hedef: assets/carpets/Jusco/${folderName}/\n`);

    // 1. Kategori sayfasından ürün linklerini çek (sayfalama ile)
    let allProductLinks = [];
    let page = 1;
    while (true) {
        const pageUrl = page === 1
            ? `${BASE_URL}/urun-kategori/${slug}/`
            : `${BASE_URL}/urun-kategori/${slug}/page/${page}/`;

        const { status, body } = await fetchUrl(pageUrl);
        if (status === 404 || status >= 400) break;

        const links = extractProductLinks(body, slug);
        if (links.length === 0) break;

        allProductLinks = [...allProductLinks, ...links];
        console.log(`  📄 Sayfa ${page}: ${links.length} ürün bulundu`);

        // Sonraki sayfa var mı?
        if (!body.includes(`/urun-kategori/${slug}/page/${page + 1}/`) &&
            !body.includes(`page/${page + 1}`)) break;
        page++;
        await new Promise(r => setTimeout(r, 300));
    }

    // Tekrarları temizle
    allProductLinks = [...new Set(allProductLinks)];
    console.log(`\n  🔢 Toplam ${allProductLinks.length} ürün listesi oluşturuldu\n`);

    if (allProductLinks.length === 0) {
        console.warn('  ⚠️ Ürün bulunamadı, kategori URL kontrolü et.');
        return;
    }

    // 2. Her ürünün detay sayfasından görseli indir
    let downloaded = 0, skipped = 0, failed = 0;

    for (const productUrl of allProductLinks) {
        const slug_name = productUrl.replace(/\/$/, '').split('/').pop();
        // Kodu temizle
        const code = slug_name.toUpperCase();
        const ext = '.jpg';
        const filename = `${code}${ext}`;
        const destPath = path.join(destDir, filename);

        if (fs.existsSync(destPath)) {
            skipped++;
            continue;
        }

        process.stdout.write(`  ⬇️  ${code} ... `);

        try {
            // Ürün sayfasını çek
            const { body: productHtml } = await fetchUrl(productUrl);
            const imageUrl = extractMainImage(productHtml);

            if (!imageUrl) {
                console.log('❌ (görsel URL bulunamadı)');
                failed++;
            } else {
                const ok = await downloadFile(imageUrl, destPath);
                if (ok) {
                    console.log('✅');
                    downloaded++;
                } else {
                    console.log('❌ (indirilemedi)');
                    failed++;
                }
            }
        } catch (err) {
            console.log(`❌ (hata: ${err.message})`);
            failed++;
        }

        await new Promise(r => setTimeout(r, 400));
    }

    console.log(`\n  🎉 Tamamlandı! ${downloaded} indirildi, ${skipped} atlandı, ${failed} başarısız.\n`);
}

async function main() {
    const arg = process.argv[2];
    if (!arg) {
        console.error('Kullanım: node scripts/scrape-jusco.js <koleksiyon|all>');
        console.error('Örnek:    node scripts/scrape-jusco.js noble');
        process.exit(1);
    }

    if (arg === 'all') {
        for (const colSlug of Object.keys(COLLECTIONS)) {
            await downloadCollection(colSlug);
        }
        console.log('\n✅ Tüm Jusco koleksiyonları indirildi!');
        console.log('Kataloğu güncelle: node scripts/generate-catalog.js\n');
    } else {
        await downloadCollection(arg.toLowerCase());
        console.log('Kataloğu güncelle: node scripts/generate-catalog.js\n');
    }
}

main();

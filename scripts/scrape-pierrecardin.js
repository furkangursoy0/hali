#!/usr/bin/env node
/**
 * Pierre Cardin Halı - Görsel İndirici
 * ------------------------------------
 * Belirtilen koleksiyondaki tüm halı görsellerini indirir.
 * 
 * Kullanım:
 *   node scripts/scrape-pierrecardin.js azur
 *   node scripts/scrape-pierrecardin.js parla
 *
 * İndirilen görseller:
 *   assets/carpets/Pierre_Cardin/KOLEKSIYON/KOD_MODELADI.jpg
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.pierrecardinhali.com';

// Koleksiyon -> Halı kodları haritası
const COLLECTIONS = {
    azur: ['UZ01A', 'UZ02A', 'UZ02B', 'UZ02C', 'UZ02D', 'UZ02E', 'UZ03A', 'UZ03B', 'UZ03C', 'UZ03D'],
    Beverly: ['BF01A', 'BF01B', 'BF02A', 'BF02B', 'BF03A', 'BF03B', 'BF04A', 'BF04B', 'BF05A', 'BF06D'],
    suprise: ['ZC01E', 'ZC01J', 'ZC02E', 'ZC02J', 'ZC02K', 'ZC02L', 'ZC02M'],
    Galenda: ['JH01A', 'JH02A', 'JH02B', 'JH02C', 'JH03A', 'JH03B'],
    History: ['HY01A', 'HY02A', 'HY03A', 'HY04A', 'HY05A', 'HY06A', 'HY07A', 'HY08A', 'HY09A', 'HY10A'],
    Morina: ['LH01A', 'LH02A', 'LH03A', 'LH04A', 'LH05A', 'LH06A', 'LH07A', 'LH08A'],
    Voyage: ['KJ01A', 'KJ01B', 'KJ02A', 'KJ02B', 'KJ03A', 'KJ03B', 'KJ04A', 'KJ05A', 'KJ05B', 'KJ06A', 'KJ06B'],
    PierZen: ['HG01A', 'HG01B', 'HG02A', 'HG03A', 'HG04A', 'HG05A', 'HG06A', 'HG07A', 'HG08A', 'HG09A', 'HG10A', 'HG11A', 'HG13A', 'HG14A', 'HG15A'],
};

function imageUrl(collection, code, index = 1) {
    return `${BASE_URL}/files/koleksiyonlar/halilar/${collection}/${code}/${index}/orjinal.jpg`;
}

function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            if (res.statusCode === 200) {
                res.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(true);
                });
            } else {
                file.close();
                fs.unlink(destPath, () => { });
                resolve(false); // 404 vb.
            }
        }).on('error', (err) => {
            fs.unlink(destPath, () => { });
            reject(err);
        });
    });
}

async function downloadCollection(collectionArg) {
    const collectionKey = Object.keys(COLLECTIONS).find(
        k => k.toLowerCase() === collectionArg.toLowerCase()
    ) || collectionArg;

    const codes = COLLECTIONS[collectionKey] || [];
    if (codes.length === 0) {
        console.error(`❌ "${collectionArg}" için halı kodları tanımlı değil.`);
        console.error('   Tanımlı koleksiyonlar:', Object.keys(COLLECTIONS).filter(k => COLLECTIONS[k].length > 0).join(', '));
        process.exit(1);
    }

    const destDir = path.join(__dirname, '..', 'assets', 'carpets', 'Pierre_Cardin', collectionKey);
    fs.mkdirSync(destDir, { recursive: true });

    console.log(`\n🪄 Pierre Cardin - ${collectionKey.toUpperCase()} koleksiyonu indiriliyor...`);
    console.log(`📁 Hedef: assets/carpets/Pierre_Cardin/${collectionKey}/\n`);

    let downloaded = 0;
    let skipped = 0;

    for (const code of codes) {
        const filename = `${code}.jpg`;
        const destPath = path.join(destDir, filename);

        if (fs.existsSync(destPath)) {
            console.log(`⏭️  Zaten var: ${filename}`);
            skipped++;
            continue;
        }

        const url = imageUrl(collectionKey, code);
        process.stdout.write(`⬇️  İndiriliyor: ${code} ... `);
        try {
            const ok = await downloadFile(url, destPath);
            if (ok) {
                console.log('✅');
                downloaded++;
            } else {
                console.log('❌ (görsel bulunamadı)');
            }
        } catch (err) {
            console.log(`❌ (hata: ${err.message})`);
        }

        // Sunucuya saygılı ol
        await new Promise(r => setTimeout(r, 300));
    }

    console.log(`\n🎉 Tamamlandı! ${downloaded} indirildi, ${skipped} atlandı.\n`);
    console.log('Şimdi kataloğu güncelle:');
    console.log('  node scripts/generate-catalog.js\n');
}

const arg = process.argv[2];
if (!arg) {
    console.error('Kullanım: node scripts/scrape-pierrecardin.js <koleksiyon>');
    console.error('Örnek:    node scripts/scrape-pierrecardin.js azur');
    process.exit(1);
}

downloadCollection(arg);

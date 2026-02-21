#!/usr/bin/env node
/**
 * Royal Halı - Görsel İndirici
 * ----------------------------
 * Kullanım: node scripts/scrape-royalhali.js Momento
 *           node scripts/scrape-royalhali.js all   (hepsini indir)
 *
 * İndirilen görseller:
 *   assets/carpets/Royal_Hali/KOLEKSIYON/KOD.png
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.royalhali.com';

const COLLECTIONS = {
    Momento: ['ZV01A', 'ZV02A', 'ZV03A', 'ZV04A', 'ZV05A', 'ZV05B', 'ZV06A', 'ZV06B', 'ZV07A', 'ZV07B', 'ZV08A', 'ZV08B', 'ZV08C'],
    ARLES: ['FJ01A', 'FJ01B', 'FJ02A', 'FJ02B', 'FJ03A', 'FJ03B'],
    NIL: ['NB01A', 'NB02A', 'NB03A', 'NB04A', 'NB05A', 'NB05B', 'NB06A', 'NB07A', 'NB08A', 'NB08B', 'NB09A'],
    alanis: ['QG01A', 'QG02A', 'QG03A', 'QG04A', 'QG05A', 'QG06A'],
    armonika: ['YT01A', 'YT02A', 'YT03A', 'YT03B', 'YT03C', 'YT03D', 'YT04A', 'YT04B', 'YT06A'],
    Marlow: ['QJ01A', 'QJ02A', 'QJ03A', 'QJ04A', 'QJ05A'],
    Vintage: ['VH01A', 'VH02A', 'VH03A', 'VH03B', 'VH04A', 'VH05A'],
    KimRoyal: ['KC01A', 'KC01B', 'KC02A', 'KC03A', 'KC04A', 'KC04B', 'KC04C', 'KC05A', 'KC06A', 'KC06B', 'KC07A', 'KC08A', 'KC09A'],
    Bearny: ['TD01A', 'TD01B', 'TD01C', 'TD01D', 'TD02A', 'TD03A', 'TD03B', 'TD03C', 'TD04A', 'TD05A'],
    Diva: ['DZ01A', 'DZ02A', 'DZ02B', 'DZ03A', 'DZ04A', 'DZ04B', 'DZ05A'],
    jasmin: ['IJ01A', 'IJ02A', 'IJ03A', 'IJ04A', 'IJ04B', 'IJ04C', 'IJ04D', 'IJ04E', 'IJ05A', 'IJ06A', 'IJ07A'],
};

function imageUrl(collection, code) {
    return `${BASE_URL}/files/koleksiyonlar/halilar/${collection}/${code}/1/orjinal.png`;
}

function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
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

async function downloadCollection(collectionKey) {
    const codes = COLLECTIONS[collectionKey];
    if (!codes) {
        console.error(`❌ "${collectionKey}" bulunamadı.`);
        console.error('   Mevcut koleksiyonlar:', Object.keys(COLLECTIONS).join(', '));
        process.exit(1);
    }

    const destDir = path.join(__dirname, '..', 'assets', 'carpets', 'Royal_Hali', collectionKey);
    fs.mkdirSync(destDir, { recursive: true });

    console.log(`\n👑 Royal Halı - ${collectionKey.toUpperCase()} koleksiyonu indiriliyor...`);
    console.log(`📁 Hedef: assets/carpets/Royal_Hali/${collectionKey}/\n`);

    let downloaded = 0, skipped = 0;

    for (const code of codes) {
        const filename = `${code}.png`;
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
            if (ok) { console.log('✅'); downloaded++; }
            else { console.log('❌ (görsel bulunamadı)'); }
        } catch (err) {
            console.log(`❌ (hata: ${err.message})`);
        }

        await new Promise(r => setTimeout(r, 300));
    }

    console.log(`\n🎉 Tamamlandı! ${downloaded} indirildi, ${skipped} atlandı.\n`);
}

async function main() {
    const arg = process.argv[2];
    if (!arg) {
        console.error('Kullanım: node scripts/scrape-royalhali.js <koleksiyon|all>');
        process.exit(1);
    }

    if (arg === 'all') {
        for (const col of Object.keys(COLLECTIONS)) {
            await downloadCollection(col);
        }
        console.log('✅ Tüm Royal Halı koleksiyonları indirildi!');
        console.log('Kataloğu güncelle: node scripts/generate-catalog.js\n');
    } else {
        await downloadCollection(arg);
        console.log('Kataloğu güncelle: node scripts/generate-catalog.js\n');
    }
}

main();

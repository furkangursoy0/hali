#!/usr/bin/env node
/**
 * Halı Katalog Üretici
 * --------------------
 * assets/carpets/ klasörünü tarayarak otomatik olarak:
 *   - data/carpets.json
 *   - constants/carpet-images.ts
 * dosyalarını üretir.
 *
 * Kullanım:
 *   node scripts/generate-catalog.js
 *
 * Beklenen klasör yapısı:
 *   assets/carpets/
 *     empara/
 *       koleksiyon-adi/
 *         6700_ARRAS.png
 *         6701_VENUS.png
 *     markab/
 *       ...
 */

const fs = require('fs');
const path = require('path');

const CARPETS_DIR = path.join(__dirname, '..', 'assets', 'carpets');
const OUTPUT_JSON = path.join(__dirname, '..', 'data', 'carpets.json');
const OUTPUT_TS = path.join(__dirname, '..', 'constants', 'carpet-images.ts');

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];

// Özel marka/koleksiyon adı geçersiz kılmaları
const BRAND_OVERRIDES = {
    'Royal_Hali': 'Royal Halı',
    'empara': 'Empara',
    // Türkçe karakter içeren markalar (klasör ASCII, display Türkçe)
    'Padisah': 'Padişah',
    'padisah': 'Padişah',
    'Ipek': 'İpek',
    'ipek': 'İpek',
    'Bahariye': 'Bahariye',
    'Seyran': 'Seyran',
    'Artemis': 'Artemis',
    'Elexus': 'Elexus',
    'Diora': 'Diora',
};

// Klasör adı disk'te farklı case'de olabilir ama Git'te farklı kayıtlı
// imagePath / thumbPath için doğru path segment'i belirtir
const PATH_OVERRIDES = {
    'empara': 'Empara',
};

function sanitizePath(brand) {
    return PATH_OVERRIDES[brand] || brand;
}

function sanitize(str, overrides = BRAND_OVERRIDES) {
    if (overrides[str.trim()]) return overrides[str.trim()];
    return str.trim().replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase());
}

function parseModelInfo(filename) {
    // "6700_ARRAS.png"   → code: "6700", name: "6700 ARRAS"
    // "6700_ARRAS_1.png" → code: "6700", name: "6700 ARRAS 1"
    // "ARRAS.png"        → code: "ARRAS", name: "ARRAS"
    const base = path.basename(filename, path.extname(filename));
    const parts = base.split('_');
    if (parts.length >= 2 && /^\d+$/.test(parts[0])) {
        const variant = parts.slice(2).join('_');
        const code = variant ? `${parts[0]}_${variant}` : parts[0];
        const modelName = parts.slice(1).join(' ');
        return { code, name: `${code} ${modelName}` };
    }
    return { code: base, name: base.replace(/_/g, ' ') };
}

function scanCarpets() {
    const carpets = [];
    const imageKeys = []; // for carpet-images.ts

    if (!fs.existsSync(CARPETS_DIR)) {
        console.error('❌ assets/carpets/ klasörü bulunamadı!');
        process.exit(1);
    }

    const brandDirs = fs.readdirSync(CARPETS_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name)
        .sort();

    if (brandDirs.length === 0) {
        console.warn('⚠️  Hiç marka klasörü bulunamadı. Düz PNG dosyaları aranıyor...');
        // Fallback: düz PNG'ler (eski yapı)
        const files = fs.readdirSync(CARPETS_DIR)
            .filter(f => IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase()));
        files.forEach((file, i) => {
            const { code, name } = parseModelInfo(file);
            const key = `carpet_${String(i + 1).padStart(3, '0')}`;
            carpets.push({
                id: code,
                name,
                brand: 'Genel',
                collection: 'Koleksiyon',
                size: '',
                material: '',
                image: key,
                imagePath: `carpets/${file}`,
                thumbPath: `carpets-thumbs/${path.basename(file, path.extname(file))}.webp`,
            });
            imageKeys.push({ key, relativePath: `../assets/carpets/${file}` });
        });
        return { carpets, imageKeys };
    }

    brandDirs.forEach(brand => {
        const brandPath = path.join(CARPETS_DIR, brand);

        // Koleksiyon klasörlerini tara
        const collectionEntries = fs.readdirSync(brandPath, { withFileTypes: true });
        const collectionDirs = collectionEntries.filter(d => d.isDirectory()).map(d => d.name).sort();

        // Koleksiyon klasörü yoksa direkt PNG'ler bu seviyededir
        const hasCollections = collectionDirs.length > 0;

        if (!hasCollections) {
            // marka/model.png
            const files = collectionEntries
                .filter(f => f.isFile() && IMAGE_EXTENSIONS.includes(path.extname(f.name).toLowerCase()))
                .map(f => f.name)
                .sort();

            files.forEach(file => {
                const { code, name } = parseModelInfo(file);
                const key = `${brand}__${code}`.replace(/[^a-zA-Z0-9_]/g, '_');
                const brandPath2 = sanitizePath(brand);
                carpets.push({
                    id: code,
                    name,
                    brand: sanitize(brand),
                    collection: 'Genel',
                    size: '',
                    material: '',
                    image: key,
                    imagePath: `carpets/${brandPath2}/${file}`,
                    thumbPath: `carpets-thumbs/${brandPath2}/${path.basename(file, path.extname(file))}.webp`,
                });
                imageKeys.push({ key, relativePath: `../assets/carpets/${brandPath2}/${file}` });
            });
        } else {
            collectionDirs.forEach(collection => {
                const collectionPath = path.join(brandPath, collection);
                const files = fs.readdirSync(collectionPath)
                    .filter(f => IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase()))
                    .sort();

                files.forEach(file => {
                    const { code, name } = parseModelInfo(file);
                    const key = `${brand}__${collection}__${code}`.replace(/[^a-zA-Z0-9_]/g, '_');
                    const brandPath2 = sanitizePath(brand);
                    carpets.push({
                        id: code,
                        name,
                        brand: sanitize(brand),
                        collection: sanitize(collection),
                        size: '',
                        material: '',
                        image: key,
                        imagePath: `carpets/${brandPath2}/${collection}/${file}`,
                        thumbPath: `carpets-thumbs/${brandPath2}/${collection}/${path.basename(file, path.extname(file))}.webp`,
                    });
                    imageKeys.push({ key, relativePath: `../assets/carpets/${brandPath2}/${collection}/${file}` });
                });
            });
        }
    });

    return { carpets, imageKeys };
}

function generateJson(carpets) {
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(carpets, null, 2), 'utf8');
    console.log(`✅ data/carpets.json güncellendi (${carpets.length} halı)`);
}

function generateImages(imageKeys) {
    const lines = [
        '// Bu dosya otomatik üretilmiştir — generate-catalog.js',
        '// Değiştirmeyin, scripts/generate-catalog.js çalıştırın',
        '',
        'const carpetImages: Record<string, any> = {',
        ...imageKeys.map(({ key, relativePath }) =>
            `  ${key}: require('${relativePath}'),`
        ),
        '};',
        '',
        'export default carpetImages;',
        '',
    ];
    fs.writeFileSync(OUTPUT_TS, lines.join('\n'), 'utf8');
    console.log(`✅ constants/carpet-images.ts güncellendi (${imageKeys.length} görsel)`);
}

function main() {
    console.log('\n🪄 Halı kataloğu üretiliyor...\n');
    const { carpets, imageKeys } = scanCarpets();

    if (carpets.length === 0) {
        console.warn('⚠️  Hiç halı görseli bulunamadı!');
        console.warn('   assets/carpets/MARKA/KOLEKSIYON/MODEL.png yapısında görselleri ekleyin.');
        return;
    }

    const brands = [...new Set(carpets.map(c => c.brand))];
    const collections = [...new Set(carpets.map(c => c.collection))];

    console.log(`📦 Markalar: ${brands.join(', ')}`);
    console.log(`📁 Koleksiyonlar: ${collections.length} adet`);
    console.log(`🪄 Toplam halı: ${carpets.length}\n`);

    generateJson(carpets);
    generateImages(imageKeys);

    console.log('\n🎉 Tamamlandı! Expo Metro\'yu yenileyin (r tuşu).\n');
}

main();

#!/usr/bin/env node
/**
 * Post-build script: injects SEO meta tags into dist/index.html
 * Expo SDK 54 (Metro) auto-generates HTML, so we patch it after build.
 */
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'dist', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Replace lang
html = html.replace('<html lang="en">', '<html lang="tr">');

// Replace title
html = html.replace(
  /<title>[^<]*<\/title>/,
  '<title>Halı Dene | Yapay Zeka ile Halı Deneme</title>'
);

// Remove Expo-generated duplicate meta tags (theme-color, description)
html = html.replace(/<meta name="theme-color"[^>]*>\n?/g, '');
html = html.replace(/<meta name="description"[^>]*>\n?/g, '');

// Remove Expo-generated favicon link (we'll add our own)
html = html.replace(/<link rel="icon" href="\/favicon\.ico"\s*\/?\s*>/g, '');

// Meta tags to inject before </head>
const metaTags = `
  <meta name="description" content="Müşterilerinize halıları evlerinde gösterin. AI destekli halı deneme platformu. 2000+ halı, 9 marka, 30 saniyede sonuç." />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Halı Dene | Yapay Zeka ile Halı Deneme" />
  <meta property="og:description" content="Müşterilerinize halıları evlerinde gösterin. AI destekli halı deneme platformu." />
  <meta property="og:url" content="https://halidene.com" />
  <meta property="og:image" content="https://halidene.com/og-image.png" />
  <meta property="og:locale" content="tr_TR" />
  <meta property="og:site_name" content="Halı Dene" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Halı Dene | Yapay Zeka ile Halı Deneme" />
  <meta name="twitter:description" content="Müşterilerinize halıları evlerinde gösterin. AI destekli halı deneme platformu." />
  <meta name="twitter:image" content="https://halidene.com/og-image.png" />

  <!-- Theme -->
  <meta name="theme-color" content="#0F0F0F" />
  <meta name="msapplication-TileColor" content="#0F0F0F" />

  <!-- Favicon -->
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
  <link rel="icon" href="/favicon.ico" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

  <!-- Canonical -->
  <link rel="canonical" href="https://halidene.com" />

  <!-- Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Halı Dene",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web, iOS, Android",
    "description": "Yapay zeka destekli halı deneme platformu. Müşterilerinize halıları evlerinde gösterin.",
    "url": "https://halidene.com",
    "offers": {
      "@type": "Offer",
      "category": "SaaS"
    }
  }
  </script>
`;

// Inject meta tags before </head>
html = html.replace('</head>', metaTags + '\n</head>');

// Update noscript text
html = html.replace(
  'You need to enable JavaScript to run this app.',
  'Bu uygulamayı kullanmak için JavaScript gereklidir.'
);

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('✅ dist/index.html SEO meta tags injected');

#!/usr/bin/env node
/**
 * Post-build script: adds metadata and pre-renders the public landing page
 * Expo SDK 54 (Metro) auto-generates HTML, so we patch it after build.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { createElement } = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const project = path.join(__dirname, '..');

const htmlPath = path.join(project, 'dist', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Replace lang
html = html.replace('<html lang="en">', '<html lang="tr">');

// Replace title
html = html.replace(
  /<title>[^<]*<\/title>/,
  '<title>Halı Dene | Odanda Yapay Zeka ile Halıyı Gör!</title>'
);

// Remove Expo-generated duplicate meta tags (theme-color, description)
html = html.replace(/<meta name="theme-color"[^>]*>\n?/g, '');
html = html.replace(/<meta name="description"[^>]*>\n?/g, '');

// Remove Expo-generated favicon link (we'll add our own)
html = html.replace(/<link rel="icon" href="\/favicon\.ico"\s*\/?\s*>/g, '');

// Meta tags to inject before </head>
const metaTags = `
  <meta name="description" content="Müşterilerinize halıları evlerinde gösterin. Yapay zeka destekli halı deneme platformu. 3600+ halı, 16 marka, 20 saniyede sonuç." />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Halı Dene | Odanda Yapay Zeka ile Halıyı Gör!" />
  <meta property="og:description" content="Müşterilerinize halıları evlerinde gösterin. Yapay zeka destekli halı deneme platformu." />
  <meta property="og:url" content="https://halidene.com" />
  <meta property="og:image" content="https://halidene.com/og-image.png" />
  <meta property="og:locale" content="tr_TR" />
  <meta property="og:site_name" content="Halı Dene" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Halı Dene | Odanda Yapay Zeka ile Halıyı Gör!" />
  <meta name="twitter:description" content="Müşterilerinize halıları evlerinde gösterin. Yapay zeka destekli halı deneme platformu." />
  <meta name="twitter:image" content="https://halidene.com/og-image.png" />

  <!-- Theme -->
  <meta name="theme-color" content="#0F0F0F" />
  <meta name="msapplication-TileColor" content="#0F0F0F" />

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
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

const emptyRoot = '<div id="root"></div>';
if (!html.includes(emptyRoot)) {
  throw new Error('Expected the empty Expo web root. Run expo export before the post-build script.');
}

// Use the same React screen for the initial HTML and the interactive web bundle.
const output = fs.mkdtempSync(path.join(project, 'node_modules', '.landing-html-'));
try {
  execFileSync(process.execPath, [
    require.resolve('typescript/bin/tsc'),
    '--outDir', output,
    '--target', 'es2022',
    '--module', 'commonjs',
    '--jsx', 'react-jsx',
    '--esModuleInterop',
    '--resolveJsonModule',
    '--skipLibCheck',
    'screens/LandingScreen.web.tsx',
  ], { cwd: project, stdio: 'inherit' });

  const { default: LandingScreen, landingFeatureList } = require(path.join(output, 'screens', 'LandingScreen.web.js'));
  const landing = renderToStaticMarkup(createElement(LandingScreen));
  const featureList = JSON.stringify(landingFeatureList).replace(/</g, '\\u003c');
  const landingHtml = html
    .replace('    "offers": {', `    "featureList": ${featureList},
    "offers": {`)
    .replace(emptyRoot, () => `<div id="root">${landing}</div>`);

  // Blog and contact routes use their existing client-side screens.
  fs.writeFileSync(path.join(project, 'dist', 'site-shell.html'), html, 'utf8');
  fs.writeFileSync(htmlPath, landingHtml, 'utf8');
  console.log('Pre-rendered the landing page and prepared the web route shell.');
} finally {
  fs.rmSync(output, { recursive: true, force: true });
}

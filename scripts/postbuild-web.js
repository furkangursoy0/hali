#!/usr/bin/env node
/**
 * Post-build script: adds metadata and pre-renders public web pages
 * Expo SDK 54 (Metro) auto-generates HTML, so we patch it after build.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { createElement } = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const project = path.join(__dirname, '..');

const dist = path.join(project, 'dist');
const htmlPath = path.join(dist, 'index.html');
const siteUrl = 'https://halidene.com';
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
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=hd-blue" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=hd-blue" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=hd-blue" />
  <link rel="icon" href="/favicon.ico?v=hd-blue" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=hd-blue" />

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

// These pages already contain readable HTML before the Expo bundle runs.
html = html.replace(/<noscript>[\s\S]*?<\/noscript>\s*/, '');

const emptyRoot = '<div id="root"></div>';
if (!html.includes(emptyRoot)) {
  throw new Error('Expected the empty Expo web root. Run expo export before the post-build script.');
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function writePage(file, template, screen, props = {}) {
  const markup = renderToStaticMarkup(createElement(screen, props));
  const filename = path.join(dist, file);
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, template.replace(emptyRoot, () => `<div id="root">${markup}</div>`), 'utf8');
}

function pageHead(route, { title, description, post, schema }) {
  const url = siteUrl + route;
  const image = post?.featuredImage || siteUrl + '/og-image.png';
  const update = [
    ['description', description],
    ['og:type', post ? 'article' : 'website'],
    ['og:title', title],
    ['og:description', description],
    ['og:url', url],
    ['og:image', image],
    ['twitter:card', post && !post.featuredImage ? 'summary' : 'summary_large_image'],
    ['twitter:title', title],
    ['twitter:description', description],
    ['twitter:image', image],
  ];
  let page = html.replace(/<title>[^<]*<\/title>/, () => `<title>${escapeHtml(title)}</title>`);
  for (const [key, value] of update) {
    const attribute = key.startsWith('og:') ? 'property' : 'name';
    const tag = new RegExp(`<meta ${attribute}="${key}" content="[^"]*"\\s*/?>`);
    page = page.replace(tag, () => `<meta ${attribute}="${key}" content="${escapeHtml(value)}" />`);
  }
  return page
    .replace(/<link rel="canonical"[^>]*>/, () => `<link rel="canonical" href="${escapeHtml(url)}" />`)
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () =>
      schema ? `<script type="application/ld+json" data-blog="true">${jsonLd(schema)}</script>` : '');
}

// Use the same React screens for the initial HTML and the interactive web bundle.
const output = fs.mkdtempSync(path.join(project, 'node_modules', '.public-html-'));
try {
  const screens = ['LandingScreen', 'BlogListScreen', 'BlogPostScreen', 'ContactScreen'];
  execFileSync(process.execPath, [
    require.resolve('typescript/bin/tsc'),
    '--outDir', output,
    '--target', 'es2022',
    '--module', 'commonjs',
    '--jsx', 'react-jsx',
    '--esModuleInterop',
    '--resolveJsonModule',
    '--skipLibCheck',
    ...screens.map(screen => `screens/${screen}.web.tsx`),
  ], { cwd: project, stdio: 'inherit' });

  const { default: Landing, landingFeatureList } = require(path.join(output, 'screens', 'LandingScreen.web.js'));
  const { default: Blog, blogMetadata } = require(path.join(output, 'screens', 'BlogListScreen.web.js'));
  const { default: BlogPost } = require(path.join(output, 'screens', 'BlogPostScreen.web.js'));
  const { default: Contact, contactMetadata } = require(path.join(output, 'screens', 'ContactScreen.web.js'));
  const { articleSchema, blogTitle } = require(path.join(output, 'components', 'landing', 'BlogLayout.web.js'));
  const { getAllPosts } = require(path.join(output, 'services', 'blog-storage.js'));
  const posts = getAllPosts();

  const landingHtml = html.replace('    "offers": {', () =>
    `    "featureList": ${jsonLd(landingFeatureList)},\n    "offers": {`);
  writePage('index.html', landingHtml, Landing);
  writePage('blog.html', pageHead('/blog', blogMetadata), Blog);
  writePage('contact.html', pageHead('/contact', contactMetadata), Contact);
  for (const post of posts) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)) {
      throw new Error(`Invalid public blog slug: ${post.slug}`);
    }
    const route = `/blog/${post.slug}`;
    const template = pageHead(route, {
      title: post.title, description: post.metaDescription, post, schema: articleSchema(post),
    });
    writePage(`blog/${post.slug}.html`, template, BlogPost, { route: { params: { slug: post.slug } } });
  }

  // Keep the client route available for posts created in browser storage.
  const shell = pageHead('/blog', blogMetadata).replace(/<link rel="canonical"[^>]*>/, '');
  fs.writeFileSync(path.join(dist, 'site-shell.html'), shell, 'utf8');

  const routes = [
    { route: '/' }, { route: '/blog' }, { route: '/contact' },
    ...posts.map(post => ({ route: `/blog/${post.slug}`, date: post.updatedDate || post.date })),
  ];
  const urls = routes.map(({ route, date }) => {
    const lastModified = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? `<lastmod>${date}</lastmod>` : '';
    return `  <url><loc>${escapeHtml(siteUrl + route)}</loc>${lastModified}</url>`;
  });
  fs.writeFileSync(path.join(dist, 'sitemap.xml'), [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n'), 'utf8');

  fs.writeFileSync(path.join(dist, 'llms.txt'), [
    '# Halı Dene',
    '',
    '> Halı Dene, fiziksel halı mağazaları için yapay zekâ destekli halı deneme uygulamasıdır.',
    '',
    ...landingFeatureList.map(feature => `- ${feature}`),
    '',
    '## Ürün ve iletişim',
    '',
    `- [Halı Dene](${siteUrl}/): Mağaza içi halı deneme, katalog ve kullanım adımları.`,
    `- [Sık sorulan sorular](${siteUrl}/#sss): Ürün fotoğrafı yükleme, özel katalog, oda önizlemesi ve tablet kullanımı.`,
    `- [Demo talebi](${siteUrl}/contact): Mağazanız için görüşme talep edin.`,
    '',
    '## Halı seçim rehberleri',
    '',
    `- [Blog](${siteUrl}/blog): Halı ölçüleri, seçim rehberleri ve dekorasyon ipuçları.`,
    ...posts.map(post => `- [${blogTitle(post)}](${siteUrl}/blog/${post.slug}): ${post.summary}`),
    '',
  ].join('\n'), 'utf8');
  console.log(`Pre-rendered the landing page, blog, ${posts.length} articles and contact page.`);
} finally {
  fs.rmSync(output, { recursive: true, force: true });
}

#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { build } = require('esbuild');
const { format } = require('prettier');
const { createElement } = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const project = path.join(__dirname, '..');
const siteUrl = 'https://halidene.com';
const homeUrl = siteUrl + '/';
const brandLogo = '/icon-192.png';
const organizationId = homeUrl + '#organization';
const homeMetadata = {
  title: 'Halı Dene | Odanda Yapay Zeka ile Halıyı Gör!',
  description: 'Müşterilerinize halıları evlerinde gösterin. Yapay zeka destekli halı deneme platformu. 3600+ halı, 16 marka, 20 saniyede sonuç.',
  socialDescription: 'Müşterilerinize halıları evlerinde gösterin. Yapay zeka destekli halı deneme platformu.',
};

const faviconLinks = `
  <link rel="icon" type="image/png" sizes="192x192" href="${brandLogo}" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=rolled-rug" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=rolled-rug" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=rolled-rug" />
  <link rel="icon" href="/favicon.ico?v=rolled-rug" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=rolled-rug" />
`.trim();

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function jsonLd(value) {
  return JSON.stringify(value, null, 2).replace(/</g, '\\u003c');
}

function googleTag() {
  const { VERCEL_ENV, VERCEL_PROJECT_PRODUCTION_URL } = process.env;
  if (VERCEL_ENV !== 'production' || VERCEL_PROJECT_PRODUCTION_URL !== new URL(siteUrl).hostname) {
    return '';
  }

  return `
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        window.dataLayer.push(arguments);
      }
      gtag('js', new Date());
    </script>
    <script async src="https://www.googletagmanager.com/gtm.js?id=GTM-NJR7W57P"></script>
  `;
}

function webAnalytics() {
  if (process.env.VERCEL_ENV !== 'production') return '';

  const { analytics } = JSON.parse(process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG || '{}');
  if (!analytics?.scriptSrc || !analytics.viewEndpoint) return '';

  const scriptSrc = new URL(analytics.scriptSrc, siteUrl).href;
  const viewEndpoint = new URL(analytics.viewEndpoint, siteUrl).href;

  return `
    <script>
      window.va = window.va || function () {
        (window.vaq = window.vaq || []).push(arguments);
      };
      window.va('beforeSend', function (event) {
        if (window.location.origin !== '${siteUrl}') return null;
        const url = new URL(event.url, window.location.origin);
        return { ...event, url: url.origin + url.pathname };
      });
    </script>
    <script defer src="${escapeHtml(scriptSrc)}" data-view-endpoint="${escapeHtml(viewEndpoint)}"></script>
  `;
}

function documentHtml(assets, { route, title, description, socialDescription = description, post, schema, noIndex = false }, markup) {
  const url = siteUrl + route;
  const socialUrl = route === '/' ? siteUrl : url;
  const image = post?.featuredImage || siteUrl + '/og-image.png';
  const preloads = markup.match(/^(?:<link rel="preload"[^>]*\/>)+/)?.[0] || '';
  const schemaScript = schema
    ? `<script type="application/ld+json"${post ? ' data-blog="true"' : ''}>\n${jsonLd(schema)}\n</script>`
    : '';

  return `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    ${googleTag()}
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    ${noIndex ? '<meta name="robots" content="noindex" />' : `<link rel="canonical" href="${escapeHtml(url)}" />`}
    <meta name="theme-color" content="#0F0F0F" />
    <meta name="msapplication-TileColor" content="#0F0F0F" />

    ${faviconLinks}
    <link rel="stylesheet" href="${assets.css}" />
    ${preloads.replaceAll('/><link', '/>\n    <link')}

    <meta property="og:type" content="${post ? 'article' : 'website'}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(socialDescription)}" />
    <meta property="og:url" content="${escapeHtml(socialUrl)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:locale" content="tr_TR" />
    <meta property="og:site_name" content="Halı Dene" />

    <meta name="twitter:card" content="${post && !post.featuredImage ? 'summary' : 'summary_large_image'}" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(socialDescription)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />

    ${schemaScript}
    ${webAnalytics()}
  </head>
  <body>
    <div id="root">${markup.slice(preloads.length)}</div>
    <script defer src="${assets.js}"></script>
  </body>
</html>
`;
}

async function writeHtml(filename, html) {
  const formatted = await format(html, {
    parser: 'html',
    printWidth: 100,
    htmlWhitespaceSensitivity: 'css',
    embeddedLanguageFormatting: 'off',
  });
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, formatted, 'utf8');
}

async function buildAssets(dist) {
  const result = await build({
    absWorkingDir: project,
    entryPoints: { site: 'website.tsx' },
    outdir: path.join(dist, 'assets'),
    entryNames: '[name]-[hash]',
    bundle: true,
    minify: true,
    metafile: true,
    jsx: 'automatic',
    target: ['chrome100', 'firefox100', 'safari15.4'],
    external: ['/landing/*'],
    define: { 'process.env.NODE_ENV': '"production"' },
  });
  const [script, output] = Object.entries(result.metafile.outputs).find(([, file]) => file.entryPoint);
  const relativeUrl = file => '/' + path.relative(dist, path.resolve(project, file)).split(path.sep).join('/');
  return { js: relativeUrl(script), css: relativeUrl(output.cssBundle) };
}

function compileScreens(output) {
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
}

function homeSchema(featureList, testimonial) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': homeUrl + '#website',
        name: 'Halı Dene',
        url: homeUrl,
        inLanguage: 'tr',
        publisher: { '@id': organizationId },
      },
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: 'Halı Dene',
        url: homeUrl,
        logo: siteUrl + brandLogo,
      },
      {
        '@type': 'SoftwareApplication',
        '@id': homeUrl + '#application',
        name: 'Halı Dene',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web, iOS, Android',
        description: 'Fiziksel halı mağazaları için yapay zekâ destekli halı deneme uygulaması.',
        url: homeUrl,
        publisher: { '@id': organizationId },
        featureList,
        offers: { '@type': 'Offer', category: 'SaaS' },
      },
      {
        '@type': 'Quotation',
        '@id': homeUrl + '#' + testimonial.id,
        name: 'Halı Dene müşteri yorumu',
        genre: 'Müşteri yorumu',
        text: testimonial.quote,
        inLanguage: 'tr',
        about: { '@id': homeUrl + '#application' },
        creator: {
          '@type': 'Person',
          name: testimonial.author,
          affiliation: { '@type': 'Organization', name: testimonial.store },
        },
      },
    ],
  };
}

async function buildWebsite() {
  const dist = fs.mkdtempSync(path.join(project, '.web-build-'));
  const output = fs.mkdtempSync(path.join(project, 'node_modules', '.public-html-'));
  try {
    fs.cpSync(path.join(project, 'public'), dist, { recursive: true });
    const assets = await buildAssets(dist);
    compileScreens(output);

    const { default: Landing, landingFeatureList, storeTestimonial } = require(path.join(output, 'screens', 'LandingScreen.web.js'));
    const { default: Blog, blogMetadata } = require(path.join(output, 'screens', 'BlogListScreen.web.js'));
    const { default: BlogPost } = require(path.join(output, 'screens', 'BlogPostScreen.web.js'));
    const { default: Contact, contactMetadata } = require(path.join(output, 'screens', 'ContactScreen.web.js'));
    const { articleSchema, blogTitle } = require(path.join(output, 'components', 'landing', 'BlogLayout.web.js'));
    const { getAllPosts } = require(path.join(output, 'services', 'blog-storage.js'));
    const posts = getAllPosts();

    function writePage(file, metadata, screen, props) {
      const markup = screen ? renderToStaticMarkup(createElement(screen, props)) : '';
      return writeHtml(path.join(dist, file), documentHtml(assets, metadata, markup));
    }

    await writePage('index.html', {
      route: '/',
      ...homeMetadata,
      schema: homeSchema(landingFeatureList, storeTestimonial),
    }, Landing);
    await writePage('blog.html', { route: '/blog', ...blogMetadata }, Blog);
    await writePage('iletisim.html', {
      route: '/iletisim',
      ...contactMetadata,
      schema: {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: contactMetadata.title,
        description: contactMetadata.description,
        url: siteUrl + '/iletisim',
        inLanguage: 'tr',
        about: { '@id': organizationId },
      },
    }, Contact);
    for (const post of posts) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)) {
        throw new Error(`Invalid public blog slug: ${post.slug}`);
      }
      await writePage(`blog/${post.slug}.html`, {
        route: `/blog/${post.slug}`,
        title: post.title,
        description: post.metaDescription,
        post,
        schema: articleSchema(post),
      }, BlogPost, { route: { params: { slug: post.slug } } });
    }

    // The blog fallback renders articles saved in the visitor's browser.
    await writePage('site-shell.html', { route: '/blog', ...blogMetadata, noIndex: true });

    const promoPath = path.join(dist, 'promo.html');
    const promo = fs.readFileSync(promoPath, 'utf8')
      .replace('<head>', () => '<head>' + googleTag())
      .replace(/<link rel="icon"[^>]*>/, () => faviconLinks)
      .replace('</head>', () => webAnalytics() + '</head>');
    await writeHtml(promoPath, promo);

    const dateFormat = /^\d{4}-\d{2}-\d{2}$/;
    // Content and link changes determine the date, independently of deployments.
    const siteLastModified = '2026-11-25';
    const articleRoutes = posts.map(post => ({
      route: `/blog/${post.slug}`,
      lastModified: [post.updatedDate, post.date].find(date => dateFormat.test(date)),
      priority: '0.7',
    }));
    const blogLastModified = [siteLastModified, ...articleRoutes.map(article => article.lastModified)]
      .filter(date => dateFormat.test(date))
      .sort()
      .at(-1);
    const routes = [
      { route: '/', lastModified: siteLastModified, priority: '1.0' },
      { route: '/blog', lastModified: blogLastModified, priority: '0.8' },
      { route: '/iletisim', lastModified: siteLastModified, priority: '0.8' },
      ...articleRoutes,
    ];
    fs.writeFileSync(path.join(dist, 'sitemap.xml'), [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...routes.flatMap(({ route, lastModified, priority }) => [
        '  <url>',
        `    <loc>${escapeHtml(siteUrl + route)}</loc>`,
        ...(lastModified ? [`    <lastmod>${lastModified}</lastmod>`] : []),
        `    <priority>${priority}</priority>`,
        '  </url>',
      ]),
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
      `- [Halı Dene](${homeUrl}): Mağaza içi halı deneme, katalog ve kullanım adımları.`,
      `- [Sık sorulan sorular](${homeUrl}#sss): Ürün fotoğrafı yükleme, özel katalog, oda önizlemesi ve tablet kullanımı.`,
      `- [Demo talebi](${siteUrl}/iletisim): Mağazanız için görüşme talep edin.`,
      `- [${storeTestimonial.author} müşteri yorumu](${homeUrl}#${storeTestimonial.id})`,
      '',
      '## Halı seçim rehberleri',
      '',
      `- [Blog](${siteUrl}/blog): Halı ölçüleri, seçim rehberleri ve dekorasyon ipuçları.`,
      ...posts.map(post => `- [${blogTitle(post)}](${siteUrl}/blog/${post.slug}): ${post.summary}`),
      '',
    ].join('\n'), 'utf8');

    const destination = path.join(project, 'dist');
    fs.rmSync(destination, { recursive: true, force: true });
    fs.renameSync(dist, destination);
    console.log(`Built the website with ${posts.length} blog articles.`);
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
    fs.rmSync(dist, { recursive: true, force: true });
  }
}

buildWebsite().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

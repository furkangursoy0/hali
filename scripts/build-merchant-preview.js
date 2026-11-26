const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const project = path.join(__dirname, '..');
const dist = path.join(project, 'dist');
const appDir = path.join(dist, 'uygulama');
const onVercel = Boolean(process.env.VERCEL_ENV);
const production = process.env.VERCEL_ENV === 'production';

async function merchantApiReady() {
  if (!onVercel) return true;

  try {
    const api = new URL(process.env.EXPO_PUBLIC_API_BASE_URL);
    if (
      api.protocol !== 'https:' ||
      api.username ||
      api.password ||
      api.search ||
      api.hash
    )
      return false;

    const base = api.href.replace(/\/+$/, '');
    const options = { redirect: 'error', signal: AbortSignal.timeout(6000) };
    const [health, database] = await Promise.all([
      fetch(base + '/health', options),
      fetch(base + '/health/db', options),
    ]);
    if (!health.ok || !database.ok) return false;

    const [service, connection] = await Promise.all([
      health.json(),
      database.json(),
    ]);
    return (
      service.service === 'hali-backend' &&
      service.ok === true &&
      connection.db === true
    );
  } catch {
    return false;
  }
}

async function build() {
  const merchantReady = await merchantApiReady();
  if (!merchantReady)
    console.log(
      'Merchant API unavailable. Publishing the store access status page.',
    );

  execFileSync(process.execPath, [path.join(__dirname, 'build-web.js')], {
    stdio: 'inherit',
  });

  execFileSync(
    process.execPath,
    [
      require.resolve('expo/bin/cli'),
      'export',
      '--platform',
      'web',
      '--clear',
      '--output-dir',
      appDir,
      '--max-workers',
      '2',
    ],
    {
      cwd: project,
      env: {
        ...process.env,
        CI: '1',
        EXPO_OFFLINE: '1',
        EXPO_PUBLIC_FOLDER: path.join('public', 'merchant-app'),
        HALIDENE_MERCHANT_EXPORT: '1',
        EXPO_PUBLIC_MERCHANT_UNAVAILABLE: merchantReady ? '0' : '1',
        EXPO_PUBLIC_APP_ENV: production
          ? 'production'
          : process.env.EXPO_PUBLIC_APP_ENV || 'development',
      },
      stdio: 'inherit',
    },
  );

  const appHtmlPath = path.join(appDir, 'index.html');
  const appHtml = fs
    .readFileSync(appHtmlPath, 'utf8')
    .replace(/<html(?:\s[^>]*)?>/i, '<html lang="tr">')
    .replace(
      /<title>[^<]*<\/title>/i,
      '<title>Mağaza girişi | Halı Dene</title>',
    )
    .replace(/<link rel="icon"[^>]*>/i, '')
    .replace(
      '</head>',
      `
      <meta name="robots" content="noindex" />
      <link rel="icon" href="/favicon.ico" />
      <style>
        @font-face {
          font-family: Inter;
          font-style: normal;
          font-weight: 400 900;
          font-display: swap;
          src: url('/landing/fonts/inter-v20-latin-ext.woff2') format('woff2');
          unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+2113, U+2C60-2C7F, U+A720-A7FF;
        }
        @font-face {
          font-family: Inter;
          font-style: normal;
          font-weight: 400 900;
          font-display: swap;
          src: url('/landing/fonts/inter-v20-latin.woff2') format('woff2');
          unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
        }
      </style>
    </head>`,
    );
  fs.writeFileSync(path.join(dist, 'uygulama.html'), appHtml);
  fs.rmSync(appHtmlPath);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

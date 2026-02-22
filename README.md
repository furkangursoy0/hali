# HALI AI

## Run App

```bash
npm install
npm start
```

Web:

```bash
npm run web
```

## Run Backend (Auth + Admin + Render + Usage)

1. Install backend dependencies:

```bash
npm --prefix backend install
```

2. Create env file:

```bash
cp backend/.env.example backend/.env
```

3. Set required vars in `backend/.env`:

```bash
OPENAI_API_KEY=...
DATABASE_URL=postgresql://...
JWT_SECRET=...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
ADMIN_FULL_NAME=...
```

4. Generate Prisma client and run migration:

```bash
npm --prefix backend run prisma:generate
npm --prefix backend run prisma:migrate
```

5. Start backend:

```bash
npm run backend
```

Backend default URL: `http://localhost:8787`

## Frontend Env Profiles

Create one of these files and restart Expo:

- `.env.development`
- `.env.staging`
- `.env.production`

Start from examples:

```bash
cp .env.development.example .env.development
```

Main frontend variables:

```bash
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_API_BASE_URL=http://YOUR_BACKEND_HOST:8787
EXPO_PUBLIC_DAILY_RENDER_LIMIT=20
EXPO_PUBLIC_USE_BACKEND_LIMIT=false
EXPO_PUBLIC_STORAGE_MODE=mock
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
EXPO_PUBLIC_CARPET_CDN_BASE=https://cdn.jsdelivr.net/gh/furkangursoy0/hali@main/assets
EXPO_PUBLIC_CARPET_THUMB_CDN_BASE=
```

Notes:

- `EXPO_PUBLIC_API_BASE_URL` points to backend proxy.
- `EXPO_PUBLIC_DAILY_RENDER_LIMIT` currently drives frontend mock limit (backend-ready hook exists).
- `EXPO_PUBLIC_USE_BACKEND_LIMIT=true` yaparsan adapter backend endpointlerine gecer:
  - `GET /api/usage`
  - `POST /api/usage/consume`
- Contract dokumani: `docs/faz5-limit-api-contract.md`
- Bulut gorsel modu:
  - `EXPO_PUBLIC_STORAGE_MODE=mock` (backendsiz local)
  - `EXPO_PUBLIC_STORAGE_MODE=cloudinary-unsigned` (Cloudinary unsigned upload)
- Cloudinary unsigned modda gerekenler:
  - `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`
  - `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- Storage adapter: `services/storage.ts`

## Carpet Image Pipeline (thumb + full)

- Liste ekrani `thumb` gorsel kullanir.
- AI render istegi `full` gorsel kullanir (kalite korunur).

Thumb dosyalarini uretmek icin:

```bash
npm run carpets:thumbs
```

Katalogu thumbPath alanlariyla tekrar uretmek icin:

```bash
npm run carpets:catalog
```

Not:

- `EXPO_PUBLIC_CARPET_THUMB_CDN_BASE` bos ise sistem wsrv fallback ile thumb olusturur.
- Gercek iki-dal (ayri thumb bucket/CDN) icin bu env'i doldur.

## Release Docs

- Build checklist: `docs/deploy-checklist.md`
- Release note template: `docs/release-notes-template.md`

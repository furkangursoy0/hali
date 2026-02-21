# Faz 3 - Storage Adapter (Backend'siz)

Bu fazda storage katmani backend'e dokunmadan eklendi.

## Storage mode

`constants/env.ts`:
- `EXPO_PUBLIC_STORAGE_MODE=mock`
- `EXPO_PUBLIC_STORAGE_MODE=cloudinary-unsigned`

## Adapter

`services/storage.ts`
- `getStorageClient()`
- `uploadImage(uri, options)`

### mock client
- Gorseli upload etmez, gelen local URI'i geri dondurur.

### cloudinary-unsigned client
- Cloudinary unsigned upload endpointine direkt cikar:
  - `POST https://api.cloudinary.com/v1_1/<cloud_name>/image/upload`
- Gerekli env:
  - `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`
  - `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

## UI entegrasyonu

`screens/ResultScreen.tsx`
- Render basarili olduktan sonra cloud upload arka planda baslar.
- Paylasim butonu varsa cloud URL'i, yoksa local URI'i kullanir.
- Upload status metni gosterilir (yukleniyor / basarili / hata).

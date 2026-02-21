# Faz 2 - Admin API Sözleşmesi (Taslak)

Bu sözleşme, Faz 2 implementasyonunda backend endpointlerinin davranışını sabitlemek için hazırlanmıştır.

## Auth

- Geçici admin doğrulama: `x-admin-token` header
- Değer: backend env'deki `ADMIN_TOKEN`
- Hatalar:
  - `401 Unauthorized` -> token yanlış/yok
  - `500` -> admin token konfigüre edilmemiş

---

## 1) GET `/admin/overview`

Amaç: üst dashboard metrikleri

### Response 200
```json
{
  "users": 12,
  "organizations": 3,
  "renders": 248,
  "totalCredits": 1420
}
```

### Errors
- `401`, `500`

---

## 2) GET `/admin/users`

Amaç: kullanıcı + organizasyon + kredi görünümü

### Response 200 (örnek)
```json
[
  {
    "id": "usr_1",
    "email": "admin@hali.local",
    "name": "Local Admin",
    "role": "ADMIN",
    "organizationId": "org_1",
    "organization": {
      "id": "org_1",
      "name": "Default Organization",
      "credits": {
        "id": "cr_1",
        "balance": 999
      }
    }
  }
]
```

### Errors
- `401`, `500`

---

## 3) POST `/admin/users`

Amaç: kullanıcı oluşturmak (isteğe bağlı yeni organization ile)

### Request
```json
{
  "email": "staff1@example.com",
  "name": "Staff 1",
  "role": "STAFF",
  "organizationId": "org_1"
}
```

veya organization yoksa:

```json
{
  "email": "staff2@example.com",
  "name": "Staff 2",
  "role": "STAFF",
  "organizationName": "Kadikoy Subesi"
}
```

### Validation
- `email`, `name` zorunlu
- `role` yoksa `STAFF`

### Response
- `201 Created` -> oluşturulan user

### Errors
- `400` -> eksik alan
- `401` -> yetkisiz
- `500` -> duplicate email veya internal

---

## 4) GET `/admin/credits`

Amaç: organization bazlı kredi bakiyesi listesi

### Response 200 (örnek)
```json
[
  {
    "id": "cr_1",
    "organizationId": "org_1",
    "balance": 999,
    "organization": {
      "id": "org_1",
      "name": "Default Organization"
    }
  }
]
```

### Errors
- `401`, `500`

---

## 5) POST `/admin/credits/adjust`

Amaç: kredi artır/azalt

### Request
```json
{
  "organizationId": "org_1",
  "delta": -10,
  "reason": "manual_adjust"
}
```

### Validation
- `organizationId` zorunlu
- `delta` numeric zorunlu

### Response 200
Güncel `CreditBalance` satırı

### Errors
- `400`, `401`, `500`

---

## 6) GET `/admin/renders?limit=50`

Amaç: render geçmişi ve durum takibi

### Query
- `limit` default `50`, max `200`

### Response 200 (örnek)
```json
[
  {
    "id": "rnd_1",
    "mode": "preview",
    "status": "success",
    "error": null,
    "createdAt": "2026-02-20T20:10:00.000Z",
    "organization": {
      "id": "org_1",
      "name": "Default Organization"
    },
    "user": {
      "id": "usr_1",
      "email": "admin@hali.local",
      "name": "Local Admin"
    }
  }
]
```

### Errors
- `401`, `500`

---

## 7) Render-DB Entegrasyonu Beklenen Davranış

`POST /api/render` için hedef davranış:

1. `RenderJob(status=processing)` oluştur
2. Upstream render çağrısı yap
3. Başarılıysa:
   - `RenderJob.status=success`
   - `CreditBalance.balance` 1 azalt
   - `CreditLog(delta=-1, reason='render')`
4. Hatalıysa:
   - `RenderJob.status=failed`
   - `RenderJob.error` doldur

Kritik: 3. adım transaction içinde olmalı.

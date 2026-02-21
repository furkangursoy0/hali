# Faz 5 - Limit API Contract (Frontend Adapter)

Frontend adapter dosyasi: `services/usage-limit-client.ts`

## 1) GET /api/usage
Amaç: kullanicinin mevcut gunluk hakkini donmek.

### 200 Response
```json
{
  "limit": 20,
  "used": 5,
  "remaining": 15,
  "resetAt": "2026-02-21T12:00:00.000Z"
}
```

### Error
- `401`: login gerekli
- `500`: sistem hatasi

## 2) POST /api/usage/consume
Amaç: render tetiklenmeden once 1 hak dusmek.

### Request
```json
{
  "type": "render",
  "amount": 1
}
```

### 200 Response
```json
{
  "limit": 20,
  "used": 6,
  "remaining": 14,
  "resetAt": "2026-02-21T12:00:00.000Z"
}
```

### Limit dolu
- `429 Too Many Requests`
```json
{
  "code": "LIMIT_REACHED",
  "message": "Daily limit reached"
}
```

Not: Adapter hem `429` hem `code=LIMIT_REACHED` durumunu limit dolu olarak yakalar.

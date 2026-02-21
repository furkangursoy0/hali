# Faz 2 - Veritabanı ve Admin Planı (Backend'e Dokunmadan Hazırlık)

Bu doküman yalnızca tasarım/plan çıktısıdır. Çalışan backend kodu değiştirilmemiştir.

## 1) Hedef

- Render geçmişini kalıcı olarak tutmak
- Kullanıcı/organizasyon bazlı yönetim altyapısı hazırlamak
- Kredi/limit sistemine veri zemini sağlamak
- Admin panel için güvenli ve sade bir ilk veri modeli oluşturmak

## 2) Teknik Karar (Geçici + Üretim)

- Geliştirme: SQLite (hızlı kurulum, düşük maliyet)
- Üretim: PostgreSQL (ölçek, concurrency, raporlama)
- ORM: Prisma

Not: Şema Prisma ile hazırlanır, üretimde `provider` PostgreSQL'e çevrilir.

## 3) Varlıklar

- `Organization`: Firma/mağaza hesabı
- `User`: Sistemi kullanan kişi (`ADMIN`, `STAFF`)
- `CreditBalance`: Kalan kredi (tek satır / organization)
- `CreditLog`: Kredi artış/azalış geçmişi
- `RenderJob`: Üretilen görsel istekleri ve durum
- `Carpet`: Katalogdaki halı meta verisi
- `AuditLog`: Admin aksiyonları ve kritik olay izi

## 4) İlişkiler

- 1 `Organization` -> N `User`
- 1 `Organization` -> 1 `CreditBalance`
- 1 `Organization` -> N `RenderJob`
- 1 `Organization` -> N `CreditLog`
- 1 `Organization` -> N `AuditLog`
- 1 `User` -> N `RenderJob` (opsiyonel)
- 1 `User` -> N `CreditLog` (opsiyonel)

## 5) Veri Doğruluğu Kuralları

- `User.email` unique olmalı
- `CreditBalance.organizationId` unique olmalı
- Render sonunda kredi düşümü transaction içinde yapılmalı
- `RenderJob.status` sadece şu değerlerden biri olmalı:
  - `queued`, `processing`, `success`, `failed`
- `AuditLog` kritik admin işlemlerini zorunlu kaydetmeli

## 6) Faz 2 Uygulama Sırası (Öneri)

1. Prisma kur ve şemayı proje içine ekle.
2. İlk migration oluştur (`init_schema`).
3. `seed` ile default org + admin kullanıcı + başlangıç kredi satırı ekle.
4. Sadece read-only admin endpointleri aç:
   - `/admin/overview`
   - `/admin/users`
   - `/admin/renders`
5. Sonra mutating endpointleri aç:
   - `/admin/users (POST)`
   - `/admin/credits/adjust (POST)`
6. Render endpointini DB ile transaction tabanlı bağla.

## 7) Güvenlik Notları

- Admin endpointleri için `x-admin-token` geçici çözüm; finalde JWT/role guard
- IP rate-limit backend katmanında korunmalı
- API key yalnızca backend env'de kalmalı
- Audit kaydı olmadan kredi ayarı yapılmamalı

## 8) Minimal Admin Ekran Kapsamı

- Overview kartları:
  - toplam kullanıcı, toplam render, toplam kalan kredi
- User listesi:
  - ad, email, rol, organizasyon, kredi
- Render listesi:
  - tarih, kullanıcı, mode, status, hata metni
- Credit action:
  - org seç, delta gir (+/-), reason gir, uygula

## 9) Geçiş Riski ve Önlem

- Risk: Render path'i DB entegrasyonu sonrası yavaşlayabilir
  - Önlem: `RenderJob` kaydını minimal alanla yaz, ağır metadata sonradan ekle
- Risk: Credit race condition
  - Önlem: kredi düşümünü tek transaction ile yap
- Risk: Admin kötüye kullanım
  - Önlem: Audit zorunluluğu + role guard + kısa token rotasyonu

## 10) DoD (Definition of Done)

- Şema migration hata vermeden uygulanabiliyor
- Seed sonrası admin endpointleri veri döndürüyor
- Render işleminde `RenderJob` ve `CreditLog` kayıtları oluşuyor
- Credit adjust endpointi audit satırı üretiyor

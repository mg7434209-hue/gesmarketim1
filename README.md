# GES MARKETİM ☀️

**gesmarketim.com** — Solar enerji e-ticaret sitesi. Güneş paneli, LiFePO4
lityum akü, hibrit/akıllı inverter, şarj regülatörü, tarımsal sulama sürücüleri
ve kullanıma hazır solar paketler.

Saf HTML + CSS + Vanilla JS, bağımlılıksız Node statik sunucu. Beyaza yakın
bej (krem) tema, AI destekli asistan, WhatsApp sipariş akışı.

## Çalıştırma

```bash
npm start        # http://localhost:3000
npm test         # JS söz dizimi kontrolleri
npm run build    # sitemap.xml üret
```

## Özellikler

- 🗂 11 birleşik kategori, ~75 ürün, 14 hazır solar paket
- 🏷 KDV dahil fiyat + üstü çizili kampanya fiyatı + % indirim rozeti
- 💰 Havale/EFT indirimi, ücretsiz kargo limiti (config'ten yönetilir)
- 📦 Paket detayında "pakete dahil olanlar" + ayrı alım vs paket karşılaştırması
- 🧾 Fiyatı gizli ürünlerde "Teklif Al" formu (WhatsApp deep-link)
- 🛒 Sepet + WhatsApp üzerinden sipariş (dropshipping/telefon teyit modeli)
- 🤖 Kural tabanlı AI asistan: paket önerisi, panel adedi hesabı, ürün arama
- 🔍 Doğal dil arama: "550W panel", "100Ah bluetooth akü", "3kw paket"
- 🛠 Admin paneli (`admin.html`): duyuru bandı, toplu/tekil fiyat, marj yönetimi
- 🔎 SEO: JSON-LD (Organization, WebSite, Product, BreadcrumbList, FAQPage),
  sitemap.xml, kategori rehber metinleri, sayfa bazlı title/description

## Deploy

- **Railway**: `railway.json` hazır — `npm start` ile yayınlanır.
- Statik host (GitHub Pages vb.): kök dizini doğrudan servis edin.

Detaylı geliştirici notları için `CLAUDE.md`, ürün/iş kuralları spesifikasyonu
için `docs/build-spec.md` dosyasına bakın.

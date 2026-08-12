# CLAUDE.md — GES MARKETİM (gesmarketim1)

> Repo kök dizinindedir; Claude Code her oturum başında otomatik okur.

## Proje
gesmarketim.com — **solar dropshipping e-ticaret sitesi**. bahcesolar.com rakip
analizinden türetilen build spec'e göre inşa edildi (bkz. `docs/build-spec.md`).
Çok sayfalı statik site: saf HTML + CSS + Vanilla JS, bağımlılıksız Node statik
sunucu (`server.js`, Railway uyumlu). Sunucu tarafı yok; sepet/favori/admin
verileri istemcide (localStorage, `gesm.` öneki) tutulur. Tema: beyaza yakın
bej/krem (kullanıcı kararı — spec'teki dark theme yerine).

KATALOG MİMARİSİ (12.08.2026 — kritik): ürünler/kategoriler SUNUCUDAN gelir:
`/api/products` + `/api/categories` ← `data/catalog.json` ← `build-catalog.js`
← tedarikçi fiyat listesi CSV'si (`data/*.csv`). Gömülü `assets/data.js`
KALDIRILDI (çift katalog tutarsızlığının köküydü). AŞAMALI KURULUM: şu an
SADECE LEXRON aşaması (82 ürün, 7 kategori); yeni marka = yeni CSV +
build-catalog.js güncellemesi. Kataloğa maliyet alanı ASLA yazılmaz (K1).

Sayfalar (kök dizinde):
`index.html` (hero + kategori grid + "Kendi Projenizi Oluşturun" bölümü +
kampanya/çok satan/yeni) ·
`sistem-kur.html` (Sistem Kurucu: senaryo → cihaz adetleri → ihtiyaç
hesabı → katalogdan panel/akü/inverter/ekipman önerisi → sepete ekle +
WhatsApp teklif; mantık `app.js pageBuilder()`, TÜM katsayılar ve katalog
eşlemesi `config.builder`'da — koda sayı gömme; durum localStorage
`gesm.builder`, `?tip=<senaryo>` ön seçim yapar) ·
`kategori.html?k=slug|?q=arama` (filtre paneli + sıralama + sayfalama + SEO
rehber metni) · `urun.html?u=id` (galeri, fiyat/Teklif Al, sekmeler, paket
bileşen listesi + ayrı alım karşılaştırması, JSON-LD Product) · `sepet.html`
(sepet + WhatsApp sipariş akışı) · `favoriler.html` · `iletisim.html` ·
`hakkimizda.html` · `sss.html` (FAQPage JSON-LD) · `kargo-teslimat.html` ·
`iade-degisim.html` · `mesafeli-satis.html` · `gizlilik.html` · `404.html` ·
`admin.html` (fiyat/duyuru yönetimi — menüde yok, robots'ta engelli).
Header/nav/footer `app.js renderChrome()` ile enjekte edilir — sayfalarda
`<div id="chrome-top">` / `<div id="chrome-footer">` yer tutucuları vardır.

## DEĞİŞMEZ İŞ KURALLARI (spec 8.1)
- **K1**: Tedarikçi ve MALİYET bilgisi müşteri arayüzünde HİÇBİR yerde
  görünmez; `data/catalog.json`'a maliyet alanı hiç yazılmaz (kaynak CSV'ler
  yalnız backend/veri deposunda kalır).
- **K2**: Enerji Pazarı ürünlerinde varsayılan marj %20 (`config.pricing`).
- **K3**: Fiyat yönetimi: toplu + tekil, yüzdesel + manuel, tedarikçi + kategori
  bazlı — `admin.html` üzerinden, localStorage'da (`gesm.admin`). Kalıcı yayın =
  CSV/`build-catalog.js` üzerinden yeni catalog.json üretip commit.
- **K4**: Ön yüz AI asistanlı (kural tabanlı, `app.js` chat IIFE). Tema, spec'te
  dark yazsa da kullanıcı talebiyle açık bej'e çevrildi — geri dönme.
- **K5**: Ürün açıklamaları ÖZGÜN — rakip metin/görsel kopyalanmaz. Görseller
  SVG yer tutucu (`thumbSVG`); gerçek görsel eklenecekse `assets/img/` altına
  tedarikçi/üretici kaynaklı dosya koy, dış siteden hotlink YAPMA.
- "FİYAT SORUN" ürünlerinde fiyat alanı render edilmez → `onRequest: true` +
  Teklif Al formu (WhatsApp deep-link).
- **K6 — Paket Sistemler bu aşamada YOK** (aşamalı kurulum): kendi
  bundle'larımız ileriki aşamada kendi kategorisiyle eklenecek.
- Stokta olmayan ürün (catalog.json `inStock:false`) yayında kalır:
  "STOKTA YOK" rozeti, sepete eklenemez, detayda "stok gelince haber ver".

## TEK DOĞRU KAYNAK — `assets/config.js`
İletişim, duyuru bandı, kargo/havale katsayıları, marj/kur kuralları, nav,
Sistem Kurucu katsayıları, admin şifresi YALNIZCA burada. Kategoriler ve
ürünler /api'den gelir (bkz. Katalog Mimarisi). Sayfalara sayı gömme.

## Dosya mimarisi
- `assets/config.js` — konfig (yukarıda).
- `build-catalog.js` — TEK DOĞRU KAYNAK zinciri: tedarikçi CSV'si →
  `data/catalog.json` (82 Lexron ürünü, 7 kategori, saleUsd, inStock,
  görseller `public/images/products/<slug>*` + `data/gorsel-eslesme.json`
  devralmaları). Yeni liste = CSV koy + `npm run build` + commit.
- `data/catalog.json` — ÜRETİLİR (elle düzenlenmez); server.js bunu
  `/api/products` + `/api/categories` olarak servis eder.
- `assets/app.js`    — fiyat motoru (`priceOf`: tekil override > açık fiyat >
  maliyet×marj, sonra toplu % ayarları), sepet, favoriler, arama, kategori
  filtreleri, ürün detay, WhatsApp sipariş, AI asistan, admin panel.
- `assets/style.css` — açık bej tema tasarım sistemi (CSS değişkenleri).
- `server.js`        — statik sunucu; uzantısız yol → `.html` eşlemesi yapar.
- `build-seo.js`     — `sitemap.xml` üretir (`npm run build`); ürün/kategori
  değişince yeniden üret ve çıktıyı commit'le.

## Konvansiyonlar
- Sayfa linkleri `.html` uzantılı; ürün `urun.html?u=id`, kategori
  `kategori.html?k=slug`, arama `kategori.html?q=...`.
- localStorage anahtarları `gesm.` önekiyle başlar.
- **FİYATLAR USD TABANLIDIR**: her fiyatlı üründe `saleUsd` (veya Havensis
  `priceUsd`) bulunur; ₺ = USD × güncel kur × (1+`pricing.fxBufferPct`/100),
  `priceOf()` içinde hesaplanır — ürünlere statik ₺ yazma. Kur kaynağı sırası:
  admin cihaz-yerel deneme > sunucu günlük kuru (`/api/kur` → localStorage
  `gesm.kur`) > `config.commerce.usdTry`. Kur SUNUCUDA OTOMATİK güncellenir:
  açılışta + 6 saatte bir (KUR_REFRESH_HOURS) open.er-api.com/frankfurter.app
  piyasa kurundan çekilir (`server.js autoUpdateKur`; %15+ sıçrama reddedilir;
  kapatma: AUTO_KUR=false). Admin panelden "Kuru Yayınla" elle yazar ve 24 saat
  otomatiğe ezdirilmez. Kalıcılık: `DATA_DIR/kur.json` (Railway Volume önerilir).
  Duyuru bandındaki `.fx-badge` rozeti güncel kuru gösterir.
- Tüm fiyat gösterimi KDV dahil; havale fiyatı `havalePrice()` ile hesaplanır.
- JSON-LD: Organization her sayfada, WebSite+SearchAction ana sayfada, Product+
  BreadcrumbList ürün sayfasında, FAQPage `sss.html`'de statik.
- Yeni ürün/liste eklerken: CSV'yi `data/` altına koy, `build-catalog.js`
  kaynağını güncelle, `npm run build` + commit (catalog.json + sitemap).

## Ağ Kısıtı (ÖNEMLİ)
Buluttaki Claude Code dış sitelere erişemez (egress izin listesi). Dış veri
gerekiyorsa dosya olarak repoya ekle.

## Çalıştırma & Test (commit öncesi)
- `npm test`  → tüm JS söz dizimi kontrolü.
- `npm run build` → sitemap.xml.
- `npm start` → http://localhost:3000 ; ana sayfaların 200 döndüğünü doğrula.

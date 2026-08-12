# CLAUDE.md — GES MARKETİM (gesmarketim1)

> Repo kök dizinindedir; Claude Code her oturum başında otomatik okur.

## Proje
gesmarketim.com — **solar dropshipping e-ticaret sitesi**. bahcesolar.com rakip
analizinden türetilen build spec'e göre inşa edildi (bkz. `docs/build-spec.md`).
**React 18 + Vite + Tailwind SPA** (12.08.2026'da sıfırdan kuruldu) +
bağımlılıksız Node sunucu (`server.js`, Railway uyumlu). Sepet/tercihler
istemcide (localStorage, `gesm.` öneki). Tema: beyaza yakın bej/krem; marka
paleti Tailwind token'larında (`frontend/tailwind.config.js` — mavi #36C5EC,
yeşil #6ABF89, lime #A2C864, amber #FDC722, kırmızı #F65863, metin #474948).

KATALOG MİMARİSİ (kritik): ürünler/kategoriler SUNUCUDAN gelir:
`/api/products` + `/api/categories` + `/api/products/:id` ← `data/catalog.json`
← `build-catalog.js` ← tedarikçi fiyat listesi CSV'si (`data/*.csv`).
AŞAMALI KURULUM: şu an SADECE LEXRON aşaması (82 ürün, 7 kategori); yeni
marka = yeni CSV + build-catalog.js güncellemesi. Kataloğa maliyet alanı
ASLA yazılmaz (K1). `/api/config` GÜVENLİ config alt kümesini verir
(company/announcement/commerce/pricing{roundTo,fxBufferPct}/brands/builder/seo
— admin şifresi ve tedarikçi bilgisi ASLA çıkmaz).

SPA rotaları (react-router; server.js history fallback yapar):
`/` (hero animasyonu + sayan istatistikler + kategori grid + "Yapay Zekâ ile
Projenizi Tasarlayın" 3 profil kartı (karavan/ev/sulama → `/hesaplayici?profil=X`)
+ çok satanlar) · `/kategori` + `/kategori/:slug` + `/kategori?q=arama`
(fiyat aralığı/marka/stok filtreleri, sıralama, sayfalama, kategori SEO metni) ·
`/urun/:id` (galeri, fiyat bloğu, sepete ekle, JSON-LD Product, benzer ürünler) ·
`/sepet` (adet/kaldır, kargo+havale özeti, WhatsApp sipariş) · `/hesaplayici`
(Sistem Kurucu sihirbazı — eski pageBuilder portu; `?profil=` veya `?tip=`
ön seçim) · `/iletisim` · statikler: `/hakkimizda` `/sss` (FAQPage JSON-LD)
`/kargo-teslimat` `/iade-degisim` `/mesafeli-satis` `/kvkk` · SPA 404.
Eski `.html` URL'leri server.js 301 ile yeni rotalara yönlendirir (SEO).

## DEĞİŞMEZ İŞ KURALLARI (spec 8.1)
- **K1**: Tedarikçi ve MALİYET bilgisi müşteri arayüzünde HİÇBİR yerde
  görünmez; `data/catalog.json`'a maliyet alanı hiç yazılmaz. server.js
  `data/`, `backup/`, `assets/` klasörlerini SERVİS ETMEZ (yalnız dist/ +
  public/ + sitemap/robots) — kaynak CSV'ler dışarı sızmaz.
- **K3**: Fiyat yönetimi CSV/`build-catalog.js` üzerinden: yeni catalog.json
  üretip commit'le (eski admin.html paneli SPA geçişinde kaldırıldı; kur elle
  yayınlama `POST /api/kur` ile yapılır — ADMIN_PASS).
- **K5**: Ürün açıklamaları ÖZGÜN — rakip metin/görsel kopyalanmaz. Görselsiz
  ürün markalı SVG yer tutucu gösterir (`PlaceholderImg`); dış hotlink YAPMA.
- **K7 — GÖRSELDE MARKA KURALI**: bir ürünün görselinde FARKLI marka
  görünemez. Görsel devralma/eşleştirme yalnız AYNI MARKA içinde —
  `build-catalog.js` zorlar (`data/gorsel-eslesme.json` `kaynakMarka` eşleşmeli;
  `_dislama` listesindeki dosyalar hiç kullanılmaz). Yanlış görsel,
  görselsizlikten kötüdür → emin olunamayan ürün SVG yer tutucuda kalır.
- **K6 — Paket Sistemler bu aşamada YOK** (aşamalı kurulum).
- Stokta olmayan ürün (`inStock:false`) yayında kalır: "STOKTA YOK" rozeti,
  sepete eklenemez, detayda "stok gelince haber ver" (WhatsApp).

## TEK DOĞRU KAYNAK — `assets/config.js`
İletişim, duyuru bandı, kargo/havale katsayıları, kur tamponu/yuvarlama,
Sistem Kurucu katsayıları (`config.builder`), admin şifresi YALNIZCA burada.
server.js bunu okur ve güvenli alt kümesini `/api/config` ile SPA'ya verir —
React tarafına sayı gömme. Tarayıcıya bu dosya artık servis edilmez.

## Dosya mimarisi
- `frontend/` — React SPA kaynağı (Vite + Tailwind). `src/api.js` (store,
  fiyat: ₺ = saleUsd × kur × (1+fxBufferPct/100) → roundTo'ya yuvarla; sepet),
  `src/hooks.js` (useCountUp, useSeo), `src/components/` (Layout, ui),
  `src/pages/` (Home/Category/Product/Cart/Builder/Contact/Static/NotFound).
  Değişiklik sonrası `npm run build:web` (kökten) → `dist/` üretir.
- `dist/` — ÜRETİLİR ama COMMIT EDİLİR (Railway'de frontend build koşmaz;
  server.js SPA'yı buradan servis eder). frontend değişince yeniden build +
  commit. `frontend/public/` içindekiler (favicon, hero-panel.webp) dist'e
  kopyalanır; ürün görselleri ise kökteki `public/images/products/`ta kalır.
- `assets/config.js` — konfig (yukarıda; server-side).
- `build-catalog.js` — CSV → `data/catalog.json` (saleUsd, inStock, görseller
  `public/images/products/<slug>*` + `data/gorsel-eslesme.json` devralmaları).
- `data/catalog.json` — ÜRETİLİR (elle düzenlenmez); `/api/products` kaynağı.
- `server.js` — API (/api/products[,/:id], /api/categories, /api/config,
  /api/kur GET/POST) + dist/ SPA fallback + eski URL 301 + otomatik kur.
- `build-seo.js` — `sitemap.xml` üretir (SPA rotalarıyla; `npm run build`).
- `tools/gorsel_yerlestir.py` — Lexron görsel zip'i geldiğinde bulanık
  eşleştirme + WebP optimizasyon + rapor (DRY-RUN varsayılan, `--uygula` yazar).

## Konvansiyonlar
- Rotalar UZANTISIZ: ürün `/urun/:id`, kategori `/kategori/:slug`, arama
  `/kategori?q=...`. localStorage anahtarları `gesm.` önekiyle başlar
  (sepet `gesm.cart` = {id: adet}, kurucu `gesm.builder`).
- **FİYATLAR USD TABANLIDIR**: üründe `saleUsd`; ₺ hesabı İSTEMCİDE
  `frontend/src/api.js priceTL()` ile — statik ₺ yazma. Kur sırası: sunucu
  günlük kuru (`/api/kur`) > `config.commerce.usdTry`. Kur SUNUCUDA OTOMATİK
  güncellenir: açılışta + 6 saatte bir (KUR_REFRESH_HOURS) open.er-api.com/
  frankfurter.app (%15+ sıçrama reddedilir; kapatma AUTO_KUR=false). Elle kur:
  `POST /api/kur {usdTry, pass}` — 24 saat otomatiğe ezdirilmez. Kalıcılık:
  `DATA_DIR/kur.json` (Railway Volume önerilir). Duyuru bandındaki rozet
  güncel kuru gösterir.
- Tüm fiyat gösterimi KDV dahil; havale fiyatı `havaleTL()` (%havaleDiscountPct).
- SEO: sayfa başına dinamik title/description (`useSeo`), JSON-LD Product
  (ürün), BreadcrumbList (kategori), FAQPage (/sss). Görseller lazy (hero hariç
  — `fetchpriority=high` LCP).
- Yeni ürün/liste: CSV'yi `data/`ya koy, `build-catalog.js` güncelle,
  `npm run build` + commit (catalog.json + sitemap).

## Ağ Kısıtı (ÖNEMLİ)
Buluttaki Claude Code dış sitelere erişemez (egress izin listesi). Dış veri
gerekiyorsa dosya olarak repoya ekle.

## Çalıştırma & Test (commit öncesi)
- `npm test` → sunucu/build betikleri söz dizimi.
- `npm run build` → catalog + sitemap; `npm run build:web` → React → dist/.
- `npm start` → http://localhost:3000 ; `/`, `/kategori/panel`, `/urun/:id`,
  `/api/products`, `/api/config` 200 döndüğünü doğrula (SPA fallback dahil).

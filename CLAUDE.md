# CLAUDE.md — GES MARKETİM (gesmarketim1)

> Repo kök dizinindedir; Claude Code her oturum başında otomatik okur.

## Proje
gesmarketim.com — **solar dropshipping e-ticaret sitesi**. bahcesolar.com rakip
analizinden türetilen build spec'e göre inşa edildi (bkz. `docs/build-spec.md`).
Çok sayfalı statik site: saf HTML + CSS + Vanilla JS, bağımlılıksız Node statik
sunucu (`server.js`, Railway uyumlu). Sunucu tarafı yok; sepet/favori/admin
verileri istemcide (localStorage, `gesm.` öneki) tutulur. Tema: beyaza yakın
bej/krem (kullanıcı kararı — spec'teki dark theme yerine).

Sayfalar (kök dizinde):
`index.html` (hero + kategori grid + "Kendi Projenizi Oluşturun" bölümü +
kampanya/çok satan/yeni — paket vitrini ŞİMDİLİK kaldırıldı, aşağıya bak) ·
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
- **K1**: Tedarikçi bilgisi (Mexxsun, Enerji Pazarı) müşteri arayüzünde HİÇBİR
  yerde görünmez — yalnız `admin.html`. `data.js` içindeki `supplier`/`cost`
  alanlarını müşteri sayfalarında ASLA render etme.
- **K2**: Enerji Pazarı ürünlerinde varsayılan marj %20 (`config.pricing`).
- **K3**: Fiyat yönetimi: toplu + tekil, yüzdesel + manuel, tedarikçi + kategori
  bazlı — `admin.html` üzerinden, localStorage'da (`gesm.admin`). Kalıcı yayın =
  değerleri `config.js`/`data.js`'e işleyip commit.
- **K4**: Ön yüz AI asistanlı (kural tabanlı, `app.js` chat IIFE). Tema, spec'te
  dark yazsa da kullanıcı talebiyle açık bej'e çevrildi — geri dönme.
- **K5**: Ürün açıklamaları ÖZGÜN — rakip metin/görsel kopyalanmaz. Görseller
  SVG yer tutucu (`thumbSVG`); gerçek görsel eklenecekse `assets/img/` altına
  tedarikçi/üretici kaynaklı dosya koy, dış siteden hotlink YAPMA.
- "FİYAT SORUN" ürünlerinde fiyat alanı render edilmez → `onRequest: true` +
  Teklif Al formu (WhatsApp deep-link).
- **K6 — Hazır paketler ŞİMDİLİK gizli** (`config.hiddenCategories:
  ["solar-paketler"]`): listelerde/aramada/ana sayfada/sitemap'te görünmez,
  nav'da yerini "Sistem Kur" aldı; ürün VERİSİ data.js'te durur ve doğrudan
  `urun.html?u=pkt*` URL'leri çalışır. Geri açmak = slug'ı listeden çıkar +
  nav'ı geri al + index paket bölümünü geri koy + `npm run build`.

## TEK DOĞRU KAYNAK — `assets/config.js`
İletişim, duyuru bandı, kargo/havale katsayıları, marj kuralları, 11 kategori
(+SEO rehber metinleri), admin şifresi YALNIZCA burada. Sayfalara sayı gömme.

## Dosya mimarisi
- `assets/config.js` — konfig (yukarıda).
- `assets/data.js`   — ürün kataloğu (247 gerçek tedarikçi ürünü, 19 paket dahil;
  tümü görselli — görselsiz/temsili ürünler kaldırıldı). Paketlerde `components[]`
  bileşen listesi (ref → ürün id; ref'siz bileşen düz metin render edilir).
  Havensis ürünleri (`hvs-*`, fiyat listesi 02/2026 sıra 11–33) **USD fiyatlıdır**:
  `priceUsd` alanı + `config.commerce.usdTry` kuru → kartta $ ve yaklaşık ₺
  gösterilir, sepet ₺ üzerinden işler, JSON-LD offer USD olur. Kur admin panelden
  geçici (localStorage), config'ten kalıcı güncellenir.
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
- Yeni ürün eklerken `data.js`'e `add({...})` + `npm run build` (sitemap).

## Ağ Kısıtı (ÖNEMLİ)
Buluttaki Claude Code dış sitelere erişemez (egress izin listesi). Dış veri
gerekiyorsa dosya olarak repoya ekle.

## Çalıştırma & Test (commit öncesi)
- `npm test`  → tüm JS söz dizimi kontrolü.
- `npm run build` → sitemap.xml.
- `npm start` → http://localhost:3000 ; ana sayfaların 200 döndüğünü doğrula.

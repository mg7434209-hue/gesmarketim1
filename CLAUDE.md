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
`index.html` (hero + kategori grid + paket vitrini + kampanya/çok satan/yeni) ·
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

## TEK DOĞRU KAYNAK — `assets/config.js`
İletişim, duyuru bandı, kargo/havale katsayıları, marj kuralları, 11 kategori
(+SEO rehber metinleri), admin şifresi YALNIZCA burada. Sayfalara sayı gömme.

## Dosya mimarisi
- `assets/config.js` — konfig (yukarıda).
- `assets/data.js`   — ürün kataloğu (75 gerçek tedarikçi ürünü + 11 paket;
  tümü görselli — görselsiz/temsili ürünler kaldırıldı). Paketlerde `components[]`
  bileşen listesi (ref → ürün id; ref'siz bileşen düz metin render edilir).
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

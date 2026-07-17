# tools/

## tedarikci_gorsel_toplayici.py

Mexxsun + Enerji Pazarı sitemap'lerinden ürün URL'lerini bulur, og:image ve
galeri görsellerini `public/images/products/{tedarikci}/` altına indirir,
`data/urun_gorsel_eslesme.csv` eşleme tablosunu yazar.

> ⚠️ **Bu script buluttaki Claude Code oturumunda ÇALIŞMAZ** — ortamın egress
> izin listesi tedarikçi sitelerine 403 verir (17.07.2026'da doğrulandı).
> Kendi bilgisayarınızda çalıştırın.

### Yerel çalıştırma (Windows/macOS/Linux)

```bash
cd gesmarketim1                      # repo kökü
pip install requests beautifulsoup4
python tools/tedarikci_gorsel_toplayici.py --limit 10   # önce küçük deneme
python tools/tedarikci_gorsel_toplayici.py              # tam çalıştırma
```

Seçenekler:
- `--supplier mexxsun|enerjipazari` — tek tedarikçi
- `--limit N` — tedarikçi başına en çok N ürün (deneme için)
- `--delay 0.6` — istekler arası bekleme saniyesi (nazik tarama)
- `--force` — var olan görsellerin üzerine yeniden indir

Script kaldığı yerden devam eder (mevcut görseli atlar), logo/ikon/banner
gürültüsünü ve 5 KB altı görselleri eler, ürün başına en çok 6 görsel alır.

### Sonrası

1. İndirilen `public/images/products/` klasörünü ve `data/urun_gorsel_eslesme.csv`
   dosyasını commit'leyin.
2. Claude Code'a "CSV'deki görselleri ürünlere bağla" deyin — `assets/data.js`
   ürün kayıtlarına `img` alanı eklenip SVG yer tutucular gerçek görsellerle
   değiştirilir.

Görseller tedarikçi kaynaklıdır; yalnızca bayisi olduğunuz ürünlerin
listelenmesinde kullanın (CLAUDE.md kural K5).

# GESMARKETIM — BahçeSolar Analiz ve Build Spec (PDF'ten aktarım)

> Kaynak: GESMARKETIM_BahceSolar_Analiz_ve_Build_Spec.pdf (16.07.2026).
> Bu dosya PDF'in düz metin aktarımıdır; sitenin iş kuralları buradan türetilmiştir.

GESMARKETIM.COM
E-Ticaret Platformu — Tam Build Spesifikasyonu
Referans/Rakip Analizi: bahcesolar.com (Akaylar Grup — OpenCart altyapısı)
Hazırlanma amacı: Bu doküman Claude Code'a doğrudan verilmek üzere hazırlanmıştır. Rakip sitenin
tam yapısı, kategori ağacı, ürün/fiyat envanteri, sayfa anatomisi, görsel kaynakları ve
gesmarketim.com için yapılacak geliştirmelerin tamamını içerir.
Proje
gesmarketim.com — Solar dropshipping e-ticaret platformu
Sahip
Gespa Enerji Sanayi Ticaret Ltd. Şti. — Mustafa Göksoylar
Tedarikçiler
Mexxsun + Enerji Pazarı (285 ürün) — müşteriye ASLA gösterilmez
Referans site
bahcesolar.com — analiz tarihi: 16 Temmuz 2026
Hedef
Rakipten daha hızlı, daha modern, SEO-üstün, dark-theme AI destekli mağaza
Doküman versiyonu
v1.0 — Claude Code build brief
ÖNEMLİ — GÖRSELLER HAKKINDA: Bu PDF üretildiği ortamın internet erişimi kısıtlı olduğu için görseller
dosyanın içine gömülemedi. Bunun yerine Bölüm 7'de TÜM görsel URL'leri kategorize liste halinde ve
Claude Code'un tek komutla çalıştırabileceği hazır indirme scripti ile verilmiştir. Claude Code bu
URL'lerden görselleri orijinal çözünürlükte doğrudan indirebilir — bu, PDF içine gömülü düşük
çözünürlüklü görselden daha kullanışlıdır.


1. Yönetici Özeti
bahcesolar.com, Akaylar Grup tarafından işletilen, OpenCart 3.x tabanlı, Türkçe bir solar e-ticaret
sitesidir. Güneş panelleri, jel/lityum aküler, inverterler, şarj regülatörleri, tarımsal sulama (pompa
sürücüleri) ve hazır solar paketler satar. Yaklaşık 60+ aktif ürün, 15 marka ve 14 hazır paket içerir.
Fiyat aralığı 380 TL (10A PWM regülatör) ile 256.000 TL (11 kW lityum paket) arasındadır.
Sitenin ticari modeli gesmarketim ile birebir örtüşür: stoksuz/az stoklu, telefonla teyit odaklı ("Sipariş
vermeden önce irtibata geçiniz" uyarısı), WhatsApp kanalı ağırlıklı satış. Zayıf yönleri (yavaş OpenCart
teması, kötü mobil UX, SEO eksikleri, tutarsız ürün adlandırma) gesmarketim için doğrudan rekabet
fırsatıdır — Bölüm 9'da tek tek listelenmiştir.
Gesmarketim tarafında hâlihazırda tanımlı kurallar bu spec'te korunmuştur: 11 birleşik kategori,
tedarikçi bilgisinin müşteriden tamamen gizlenmesi, Enerji Pazarı ürünlerinde %20 marj, admin
panelde toplu/tekil + yüzdesel/manuel + tedarikçi ve kategori bazlı marj yönetimi, dark-theme AI
destekli ön yüz.
2. Rakip Sitenin Teknik Analizi
Özellik
Tespit
Gesmarketim kararı
Altyapı
OpenCart 3.x (index.php?route=... URL'leri,
standart account/checkout rotaları)
Next.js 14 + PostgreSQL (mevcut standart stack)
Tema
Hazır OpenCart teması; bootstrap grid; tab'lı ürün
vitrini
Özel dark-theme, Tailwind, SSR
URL yapısı
SEO-friendly slug + kırıntı: /gunes-enerji-sistemle
ri/solar-sistemleri/{kategori}/{urun}
Daha kısa: /kategori/urun-slug (max 2 seviye)
Fiyat gösterimi
KDV dahil + "Vergiler Hariç" satırı; üstü çizili eski
fiyat (kampanya)
Aynı patern + yüzde indirim rozeti
Stok
"Stokta Var" etiketi; bazı ürünler 0,00₺ = "FİYAT
SORUN" modeli
Fiyat Sorun yerine "Teklif Al" formu + WhatsApp
deep-link
Canlı destek
Tawk.to widget + WhatsApp butonu
(wa.me/905414431453)
WhatsApp + AI chat asistan (Claude API)
Ödeme
Kredi kartı ikon bandı; "peşin/KK fiyat farkı
oluşur" uyarısı
iyzico/PayTR entegrasyonu + havale indirimi
İade
14 gün koşulsuz iade; OpenCart return modülü
Aynı yasal standart (Mesafeli Satış Söz.)
Üyelik
Klasik giriş/üye ol + popup login
Telefon/OTP öncelikli hızlı üyelik
Bülten
Footer'da e-posta aboneliği + KVKK onayı
Aynı + indirim kuponu teşviki
3. Tam Site Haritası ve Kategori Ağacı
Ana menü 8 başlıktan oluşur. Parantez içindekiler alt kategorilerdir:
Ana Kategori
Alt Kategoriler
URL yolu
GÜNEŞ PANELLERİ
Monokristal Paneller
/gunes-enerji-sistemleri/solar-sistemleri/gu
nes-panelleri
AKÜLER
Jel Aküler · Lityum Aküler
/solar-akuler/jel-akuler ·
/solar-akuler/lityum-akuler
INVERTERLER
On-Grid Hibrit · On-Grid Şebeke · Tam Sinüs Akıllı ·
Tam Sinüs · Tam Sinüs UPS · Modifiye Sinüs
/inverteler/{alt-slug} (6 alt kategori)
ŞARJ CİHAZLARI
PWM Regülatör · MPPT Regülatör · AC-DC Akü Şarj
/sarj-cihazlari/{alt-slug}
TARIMSAL SULAMA
Pompa Sürücüleri · DC Pompalar · Saksı Sulama
Cihazı
/tarimsal-sulama/{alt-slug}


Ana Kategori
Alt Kategoriler
URL yolu
SOLAR EKİPMANLAR
DC Sigorta-Konnektörler · Solar Kablolar · Montaj
Ekipmanları
/solar-ekipmanlar/{alt-slug}
SOLAR PAKETLER
(tek seviye — 14 paket ürünü)
/solar-paketleri
İLETİŞİM
—
route=information/contact
Kurumsal/bilgi sayfaları (footer): Hakkımızda, SSS, Kargo & Teslimat, Gizlilik & Güvenlik,
İptal-İade-Değişim, Mesafeli Satış Sözleşmesi, Kolay İade, Hediye Çeki, Hesabım, Favoriler, Siparişler.
3.1 Markalar (marka sayfaları mevcut — 15 adet)
TommaTech · Arçelik · CW Energy · Gazioğlu · Auxsol · Exelon · Mexxun (=Mexxsun) · Megacell ·
Agromot · Tescom Solar · Werer Energy · Deye · Sako · Lexron · Pantec. Her marka /marka-slug
URL'sinde ayrı listeleme sayfasına sahiptir. Not: Mexxun, gesmarketim'in tedarikçisi Mexxsun ile aynı
üreticidir — fiyat karşılaştırması için birebir referanstır.


4. Tam Ürün ve Fiyat Envanteri (16.07.2026 itibarıyla)
Tüm fiyatlar KDV dahil TL'dir. "İnd. öncesi" sütunu üstü çizili kampanya-öncesi fiyattır. 0,00₺ görünen
ürünler sitede "FİYAT SORUN" modelinde satılır.
4.1 Güneş Panelleri (Monokristal)
Ürün
Fiyat (₺)
İnd. öncesi
245 W A+ Half Cut Monokristal Perc (yerli)
2.980,00
—
275 W A+ Half Cut Monokristal Perc (yerli, 72 hücre)
3.100,00
—
Gazioğlu 280 W A+ Half-Cut TopCon
3.290,00
—
450 W A+ Half Cut Mono Perc (Gazioğlu)
FİYAT SORUN
—
550 W A+ Half Cut Mono Perc (Gazioğlu)
5.290,00
—
Gazioğlu 600 W A- Half-Cut TopCon
5.150,00
—
Gazioğlu 600 W A+ Half-Cut TopCon
5.980,00
—
CW Enerji 600 Wp 120PM M12 HC-MB
6.580,00
—
TommaTech 585 Wp 156PM M10 HC-MB
6.590,00
—
CW Enerji 600 Wp 144TNB M10 G2G TopCon
6.690,00
—
4.2 Aküler (Lityum LiFePO4 ağırlıklı)
Ürün
Fiyat (₺)
İnd. öncesi
100 Ah 12V LiFePO4 — Bluetooth/Wifi
14.900,00
—
Megacell 12,8V 100 Ah LiFePO4 ABS Standart
16.900,00
—
Megacell 12,8V 120 Ah LiFePO4 ABS Standart
20.100,00
—
100 Ah 24V LiFePO4 — Bluetooth/Wifi (kampanyalı)
23.450,00
26.800,00
Megacell 12,8V 150 Ah LiFePO4 ABS Standart
24.400,00
—
Megacell 12,8V 150 Ah LiFePO4 ABS Bluetooth
24.500,00
—
Megacell 12,8V 200 Ah LiFePO4 ABS Bluetooth
31.800,00
—
100 Ah 36V LiFePO4 — Bluetooth/Wifi
36.900,00
—
100 Ah / 5,4 kWh / 51,2V LiFePO4 WPU — Bluetooth
44.200,00
—
11 kW Sessiz Jeneratör Tek Faz (akü sekmesinde listeleniyor)
FİYAT SORUN
—
4.3 Inverterler
Ürün
Fiyat (₺)
İnd. öncesi
1 kW MPPT 12V Akıllı İnverter
7.810,00
—
1.6 kW HV MPPT Akıllı İnverter 12V
8.380,00
—
3 kW HV MPPT Akıllı İnverter 24V (kampanyalı)
9.265,00
10.500,00
4.2 kW HV MPPT Akıllı İnverter 24V
13.800,00
—
6.2 kW HV MPPT Akıllı İnverter 48V
18.300,00
—
Tam Sinüs Akıllı 48V 8000W Twin (MAX 8000) (kampanyalı)
29.985,00
48.750,00
11 kW HV 2xMPPT Akıllı İnverter 48V
FİYAT SORUN
—
DEYE 10 kW Monofaze
34.500,00
—
DEYE 10 kW Trifaze
34.900,00
—
DEYE 12 kW Hibrit Trifaze LV (48V)
132.800,00
—
DEYE 100 kW Trifaze
156.700,00
—


4.4 Şarj Cihazları / Regülatörler
Ürün
Fiyat (₺)
10A PWM Şarj Kontrol Cihazı (12/24V)
380,00
20A PWM Şarj Kontrol Cihazı (12/24V)
470,00
30A PWM Şarj Kontrol Cihazı (12/24V)
695,00
20A MPPT Şarj Kontrol Cihazı (12/24V, 60V panel)
2.180,00
30A MPPT Şarj Kontrol Cihazı (12/24V, 100V panel)
2.720,00
(PC18F) 60A MPPT 12/24/48V
6.030,00
(MPK8) 60A MPPT 12/24/48V
7.182,00
(PC18F) 80A MPPT 12/24/48V
7.540,00
(PC18F) 100A MPPT 12/24/48V
8.040,00
(MPK8) 100A MPPT 12/24/48V
9.250,00
4.5 Tarımsal Sulama — Solar Pompa Sürücüleri (Trifaze)
Ürün
Fiyat (₺)
2Hp/3Hp (1,5/2,2 kW) Pompa Sürücüsü (3x220)
6.660,00
3Hp (2,2 kW) Pompa Sürücüsü
7.800,00
10Hp (7,5 kW) Pompa Sürücüsü
14.440,00
15Hp (11 kW) Pompa Sürücüsü
18.240,00
20Hp (15 kW) Pompa Sürücüsü
19.980,00
25Hp (18,5 kW) Pompa Sürücüsü
27.750,00
30Hp (22 kW) Pompa Sürücüsü
31.450,00
40Hp (30 kW) Pompa Sürücüsü
40.700,00
100Hp (75 kW) Pompa Sürücüsü
88.800,00
120Hp (90 kW) Pompa Sürücüsü
103.600,00
4.6 Solar Paketler (14 adet — sitenin amiral ürün grubu)
Kod
Paket
Fiyat (₺)
PKT1
Mini Solar Paket
13.690,00
PKT2
Karavan / Konteyner Paket
24.650,00
PKT3
Yayla / Bağ Evi Solar Paket
34.875,00
PKT4
3 kW Solar Paket
39.900,00
PKT5
4 kW Solar Paket
56.800,00
PKT6
4 kW Lityum Paket
61.750,00
PKT7
6 kW Lityum Paket (ürün kodu SS.SP.PKT007)
92.750,00
PKT8
8 kW Lityum Paket
128.500,00
PKT10
10,2 kW Lityum Paket
176.000,00
PKT9
8 kW Lityum Paket (üst konfigürasyon)
179.800,00
PKT11
11 kW Lityum Paket
193.700,00
PKT12
11 kW Lityum Paket (orta konfig.)
228.000,00
PKT14
12 kW Lityum Paket
238.900,00
PKT13
11 kW Lityum Paket (üst konfig.)
256.000,00
Fiyat merdiveni analizi: paketler 13.690 → 256.000 TL arasında, kullanım senaryosuna göre
adlandırılmış (karavan, bağ evi, ev tipi kW bazlı). Aynı kW'ta birden çok konfigürasyon sunma stratejisi


(PKT8/9, PKT11/12/13) müşteriye bütçe basamağı yaratıyor. Gesmarketim paket sayfasında bu strateji
"Ekonomik / Standart / Pro" etiketleriyle daha okunur hale getirilmelidir.


5. Sayfa Anatomileri (birebir yapı çözümlemesi)
5.1 Anasayfa yapısı (yukarıdan aşağıya)
#
Bölüm
İçerik / Davranış
1
Duyuru bandı
Tek satır kampanya metni ("Açılışa özel fırsatlar")
2
Header
Logo (sol) + Giriş/Üye Ol + Sepet özeti (ürün adedi + tutar)
3
Mega menü
8 ana kategori, hover ile alt kategoriler
4
Hero banner
Tam genişlik kampanya görseli + telefon linki (tel:)
5
Marka karuseli
15 marka logosu, marka sayfalarına link
6
Kategori kutuları
7 görsel kutu (paneller, aküler, inverterler, paketler, sulama, şarj, ekipman)
7
Paket vitrini
14 paketin görsel grid'i — her biri ürün sayfasına link
8
İndirimli ürünler şeridi
4 kampanyalı ürün kartı (eski fiyat üstü çizili)
9
Tab'lı ürün vitrini
5 sekme: Paneller / Aküler / Inverterler / Şarj / Ekipman — sekme başına ~10 kart
10
Video bölümleri
"Uygulanan Projeler" + "Özel Ürün" — YouTube embed
11
WhatsApp CTA
wa.me linki, tam genişlik buton
12
Güven şeridi
Kolay iade (14 gün) · 256bit SSL · Hızlı kargo
13
Footer
Kurumsal + Bilgilendirme linkleri + bülten + sosyal + ödeme ikonları
5.2 Kategori sayfası yapısı
Kırıntı menü → H1 kategori adı → sol filtre paneli (fiyat aralığı min/max + stok durumu sayaçlı) →
sıralama seçici (ad, fiyat, oylama, ürün kodu) → sayfa başına adet seçici (25/30/50/75/100) → ürün kartı
grid → sayfalama. Ürün kartı: görsel, ad (link), kısa açıklama (2 satır kesme), fiyat + vergiler hariç
satırı, Sepete Ekle / Favori / Karşılaştır butonları.
5.3 Ürün detay sayfası yapısı (örnek: 6 kW Lityum Paket PKT7)
Bölge
İçerik
Galeri
Ana görsel 800x800 + thumbnail'lar 100x100; paket ürünlerde bileşen görselleri de galeride
(ör. panel görseli)
Satın alma bloğu
H1 ad · yorum sayısı/linki · fiyat · vergiler hariç · stok durumu · ürün kodu (SS.SP.PKTxxx) · adet ·
Sepete Ekle · Favori · Karşılaştır
Uyarı şeridi
3 statik uyarı: sipariş öncesi irtibat · peşin/KK fiyat farkı · yüklü sipariş kapıya teslim
Sekmeler
Ürün Açıklaması · İptal & İade Koşulları (standart 14 gün metni) · Yorumlar (form dahil)
Etiketler
Ürün adı + ürün kodu + kategori etiket linkleri (site içi arama)
İlgili ürünler
4'lü kampanyalı ürün karuseli
Destek
Tawk.to "Soru Sor" + WhatsApp butonu
6. SEO Yapısı Analizi
Öğe
bahcesolar.com uygulaması
Gesmarketim hedefi
Title
Anasayfa: "Solar Güneş Enerji Sistemleri";
kategori: uzun anahtar kelimeli title
Şablon: {Ürün} Fiyatı ve Özellikleri |
Gesmarketim
Meta
description
Anahtar kelime yığını (~40 kelime); kategori
sayfalarında emoji bile var
Doğal 150-160 karakter, CTA içeren özgün metin
Meta keywords
Aşırı uzun keyword listesi (eski teknik — Google
yok sayıyor)
Kullanma; yapılandırılmış veriye yatır
OG/Twitter
og:image çoğu üründe var; kategori sayfalarında
placeholder
Her sayfada gerçek görsel + dinamik OG


Öğe
bahcesolar.com uygulaması
Gesmarketim hedefi
Yapılandırılmış
veri
Yok (Product/Offer schema tespit edilmedi)
Product + Offer + AggregateRating +
BreadcrumbList JSON-LD (kritik avantaj)
İçerik
Blog yok; kategori açıklaması yok
Trafik Motoru kuralı: her kategoriye 500+ kelime
rehber içerik + blog


7. Görsel Envanteri ve Claude Code İndirme Talimatı
Telif uyarısı: Aşağıdaki URL'ler analiz ve teknik referans içindir. Bahcesolar'ın kendi tasarladığı
banner/afiş görselleri ve ürün açıklama metinleri o siteye aittir — gesmarketim'de birebir
kullanılmamalıdır. Ürün görselleri için doğru kaynak: kendi tedarikçilerinin (Mexxsun, Enerji Pazarı)
ürün görselleri ve üretici (Deye, CW Enerji, TommaTech, Megacell vb.) resmî medya kitleri. Rakip
görselleri yalnızca "hangi üründe nasıl görsel kullanılmış" karşılaştırması için indirilmelidir.
7.1 Görsel URL deseni (OpenCart cache sistemi)
Site tüm görselleri şu desenle sunar — Claude Code istediği boyutu üretebilir veya orijinali çekebilir:
Önbellek: https://bahcesolar.com/image/cache/catalog/{KLASÖR}/{dosya}-{GENİŞLİK}x{YÜKSEKLİK}{w|h}.{uzantı}
Orijinal:  https://bahcesolar.com/image/catalog/{KLASÖR}/{dosya}.{uzantı}  (cache yolundan "-800x800w" son ekini
sil)
Bilinen klasörler: LOGOLAR / AFİŞLER / SOLAR ÜRÜNLER/SOLAR PAKETLER / GÜNEŞ PANELLERİ/GAZİOĞLU PANLE /
TARIMSAL SULAMA
7.2 Doğrulanmış görsel URL'leri
Görsel
URL
Site logosu (2168x876)
https://bahcesolar.com/image/cache/catalog/LOGOLAR/logo%20yeni-2168x876.png
Logo OG varyantı (1920x1080)
https://bahcesolar.com/image/cache/catalog/LOGOLAR/logo%20yeni-1920x1080w.png
Header kampanya bandı (2000x200)
https://bahcesolar.com/image/cache/catalog/LOGOLAR/web%20banner%20(2)-2000x200.png
"Uygulanan Projeler" afişi (800x400)
https://bahcesolar.com/image/cache/catalog/AF%C4%B0%C5%9ELER/Ekran%20Resmi%202025-03
-06%2002.40.54-800x400h.png
Tarımsal sulama tanıtım (800x400)
https://bahcesolar.com/image/cache/catalog/TARIMSAL%20SULAMA/RES%C4%B0M%204-800x400
h.jpg
PKT7 paket görseli (1920x1080)
https://bahcesolar.com/image/cache/catalog/SOLAR%20%C3%9CR%C3%9CNLER/SOLAR%20PAKET
LER/Slayt7-1-1920x1080h.jpeg
PKT7 paket görseli (800x800)
https://bahcesolar.com/image/cache/catalog/SOLAR%20%C3%9CR%C3%9CNLER/SOLAR%20PAKET
LER/Slayt7-1-800x800w.jpeg
Gazioğlu panel görseli (800x800)
https://bahcesolar.com/image/cache/catalog/G%C3%9CNE%C5%9E%20PANELLER%C4%B0/GAZ%C
4%B0O%C4%9ELU%20PANLE/71f67488b0857639cee631943a3fc6fa_L%20(1)-800x800h.jpg
Ödeme ikon bandı (SVG)
https://bahcesolar.com/image/catalog/gereksinim/logo-band.svg
Paket görselleri seri halinde: Slayt1-1 … Slayt14-1 deseni ile PKT1–PKT14 görselleri aynı klasörde bulunur (PKT7 = Slayt7-1
doğrulandı; diğerleri aynı desenle denenmelidir).
7.3 Tüm ürün görsellerini otomatik toplama — Claude Code scripti
Her ürün sayfasının og:image meta etiketi 1920x1080 ana görseli verir. Aşağıdaki script Bölüm 7.4'teki
ürün URL listesini gezip tüm görselleri assets/ klasörüne indirir (Claude Code'a: bu scripti
D:\Git\gesmarketim\tools\scrape_ref_images.py olarak kaydet ve çalıştır):
# pip install requests beautifulsoup4
import requests, re, os
from bs4 import BeautifulSoup
from urllib.parse import unquote
URLS = open("product_urls.txt", encoding="utf-8").read().split()
os.makedirs("assets/ref", exist_ok=True)
H = {"User-Agent": "Mozilla/5.0"}
for u in URLS:
    s = BeautifulSoup(requests.get(u, headers=H, timeout=20).text, "html.parser")
    og = s.find("meta", property="og:image")
    imgs = {og["content"]} if og else set()
    imgs |= {i["src"] for i in s.select(".product-info img, .thumbnails img") if
i.get("src","").startswith("http")}
    for img in imgs:
        name = re.sub(r"[^\w.-]", "_", unquote(img.split("/")[-1]))
        r = requests.get(img, headers=H, timeout=20)
        if r.ok: open(f"assets/ref/{name}", "wb").write(r.content)
    print("OK", u)
7.4 product_urls.txt içeriği (doğrulanmış 60 ürün URL'si)


https://bahcesolar.com/245-watt-a-half-cut-monokristal-perc
https://bahcesolar.com/275-watt-a-half-cut-monokristal-perc
https://bahcesolar.com/gazioglu-solar-280watt-a-sinif-hulf-cut-topcun-panel
https://bahcesolar.com/450-watt-a-half-cut-monokristal-perc
https://bahcesolar.com/550-watt-a-half-cut-monokristal-perc-1
https://bahcesolar.com/gazioglu-solar-600watt-a-sinif-hulf-cut-topcun-panel
https://bahcesolar.com/gazioglu-solar-600watt-a-sinif-hulf-cut-topcun-panel-1
https://bahcesolar.com/cw-enerji-600wp-120pm-m12-hc-mb
https://bahcesolar.com/cw-enerji-600wp-120pm-m12-hc-mb-1
https://bahcesolar.com/tommatech-585wp-156pm-m10-hc-mb
https://bahcesolar.com/100-ah-12v-lifepo4-lityum-demir-fosfat-batarya-aku-%E2%80%93-bluetooth-wifi
https://bahcesolar.com/100-ah-24v-lifepo4-lityum-demir-fosfat-batarya-aku-%E2%80%93-bluetooth-wifi
https://bahcesolar.com/100-ah-36v-lifepo4-lityum-demir-fosfat-batarya-aku-%E2%80%93-bluetooth-wifi
https://bahcesolar.com/100-ah-5-4kwh-51-2v-lifepo4-wpu-batarya-aku-%E2%80%93-bluetooth
https://bahcesolar.com/12-8v-100-ah-lityum-life-p04-abs-standart-1
https://bahcesolar.com/12-8v-120-ah-lityum-life-p04-abs-standart
https://bahcesolar.com/12-8v-150-ah-lityum-life-p04-abs-bluetooth
https://bahcesolar.com/12-8v-150-ah-lityum-life-p04-abs-standart
https://bahcesolar.com/12-8v-200-ah-lityum-life-p04-abs-bluetooth
https://bahcesolar.com/11kw-sessiz-jenerator-tek-faz
https://bahcesolar.com/1kw-mppt-12v-akilli-inverter
https://bahcesolar.com/1-6kw-hv-mppt-akilli-inverter-12v
https://bahcesolar.com/3kw-hv-mppt-akilli-inverter-24v
https://bahcesolar.com/4-2kw-hv-mppt-akilli-inverter-24v
https://bahcesolar.com/6-2kw-hv-mppt-akilli-inverter-48v
https://bahcesolar.com/11kw-hv-2xmppt-akilli-inverter-48v
https://bahcesolar.com/tam-sinus-akilli-48v-8000w-twin-max-8000
https://bahcesolar.com/deye-10kw-monofaze
https://bahcesolar.com/deye-10kw-trifaze
https://bahcesolar.com/deye-12-kw-hibrit-trifaze-lv-48v
https://bahcesolar.com/deye-100kw-trifaze
https://bahcesolar.com/10a-pwm-sarj-kontrol-cihazi
https://bahcesolar.com/20a-pwm-sarj-kontrol-cihazi
https://bahcesolar.com/30a-pwm-sarj-kontrol-cihazi
https://bahcesolar.com/20a-mppt-sarj-kontrol-cihazi
https://bahcesolar.com/30a-mppt-sarj-kontrol-cihazi
https://bahcesolar.com/mpk8-60a-mppt-12-24-48v
https://bahcesolar.com/mpk8-100a-mppt-12-24-48v
https://bahcesolar.com/pc18f-60a-mppt-12-24-48v
https://bahcesolar.com/pc18f-80a-mppt-12-24-48v
https://bahcesolar.com/pc18f-100a-mppt-12-24-48v
https://bahcesolar.com/2hp-3hp-1-5kw-2-2-kw-solar-pompa-surucusu-3x220
https://bahcesolar.com/3hp-2-2-kw-solar-pompa-surucusu-trifaze
https://bahcesolar.com/10hp-7-5-kw-solar-pompa-surucusu-trifaze
https://bahcesolar.com/15hp-11-kw-solar-pompa-surucusu-trifaze
https://bahcesolar.com/20hp-15-kw-solar-pompa-surucusu-trifaze
https://bahcesolar.com/25hp-18-5-kw-solar-pompa-surucusu-trifaze
https://bahcesolar.com/30hp-22-kw-solar-pompa-surucusu-trifaze
https://bahcesolar.com/40hp-30-kw-solar-pompa-surucusu-trifaze
https://bahcesolar.com/100hp-75-kw-solar-pompa-surucusu-trifaze
https://bahcesolar.com/120hp-90-kw-solar-pompa-surucusu-trifaze
https://bahcesolar.com/gunes-enerjili-otomatik-saksi-sulama-cihazi
https://bahcesolar.com/mini-solar-paket-pkt-1
https://bahcesolar.com/karavan-konteyner-paket-pkt-2
https://bahcesolar.com/yayla-bag-evi-solar-paket-pkt-3
https://bahcesolar.com/3-kw-solar-paket-pkt-4
https://bahcesolar.com/4-kw-solar-paket-pkt5
https://bahcesolar.com/4-kw-lityum-paket-pkt6
https://bahcesolar.com/6-kw-lityum-paket-pkt7
https://bahcesolar.com/8-kw-lityum-paket-pkt8
https://bahcesolar.com/8-kw-lityum-paket-pkt9
https://bahcesolar.com/10-2-kw-lityum-paket-pkt10
https://bahcesolar.com/11-kw-lityum-paket-pkt11
https://bahcesolar.com/11-kw-lityum-paket-pkt12
https://bahcesolar.com/11-kw-lityum-paket-pkt13
https://bahcesolar.com/11-kw-lityum-paket-pkt11-1


8. GESMARKETIM Build Spesifikasyonu (Claude Code
görev tanımı)
Aşağıdaki gereksinimler, mevcut gesmarketim V2 kararlarını (11 birleşik kategori, tedarikçi gizleme,
%20 Enerji Pazarı marjı, dark theme) bahcesolar analizinden çıkan yapı ile birleştirir.
8.1 Değişmez iş kuralları
#
Kural
K1
Tedarikçi bilgisi (Mexxsun, Enerji Pazarı vb.) müşteri arayüzünde HİÇBİR yerde görünmez — tek marka
deneyimi. Tedarikçi yalnızca admin panelde.
K2
Enerji Pazarı kaynaklı ürünlerde varsayılan marj %20; admin panelden tedarikçi ve kategori bazında
değiştirilebilir.
K3
Fiyat yönetimi: toplu + tekil değişim; yüzdesel + manuel mod; tedarikçi bazlı + kategori bazlı marj ayarı.
K4
Ön yüz dark-theme, AI destekli (ürün önerisi + chat asistan).
K5
Ürün açıklamaları ve banner görselleri ÖZGÜN üretilecek — rakip site metin/afişleri kopyalanmaz; ürün
fotoğrafları tedarikçi/üretici kaynaklıdır.
8.2 Kategori mimarisi (11 birleşik kategori — bahcesolar eşleştirmeli)
Gesmarketim kategorisi
Bahcesolar karşılığı
Not
Güneş Panelleri
GÜNEŞ PANELLERİ > Monokristal
Watt aralığı filtresi ekle (100-300 / 300-450 /
450-600+)
Lityum Aküler
AKÜLER > Lityum
Voltaj (12/24/36/48V) + Ah + Bluetooth filtreleri
Jel Aküler
AKÜLER > Jel
Ah filtresi
Hibrit Inverterler
On-Grid Hibrit
kW + faz (mono/trifaze) filtresi
Akıllı Inverterler (Off-Grid)
Tam Sinüs Akıllı + Tam Sinüs + UPS +
Modifiye
4 alt tipi tek kategoride "tip" filtresiyle birleştir —
bahcesolar'ın 6 alt kategorisi gereksiz bölünmüş
Şebeke Inverterleri
On-Grid Şebeke
kW filtresi
Şarj Regülatörleri
PWM + MPPT + AC-DC
Teknoloji (PWM/MPPT) + amper filtresi
Solar Paketler
SOLAR PAKETLER
Kullanım senaryosu filtresi: Karavan / Bağ Evi / Ev /
Ticari
Tarımsal Sulama
Pompa Sürücüleri + DC Pompalar
Hp/kW filtresi
Solar Ekipmanlar
Kablolar + Konnektör + Montaj
—
Aksesuar & Diğer
Saksı sulama vb. niş ürünler
—
8.3 Sayfa gereksinimleri
Sayfa
Gereksinimler
Anasayfa
Duyuru bandı (admin'den yönetilir) · hero slider · kategori grid (11) · paket vitrini · kampanya şeridi (üstü
çizili fiyat + %indirim rozeti) · tab'lı vitrin yerine "Çok Satanlar / Yeni Gelenler / Fırsatlar" karuselleri · güven
şeridi · footer
Kategori
SSR + filtre paneli (fiyat slider, marka, teknik özellik, stok) · sıralama · sonsuz kaydırma veya sayfalama ·
kategori altına 500+ kelime SEO rehber metni
Ürün detay
Galeri (zoom + thumbnail) · fiyat bloğu (KDV dahil + havale fiyatı) · stok · ürün kodu · teknik özellik tablosu
(yapılandırılmış alanlar, bahcesolar'daki gibi düz metne gömülmez!) · "Teklif Al" (fiyatı gizli ürünlerde) ·
WhatsApp deep-link · sekmeler: Açıklama / Teknik Özellikler / Kargo-İade / Yorumlar · JSON-LD Product
schema · benzer ürünler
Paket detay
Ek olarak: "Pakete dahil olanlar" bileşen listesi (her bileşen kendi ürün sayfasına link) + toplam ayrı alım vs
paket fiyat karşılaştırması
Sepet/Ödeme
Tek sayfa checkout · misafir alışveriş · iyzico/PayTR · havale/EFT seçeneği (indirimli) · KVKK + Mesafeli Satış
onayları


Sayfa
Gereksinimler
Kurumsal
Hakkımızda · SSS · Kargo-Teslimat · Gizlilik · İade-Değişim · Mesafeli Satış Sözleşmesi · İletişim (form +
WhatsApp + harita)
Hesabım
Siparişler · favoriler · adresler · iade talebi · OTP ile hızlı giriş
8.4 Admin panel gereksinimleri
Modül
Gereksinimler
Ürün yönetimi
285 tedarikçi ürünü içe aktarma · tedarikçi alanı (yalnız admin görür) · marka düzeltme kuralları · kategori
eşleme · taslak/yayın durumu
Fiyat yönetimi
Toplu + tekil değişim · yüzdesel + manuel mod · tedarikçi bazlı marj · kategori bazlı marj · kampanya fiyatı
(eski fiyat üstü çizili gösterim) · fiyat geçmişi logu
Sipariş yönetimi
Sipariş → tedarikçiye iletim akışı (dropshipping) · durum takibi · kargo entegrasyonu
İçerik
Duyuru bandı · hero slider · banner · SEO alanları (title/description/OG) sayfa bazında
Raporlama
Satış · marj analizi (tedarikçi maliyeti vs satış fiyatı) · stok uyarıları
8.5 Bahcesolar'ı geçme fırsatları (rakip zayıf noktaları)
Zayıf nokta
Gesmarketim aksiyonu
Yapılandırılmış veri yok
Product/Offer/Breadcrumb JSON-LD → Google'da fiyatlı zengin sonuç
Teknik özellikler düz metne gömülü, okunmaz
Yapılandırılmış özellik tablosu + karşılaştırma aracı
Ürün adlandırma tutarsız ("HULF-CUT TOPCUN"
yazım hataları)
Standart adlandırma şablonu: {Marka} {Güç} {Teknoloji} {Tip}
Kategori açıklaması/blog yok
Trafik Motoru içerik kümeleri: "kaç panel gerekir", "inverter seçimi"
rehberleri
"FİYAT SORUN" ürünler 0,00₺ görünüyor (kötü UX +
SEO)
"Teklif Al" akışı — fiyat alanı hiç render edilmez
Aynı kW'ta paketler ayırt edilemiyor (PKT11/12/13)
Ekonomik/Standart/Pro etiketi + paket karşılaştırma tablosu
Tab'lı vitrin JS ağırlıklı, LCP yavaş
SSR + görsel lazy-load + WebP → Core Web Vitals üstünlüğü
Placeholder OG görselleri
Her sayfada dinamik OG görsel üretimi
8.6 Claude Code için önerilen çalışma sırası
Adım
Görev
1
tools/scrape_ref_images.py + product_urls.txt oluştur (Bölüm 7.3-7.4), referans görselleri assets/ref/ altına indir
2
DB şeması: products, categories, suppliers, price_rules, orders, banners (K1-K3 kurallarına uygun)
3
Tedarikçi içe aktarma: Mexxsun + Enerji Pazarı 285 ürün → kategori eşleme + %20 marj uygula
4
Ön yüz: anasayfa → kategori → ürün detay → paket detay (Bölüm 8.3)
5
Sepet + checkout + ödeme entegrasyonu
6
Admin panel (Bölüm 8.4) — fiyat yönetimi öncelikli
7
SEO katmanı: JSON-LD, sitemap, kategori içerikleri, dinamik OG
8
Bölüm 4 fiyat tablolarıyla rekabet fiyat kontrolü: gesmarketim satış fiyatları bahcesolar ile karşılaştırılıp marj ayarı
yapılır
Bu doküman 16 Temmuz 2026 tarihli site verilerini yansıtır. Fiyatlar rakip takibi içindir; yayın öncesi güncel kontrol önerilir.
— Gesmarketim / Claude teknik ortaklığı

/* ============================================================
   GES MARKETİM — TEK DOĞRU KAYNAK (config)
   İletişim, kategoriler, marj kuralları, kargo/ödeme katsayıları
   YALNIZCA burada tutulur. Sayfalara/JS'e sayı gömme!
   ============================================================ */
window.GESM = window.GESM || {};

GESM.config = {
  company: {
    brand: "GES MARKETİM",
    legal: "Göksoylar İletişim Ltd. Şti.",
    domain: "https://gesmarketim.com",
    phone: {
      display: "0543 743 42 09",
      intl: "+90 543 743 42 09",
      tel: "+905437434209",
      wa: "905437434209"
    },
    email: "gesmarketim@gmail.com",
    address: "Örnek Mah. 1551 Sok. No:10/1, Manavgat / Antalya",
    hours: "Hafta içi 09:00–18:00 · Cumartesi 09:00–14:00",
    social: {
      instagram: "https://instagram.com/gesmarketim",
      youtube: "https://youtube.com/@gesmarketim"
    }
  },

  // Duyuru bandı (admin panelden geçersiz kılınabilir)
  announcement: "🌞 Açılışa özel fırsatlar! Havale/EFT ödemelerinde ekstra indirim — detaylar sepette.",

  // Ödeme & kargo
  commerce: {
    vatIncluded: true,          // tüm fiyatlar KDV dahil gösterilir
    havaleDiscountPct: 3,       // havale/EFT indirimi (%)
    freeShippingLimit: 15000,   // ₺ üzeri kargo bedava
    shippingFlat: 350,          // ₺ standart kargo (limit altı)
    codAvailable: false
  },

  // Fiyatlandırma kuralları (K2/K3) — admin panel bunların üzerine yazabilir
  pricing: {
    defaultMarginPct: 20,       // Enerji Pazarı varsayılan marjı (K2)
    marginBySupplier: { mexxsun: 15, enerjipazari: 20 },
    marginByCategory: {},       // ör. { "solar-paketler": 18 }
    roundTo: 10                 // satış fiyatı yuvarlama adımı (₺)
  },

  // Tedarikçiler — K1: müşteri arayüzünde ASLA gösterilmez, yalnız admin panelde
  suppliers: {
    mexxsun:      { label: "Mexxsun" },
    enerjipazari: { label: "Enerji Pazarı" }
  },

  // 11 birleşik kategori (spec 8.2)
  categories: [
    { slug: "gunes-panelleri",     name: "Güneş Panelleri",              icon: "☀️", desc: "Polikristal, monokristal ve TopCon güneş panelleri — 12 W'tan 750 W'a.",
      seo: "Güneş paneli seçerken ilk bakılması gereken değer panel gücüdür (Wp). Karavan ve küçük bağ evi sistemlerinde 245–300 W paneller yeterli olurken, ev tipi ve tarımsal sistemlerde 450–600 W half-cut monokristal veya TopCon paneller hem çatı alanından hem kablolamadan tasarruf sağlar. A+ hücre sınıfı, düşük sıcaklık katsayısı ve 10 yıl ürün / 25 yıl performans garantisi kalite göstergeleridir. Kaç panele ihtiyacınız olduğunu bilmiyorsanız AI asistanımıza günlük tüketiminizi yazın, size doğru gücü önersin." },
    { slug: "lityum-akuler",       name: "Lityum Aküler",                icon: "🔋", desc: "LiFePO4 lityum aküler — 12/24/36/51V, Bluetooth takipli modeller.",
      seo: "LiFePO4 (lityum demir fosfat) aküler, jel akülere göre 3–5 kat daha uzun çevrim ömrü (3000–6000 çevrim), %90'a varan kullanılabilir kapasite ve çok daha hızlı şarj sunar. Voltaj seçimi inverterinize göre yapılır: 12V küçük sistemler, 24V orta boy, 48/51,2V ev tipi sistemler içindir. Bluetooth'lu modellerde hücre dengesi ve şarj durumu telefondan izlenir. Ah değeri × voltaj = depolanan enerji (Wh) formülüyle ihtiyacınızı hesaplayabilirsiniz." },
    { slug: "jel-akuler",          name: "Jel Aküler",                   icon: "🪫", desc: "Lexron nano karbon derin döngü jel aküler — 14 Ah'ten 210 Ah'e.",
      seo: "Jel aküler, ekonomik başlangıç sistemleri ve düşük döngülü kullanım (hafta sonu bağ evi, yedek güç) için uygun maliyetli çözümdür. Derin deşarj toleransı %50 civarında tutulmalı, yani 200 Ah jel akünün pratik kapasitesi ~100 Ah kabul edilmelidir. Sık ve derin deşarj gerektiren günlük kullanımlarda lityum aküye geçiş toplam sahip olma maliyetini düşürür." },
    { slug: "hibrit-inverterler",  name: "Hibrit İnverterler",           icon: "⚡", desc: "Şebeke + akü + panel birlikte: Deye ve muadili hibrit inverterler.",
      seo: "Hibrit inverterler; güneş paneli, akü ve şebekeyi tek cihazda yönetir. Elektrik kesintisinde akülerden beslemeye milisaniyeler içinde geçer, fazla üretimi şebekeye satabilir (mahsuplaşma). Monofaze 10 kW'a kadar konutlar, trifaze modeller işletmeler ve tarımsal aboneler içindir. Akü voltajı (LV 48V / HV) inverterle uyumlu seçilmelidir." },
    { slug: "akilli-inverterler",  name: "Akıllı İnverterler (Off-Grid)", icon: "🔌", desc: "MPPT şarjlı tam sinüs akıllı inverterler — şebekeden bağımsız sistemler.",
      seo: "Off-grid akıllı inverterler, MPPT şarj kontrol cihazını ve tam sinüs inverteri tek kutuda birleştirir; bağ evi, karavan, şantiye gibi şebekesiz noktaların standart çözümüdür. Seçimde üç değer kritiktir: sürekli çıkış gücü (kW), akü voltajı (12/24/48V) ve maksimum PV giriş gerilimi (HV modeller daha az panel dizisi kablosu ister). Buzdolabı + aydınlatma + TV içeren tipik bağ evi için 3 kW, klima/pompa varsa 4,2–6,2 kW önerilir." },
    { slug: "sebeke-inverterleri", name: "Şebeke (On-Grid) İnverterleri", icon: "🏭", desc: "Mahsuplaşma ve öz tüketim için on-grid inverterler.",
      seo: "On-grid inverterler aküsüz çalışır; ürettiğiniz enerjiyi anlık tüketir, fazlasını şebekeye aktarırsınız. Çatı GES yatırımlarında kW başına en düşük maliyetli sistemdir. Bağlantı gücünüz ve sayaç tipiniz (monofaze/trifaze) inverter seçimini belirler; 30 kW üzeri ticari projelerde keşif ve proje onayı gerekir — teklif alın, süreci birlikte yürütelim." },
    { slug: "sarj-regulatorleri",  name: "Şarj Regülatörleri",           icon: "🎛️", desc: "PWM ve MPPT şarj kontrol cihazları — 10A'dan 100A'ya.",
      seo: "Şarj regülatörü panelden gelen enerjiyi aküye güvenle aktarır. PWM regülatörler ekonomiktir ve panel voltajı akü voltajına yakın küçük sistemlerde yeterlidir. MPPT regülatörler panelden %20–30 daha fazla enerji hasadı yapar ve yüksek voltajlı panel dizilerine izin verir. Amper seçimi: panel gücü (W) ÷ akü voltajı (V) × 1,25 güvenlik payı formülüyle yapılır." },
    { slug: "solar-paketler",      name: "Solar Paketler",               icon: "📦", desc: "Kullanıma hazır solar paketler — karavandan eve, 13.690 ₺'den başlayan fiyatlarla.",
      seo: "Solar paketlerimiz panel, inverter, akü, regülatör ve montaj malzemesini uyumlu şekilde bir araya getirir — tek tek ürün seçme derdi olmadan, kutudan çıkar çalışır. Karavan/konteyner için kompakt paketler, bağ evi için 3–4 kW, sürekli yaşanan evler için 6–12 kW lityum paketler sunuyoruz. Aynı güçte Ekonomik / Standart / Pro seçenekleri bütçenize göre bileşen kalitesini ölçekler. Hangi paketin size uygun olduğundan emin değilseniz AI asistan üç soruda önerir." },
    { slug: "tarimsal-sulama",     name: "Tarımsal Sulama",              icon: "💧", desc: "Solar pompa sürücüleri 2 Hp – 120 Hp ve sulama çözümleri.",
      seo: "Güneş enerjili tarımsal sulama, mazot ve şebeke maliyetini sıfırlar; sürücü, panellerden gelen DC enerjiyi mevcut trifaze dalgıç pompanıza uygun AC'ye çevirir. Sürücü gücü pompa etiket gücünün bir üst kademesi seçilmeli, panel gücü ise pompa gücünün yaklaşık 1,3 katı kurulmalıdır. 2 Hp'den 120 Hp'ye tüm sürücüler stoktan; kuyu derinliği ve günlük su ihtiyacınızı iletin, sistemi ücretsiz boyutlandıralım." },
    { slug: "solar-ekipmanlar",    name: "Solar Ekipmanlar",             icon: "🧰", desc: "Solar kablo, MC4 konnektör, DC sigorta ve montaj ekipmanları.",
      seo: "Sistemin görünmeyen kahramanları: doğru kesitte solar kablo gerilim düşümünü, DC sigorta ve parafudr yıldırım/ark riskini, kaliteli MC4 konnektör temas direncini önler. Panel montaj setleri kiremit, trapez sac ve düz çatı için ayrı tiplerde sunulur. Kablo kesiti seçiminde 100 metreye kadar %2 gerilim düşümü hedeflenmelidir." },
    { slug: "aksesuar",            name: "Aksesuar & Diğer",             icon: "🧩", desc: "Monoblok ısı pompaları ve tamamlayıcı çözümler.",
      seo: "Solar yaşamı kolaylaştıran niş ürünler: güneş enerjili otomatik saksı sulama cihazları, uzun kesintiler için sessiz jeneratörler ve tamamlayıcı aksesuarlar. Aradığınız özel bir ürün varsa WhatsApp'tan sorun — tedarik ağımızla bulup fiyatlandıralım." }
  ],

  brands: ["Arçelik", "Lexron", "Mexxun", "TitanX", "Havensis", "Ecosol", "Sako", "Sorotec", "Gazioğlu", "Megacell", "Deye", "GESM Power", "Tescom"],

  // Admin panel (statik sitede yalnızca caydırıcı)
  admin: { pass: "gesm2026" },

  seo: {
    titleTemplate: "%s | GES MARKETİM",
    defaultTitle: "GES MARKETİM — Solar Enerji Marketi | Panel, Akü, İnverter, Paket",
    defaultDesc: "Güneş paneli, LiFePO4 lityum akü, hibrit ve akıllı inverter, solar paket ve tarımsal sulama çözümleri. KDV dahil şeffaf fiyat, hızlı kargo, WhatsApp destek."
  }
};

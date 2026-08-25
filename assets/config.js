/* ============================================================
   GES MARKETİM — TEK DOĞRU KAYNAK (config)
   İletişim, kategoriler, marj kuralları, kargo/ödeme katsayıları
   YALNIZCA burada tutulur. Sayfalara/JS'e sayı gömme!
   ============================================================ */
window.GESM = window.GESM || {};

GESM.config = {
  company: {
    brand: "GES MARKETİM",
    legal: "Gespa Enerji Sanayi Ticaret Ltd. Şti.",
    domain: "https://www.gesmarketim.com", // kanonik adres — Railway custom domain'i www
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
    // KARGO MODU — "alici": karşı (alıcı) ödemeli; site kargo ücreti TAHSİL
    // ETMEZ, ücret teslimatta kargo firmasına ödenir (kargo anlaşması
    // çözülene kadar). "sabit": freeShippingLimit üzeri ücretsiz, altı
    // shippingFlat tahsil edilir (eski davranış). Değiştir + build + commit.
    kargoModu: "alici",
    freeShippingLimit: 15000,   // ₺ üzeri kargo bedava (yalnız "sabit" modda)
    shippingFlat: 350,          // ₺ standart kargo (yalnız "sabit" modda)
    codAvailable: false,
    usdTry: 47.20               // USD/TL kuru (10.08.2026) — hem Havensis priceUsd hem
                                // ACS USD maliyet → ₺ hesabı bu kurla yapılır; admin
                                // panelden geçici, buradan kalıcı güncellenir
  },

  // Kartla ödeme — iyzico tek kanaldan/tek siteden (gespaenerji.com) izin
  // verdiği için tahsilat oradaki "Güvenli Ödeme" link sayfasında yapılır.
  // Sepet, tutar/açıklama/sipariş no'yu URL parametresiyle taşır:
  // odeme.html?t=<tutar ₺ tam sayı>&a=<açıklama>&s=<sipariş no>.
  // kartUrl BOŞ bırakılırsa bu yol kapanır; o zaman yalnız sunucudaki
  // IYZICO_* env anahtarları (varsa) ile yerinde Checkout Form çalışır.
  // kartMin/MaxTL gespaenerji /api/pay/custom sınırlarının aynısıdır.
  payments: {
    kartUrl: "https://www.gespaenerji.com/odeme.html",
    kartMinTL: 50,
    kartMaxTL: 250000
  },

  // Fiyatlandırma kuralları (K2/K3) — admin panel bunların üzerine yazabilir
  pricing: {
    defaultMarginPct: 20,       // Enerji Pazarı varsayılan marjı (K2)
    marginBySupplier: { mexxsun: 15, enerjipazari: 20 },
    marginByCategory: {},       // ör. { "solar-paketler": 18 }
    roundTo: 10,                // satış fiyatı yuvarlama adımı (₺)
    usdMarkup: 1.22,            // ACS listesi sabit marjı: saleUSD = costUSD × 1.22
    fxBufferPct: 2              // kur tamponu (%): saleTRY = saleUSD × kur × 1.02
  },

  // Tedarikçiler — K1: müşteri arayüzünde ASLA gösterilmez, yalnız admin panelde
  suppliers: {
    mexxsun:      { label: "Mexxsun" },
    enerjipazari: { label: "Enerji Pazarı" },
    havensis:     { label: "Havensis" }
  },

  // Kategoriler artık /api/categories'ten gelir (kaynak: data/catalog.json —
  // build-catalog.js üretir); burada kategori listesi TUTULMAZ.

  brands: ["Lexron"],
  hiddenCategories: [],

  // Ana menü yapısı — cat: kategori slug'ı · children: açılır menü grubu.
  // Child öğe: kategori slug'ı (string) YA DA { label, cat, tag } nesnesi
  // (tag → kategori sayfası o özellik filtresiyle açılır, ?t= parametresi).
  nav: [
    { label: "Ana Sayfa", href: "index.html", key: "home" },
    { cat: "panel" },
    { cat: "inverter" },
    { cat: "aku-batarya" },
    { cat: "sarj-kontrol" },
    { cat: "solar-pompa" },
    { label: "Sistem Kur 🛠️", href: "sistem-kur.html", key: "sistem-kur" },
    { label: "Ekipman", children: ["aydinlatma", "kablo-konnektor"] },
    { label: "İletişim", href: "iletisim.html", key: "iletisim" }
  ],

  // ============================================================
  // Sistem Kur (/hesaplayici) — 3 bölüm: OEM kurucu · Solar Sulama · Paketler
  // TÜM katsayılar ve katalog eşlemesi burada; React koda sayı gömmez.
  // Ürün ref'leri /api/products id'leridir (data/catalog.json — Lexron
  // aşaması). Ürün yoksa ya da stokta değilse arayüz o adayı atlar.
  // ============================================================
  builder: {
    // ---- OEM kurucu (Kendi Projeni Kendin Oluştur) ----
    oem: {
      pvHeadroom: 1.3,  // inverter kW × bu katsayı = kabul edilen azami PV gücü
      sarjMarj: 1.25    // şarj kontrolörü amper emniyet payı (gerekli A × bu)
    },

    // Katalog eşlemesi + elektriksel değerler (uyumluluk kontrolü için).
    //  panels: w = panel gücü (Wp), voc = açık devre gerilimi (V) — dizi
    //          (seri) hesabında kullanılır; kesin datasheet değeriyle
    //          güncellenebilir, mantık değişmez.
    //  inverters: kw = güç, v = akü sistem voltajı, mppt = PV giriş MPPT
    //          aralığı [min,max] V (yaklaşık — datasheet ile güncellenebilir).
    //  batteries: v = nominal voltaj, wh = enerji, chem = kimya.
    catalog: {
      panels: {
        "160w-32-cell-16bb-half-cut-topcon-gunes-paneli":                { w: 160, voc: 19.5 },
        "175w-half-cut-topcon-mono-gunes-paneli":                        { w: 175, voc: 24 },
        "285w-16bb-half-cut-topcon-mono-gunes-paneli-karavan-ozel-uretim": { w: 285, voc: 33 },
        "350w-ecosol-polykristal-gunes-paneli":                          { w: 350, voc: 46 },
        "450w-bifacial-78-cell-16bb-half-cut-topcon-gunes-paneli":       { w: 450, voc: 34 },
        "655w-132-cell-16bb-half-cut-topcon-16bb-gunes-paneli":          { w: 655, voc: 45.5 },
        "750w-bifacial-132-cell-16bb-half-cut-topcon-gunes-paneli":      { w: 750, voc: 51.5 }
      },
      batteries: [
        { ref: "100ah-12-8v-lityum-batarya",  chem: "lityum", v: 12.8, wh: 1280 },
        { ref: "200ah-12-8v-lityum-batarya",  chem: "lityum", v: 12.8, wh: 2560 },
        { ref: "100ah-25-6v-lityum-batarya",  chem: "lityum", v: 25.6, wh: 2560 },
        { ref: "200ah-25-6v-lityum-batarya",  chem: "lityum", v: 25.6, wh: 5120 },
        { ref: "100ah-48v-lityum-batarya",    chem: "lityum", v: 51.2, wh: 4800 },
        { ref: "314ah-51-2v-premium-serisi-lityum-batarya", chem: "lityum", v: 51.2, wh: 16077 },
        { ref: "105ah-12v-nano-karbon-jel-aku", chem: "jel", v: 12, wh: 1260 },
        { ref: "160ah-12v-nano-karbon-jel-aku", chem: "jel", v: 12, wh: 1920 },
        { ref: "210ah-12v-nano-karbon-jel-aku", chem: "jel", v: 12, wh: 2520 }
      ],
      // tip: hibrit = MPPT şarj dahili (panel doğrudan inverter'e girer);
      //      modifiye / tamsinus = akü inverteri → panel ŞARJ KONTROLÖRÜ ister.
      inverters: [
        { ref: "3kw-hv-mppt-akilli-inverter-24v",    kw: 3,   v: 24, tip: "hibrit", mppt: [60, 450] },
        { ref: "6-2kw-hv-mppt-akilli-inverter-48v",  kw: 6.2, v: 48, tip: "hibrit", mppt: [90, 450] },
        { ref: "8kw-hv-mppt-akilli-inverter-48v",    kw: 8,   v: 48, tip: "hibrit", mppt: [90, 450] },
        { ref: "11kw-hv-2xmppt-akilli-inverter-48v", kw: 11,  v: 48, tip: "hibrit", mppt: [90, 450] },
        { ref: "2000w-24v-modifiye-sinus-inverter",  kw: 2,   v: 24, tip: "modifiye" }
      ],
      // Şarj kontrolörleri — a = amper, tip pwm/mppt, pv = PV giriş penceresi
      // [minV, maxV] (yaklaşık; datasheet ile güncellenebilir). PWM'de dizi
      // kontrolü yapılmaz, "12/24V nominal panel" notu gösterilir.
      sarjKontrol: [
        { ref: "10a-pwm-sarj-kontrol-cihazi", a: 10, tip: "pwm" },
        { ref: "20a-pwm-sarj-kontrol-cihazi", a: 20, tip: "pwm" },
        { ref: "30a-pwm-sarj-kontrol-cihazi", a: 30, tip: "pwm" },
        { ref: "40a-pwm-sarj-kontrol-cihazi", a: 40, tip: "pwm" },
        { ref: "60a-pwm-sarj-kontrol-cihazi", a: 60, tip: "pwm" },
        { ref: "20a-mppt-sarj-kontrol-cihazi", a: 20, tip: "mppt", pv: [15, 100] },
        { ref: "30a-mppt-sarj-kontrol-cihazi", a: 30, tip: "mppt", pv: [15, 100] },
        { ref: "40a-mppt-sarj-kontrol-cihazi", a: 40, tip: "mppt", pv: [15, 100] },
        { ref: "80a-hv-15-230v-mppt-sarj-kontrol-cihazi", a: 80, tip: "mppt", pv: [15, 230] }
      ],
      // Montaj · kablo · konnektör grupları ("Montaj & Aksesuar" adımı;
      // çoklu seçim + adet). birim: satırda gösterilen adet birimi.
      aksesuar: [
        { grup: "Panel tutucu", birim: "adet", refs: ["orta-tutucu", "sonlandirici"] },
        { grup: "Solar kablo",  birim: "metre", refs: ["6mm2-solar-kablo", "4mm2-solar-kablo"] },
        { grup: "Konnektör",    birim: "adet", refs: ["mc4-konnektor-1500v", "2li-t-branch", "3lu-branch"] }
      ]
    },

    // ---- Solar Sulama (SMART VFD500 MPPT pompa sürücüsü datasheet'i) ----
    // siniflar: çıkış voltaj sınıfına göre PV tarafı değerleri —
    //   mppt = önerilen MPPT aralığı (VDC), oneriV = önerilen PV giriş
    //   gerilimi, maxDcV = azami DC giriş. Kaynak: SMART_DATASHEET_1.pdf.
    // suruculer: hp = pompa gücü, kw = sürücü gücü, faz = "220" (3×220V çıkış,
    //   monofaze şebeke sınıfı) | "380" (3×380V trifaze), ref = katalogdaki
    //   ürün (yoksa null → fiyat için teklif CTA'sı gösterilir).
    sulama: {
      pvOversize: 1.35,   // panel gücü ≈ sürücü kW × bu katsayı
      siniflar: {
        "220": { mppt: [250, 350], oneriV: 305, maxDcV: 450, cikis: "3×220V" },
        "380": { mppt: [600, 650], oneriV: 530, maxDcV: 800, cikis: "3×380V" }
      },
      suruculer: [
        { hp: 3,   kw: 2.2, faz: "220", ref: "3hp-2-2kw-3x220v-solar-pompa-inverteri" },
        { hp: 5.5, kw: 4,   faz: "220", ref: "5-5hp-4kw-3x220v-solar-pompa-inverteri" },
        { hp: 3,   kw: 2.2, faz: "380", ref: "3hp-2-2kw-380v-solar-pompa-inverteri" },
        { hp: 5.5, kw: 4,   faz: "380", ref: "5-5hp-4kw-solar-pompa-inverter-yeni-nesil" },
        { hp: 7.5, kw: 5.5, faz: "380", ref: "7-5hp-5-5kw-solar-pompa-inverter-yeni-nesil" },
        { hp: 10,  kw: 7.5, faz: "380", ref: "10hp-7-5kw-solar-pompa-inverter-yeni-nesil" },
        { hp: 15,  kw: 11,  faz: "380", ref: "15hp-11kw-solar-pompa-inverter-yeni-nesil" },
        { hp: 20,  kw: 15,  faz: "380", ref: "20hp-15kw-solar-pompa-inverter-yeni-nesil" },
        { hp: 25,  kw: 18.5, faz: "380", ref: "25hp-18-5kwsolar-pompa-inverter-yeni-nesil" },
        { hp: 30,  kw: 22,  faz: "380", ref: "30hp-22kw-solar-pompa-inverter-yeni-nesil" },
        { hp: 40,  kw: 30,  faz: "380", ref: "40hp-30kw-solar-pompa-inverter-yeni-nesil" },
        { hp: 50,  kw: 37,  faz: "380", ref: null },
        { hp: 60,  kw: 45,  faz: "380", ref: "60hp-45kw-solar-pompa-inverter-yeni-nesil" },
        { hp: 75,  kw: 55,  faz: "380", ref: null },
        { hp: 100, kw: 75,  faz: "380", ref: null },
        { hp: 120, kw: 90,  faz: "380", ref: "120hp-90kw-solar-pompa-inverteri-yeni-nesil" },
        { hp: 150, kw: 110, faz: "380", ref: "150hp-110kw-solar-pompa-inverteri-yeni-nesil" },
        { hp: 180, kw: 132, faz: "380", ref: "180hp-132kw-solar-pompa-inverteri-yeni-nesil" },
        { hp: 210, kw: 160, faz: "380", ref: "210hp-160kw-solar-pompa-inverteri-yeni-nesil" }
      ]
    },

    // ---- Size Özel Paketler ----
    // Doldurulunca sayfada otomatik listelenir. Şema:
    //   { id: "karavan-baslangic", ad: "Karavan Başlangıç Paketi",
    //     aciklama: "...", etiket: "Yeni", urunler: [{ ref: "<urun-id>", adet: 2 }] }
    paketler: []
  },

  // Ziyaretçi sayacı — footer rozeti. Gösterilen toplam = base + sunucu sayacı
  // (sunucu /api/visitors ile çerez başına günde 1 sayar, botları filtreler;
  // kalıcı veri DATA_DIR/visitors.json — Railway Volume önerilir).
  visitors: { base: 1000, show: true },

  // Admin panel (statik sitede yalnızca caydırıcı)
  admin: { pass: "gesm2026" },

  seo: {
    titleTemplate: "%s | GES MARKETİM",
    defaultTitle: "GES MARKETİM — Solar Enerji Marketi | Panel, Akü, İnverter, Pompa",
    defaultDesc: "Lexron güneş panelleri, LiFePO4 lityum aküler, MPPT akıllı inverterler ve solar pompa çözümleri. KDV dahil şeffaf fiyat, günlük kur, hızlı kargo, WhatsApp destek."
  }
};

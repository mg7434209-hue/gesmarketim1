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
    freeShippingLimit: 15000,   // ₺ üzeri kargo bedava
    shippingFlat: 350,          // ₺ standart kargo (limit altı)
    codAvailable: false,
    usdTry: 47.20               // USD/TL kuru (10.08.2026) — hem Havensis priceUsd hem
                                // ACS USD maliyet → ₺ hesabı bu kurla yapılır; admin
                                // panelden geçici, buradan kalıcı güncellenir
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
  // Sistem Kurucu (sistem-kur.html) — "Kendi Projenizi Oluşturun"
  // TÜM katsayılar ve katalog eşlemesi burada; app.js koda sayı gömmez.
  // Ürün ref'leri /api/products id'leridir (data/catalog.json — Lexron
  // aşaması). Ürün yoksa ya da stokta değilse app.js o adayı atlar.
  // ============================================================
  builder: {
    sizing: {
      sunHours: 4.2,        // TR ortalama güneşlenme (kWh/kWp/gün, temkinli)
      systemEff: 0.75,      // panel→priz toplam sistem verimi
      invEff: 0.93,         // inverter/şarj verimi (akü boyutunda)
      simultaneity: 0.7,    // cihazların aynı anda çalışma oranı
      surgeHeadroom: 1.25,  // inverter gücü emniyet payı
      cableBaseM: 10,       // temel solar kablo (m)
      cablePerKwM: 5,       // kurulu kW başına ek kablo (m)
      dod: { lityum: 0.9, jel: 0.5 } // kullanılabilir kapasite oranı
    },
    // Cihazlar: w = güç (W), h = günlük kullanım (saat), surge = kalkış çarpanı
    appliances: [
      { id: "led",       name: "LED aydınlatma (ampul başı)", icon: "💡", w: 10,   h: 6,   surge: 1 },
      { id: "buzdolabi", name: "Buzdolabı (A++)",             icon: "🧊", w: 100,  h: 10,  surge: 3 },
      { id: "tv",        name: "TV + uydu",                   icon: "📺", w: 80,   h: 5,   surge: 1 },
      { id: "sarj",      name: "Telefon / laptop şarjı",      icon: "🔌", w: 60,   h: 3,   surge: 1 },
      { id: "camasir",   name: "Çamaşır makinesi",            icon: "🌀", w: 600,  h: 1,   surge: 2 },
      { id: "pompa",     name: "Su pompası / hidrofor",       icon: "🚿", w: 750,  h: 1.5, surge: 3 },
      { id: "klima",     name: "Klima (12.000 BTU inverter)", icon: "❄️", w: 1000, h: 4,   surge: 2 },
      { id: "kettle",    name: "Kettle / su ısıtıcı",         icon: "☕", w: 1800, h: 0.3, surge: 1 },
      { id: "mikro",     name: "Mikrodalga",                  icon: "🍲", w: 900,  h: 0.3, surge: 1 },
      { id: "supurge",   name: "Elektrikli süpürge",          icon: "🧹", w: 900,  h: 0.2, surge: 1.5 }
    ],
    // Senaryolar: varsayılan cihaz seti + akü kimyası + özerklik + panel adayları
    presets: [
      { id: "karavan", label: "Karavan / Tekne", icon: "🚐",
        desc: "Kompakt sistem — buzdolabı, aydınlatma, şarj.",
        chem: "lityum", autonomyDays: 1,
        items: { led: 4, buzdolabi: 1, tv: 1, sarj: 1 },
        panels: ["285w-16bb-half-cut-topcon-mono-gunes-paneli-karavan-ozel-uretim", "175w-half-cut-topcon-mono-gunes-paneli", "160w-32-cell-16bb-half-cut-topcon-gunes-paneli"] },
      { id: "bagevi", label: "Bağ Evi (hafta sonu)", icon: "🏡",
        desc: "Temel konfor: buzdolabı, TV, aydınlatma, su pompası.",
        chem: "jel", autonomyDays: 1,
        items: { led: 6, buzdolabi: 1, tv: 1, sarj: 1, pompa: 1 },
        panels: ["655w-132-cell-16bb-half-cut-topcon-16bb-gunes-paneli", "450w-bifacial-78-cell-16bb-half-cut-topcon-gunes-paneli", "350w-ecosol-polykristal-gunes-paneli"] },
      { id: "ev", label: "Müstakil Ev (sürekli)", icon: "🏠",
        desc: "Çamaşır makinesi ve klima dahil tam ev yükü.",
        chem: "lityum", autonomyDays: 1,
        items: { led: 8, buzdolabi: 1, tv: 1, sarj: 1, camasir: 1, pompa: 1, klima: 1 },
        panels: ["655w-132-cell-16bb-half-cut-topcon-16bb-gunes-paneli", "750w-bifacial-132-cell-16bb-half-cut-topcon-gunes-paneli"] },
      { id: "ticari", label: "İşletme / Ticari", icon: "🏭",
        desc: "Yüksek tüketim — soğutma, aydınlatma, ofis yükleri.",
        chem: "lityum", autonomyDays: 0.5,
        items: { led: 12, buzdolabi: 2, tv: 1, sarj: 2, klima: 2, pompa: 1 },
        panels: ["655w-132-cell-16bb-half-cut-topcon-16bb-gunes-paneli", "750w-bifacial-132-cell-16bb-half-cut-topcon-gunes-paneli"] },
      { id: "sulama", label: "Tarımsal Sulama", icon: "🌾",
        desc: "Gündüz güneşle çalışan pompa — bahçe, sera ve tarla.",
        chem: "jel", autonomyDays: 0.5,
        items: { pompa: 1, led: 2 },
        panels: ["655w-132-cell-16bb-half-cut-topcon-16bb-gunes-paneli", "450w-bifacial-78-cell-16bb-half-cut-topcon-gunes-paneli", "350w-ecosol-polykristal-gunes-paneli"] }
    ],
    // Katalog eşlemesi — /api/products id'leri (w=Wp, wh=akü Wh, kw/v=inverter)
    catalog: {
      panels: {
        "160w-32-cell-16bb-half-cut-topcon-gunes-paneli": 160,
        "175w-half-cut-topcon-mono-gunes-paneli": 175,
        "285w-16bb-half-cut-topcon-mono-gunes-paneli-karavan-ozel-uretim": 285,
        "350w-ecosol-polykristal-gunes-paneli": 350,
        "450w-bifacial-78-cell-16bb-half-cut-topcon-gunes-paneli": 450,
        "655w-132-cell-16bb-half-cut-topcon-16bb-gunes-paneli": 655,
        "750w-bifacial-132-cell-16bb-half-cut-topcon-gunes-paneli": 750
      },
      batteries: [
        { ref: "100ah-12-8v-lityum-batarya",  chem: "lityum", v: 12, wh: 1280 },
        { ref: "200ah-12-8v-lityum-batarya",  chem: "lityum", v: 12, wh: 2560 },
        { ref: "100ah-25-6v-lityum-batarya",  chem: "lityum", v: 24, wh: 2560 },
        { ref: "200ah-25-6v-lityum-batarya",  chem: "lityum", v: 24, wh: 5120 },
        { ref: "100ah-48v-lityum-batarya",    chem: "lityum", v: 48, wh: 4800 },
        { ref: "314ah-51-2v-premium-serisi-lityum-batarya", chem: "lityum", v: 48, wh: 16077 },
        { ref: "105ah-12v-nano-karbon-jel-aku", chem: "jel", v: 12, wh: 1260 },
        { ref: "160ah-12v-nano-karbon-jel-aku", chem: "jel", v: 12, wh: 1920 },
        { ref: "210ah-12v-nano-karbon-jel-aku", chem: "jel", v: 12, wh: 2520 }
      ],
      inverters: [
        { ref: "3kw-hv-mppt-akilli-inverter-24v",    kw: 3,   v: 24 },
        { ref: "6-2kw-hv-mppt-akilli-inverter-48v",  kw: 6.2, v: 48 },
        { ref: "8kw-hv-mppt-akilli-inverter-48v",    kw: 8,   v: 48 },
        { ref: "11kw-hv-2xmppt-akilli-inverter-48v", kw: 11,  v: 48 }
      ],
      extras: { cable: "6mm2-solar-kablo", mc4: "mc4-konnektor-1500v" }
    }
  },

  // Admin panel (statik sitede yalnızca caydırıcı)
  admin: { pass: "gesm2026" },

  seo: {
    titleTemplate: "%s | GES MARKETİM",
    defaultTitle: "GES MARKETİM — Solar Enerji Marketi | Panel, Akü, İnverter, Pompa",
    defaultDesc: "Lexron güneş panelleri, LiFePO4 lityum aküler, MPPT akıllı inverterler ve solar pompa çözümleri. KDV dahil şeffaf fiyat, günlük kur, hızlı kargo, WhatsApp destek."
  }
};

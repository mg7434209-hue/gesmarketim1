/* ============================================================
   GES MARKETİM — Ürün Kataloğu (GESM.data)
   Kaynak: docs/build-spec.md Bölüm 4 envanteri (16.07.2026).
   supplier + cost alanları YALNIZ admin panelde görünür (K1).
   Fiyatlar KDV dahil ₺. onRequest=true → fiyat render edilmez,
   "Teklif Al" akışı çalışır (K: FİYAT SORUN modeli yasak).
   ============================================================ */
(function () {
  "use strict";

  // cost: tedarikçi maliyeti (admin marj analizi için) — satış fiyatından
  // tedarikçi marjı geri hesaplanarak tutulur.
  function costOf(price, supplier) {
    if (!price) return null;
    var m = supplier === "mexxsun" ? 1.15 : 1.2;
    return Math.round(price / m);
  }

  var P = []; // katalog
  function add(o) {
    o.code = o.code || ("GM-" + o.id.toUpperCase().replace(/_/g, ""));
    o.cost = costOf(o.onRequest ? null : o.price, o.supplier);
    P.push(o);
  }

  /* ---------- 1) Güneş Panelleri (tedarikçi gerçek envanteri) ---------- */
  function pnl(id, name, price, band, specs, extra) {
    add(Object.assign({ id: id, cat: "gunes-panelleri", brand: "Lexron", price: price,
      name: name, supplier: "enerjipazari", tags: [band], specs: specs,
      img: ["public/images/products/" + id.replace("pnl-", "") + ".webp"] }, extra || {}));
  }
  pnl("pnl-12w-polikristal-gunes-paneli", "12 W Polikristal Güneş Paneli", 1640, "≤100 W",
    { "Güç": "12 Wp", "Hücre": "Polikristal", "Kullanım": "Şarj/aydınlatma, hobi" });
  pnl("pnl-25w-polikristal-gunes-paneli", "25 W Polikristal Güneş Paneli", 2670, "≤100 W",
    { "Güç": "25 Wp", "Hücre": "Polikristal", "Kullanım": "Karavan, tekne, bahçe" });
  pnl("pnl-55w-monokristal-gunes-paneli", "55 W Monokristal Güneş Paneli", 3830, "≤100 W",
    { "Güç": "55 Wp", "Hücre": "Monokristal", "Kullanım": "Karavan, tekne" });
  pnl("pnl-110w-monokristal-ecosolgunes-paneli", "Ecosol 110 W Monokristal Güneş Paneli", 6570, "100–300 W",
    { "Güç": "110 Wp", "Hücre": "Monokristal" }, { brand: "Ecosol" });
  pnl("pnl-140w-half-cut-topcon-gunes-paneli", "140 W Half-Cut TopCon Güneş Paneli", 7460, "100–300 W",
    { "Güç": "140 Wp", "Teknoloji": "TopCon Half-Cut" });
  pnl("pnl-160w-monokristal-gunes-paneli", "160 W Monokristal Güneş Paneli", 6130, "100–300 W",
    { "Güç": "160 Wp", "Hücre": "Monokristal" });
  pnl("pnl-175w-half-cut-topcon-gunes-paneli", "175 W Half-Cut TopCon Güneş Paneli", 9110, "100–300 W",
    { "Güç": "175 Wp", "Teknoloji": "TopCon Half-Cut" });
  pnl("pnl-240w-48-cell-16bb-half-cut-topcon-gunes-paneli", "240 W 48-Cell 16BB Half-Cut TopCon Güneş Paneli", 11910, "100–300 W",
    { "Güç": "240 Wp", "Hücre": "48 hücre 16BB", "Teknoloji": "TopCon Half-Cut" });
  pnl("pnl-285w-half-cut-monokristal-gunes-paneli", "285 W Half-Cut Monokristal Güneş Paneli", 13010, "100–300 W",
    { "Güç": "285 Wp", "Hücre": "Half-Cut Monokristal" });
  pnl("pnl-340w-polykristal-gunes-paneli", "340 W Polikristal Güneş Paneli", 11160, "300–500 W",
    { "Güç": "340 Wp", "Hücre": "Polikristal" });
  pnl("pnl-350w-ecosol-polykristal-gunes-paneli", "Ecosol 350 W Polikristal Güneş Paneli", 9450, "300–500 W",
    { "Güç": "350 Wp", "Hücre": "Polikristal" }, { brand: "Ecosol", bestseller: true });
  pnl("pnl-390w-78-cell-16bb-half-cut-topcon-gunes-paneli", "390 W 78-Cell 16BB Half-Cut TopCon Güneş Paneli", 14580, "300–500 W",
    { "Güç": "390 Wp", "Hücre": "78 hücre 16BB", "Teknoloji": "TopCon Half-Cut" });
  pnl("pnl-450w-bifacial-78-cell-16bb-half-cut-topcon-gunes-paneli", "450 W Bifacial 78-Cell 16BB Half-Cut TopCon Güneş Paneli", 15750, "300–500 W",
    { "Güç": "450 Wp", "Tip": "Bifacial (çift yüzlü)", "Teknoloji": "TopCon Half-Cut" }, { isNew: true });
  pnl("pnl-655w-half-cut-topcon-mono-gunes-paneli", "655 W Half-Cut TopCon Monokristal Güneş Paneli", 21910, "500 W+",
    { "Güç": "655 Wp", "Teknoloji": "TopCon Half-Cut", "Kullanım": "Çatı/arazi GES" }, { bestseller: true });
  pnl("pnl-750w-bifacial-132-cell-16bb-half-cut-topcon-gunes-paneli", "750 W Bifacial 132-Cell 16BB Half-Cut TopCon Güneş Paneli", 22800, "500 W+",
    { "Güç": "750 Wp", "Tip": "Bifacial (çift yüzlü)", "Hücre": "132 hücre 16BB", "Teknoloji": "TopCon Half-Cut" }, { isNew: true });

  add({ id: "pnl-245", cat: "gunes-panelleri", brand: "Gazioğlu", price: 2980, supplier: "mexxsun",
    name: "Gazioğlu GSE245 245 W Half-Cut MonoPower Güneş Paneli (A Class)",
    tags: ["100–300 W"], specs: { "Güç": "245 Wp", "Hücre": "Half-Cut Monokristal", "Sınıf": "A", "Üretim": "Yerli (Gazioğlu)" } });

  /* ---------- 2) Lityum Aküler ---------- */
  add({ id: "aku-100-12", cat: "lityum-akuler", brand: "Mexxun", price: 14900, bestseller: true,
    name: "Mexxun 100 Ah 12,8V LiFePO4 Lityum Akü (1,28 kWh)", supplier: "mexxsun",
    tags: ["12V", "100 Ah", "Bluetooth"], specs: { "Kapasite": "100 Ah / 1,28 kWh", "Voltaj": "12,8 V", "Kimya": "LiFePO4", "İzleme": "Bluetooth + WiFi", "Çevrim": "≥4000" } });
  add({ id: "aku-100-24", cat: "lityum-akuler", brand: "Mexxun", price: 23450, listPrice: 26800,
    name: "Mexxun 100 Ah 25,6V LiFePO4 Lityum Akü (2,56 kWh)", supplier: "mexxsun",
    tags: ["24V", "100 Ah", "Bluetooth"], specs: { "Kapasite": "100 Ah / 2,56 kWh", "Voltaj": "25,6 V", "Kimya": "LiFePO4", "İzleme": "Bluetooth + WiFi" } });
  add({ id: "aku-mc-200b", cat: "lityum-akuler", brand: "Megacell", price: 31800,
    name: "Megacell 12,8V 200 Ah LiFePO4 Akü — ABS Bluetooth", supplier: "enerjipazari",
    tags: ["12V", "200 Ah", "Bluetooth"], specs: { "Kapasite": "200 Ah / 2,56 kWh", "Voltaj": "12,8 V", "İzleme": "Bluetooth", "Kimya": "LiFePO4" } });
  add({ id: "aku-51-wpu", cat: "lityum-akuler", brand: "Mexxun", price: 44200, isNew: true,
    name: "Mexxun 100 Ah 48V LiFePO4 Akü (4,8 kWh) — Raf Tipi", supplier: "mexxsun",
    tags: ["48V", "100 Ah"], specs: { "Kapasite": "100 Ah / 4,8 kWh", "Voltaj": "48 V (51,2 V nominal)", "Tip": "Raf tipi", "Kimya": "LiFePO4" } });

  /* ---------- 3) Jel Aküler (Lexron Nano Karbon — tedarikçi gerçek envanteri) ---------- */
  function jel(id, ah, price, extra) {
    add(Object.assign({ id: "jel-" + id, cat: "jel-akuler", brand: "Lexron", price: price,
      name: "Lexron " + ah + " Ah 12V Nano Karbon Jel Akü", supplier: "enerjipazari",
      tags: [ah + " Ah"], specs: { "Kapasite": ah + " Ah", "Voltaj": "12 V", "Tip": "Nano karbon jel (derin döngü)", "Bakım": "Bakımsız" },
      img: ["public/images/products/" + id + "ah-lexron-nano-karbon-jel-aku" + (id === "210" ? "-1" : "") + ".webp"] }, extra || {}));
  }
  jel("14", "14", 3490);
  jel("24", "24", 4450);
  jel("42", "42", 9310);
  jel("65", "65", 13630);
  jel("105", "105", 18210, { bestseller: true });
  jel("160", "160", 27390);
  jel("210", "210", 36500);

  /* ---------- 4) Akıllı İnverterler (Off-Grid) ---------- */
  add({ id: "inv-1kw", cat: "akilli-inverterler", brand: "Lexron", price: 7810,
    name: "Lexron 1 kW MPPT 12V Akıllı İnverter", supplier: "enerjipazari",
    tags: ["1–3 kW", "12V"], specs: { "Güç": "1 kW", "Akü Voltajı": "12 V", "Şarj": "Dahili MPPT", "Dalga": "Tam sinüs" } });
  add({ id: "inv-1-6kw", cat: "akilli-inverterler", brand: "Lexron", price: 8380,
    name: "Lexron 1,6 kW HV MPPT Akıllı İnverter 12V", supplier: "enerjipazari",
    tags: ["1–3 kW", "12V"], specs: { "Güç": "1,6 kW", "Akü Voltajı": "12 V", "Şarj": "HV MPPT (yüksek PV girişi)", "Dalga": "Tam sinüs" } });
  add({ id: "inv-3kw", cat: "akilli-inverterler", brand: "Sorotec", price: 9265, listPrice: 10500, bestseller: true,
    name: "Sorotec 3,5 kW HV MPPT Akıllı İnverter 24V", supplier: "enerjipazari",
    tags: ["4–8 kW", "24V"], specs: { "Güç": "3,5 kW", "Akü Voltajı": "24 V", "Şarj": "HV MPPT", "Dalga": "Tam sinüs" } });
  add({ id: "inv-4-2kw", cat: "akilli-inverterler", brand: "Sako", price: 13800,
    name: "Sako Sunon ECO 4,2 kW Tam Sinüs Akıllı İnverter 24V", supplier: "mexxsun",
    tags: ["4–8 kW", "24V"], specs: { "Güç": "4,2 kW", "Akü Voltajı": "24 V", "Şarj": "HV MPPT", "Dalga": "Tam sinüs" } });
  add({ id: "inv-6-2kw", cat: "akilli-inverterler", brand: "Lexron", price: 18300, bestseller: true,
    name: "Lexron 6,2 kW HV MPPT Akıllı İnverter 48V", supplier: "enerjipazari",
    tags: ["4–8 kW", "48V"], specs: { "Güç": "6,2 kW", "Akü Voltajı": "48 V", "Şarj": "HV MPPT", "Dalga": "Tam sinüs" } });
  add({ id: "inv-max8", cat: "akilli-inverterler", brand: "Sako", price: 29985, listPrice: 48750,
    name: "Sako Sunon IV 8 kW Tam Sinüs Akıllı İnverter 48V", supplier: "mexxsun",
    tags: ["4–8 kW", "48V"], specs: { "Güç": "8 kW", "Akü Voltajı": "48 V", "Maks. PV Girişi": "450 VDC", "Dalga": "Tam sinüs" } });
  add({ id: "inv-11kw", cat: "akilli-inverterler", brand: "Mexxun", onRequest: true,
    name: "Mexxun P12KW Premium 12 kW Akıllı İnverter 48V (Paralel, Wi-Fi)", supplier: "mexxsun",
    tags: ["8+ kW", "48V"], specs: { "Güç": "12 kW", "Akü Voltajı": "48 V", "Paralel": "9 adede kadar", "Bağlantı": "Wi-Fi + çift çıkış", "Arayüz": "Türkçe" } });

  /* ---------- 5) Hibrit İnverterler ---------- */
  add({ id: "inv-deye-10m", cat: "hibrit-inverterler", brand: "Deye", price: 34500,
    name: "Deye 10 kW Hibrit İnverter — Monofaze", supplier: "enerjipazari",
    tags: ["8+ kW", "Monofaze"], specs: { "Güç": "10 kW", "Faz": "Monofaze", "Tip": "Hibrit (şebeke+akü+PV)", "Akü": "48 V LV" } });
  add({ id: "inv-deye-12", cat: "hibrit-inverterler", brand: "Deye", price: 132800,
    name: "Deye 12 kW Hibrit İnverter Trifaze LV (48V)", supplier: "enerjipazari",
    tags: ["8+ kW", "Trifaze"], specs: { "Güç": "12 kW", "Faz": "Trifaze", "Tip": "Hibrit", "Akü": "48 V LV" } });

  /* ---------- 6) Şebeke (On-Grid) İnverterleri ---------- */
  add({ id: "inv-deye-100", cat: "sebeke-inverterleri", brand: "Deye", price: 156700,
    name: "Deye 100 kW Trifaze On-Grid İnverter", supplier: "enerjipazari",
    tags: ["Trifaze"], specs: { "Güç": "100 kW", "Faz": "Trifaze", "Tip": "On-Grid (şebeke bağlantılı)" } });
  add({ id: "inv-ongrid-25", cat: "sebeke-inverterleri", brand: "Deye", onRequest: true,
    name: "Deye 25 kW Trifaze On-Grid İnverter", supplier: "enerjipazari",
    tags: ["Trifaze"], specs: { "Güç": "25 kW", "Faz": "Trifaze", "Tip": "On-Grid (şebeke bağlantılı)" } });

  /* ---------- 7) Şarj Regülatörleri ---------- */
  add({ id: "reg-pwm10", cat: "sarj-regulatorleri", brand: "Mexxun", price: 380,
    name: "Mexxun AT10 10A PWM Şarj Kontrol Cihazı (12/24V)", supplier: "mexxsun",
    tags: ["PWM", "10–30 A"], specs: { "Teknoloji": "PWM", "Akım": "10 A", "Voltaj": "12/24 V otomatik" } });
  add({ id: "reg-pwm20", cat: "sarj-regulatorleri", brand: "Lexron", price: 470,
    name: "Lexron 20A PWM Şarj Kontrol Cihazı (12/24V)", supplier: "enerjipazari",
    tags: ["PWM", "10–30 A"], specs: { "Teknoloji": "PWM", "Akım": "20 A", "Voltaj": "12/24 V otomatik" } });
  add({ id: "reg-pwm30", cat: "sarj-regulatorleri", brand: "Lexron", price: 695,
    name: "Lexron 30A PWM Şarj Kontrol Cihazı (12/24V)", supplier: "enerjipazari",
    tags: ["PWM", "10–30 A"], specs: { "Teknoloji": "PWM", "Akım": "30 A", "Voltaj": "12/24 V otomatik" } });
  add({ id: "reg-mppt20", cat: "sarj-regulatorleri", brand: "Lexron", price: 2180,
    name: "Lexron 20A MPPT Şarj Kontrol Cihazı (12/24V, 60V panel girişi)", supplier: "enerjipazari",
    tags: ["MPPT", "10–30 A"], specs: { "Teknoloji": "MPPT", "Akım": "20 A", "Maks. PV Girişi": "60 V", "Voltaj": "12/24 V" } });
  add({ id: "reg-mppt30", cat: "sarj-regulatorleri", brand: "Lexron", price: 2720, bestseller: true,
    name: "Lexron 30A MPPT Şarj Kontrol Cihazı (12/24V, 100V panel girişi)", supplier: "enerjipazari",
    tags: ["MPPT", "10–30 A"], specs: { "Teknoloji": "MPPT", "Akım": "30 A", "Maks. PV Girişi": "100 V", "Voltaj": "12/24 V" } });
  add({ id: "reg-mpk8-60", cat: "sarj-regulatorleri", brand: "Mexxun", price: 7182,
    name: "Mexxun MPK8 60A MPPT Şarj Kontrol Cihazı (12/24/48V)", supplier: "mexxsun",
    tags: ["MPPT", "60–100 A"], specs: { "Teknoloji": "MPPT", "Akım": "60 A", "Voltaj": "12/24/48 V", "Seri": "MPK8" } });
  add({ id: "reg-pc18f-80", cat: "sarj-regulatorleri", brand: "Mexxun", price: 7540,
    name: "Mexxun MPK8 80A MPPT Şarj Kontrol Cihazı (12/24/48V)", supplier: "mexxsun",
    tags: ["MPPT", "60–100 A"], specs: { "Teknoloji": "MPPT", "Akım": "80 A", "Voltaj": "12/24/48 V", "Seri": "MPK8" } });
  add({ id: "reg-mpk8-100", cat: "sarj-regulatorleri", brand: "Mexxun", price: 9250,
    name: "Mexxun MPK8 100A MPPT Şarj Kontrol Cihazı (12/24/48V)", supplier: "mexxsun",
    tags: ["MPPT", "60–100 A"], specs: { "Teknoloji": "MPPT", "Akım": "100 A", "Voltaj": "12/24/48 V", "Seri": "MPK8" } });

  /* ---------- 8) Tarımsal Sulama — Pompa Sürücüleri ---------- */
  function pump(id, hp, kw, price, extra) {
    add(Object.assign({ id: id, cat: "tarimsal-sulama", brand: "Mexxun", price: price, supplier: "mexxsun",
      name: hp + " Hp (" + kw + " kW) Solar Pompa Sürücüsü — Trifaze",
      tags: [parseFloat(hp) <= 15 ? "2–15 Hp" : (parseFloat(hp) <= 40 ? "20–40 Hp" : "100+ Hp")],
      specs: { "Pompa Gücü": hp + " Hp / " + kw + " kW", "Çıkış": "Trifaze", "Giriş": "Solar DC dizi", "Koruma": "Kuru çalışma / aşırı akım" } }, extra || {}));
  }
  pump("pmp-2-3hp", "2–3", "1,5–2,2", 6660, { name: "2–3 Hp (1,5–2,2 kW) Solar Pompa Sürücüsü (3×220)", bestseller: true });
  pump("pmp-3hp", "3", "2,2", 7800);
  pump("pmp-10hp", "10", "7,5", 14440);
  pump("pmp-15hp", "15", "11", 18240);
  pump("pmp-20hp", "20", "15", 19980);
  pump("pmp-25hp", "25", "18,5", 27750);
  pump("pmp-30hp", "30", "22", 31450);
  pump("pmp-40hp", "40", "30", 40700);
  pump("pmp-100hp", "100", "75", 88800);
  pump("pmp-120hp", "120", "90", 103600);

  /* ---------- 9) Solar Ekipmanlar ---------- */
  add({ id: "eq-kablo6", cat: "solar-ekipmanlar", brand: "GESM Power", price: 95, unit: "metre",
    name: "6 mm² Solar Kablo (Kırmızı/Siyah, metre)", supplier: "enerjipazari",
    tags: ["Kablo"], specs: { "Kesit": "6 mm²", "Gerilim": "1500 V DC", "UV": "Dayanımlı", "Satış": "Metre ile" } });
  add({ id: "eq-mc4", cat: "solar-ekipmanlar", brand: "GESM Power", price: 85,
    name: "MC4 Solar Konnektör Çifti (Erkek + Dişi)", supplier: "enerjipazari",
    tags: ["Konnektör"], specs: { "Tip": "MC4", "Akım": "30 A", "Gerilim": "1000 V DC", "IP": "IP67" } });
  add({ id: "eq-sigorta", cat: "solar-ekipmanlar", brand: "GESM Power", price: 420,
    name: "DC Sigorta + Tutucu Set (15A / 1000V)", supplier: "enerjipazari",
    tags: ["Sigorta"], specs: { "Akım": "15 A", "Gerilim": "1000 V DC", "İçerik": "Sigorta + ray tipi tutucu" },
    img: ["public/images/products/dc-sigorta-1000v-15a.webp"] });
  add({ id: "eq-kablo4", cat: "solar-ekipmanlar", brand: "GESM Power", price: 140, unit: "metre",
    name: "4 mm² Solar Kablo (metre)", supplier: "enerjipazari",
    tags: ["Kablo"], specs: { "Kesit": "4 mm²", "Gerilim": "1500 V DC", "UV": "Dayanımlı", "Satış": "Metre ile" },
    img: ["public/images/products/4mm-solar-kablo.webp"] });
  add({ id: "eq-tbranch", cat: "solar-ekipmanlar", brand: "GESM Power", price: 430,
    name: "MC4 T-Branch Paralel Konnektör (Çift)", supplier: "enerjipazari",
    tags: ["Konnektör"], specs: { "Tip": "T-Branch (2'li paralel)", "Uyum": "MC4", "IP": "IP67" },
    img: ["public/images/products/t-branch.webp"] });
  add({ id: "eq-3branch", cat: "solar-ekipmanlar", brand: "GESM Power", price: 610,
    name: "MC4 3'lü Branch Paralel Konnektör (Çift)", supplier: "enerjipazari",
    tags: ["Konnektör"], specs: { "Tip": "3'lü Branch paralel", "Uyum": "MC4", "IP": "IP67" },
    img: ["public/images/products/3lu-branch.webp"] });
  add({ id: "eq-orta-tutucu", cat: "solar-ekipmanlar", brand: "GESM Power", price: 100,
    name: "Panel Orta Tutucu (Alüminyum)", supplier: "enerjipazari",
    tags: ["Montaj"], specs: { "Tip": "Orta tutucu (mid clamp)", "Malzeme": "Eloksallı alüminyum" },
    img: ["public/images/products/orta-tutucu.webp"] });
  add({ id: "eq-sonlandirici", cat: "solar-ekipmanlar", brand: "GESM Power", price: 100,
    name: "Panel Sonlandırıcı Tutucu (Alüminyum)", supplier: "enerjipazari",
    tags: ["Montaj"], specs: { "Tip": "Sonlandırıcı (end clamp)", "Malzeme": "Eloksallı alüminyum" },
    img: ["public/images/products/sonlandirici.webp"] });

  /* ---------- 10) Aksesuar & Diğer — Isı Pompaları ---------- */
  function isip(id, kw, price) {
    add({ id: "aks-isi-" + id, cat: "aksesuar", brand: "Lexron", price: price,
      name: "Lexron " + kw + " kW Monoblok Isı Pompası", supplier: "enerjipazari",
      tags: ["Isı Pompası"], specs: { "Kapasite": kw + " kW", "Tip": "Monoblok (hava kaynaklı)", "Kullanım": "Isıtma/soğutma + sıcak su", "Uyum": "Solar sistemle entegre çalışır" },
      img: ["public/images/products/lexron-" + id + "kw-monoblok-isi-pompasi.webp"],
      desc: "Lexron " + kw + " kW monoblok ısı pompası; havadaki ısıyı kullanarak elektriğin 3–4 katı ısıtma enerjisi üretir. Güneş enerjisi sistemiyle birlikte kurulduğunda neredeyse sıfır maliyetli ısıtma/soğutma sağlar. Keşif ve boyutlandırma için bize ulaşın." });
  }
  isip("8", "8", 303540);
  isip("13", "13", 365160);
  isip("16", "16", 395560);

  /* ---------- 11) Solar Paketler (14 adet) ---------- */
  function pkt(id, name, price, scenario, tier, kw, comps, desc, extra) {
    add(Object.assign({ id: id, cat: "solar-paketler", brand: "GESM Power", price: price, supplier: "mexxsun",
      name: name, scenario: scenario, tier: tier || null,
      tags: [scenario].concat(tier ? [tier] : []),
      specs: Object.assign({ "Sistem Gücü": kw, "Kullanım": scenario, "Kurulum": "Tak-çalıştır set (montaj opsiyonel)" }, tier ? { "Seviye": tier } : {}),
      components: comps, desc: desc }, extra || {}));
  }
  pkt("pkt1", "Mini Solar Paket (PKT1)", 13690, "Karavan", null, "~250 W",
    [{ q: 1, name: "245 W Half-Cut Mono Perc panel" },
     { q: 1, name: "12V 100 Ah jel akü" },
     { q: 1, name: "1000 W tam sinüs inverter" },
     { q: 1, name: "30A PWM şarj regülatörü", ref: "reg-pwm30" },
     { q: 1, name: "Kablo + sigorta + bağlantı seti" }],
    "Aydınlatma, telefon/laptop şarjı ve küçük TV için giriş seviyesi hazır sistem. Karavan, tekne ve kamelya kullanımına uygundur; kurulumu bir saat sürmez.");
  pkt("pkt2", "Karavan / Konteyner Solar Paket (PKT2)", 24650, "Karavan", null, "~550 W",
    [{ q: 1, name: "550 W Half-Cut panel" },
     { q: 1, name: "100 Ah 12,8V LiFePO4 lityum akü", ref: "aku-100-12" },
     { q: 1, name: "1,6 kW HV MPPT akıllı inverter", ref: "inv-1-6kw" },
     { q: 1, name: "Kablo + sigorta + montaj seti" }],
    "Karavan ve konteyner yaşamının standardı: buzdolabı, aydınlatma, TV ve şarj ihtiyaçlarını lityum akü konforuyla karşılar. Bluetooth ile şarj durumu telefondan izlenir.");
  pkt("pkt3", "Yayla / Bağ Evi Solar Paket (PKT3)", 34875, "Bağ Evi", null, "~1,1 kW",
    [{ q: 2, name: "550 W Half-Cut panel" },
     { q: 2, name: "12V 150 Ah jel akü" },
     { q: 1, name: "3 kW HV MPPT akıllı inverter", ref: "inv-3kw" },
     { q: 1, name: "Kablo + sigorta + montaj seti" }],
    "Hafta sonu kullanılan yayla ve bağ evleri için dengeli sistem: buzdolabı, aydınlatma, TV ve küçük ev aletlerini rahatça çalıştırır.");
  pkt("pkt4", "3 kW Solar Paket (PKT4)", 39900, "Bağ Evi", null, "~2,2 kW",
    [{ q: 4, name: "550 W Half-Cut panel" },
     { q: 2, name: "12V 200 Ah jel akü" },
     { q: 1, name: "3 kW HV MPPT akıllı inverter", ref: "inv-3kw" },
     { q: 1, name: "4 panel montaj seti" },
     { q: 1, name: "Kablo + sigorta seti" }],
    "Sürekli yaşanan bağ evleri için 3 kW sistem: çamaşır makinesi dahil temel ev yükünü taşır. Jel akü grubuyla ekonomik, dilerseniz lityuma yükseltilebilir.");
  pkt("pkt5", "4 kW Solar Paket (PKT5)", 56800, "Ev", null, "~3,3 kW",
    [{ q: 6, name: "550 W Half-Cut panel" },
     { q: 4, name: "12V 200 Ah jel akü" },
     { q: 1, name: "4,2 kW HV MPPT akıllı inverter", ref: "inv-4-2kw" },
     { q: 2, name: "4 panel montaj seti" },
     { q: 1, name: "Kablo + sigorta seti" }],
    "Şebekenin olmadığı müstakil evler için 4 kW jel akülü sistem: buzdolabı, çamaşır makinesi, TV, aydınlatma ve pompa gibi yükleri birlikte yönetir.");
  pkt("pkt6", "4 kW Lityum Solar Paket (PKT6)", 61750, "Ev", null, "~3,3 kW",
    [{ q: 6, name: "550 W Half-Cut panel" },
     { q: 1, name: "100 Ah 24V LiFePO4 lityum akü", ref: "aku-100-24" },
     { q: 1, name: "4,2 kW HV MPPT akıllı inverter", ref: "inv-4-2kw" },
     { q: 2, name: "4 panel montaj seti" },
     { q: 1, name: "Kablo + sigorta seti" }],
    "PKT5'in lityum sürümü: daha uzun ömür, daha hızlı şarj, telefondan izleme. Günlük derin kullanımda toplam maliyeti jelden daha düşüktür.");
  pkt("pkt10", "10,2 kW Lityum Solar Paket (PKT10)", 176000, "Ev", null, "~10 kW",
    [{ q: 17, name: "600 W TopCon panel" },
     { q: 2, name: "4,8 kWh 48V LiFePO4 akü", ref: "aku-51-wpu" },
     { q: 1, name: "Deye 10 kW hibrit inverter (monofaze)", ref: "inv-deye-10m" },
     { q: 5, name: "4 panel montaj seti" },
     { q: 1, name: "Kablo + sigorta seti" }],
    "Hibrit inverterli 10 kW sistem: şebekeyle mahsuplaşır, kesintide aküden besler. Yüksek tüketimli evler ve küçük işletmeler için ideal.");
  pkt("pkt11", "11 kW Lityum Solar Paket (PKT11) — Ekonomik", 193700, "Ev", "Ekonomik", "~11 kW",
    [{ q: 18, name: "600 W TopCon panel" },
     { q: 2, name: "4,8 kWh 48V LiFePO4 akü", ref: "aku-51-wpu" },
     { q: 1, name: "Deye 10 kW hibrit inverter (trifaze)" },
     { q: 5, name: "4 panel montaj seti" },
     { q: 1, name: "Kablo + sigorta seti" }],
    "11 kW sınıfının giriş konfigürasyonu: trifaze hibrit inverter ve 10,8 kWh depolama ile ekonomik güç.");
  pkt("pkt12", "11 kW Lityum Solar Paket (PKT12) — Standart", 228000, "Ev", "Standart", "~11 kW",
    [{ q: 18, name: "600 W TopCon panel" },
     { q: 3, name: "4,8 kWh 48V LiFePO4 akü", ref: "aku-51-wpu" },
     { q: 1, name: "Deye 12 kW hibrit inverter (trifaze LV)", ref: "inv-deye-12" },
     { q: 5, name: "4 panel montaj seti" },
     { q: 1, name: "Kablo + sigorta seti" }],
    "11 kW'ın dengeli konfigürasyonu: Deye 12 kW trifaze hibrit ve 16,2 kWh depolama — konfor ile bütçenin kesişimi.");
  pkt("pkt13", "11 kW Lityum Solar Paket (PKT13) — Pro", 256000, "Ev", "Pro", "~11 kW",
    [{ q: 18, name: "600 W TopCon G2G çift cam panel" },
     { q: 4, name: "4,8 kWh 48V LiFePO4 akü", ref: "aku-51-wpu" },
     { q: 1, name: "Deye 12 kW hibrit inverter (trifaze LV)", ref: "inv-deye-12" },
     { q: 5, name: "4 panel montaj seti" },
     { q: 1, name: "Kablo + sigorta seti" }],
    "Amiral gemisi: çift cam TopCon paneller, 21,6 kWh depolama ve Deye trifaze hibrit ile tam bağımsızlık. Uzun kesintilerde bile ev tam kapasite çalışır.");
  pkt("pkt14", "12 kW Lityum Solar Paket (PKT14)", 238900, "Ticari", null, "~12 kW",
    [{ q: 20, name: "600 W TopCon panel" },
     { q: 3, name: "4,8 kWh 48V LiFePO4 akü", ref: "aku-51-wpu" },
     { q: 1, name: "Deye 12 kW hibrit inverter (trifaze LV)", ref: "inv-deye-12" },
     { q: 5, name: "4 panel montaj seti" },
     { q: 1, name: "Kablo + sigorta seti" }],
    "Atölye, soğuk hava deposu ve küçük işletmeler için 12 kW trifaze sistem: gündüz yükünü doğrudan güneşten, akşamı depodan karşılar.");

  /* ---------- Açıklama üretici (K5: özgün metin) ---------- */
  var CAT_DESC = {
    "gunes-panelleri": function (p) { return p.name + ", " + (p.specs["Güç"] || "") + " gücünde, düşük gölge kaybı için half-cut hücre mimarisiyle üretilmiş bir güneş panelidir. Çatı ve arazi uygulamalarında kullanılır; 10 yıl ürün, 25 yıl performans garantisi kapsamındadır. Sipariş öncesi stok ve kargo koşulları için bize WhatsApp'tan ulaşabilirsiniz."; },
    "lityum-akuler": function (p) { return p.name + ", " + (p.specs["Kapasite"] || "") + " kapasiteli LiFePO4 (lityum demir fosfat) enerji depolama çözümüdür. Dahili BMS hücre koruması standarttır" + (p.tags.indexOf("Bluetooth") >= 0 ? "; şarj durumu ve hücre dengesi Bluetooth üzerinden telefondan izlenir" : "") + ". Solar sistemlerde jel aküye göre kat kat uzun çevrim ömrü sunar."; },
    "jel-akuler": function (p) { return p.name + ", bakım gerektirmeyen derin döngü jel teknolojisiyle ekonomik enerji depolama sağlar. Bağ evi, karavan ve yedek güç sistemleri için uygundur; %50 deşarj derinliğinde en uzun ömrü verir."; },
    "akilli-inverterler": function (p) { return p.name + ", MPPT şarj kontrolünü ve tam sinüs çıkışı tek cihazda birleştiren off-grid inverterdir. " + (p.specs["Güç"] || "") + " sürekli güç sağlar; şebekenin olmadığı bağ evi, karavan ve şantiye sistemlerinin kalbidir."; },
    "hibrit-inverterler": function (p) { return p.name + "; güneş paneli, akü ve şebekeyi tek noktadan yönetir. Kesintide otomatik aküye geçer, fazla üretimde mahsuplaşma yapılabilir. " + (p.specs["Faz"] || "") + " bağlantı içindir."; },
    "sebeke-inverterleri": function (p) { return p.name + ", aküsüz şebekeye bağlı (on-grid) sistemler için yüksek verimli inverterdir. Çatı GES ve ticari öz tüketim projelerinde kullanılır; proje ve devreye alma desteği sunuyoruz."; },
    "sarj-regulatorleri": function (p) { return p.name + ", panelden aküye şarjı " + (p.specs["Teknoloji"] || "") + " teknolojisiyle yönetir. Aşırı şarj, derin deşarj ve ters polarite korumaları standarttır."; },
    "tarimsal-sulama": function (p) { return p.name + ", mevcut trifaze dalgıç pompanızı doğrudan güneş panellerinden çalıştırır; mazot ve şebeke maliyetini ortadan kaldırır. MPPT algoritması gün boyu maksimum su basar; kuru çalışma koruması dahildir. Kuyu bilgilerinizi iletin, panel sayısını ücretsiz boyutlandıralım."; },
    "solar-ekipmanlar": function (p) { return p.name + " — solar kurulumların güvenli ve uzun ömürlü olması için doğru ekipman şarttır. TSE/IEC uyumlu malzeme kullanılır."; },
    "aksesuar": function (p) { return p.name + " — solar yaşamı kolaylaştıran tamamlayıcı ürün. Detaylı bilgi ve stok için WhatsApp'tan yazabilirsiniz."; }
  };
  P.forEach(function (p) {
    if (!p.desc) p.desc = (CAT_DESC[p.cat] || function () { return p.name; })(p);
    if (!p.tags) p.tags = [];
  });

  GESM.data = { products: P };
})();

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


  /* ---------- EK: Tedarikçi tam envanteri (tools/envanter_genislet.py üretti) ----------
     Fiyatlılar EP maliyet × 1,2; fiyatsızlar Teklif Al (onRequest). */
  var EXTRA = [
  {"id": "x-60a-pwm-sarj-kontrol-cihazi", "cat": "sarj-regulatorleri", "brand": "GESM Power", "name": "60A PWM Şarj Kontrol Cihazı", "supplier": "enerjipazari", "price": 4110, "tags": ["PWM"], "specs": {}, "img": ["public/images/products/60a-pwm-sarj-kontrol-cihazi.webp"]},
  {"id": "x-2hp-pompa-tarimsal-sulama-sistemi-1", "cat": "tarimsal-sulama", "brand": "GESM Power", "name": "2 Hp Pompa Tarımsal Sulama Sistemi", "supplier": "enerjipazari", "price": 136120, "tags": ["Komple Sistem"], "specs": {}, "img": ["public/images/products/2hp-pompa-tarimsal-sulama-sistemi-1.webp"]},
  {"id": "x-4hp-pompa-tarimsal-sulama-sistemi", "cat": "tarimsal-sulama", "brand": "GESM Power", "name": "4 Hp Pompa Tarımsal Sulama Sistemi", "supplier": "enerjipazari", "price": 208360, "tags": ["Komple Sistem"], "specs": {}, "img": ["public/images/products/4hp-pompa-tarimsal-sulama-sistemi.webp"]},
  {"id": "x-5-5hp-pompa-tarimsal-sulama-sistemi", "cat": "tarimsal-sulama", "brand": "GESM Power", "name": "5,5 Hp Pompa Tarımsal Sulama Sistemi", "supplier": "enerjipazari", "price": 334210, "tags": ["Komple Sistem"], "specs": {}, "img": ["public/images/products/5-5hp-pompa-tarimsal-sulama-sistemi.webp"]},
  {"id": "x-10hp-pompa-tarimsal-sulama-sistemi", "cat": "tarimsal-sulama", "brand": "GESM Power", "name": "10 Hp Pompa Tarımsal Sulama Sistemi", "supplier": "enerjipazari", "price": 606050, "tags": ["Komple Sistem"], "specs": {}, "img": ["public/images/products/10hp-pompa-tarimsal-sulama-sistemi.webp"]},
  {"id": "x-15hp-pompa-tarimsal-sulama-sistemi", "cat": "tarimsal-sulama", "brand": "GESM Power", "name": "15 Hp Pompa Tarımsal Sulama Sistemi", "supplier": "enerjipazari", "price": 654040, "tags": ["Komple Sistem"], "specs": {}, "img": ["public/images/products/15hp-pompa-tarimsal-sulama-sistemi.webp"]},
  {"id": "x-20hp-pompa-tarimsal-sulama-sistemi", "cat": "tarimsal-sulama", "brand": "GESM Power", "name": "20 Hp Pompa Tarımsal Sulama Sistemi", "supplier": "enerjipazari", "price": 898010, "tags": ["Komple Sistem"], "specs": {}, "img": ["public/images/products/20hp-pompa-tarimsal-sulama-sistemi.webp"]},
  {"id": "x-25hp-dalgic-pompa-tarimsal-sulama-sistemi", "cat": "tarimsal-sulama", "brand": "GESM Power", "name": "25 Hp Dalgıç Pompa Tarımsal Sulama Sistemi", "supplier": "enerjipazari", "price": 1188610, "tags": ["Komple Sistem"], "specs": {}, "img": ["public/images/products/25hp-dalgic-pompa-tarimsal-sulama-sistemi.webp"]},
  {"id": "x-30hp-dalgic-pompa-tarimsal-sulama-sistemi", "cat": "tarimsal-sulama", "brand": "GESM Power", "name": "30 Hp Dalgıç Pompa Tarımsal Sulama Sistemi", "supplier": "enerjipazari", "price": 1383130, "tags": ["Komple Sistem"], "specs": {}, "img": ["public/images/products/30hp-dalgic-pompa-tarimsal-sulama-sistemi.webp"]},
  {"id": "x-40hp-dalgic-pompa-tarimsal-sulama-sistemi", "cat": "tarimsal-sulama", "brand": "GESM Power", "name": "40 Hp Dalgıç Pompa Tarımsal Sulama Sistemi", "supplier": "enerjipazari", "price": 1726380, "tags": ["Komple Sistem"], "specs": {}, "img": ["public/images/products/40hp-dalgic-pompa-tarimsal-sulama-sistemi.webp"]},
  {"id": "x-9ah-lexron-agm-aku", "cat": "jel-akuler", "brand": "Lexron", "name": "Lexron 9 Ah 12V AGM Akü", "supplier": "enerjipazari", "price": 1920, "tags": ["AGM", "9 Ah"], "specs": {}, "img": ["public/images/products/9ah-lexron-agm-aku.webp"]},
  {"id": "x-7-2ah-lexron-agm-aku", "cat": "jel-akuler", "brand": "Lexron", "name": "Lexron 7,2 Ah 12V AGM Akü", "supplier": "enerjipazari", "price": 1370, "tags": ["AGM", "2 Ah"], "specs": {}, "img": ["public/images/products/7-2ah-lexron-agm-aku.webp"]},
  {"id": "x-7ah-lexron-agm-aku", "cat": "jel-akuler", "brand": "Lexron", "name": "Lexron 7 Ah 12V AGM Akü", "supplier": "enerjipazari", "price": 1140, "tags": ["AGM", "7 Ah"], "specs": {}, "img": ["public/images/products/7ah-lexron-agm-aku.webp"]},
  {"id": "x-40a-pwm-sarj-kontrol-cihazi", "cat": "sarj-regulatorleri", "brand": "GESM Power", "name": "40A PWM Şarj Kontrol Cihazı", "supplier": "enerjipazari", "price": 1990, "tags": ["PWM"], "specs": {}, "img": ["public/images/products/40a-pwm-sarj-kontrol-cihazi.webp"]},
  {"id": "x-40a-mppt-sarj-kontrol-cihazi", "cat": "sarj-regulatorleri", "brand": "GESM Power", "name": "40A MPPT Şarj Kontrol Cihazı", "supplier": "enerjipazari", "price": 7120, "tags": ["MPPT"], "specs": {}, "img": ["public/images/products/40a-mppt-sarj-kontrol-cihazi.webp"]},
  {"id": "x-12ah-12v-lexron-agm-aku", "cat": "jel-akuler", "brand": "Lexron", "name": "Lexron 12 Ah 12V AGM Akü", "supplier": "enerjipazari", "price": 2050, "tags": ["AGM", "12 Ah"], "specs": {}, "img": ["public/images/products/12ah-12v-lexron-agm-aku.webp"]},
  {"id": "x-50kw-on-grid-trifaze-inverter-1", "cat": "sebeke-inverterleri", "brand": "GESM Power", "name": "50 kW On-Grid Trifaze İnverter", "supplier": "enerjipazari", "price": 302990, "tags": ["Trifaze", "30+ kW"], "specs": {}, "img": ["public/images/products/50kw-on-grid-trifaze-inverter-1.webp"]},
  {"id": "x-20kw-on-grid-trifaze-inverter-1", "cat": "sebeke-inverterleri", "brand": "GESM Power", "name": "20 kW On-Grid Trifaze İnverter", "supplier": "enerjipazari", "price": 136940, "tags": ["Trifaze", "10–30 kW"], "specs": {}, "img": ["public/images/products/20kw-on-grid-trifaze-inverter-1.webp"]},
  {"id": "x-10kw-on-grid-trifaze-inverter-1", "cat": "sebeke-inverterleri", "brand": "GESM Power", "name": "10 kW On-Grid Trifaze İnverter", "supplier": "enerjipazari", "price": 94350, "tags": ["Trifaze", "≤10 kW"], "specs": {}, "img": ["public/images/products/10kw-on-grid-trifaze-inverter-1.webp"]},
  {"id": "x-5kw-on-grid-monofaze-inverter-1", "cat": "sebeke-inverterleri", "brand": "GESM Power", "name": "5 kW On-Grid Monofaze İnverter", "supplier": "enerjipazari", "price": 54780, "tags": ["Monofaze", "≤10 kW"], "specs": {}, "img": ["public/images/products/5kw-on-grid-monofaze-inverter-1.webp"]},
  {"id": "x-3kw-on-grid-monofaze-inverter-1", "cat": "sebeke-inverterleri", "brand": "GESM Power", "name": "3 kW On-Grid Monofaze İnverter", "supplier": "enerjipazari", "price": 40190, "tags": ["Monofaze", "≤10 kW"], "specs": {}, "img": ["public/images/products/3kw-on-grid-monofaze-inverter-1.webp"]},
  {"id": "x-75hp-solar-pompa-inverter-yeni-nesil", "cat": "tarimsal-sulama", "brand": "GESM Power", "name": "75 Hp Solar Pompa İnverter Yeni Nesil", "supplier": "enerjipazari", "price": 213020, "tags": ["Sürücü"], "specs": {}, "img": ["public/images/products/75hp-solar-pompa-inverter-yeni-nesil.webp"]},
  {"id": "x-50hp-solar-pompa-inverter-yeni-nesil", "cat": "tarimsal-sulama", "brand": "GESM Power", "name": "50 Hp Solar Pompa İnverter Yeni Nesil", "supplier": "enerjipazari", "price": 149130, "tags": ["Sürücü"], "specs": {}, "img": ["public/images/products/50hp-solar-pompa-inverter-yeni-nesil.webp"]},
  {"id": "x-7-5hp-solar-pompa-inverter-yeni-nesil", "cat": "tarimsal-sulama", "brand": "GESM Power", "name": "7,5 Hp Solar Pompa İnverter Yeni Nesil", "supplier": "enerjipazari", "price": 30130, "tags": ["Sürücü"], "specs": {}, "img": ["public/images/products/7-5hp-solar-pompa-inverter-yeni-nesil.webp"]},
  {"id": "x-2hp-solar-pompa-inverter-yeni-nesil", "cat": "tarimsal-sulama", "brand": "GESM Power", "name": "2 Hp Solar Pompa İnverter Yeni Nesil", "supplier": "enerjipazari", "price": 17460, "tags": ["Sürücü"], "specs": {}, "img": ["public/images/products/2hp-solar-pompa-inverter-yeni-nesil.webp"]},
  {"id": "x-60hp-solar-pompa-inverter-yeni-nesil", "cat": "tarimsal-sulama", "brand": "GESM Power", "name": "60 Hp Solar Pompa İnverter Yeni Nesil", "supplier": "enerjipazari", "price": 197750, "tags": ["Sürücü"], "specs": {}, "img": ["public/images/products/60hp-solar-pompa-inverter-yeni-nesil.webp"]},
  {"id": "x-5kw-hibrit-monofaze-inverter", "cat": "hibrit-inverterler", "brand": "GESM Power", "name": "5 kW Hibrit Monofaze İnverter", "supplier": "enerjipazari", "price": 146120, "tags": ["Monofaze", "≤10 kW"], "specs": {}, "img": ["public/images/products/5kw-hibrit-monofaze-inverter.webp"]},
  {"id": "x-200w-solar-projektor", "cat": "aksesuar", "brand": "GESM Power", "name": "200 W Solar Projektör", "supplier": "enerjipazari", "price": 3770, "tags": ["Aydınlatma"], "specs": {}, "img": ["public/images/products/200w-solar-projektor.webp"]},
  {"id": "x-195w-10bb-etfe-esnek-monokristal-gunes-paneli", "cat": "gunes-panelleri", "brand": "GESM Power", "name": "195 W 10BB ETFE Esnek Monokristal Güneş Paneli", "supplier": "enerjipazari", "price": 53410, "tags": ["Esnek"], "specs": {}, "img": ["public/images/products/195w-10bb-etfe-esnek-monokristal-gunes-paneli.webp"]},
  {"id": "x-300w-12v-modifiye-sinus-inverter-1", "cat": "akilli-inverterler", "brand": "GESM Power", "name": "300 W 12V Modifiye Sinüs İnverter", "supplier": "enerjipazari", "price": 2400, "tags": ["Modifiye Sinüs", "12V"], "specs": {}, "img": ["public/images/products/300w-12v-modifiye-sinus-inverter-1.webp"]},
  {"id": "x-600w-12v-modifiye-sinus-inverter", "cat": "akilli-inverterler", "brand": "GESM Power", "name": "600 W 12V Modifiye Sinüs İnverter", "supplier": "enerjipazari", "price": 3490, "tags": ["Modifiye Sinüs", "12V"], "specs": {}, "img": ["public/images/products/600w-12v-modifiye-sinus-inverter.webp"]},
  {"id": "x-1200w-12v-modifiye-sinus-inverter", "cat": "akilli-inverterler", "brand": "GESM Power", "name": "1200 W 12V Modifiye Sinüs İnverter", "supplier": "enerjipazari", "price": 6230, "tags": ["Modifiye Sinüs", "12V"], "specs": {}, "img": ["public/images/products/1200w-12v-modifiye-sinus-inverter.webp"]},
  {"id": "x-1200w-24v-modifiye-sinus-inverter-1", "cat": "akilli-inverterler", "brand": "GESM Power", "name": "1200 W 24V Modifiye Sinüs İnverter", "supplier": "enerjipazari", "price": 6230, "tags": ["Modifiye Sinüs", "24V"], "specs": {}, "img": ["public/images/products/1200w-24v-modifiye-sinus-inverter-1.webp"]},
  {"id": "x-2000w-12v-modifiye-sinus-inverter", "cat": "akilli-inverterler", "brand": "GESM Power", "name": "2000 W 12V Modifiye Sinüs İnverter", "supplier": "enerjipazari", "price": 13350, "tags": ["Modifiye Sinüs", "12V"], "specs": {}, "img": ["public/images/products/2000w-12v-modifiye-sinus-inverter.webp"]},
  {"id": "x-2000w-24v-modifiye-sinus-inverter-1", "cat": "akilli-inverterler", "brand": "GESM Power", "name": "2000 W 24V Modifiye Sinüs İnverter", "supplier": "enerjipazari", "price": 13350, "tags": ["Modifiye Sinüs", "24V"], "specs": {}, "img": ["public/images/products/2000w-24v-modifiye-sinus-inverter-1.webp"]},
  {"id": "x-600w-12v-tam-sinus-inverter-1", "cat": "akilli-inverterler", "brand": "GESM Power", "name": "600 W 12V Tam Sinüs İnverter", "supplier": "enerjipazari", "price": 8220, "tags": ["Tam Sinüs", "12V"], "specs": {}, "img": ["public/images/products/600w-12v-tam-sinus-inverter-1.webp"]},
  {"id": "x-1000w-12v-tam-sinus-inverter", "cat": "akilli-inverterler", "brand": "GESM Power", "name": "1000 W 12V Tam Sinüs İnverter", "supplier": "enerjipazari", "price": 12670, "tags": ["Tam Sinüs", "12V"], "specs": {}, "img": ["public/images/products/1000w-12v-tam-sinus-inverter.webp"]},
  {"id": "x-1000w-24v-tam-sinus-inverter", "cat": "akilli-inverterler", "brand": "GESM Power", "name": "1000 W 24V Tam Sinüs İnverter", "supplier": "enerjipazari", "price": 12670, "tags": ["Tam Sinüs", "24V"], "specs": {}, "img": ["public/images/products/1000w-24v-tam-sinus-inverter.webp"]},
  {"id": "x-2000w-12v-tam-sinus-inverter-1", "cat": "akilli-inverterler", "brand": "GESM Power", "name": "2000 W 12V Tam Sinüs İnverter", "supplier": "enerjipazari", "price": 19790, "tags": ["Tam Sinüs", "12V"], "specs": {}, "img": ["public/images/products/2000w-12v-tam-sinus-inverter-1.webp"]},
  {"id": "x-3000w-12v-tam-sinus-inverter-1", "cat": "akilli-inverterler", "brand": "GESM Power", "name": "3000 W 12V Tam Sinüs İnverter", "supplier": "enerjipazari", "price": 27050, "tags": ["Tam Sinüs", "12V"], "specs": {}, "img": ["public/images/products/3000w-12v-tam-sinus-inverter-1.webp"]},
  {"id": "x-1000w-12v-tam-sinus-inverter-ups-1", "cat": "akilli-inverterler", "brand": "GESM Power", "name": "1000 W 12V Tam Sinüs İnverter UPS", "supplier": "enerjipazari", "price": 15950, "tags": ["UPS", "12V"], "specs": {}, "img": ["public/images/products/1000w-12v-tam-sinus-inverter-ups-1.webp"]},
  {"id": "x-2000w-12v-tam-sinus-inverter-ups-1", "cat": "akilli-inverterler", "brand": "GESM Power", "name": "2000 W 12V Tam Sinüs İnverter UPS", "supplier": "enerjipazari", "price": 31150, "tags": ["UPS", "12V"], "specs": {}, "img": ["public/images/products/2000w-12v-tam-sinus-inverter-ups-1.webp"]},
  {"id": "x-11-kw-2x100a-mppt-akilli-inverter-paralellenebilir-1", "cat": "akilli-inverterler", "brand": "GESM Power", "name": "11 kW 2×100A MPPT Akıllı İnverter (Paralellenebilir)", "supplier": "enerjipazari", "price": 89010, "tags": ["Tam Sinüs"], "specs": {}, "img": ["public/images/products/11-kw-2x100a-mppt-akilli-inverter-paralellenebilir-1.webp"]},
  {"id": "x-3kva-3000w-mppt-hv-akilli-inverter-1", "cat": "akilli-inverterler", "brand": "GESM Power", "name": "3 kVA 3000 W MPPT HV Akıllı İnverter", "supplier": "enerjipazari", "price": 24310, "tags": ["Tam Sinüs"], "specs": {}, "img": ["public/images/products/3kva-3000w-mppt-hv-akilli-inverter-1.webp"]},
  {"id": "x-gprs-kit", "cat": "solar-ekipmanlar", "brand": "GESM Power", "name": "GPRS Uzaktan İzleme Kiti", "supplier": "enerjipazari", "price": 27390, "tags": ["İzleme"], "specs": {}, "img": ["public/images/products/gprs-kit.webp"]},
  {"id": "x-deye-wifi-logger", "cat": "solar-ekipmanlar", "brand": "Deye", "name": "Deye Wi-Fi Logger (İzleme Modülü)", "supplier": "enerjipazari", "price": 15270, "tags": ["İzleme"], "specs": {}, "img": ["public/images/products/deye-wifi-logger.webp"]},
  {"id": "x-eastron-meter", "cat": "solar-ekipmanlar", "brand": "Eastron", "name": "Eastron Akıllı Sayaç (Meter)", "supplier": "enerjipazari", "price": 25880, "tags": ["İzleme"], "specs": {}, "img": ["public/images/products/eastron-meter.webp"]},
  {"id": "x-enerji-depolamali-on-grid-sistem-1", "cat": "solar-paketler", "brand": "GESM Power", "name": "Enerji Depolamalı On-Grid Paket Sistem — Konfigürasyon 1", "supplier": "enerjipazari", "price": 404600, "tags": [], "scenario": "Ev", "specs": {}, "img": ["public/images/products/enerji-depolamali-on-grid-sistem-1.webp"]},
  {"id": "x-enerji-depolamali-on-grid-sistem-2", "cat": "solar-paketler", "brand": "GESM Power", "name": "Enerji Depolamalı On-Grid Paket Sistem — Konfigürasyon 2", "supplier": "enerjipazari", "price": 618300, "tags": [], "scenario": "Ev", "specs": {}, "img": ["public/images/products/enerji-depolamali-on-grid-sistem-2.webp"]},
  {"id": "x-enerji-depolamali-on-grid-sistem-3", "cat": "solar-paketler", "brand": "GESM Power", "name": "Enerji Depolamalı On-Grid Paket Sistem — Konfigürasyon 3", "supplier": "enerjipazari", "price": 937720, "tags": [], "scenario": "Ev", "specs": {}, "img": ["public/images/products/enerji-depolamali-on-grid-sistem-3.webp"]},
  {"id": "x-enerji-depolamali-on-grid-sistem-4", "cat": "solar-paketler", "brand": "GESM Power", "name": "Enerji Depolamalı On-Grid Paket Sistem — Konfigürasyon 4", "supplier": "enerjipazari", "price": 1136430, "tags": [], "scenario": "Ev", "specs": {}, "img": ["public/images/products/enerji-depolamali-on-grid-sistem-4.webp"]},
  {"id": "x-off-grid-inverter-logger", "cat": "solar-ekipmanlar", "brand": "GESM Power", "name": "Off-Grid İnverter Wi-Fi Logger", "supplier": "enerjipazari", "price": 7670, "tags": ["İzleme"], "specs": {}, "img": ["public/images/products/off-grid-inverter-logger.webp"]},
  {"id": "x-trifaze-enerji-depolamali-on-grid-sistem-5-1", "cat": "solar-paketler", "brand": "GESM Power", "name": "Trifaze Enerji Depolamalı On-Grid Paket Sistem — Konfigürasyon 5", "supplier": "enerjipazari", "price": 1775550, "tags": [], "scenario": "Ticari", "specs": {}, "img": ["public/images/products/trifaze-enerji-depolamali-on-grid-sistem-5-1.webp"]},
  {"id": "x-trifaze-enerji-depolamali-on-grid-sistem-6", "cat": "solar-paketler", "brand": "GESM Power", "name": "Trifaze Enerji Depolamalı On-Grid Paket Sistem — Konfigürasyon 6", "supplier": "enerjipazari", "price": 2123180, "tags": [], "scenario": "Ticari", "specs": {}, "img": ["public/images/products/trifaze-enerji-depolamali-on-grid-sistem-6.webp"]},
  {"id": "x-20kw-hibrit-trifaze-inverter-lv", "cat": "hibrit-inverterler", "brand": "GESM Power", "name": "20 kW Hibrit Trifaze İnverter LV", "supplier": "enerjipazari", "price": 502110, "tags": ["Trifaze", "10–30 kW"], "specs": {}, "img": ["public/images/products/20kw-hibrit-trifaze-inverter-lv.webp"]},
  {"id": "x-10kw-on-grid-monofaze-inverter", "cat": "sebeke-inverterleri", "brand": "GESM Power", "name": "10 kW On-Grid Monofaze İnverter", "supplier": "enerjipazari", "price": 86690, "tags": ["Monofaze", "≤10 kW"], "specs": {}, "img": ["public/images/products/10kw-on-grid-monofaze-inverter.webp"]},
  {"id": "x-lg-9kw-monoblok-isi-pompasi", "cat": "aksesuar", "brand": "LG", "name": "LG 9 kW Monoblok Isı Pompası", "supplier": "enerjipazari", "price": 592760, "tags": ["Isı Pompası"], "specs": {}, "img": ["public/images/products/lg-9kw-monoblok-isi-pompasi.webp"]},
  {"id": "x-lg-12kw-monoblok-isi-pompasi", "cat": "aksesuar", "brand": "LG", "name": "LG 12 kW Monoblok Isı Pompası", "supplier": "enerjipazari", "price": 703000, "tags": ["Isı Pompası"], "specs": {}, "img": ["public/images/products/lg-12kw-monoblok-isi-pompasi.webp"]},
  {"id": "x-lg-16kw-monoblok-isi-pompasi", "cat": "aksesuar", "brand": "LG", "name": "LG 16 kW Monoblok Isı Pompası", "supplier": "enerjipazari", "price": 733400, "tags": ["Isı Pompası"], "specs": {}, "img": ["public/images/products/lg-16kw-monoblok-isi-pompasi.webp"]},
  {"id": "x-20kw-trifaze-hibrit-sistem-3", "cat": "solar-paketler", "brand": "GESM Power", "name": "20 kW Trifaze Hibrit Paket Sistem", "supplier": "enerjipazari", "price": 2371250, "tags": [], "scenario": "Ticari", "specs": {}, "img": ["public/images/products/20kw-trifaze-hibrit-sistem-3.webp"]},
  {"id": "x-15kw-hibrit-trifaze-inverter-lv", "cat": "hibrit-inverterler", "brand": "GESM Power", "name": "15 kW Hibrit Trifaze İnverter LV", "supplier": "enerjipazari", "price": 365160, "tags": ["Trifaze", "10–30 kW"], "specs": {}, "img": ["public/images/products/15kw-hibrit-trifaze-inverter-lv.webp"]},
  {"id": "x-30kw-hibrit-trifaze-inverter-hv", "cat": "hibrit-inverterler", "brand": "GESM Power", "name": "30 kW Hibrit Trifaze İnverter HV", "supplier": "enerjipazari", "price": 570580, "tags": ["Trifaze", "10–30 kW"], "specs": {}, "img": ["public/images/products/30kw-hibrit-trifaze-inverter-hv.webp"]},
  {"id": "x-50kw-hibrit-trifaze-inverter-hv", "cat": "hibrit-inverterler", "brand": "GESM Power", "name": "50 kW Hibrit Trifaze İnverter HV", "supplier": "enerjipazari", "price": 911430, "tags": ["Trifaze", "30+ kW"], "specs": {}, "img": ["public/images/products/50kw-hibrit-trifaze-inverter-hv.webp"]},
  {"id": "x-150hp-110kw-solar-pompa-inverteri-yeni-nesil", "cat": "tarimsal-sulama", "brand": "GESM Power", "name": "150 Hp (110 kW) Solar Pompa İnverteri Yeni Nesil", "supplier": "enerjipazari", "price": 349960, "tags": ["Sürücü"], "specs": {}, "img": ["public/images/products/150hp-110kw-solar-pompa-inverteri-yeni-nesil.webp"]},
  {"id": "x-180hp-132kw-solar-pompa-inverteri-yeni-nesil", "cat": "tarimsal-sulama", "brand": "GESM Power", "name": "180 Hp (132 kW) Solar Pompa İnverteri Yeni Nesil", "supplier": "enerjipazari", "price": 532510, "tags": ["Sürücü"], "specs": {}, "img": ["public/images/products/180hp-132kw-solar-pompa-inverteri-yeni-nesil.webp"]},
  {"id": "x-black-series-140w-16bb-topcon-esnek-gunes-paneli", "cat": "gunes-panelleri", "brand": "GESM Power", "name": "Black Series 140 W 16BB TopCon Esnek Güneş Paneli", "supplier": "enerjipazari", "price": 38340, "tags": ["Esnek"], "specs": {}, "img": ["public/images/products/black-series-140w-16bb-topcon-esnek-gunes-paneli.webp"]},
  {"id": "x-8kw-hibrit-trifaze-inverter-lv", "cat": "hibrit-inverterler", "brand": "GESM Power", "name": "8 kW Hibrit Trifaze İnverter LV", "supplier": "enerjipazari", "price": 303540, "tags": ["Trifaze", "≤10 kW"], "specs": {}, "img": ["public/images/products/8kw-hibrit-trifaze-inverter-lv.webp"]},
  {"id": "x-210hp-160kw-solar-pompa-inverteri-yeni-nesil", "cat": "tarimsal-sulama", "brand": "GESM Power", "name": "210 Hp (160 kW) Solar Pompa İnverteri Yeni Nesil", "supplier": "enerjipazari", "price": 600980, "tags": ["Sürücü"], "specs": {}, "img": ["public/images/products/210hp-160kw-solar-pompa-inverteri-yeni-nesil.webp"]},
  {"id": "x-8kw-hibrit-monofaze-inverter-lv-1", "cat": "hibrit-inverterler", "brand": "GESM Power", "name": "8 kW Hibrit Monofaze İnverter LV", "supplier": "enerjipazari", "price": 220620, "tags": ["Monofaze", "≤10 kW"], "specs": {}, "img": ["public/images/products/8kw-hibrit-monofaze-inverter-lv-1.webp"]},
  {"id": "x-20-48kwh-lifepo4-hv-yuksek-voltaj-batarya-sistemi", "cat": "lityum-akuler", "brand": "GESM Power", "name": "20–48 kWh LiFePO4 HV Yüksek Voltaj Batarya Sistemi", "supplier": "enerjipazari", "price": 836860, "tags": ["HV Sistem"], "specs": {}, "img": ["public/images/products/20-48kwh-lifepo4-hv-yuksek-voltaj-batarya-sistemi.webp"]},
  {"id": "x-40-96kwh-lifepo4-hv-yuksek-voltaj-batarya-sistemi", "cat": "lityum-akuler", "brand": "GESM Power", "name": "40–96 kWh LiFePO4 HV Yüksek Voltaj Batarya Sistemi", "supplier": "enerjipazari", "price": 1323770, "tags": ["HV Sistem"], "specs": {}, "img": ["public/images/products/40-96kwh-lifepo4-hv-yuksek-voltaj-batarya-sistemi.webp"]},
  {"id": "x-eve-61-44kwh-lifepo4-hv-yuksek-voltaj-batarya-sistemi", "cat": "lityum-akuler", "brand": "GESM Power", "name": "EVE 61,44 kWh LiFePO4 HV Yüksek Voltaj Batarya Sistemi", "supplier": "enerjipazari", "price": 1909620, "tags": ["HV Sistem"], "specs": {}, "img": ["public/images/products/eve-61-44kwh-lifepo4-hv-yuksek-voltaj-batarya-sistemi-kopya.webp"]},
  {"id": "x-15kw-on-grid-trifaze-inverter", "cat": "sebeke-inverterleri", "brand": "GESM Power", "name": "15 kW On-Grid Trifaze İnverter", "supplier": "enerjipazari", "price": 117160, "tags": ["Trifaze", "10–30 kW"], "specs": {}, "img": ["public/images/products/15kw-on-grid-trifaze-inverter.webp"]},
  {"id": "x-5kw-on-grid-trifaze-inverter", "cat": "sebeke-inverterleri", "brand": "GESM Power", "name": "5 kW On-Grid Trifaze İnverter", "supplier": "enerjipazari", "price": 89010, "tags": ["Trifaze", "≤10 kW"], "specs": {}, "img": ["public/images/products/5kw-on-grid-trifaze-inverter.webp"]},
  {"id": "x-314ah-51-2v-premium-serisi-lityum-batarya", "cat": "lityum-akuler", "brand": "GESM Power", "name": "314 Ah 51,2V Premium Serisi Lityum Batarya (16 kWh)", "supplier": "enerjipazari", "price": 365160, "tags": ["314 Ah"], "specs": {}, "img": ["public/images/products/314ah-51-2v-premium-serisi-lityum-batarya.webp"]},
  {"id": "x-1200w-solar-aydinlatma", "cat": "aksesuar", "brand": "GESM Power", "name": "1200 W Solar Aydınlatma", "supplier": "enerjipazari", "price": 6850, "tags": ["Aydınlatma"], "specs": {}, "img": ["public/images/products/1200w-solar-aydinlatma.webp"]},
  {"id": "x-2400w-solar-aydinlatma", "cat": "aksesuar", "brand": "GESM Power", "name": "2400 W Solar Aydınlatma", "supplier": "enerjipazari", "price": 10610, "tags": ["Aydınlatma"], "specs": {}, "img": ["public/images/products/2400w-solar-aydinlatma.webp"]},
  {"id": "x-700w-solar-aydinlatma", "cat": "aksesuar", "brand": "GESM Power", "name": "700 W Solar Aydınlatma", "supplier": "enerjipazari", "price": 5270, "tags": ["Aydınlatma"], "specs": {}, "img": ["public/images/products/700w-solar-aydinlatma.webp"]},
  {"id": "x-lexron-18kw-monoblok-isi-pompasi", "cat": "aksesuar", "brand": "Lexron", "name": "Lexron 18 kW Monoblok Isı Pompası", "supplier": "enerjipazari", "price": 455680, "tags": ["Isı Pompası"], "specs": {}, "img": ["public/images/products/lexron-18kw-monoblok-isi-pompasi.webp"]},
  {"id": "x-60kw-hibrit-trifaze-inverter-hv", "cat": "hibrit-inverterler", "brand": "GESM Power", "name": "60 kW Hibrit Trifaze İnverter HV", "supplier": "enerjipazari", "price": 989010, "tags": ["Trifaze", "30+ kW"], "specs": {}, "img": ["public/images/products/60kw-hibrit-trifaze-inverter-hv.webp"]},
  {"id": "x-80kw-hibrit-trifaze-inverter-hv", "cat": "hibrit-inverterler", "brand": "GESM Power", "name": "80 kW Hibrit Trifaze İnverter HV", "supplier": "enerjipazari", "price": 1072680, "tags": ["Trifaze", "30+ kW"], "specs": {}, "img": ["public/images/products/80kw-hibrit-trifaze-inverter-hv.webp"]},
  {"id": "x-200ah-25-6v-lityum-batarya", "cat": "lityum-akuler", "brand": "GESM Power", "name": "200 Ah 25,6V Lityum Batarya (5,12 kWh)", "supplier": "enerjipazari", "price": 120170, "tags": ["200 Ah"], "specs": {}, "img": ["public/images/products/200ah-25-6v-lityum-batarya.webp"]},
  {"id": "x-dc-sigorta-1000v-30a", "cat": "solar-ekipmanlar", "brand": "GESM Power", "name": "DC Sigorta 1000V 30A", "supplier": "enerjipazari", "price": 1220, "tags": ["Sigorta"], "specs": {}, "img": ["public/images/products/dc-sigorta-1000v-30a.webp"]},
  {"id": "x-80a-hv-15-230v-mppt-sarj-kontrol-cihazi", "cat": "sarj-regulatorleri", "brand": "GESM Power", "name": "80A HV MPPT Şarj Kontrol Cihazı (15–230V PV)", "supplier": "enerjipazari", "price": 22120, "tags": ["MPPT"], "specs": {}, "img": ["public/images/products/80a-hv-15-230v-mppt-sarj-kontrol-cihazi.webp"]},
  {"id": "x-2000w-2kw-tasinabilir-guc-istasyonu", "cat": "aksesuar", "brand": "GESM Power", "name": "2000 W Taşınabilir Güç İstasyonu", "supplier": "enerjipazari", "price": 128040, "tags": ["Güç İstasyonu"], "specs": {}, "img": ["public/images/products/2000w-2kw-tasinabilir-guc-istasyonu.webp"]},
  {"id": "x-1-5kw-hv-mppt-akilli-inverter-12v-sorotec", "cat": "akilli-inverterler", "brand": "Sorotec", "name": "Sorotec 1,5 kW HV MPPT Akıllı İnverter 12V", "supplier": "enerjipazari", "price": 19720, "tags": ["Tam Sinüs", "12V"], "specs": {}, "img": ["public/images/products/1-5kw-hv-mppt-akilli-inverter-12v-sorotec.webp"]},
  {"id": "x-16kw-hibrit-monofaze-inverter-lv", "cat": "hibrit-inverterler", "brand": "GESM Power", "name": "16 kW Hibrit Monofaze İnverter LV", "supplier": "enerjipazari", "price": 387960, "tags": ["Monofaze", "10–30 kW"], "specs": {}, "img": ["public/images/products/16kw-hibrit-monofaze-inverter-lv.webp"]},
  {"id": "x-4-2kw-topcon-paket-sistem-1-paket-4", "cat": "solar-paketler", "brand": "GESM Power", "name": "4,2 kW TopCon Paket Sistem", "supplier": "enerjipazari", "price": 236160, "tags": [], "scenario": "Ev", "specs": {}, "img": ["public/images/products/4-2kw-topcon-paket-sistem-1-paket-4-kopya.webp"]},
  {"id": "x-5-5kw-hv-mppt-akilli-inverter-sorotec", "cat": "akilli-inverterler", "brand": "Sorotec", "name": "Sorotec 5,5 kW HV MPPT Akıllı İnverter", "supplier": "enerjipazari", "price": 39710, "tags": ["Tam Sinüs"], "specs": {}, "img": ["public/images/products/5-5kw-hv-mppt-akilli-inverter-sorotec.webp"]},
  {"id": "x-30kw-on-grid-trifaze-inverter", "cat": "sebeke-inverterleri", "brand": "GESM Power", "name": "30 kW On-Grid Trifaze İnverter", "supplier": "enerjipazari", "price": 164330, "tags": ["Trifaze", "10–30 kW"], "specs": {}, "img": ["public/images/products/30kw-on-grid-trifaze-inverter.webp"]},
  {"id": "x-25kw-hibrit-trifaze-inverter-hv", "cat": "hibrit-inverterler", "brand": "GESM Power", "name": "25 kW Hibrit Trifaze İnverter HV", "supplier": "enerjipazari", "price": 455000, "tags": ["Trifaze", "10–30 kW"], "specs": {}, "img": ["public/images/products/25kw-hibrit-trifaze-inverter-hv.webp"]},
  {"id": "x-220w-16bb-etfe-210r-esnek-topcon-gunes-paneli", "cat": "gunes-panelleri", "brand": "GESM Power", "name": "220 W 16BB ETFE 210R Esnek TopCon Güneş Paneli", "supplier": "enerjipazari", "price": 60260, "tags": ["Esnek"], "specs": {}, "img": ["public/images/products/220w-16bb-etfe-210r-esnek-topcon-gunes-paneli.webp"]},
  {"id": "x-tam-sinus-12v-300w", "cat": "akilli-inverterler", "brand": "Mexxun", "name": "Tam Sinüs İnverter 12V 300 W", "supplier": "mexxsun", "onRequest": true, "tags": ["Tam Sinüs", "12V"], "specs": {}, "img": ["public/images/products/tam-sinus-12v-300w.webp", "public/images/products/tam-sinus-12v-300w-2.webp", "public/images/products/tam-sinus-12v-300w-3.webp", "public/images/products/tam-sinus-12v-300w-4.webp", "public/images/products/tam-sinus-12v-300w-5.webp", "public/images/products/tam-sinus-12v-300w-6.webp"]},
  {"id": "x-tam-sinus-12v-1500w", "cat": "akilli-inverterler", "brand": "Mexxun", "name": "Tam Sinüs İnverter 12V 1500 W", "supplier": "mexxsun", "onRequest": true, "tags": ["Tam Sinüs", "12V"], "specs": {}, "img": ["public/images/products/tam-sinus-12v-1500w.webp", "public/images/products/tam-sinus-12v-1500w-2.webp", "public/images/products/tam-sinus-12v-1500w-3.webp", "public/images/products/tam-sinus-12v-1500w-4.webp", "public/images/products/tam-sinus-12v-1500w-5.webp", "public/images/products/tam-sinus-12v-1500w-6.webp"]},
  {"id": "x-tam-sinus-12v-4000w", "cat": "akilli-inverterler", "brand": "Mexxun", "name": "Tam Sinüs İnverter 12V 4000 W", "supplier": "mexxsun", "onRequest": true, "tags": ["Tam Sinüs", "12V"], "specs": {}, "img": ["public/images/products/tam-sinus-12v-4000w.webp", "public/images/products/tam-sinus-12v-4000w-2.webp", "public/images/products/tam-sinus-12v-4000w-3.webp", "public/images/products/tam-sinus-12v-4000w-4.webp", "public/images/products/tam-sinus-12v-4000w-5.webp", "public/images/products/tam-sinus-12v-4000w-6.webp"]},
  {"id": "x-tam-sinus-24v-1500w", "cat": "akilli-inverterler", "brand": "Mexxun", "name": "Tam Sinüs İnverter 24V 1500 W", "supplier": "mexxsun", "onRequest": true, "tags": ["Tam Sinüs", "24V"], "specs": {}, "img": ["public/images/products/tam-sinus-24v-1500w.webp", "public/images/products/tam-sinus-24v-1500w-2.webp", "public/images/products/tam-sinus-24v-1500w-3.webp", "public/images/products/tam-sinus-24v-1500w-4.webp", "public/images/products/tam-sinus-24v-1500w-5.webp", "public/images/products/tam-sinus-24v-1500w-6.webp"]},
  {"id": "x-tam-sinus-24v-2000w", "cat": "akilli-inverterler", "brand": "Mexxun", "name": "Tam Sinüs İnverter 24V 2000 W", "supplier": "mexxsun", "onRequest": true, "tags": ["Tam Sinüs", "24V"], "specs": {}, "img": ["public/images/products/tam-sinus-24v-2000w.webp", "public/images/products/tam-sinus-24v-2000w-2.webp", "public/images/products/tam-sinus-24v-2000w-3.webp", "public/images/products/tam-sinus-24v-2000w-4.webp", "public/images/products/tam-sinus-24v-2000w-5.webp", "public/images/products/tam-sinus-24v-2000w-6.webp"]},
  {"id": "x-tam-sinus-24v-3000wts", "cat": "akilli-inverterler", "brand": "Mexxun", "name": "Tam Sinüs İnverter 24V 3000 W", "supplier": "mexxsun", "onRequest": true, "tags": ["Tam Sinüs", "24V"], "specs": {}, "img": ["public/images/products/tam-sinus-24v-3000wts.webp", "public/images/products/tam-sinus-24v-3000wts-2.webp", "public/images/products/tam-sinus-24v-3000wts-3.webp", "public/images/products/tam-sinus-24v-3000wts-4.webp", "public/images/products/tam-sinus-24v-3000wts-5.webp", "public/images/products/tam-sinus-24v-3000wts-6.webp"]},
  {"id": "x-tam-sinus-ups-remote-ekran-12v-600w", "cat": "akilli-inverterler", "brand": "Mexxun", "name": "Tam Sinüs UPS İnverter 12V 600 W (Uzaktan Ekranlı)", "supplier": "mexxsun", "onRequest": true, "tags": ["UPS", "12V"], "specs": {}, "img": ["public/images/products/tam-sinus-ups-remote-ekran-12v-600w.webp", "public/images/products/tam-sinus-ups-remote-ekran-12v-600w-2.webp", "public/images/products/tam-sinus-ups-remote-ekran-12v-600w-3.webp", "public/images/products/tam-sinus-ups-remote-ekran-12v-600w-4.webp", "public/images/products/tam-sinus-ups-remote-ekran-12v-600w-5.webp", "public/images/products/tam-sinus-ups-remote-ekran-12v-600w-6.webp"]},
  {"id": "x-tam-sinus-ups-remote-ekran-12v-3000w", "cat": "akilli-inverterler", "brand": "Mexxun", "name": "Tam Sinüs UPS İnverter 12V 3000 W (Uzaktan Ekranlı)", "supplier": "mexxsun", "onRequest": true, "tags": ["UPS", "12V"], "specs": {}, "img": ["public/images/products/tam-sinus-ups-remote-ekran-12v-3000w.webp", "public/images/products/tam-sinus-ups-remote-ekran-12v-3000w-2.webp", "public/images/products/tam-sinus-ups-remote-ekran-12v-3000w-3.webp", "public/images/products/tam-sinus-ups-remote-ekran-12v-3000w-4.webp", "public/images/products/tam-sinus-ups-remote-ekran-12v-3000w-5.webp", "public/images/products/tam-sinus-ups-remote-ekran-12v-3000w-6.webp"]},
  {"id": "x-mexx-p4kw-premium-24v-4kw", "cat": "akilli-inverterler", "brand": "Mexxun", "name": "Mexxun P4KW Premium 4 kW Akıllı İnverter 24V", "supplier": "mexxsun", "onRequest": true, "tags": ["Tam Sinüs", "24V"], "specs": {}, "img": ["public/images/products/mexx-p4kw-premium-24v-4kw.webp", "public/images/products/mexx-p4kw-premium-24v-4kw-2.webp", "public/images/products/mexx-p4kw-premium-24v-4kw-3.webp", "public/images/products/mexx-p4kw-premium-24v-4kw-4.webp", "public/images/products/mexx-p4kw-premium-24v-4kw-5.webp", "public/images/products/mexx-p4kw-premium-24v-4kw-6.webp"]},
  {"id": "x-mexx-p6kw-premium-48v-6kw", "cat": "akilli-inverterler", "brand": "Mexxun", "name": "Mexxun P6KW Premium 6 kW Akıllı İnverter 48V", "supplier": "mexxsun", "onRequest": true, "tags": ["Tam Sinüs", "48V"], "specs": {}, "img": ["public/images/products/mexx-p6kw-premium-48v-6kw.webp", "public/images/products/mexx-p6kw-premium-48v-6kw-2.webp", "public/images/products/mexx-p6kw-premium-48v-6kw-3.webp", "public/images/products/mexx-p6kw-premium-48v-6kw-4.webp", "public/images/products/mexx-p6kw-premium-48v-6kw-5.webp", "public/images/products/mexx-p6kw-premium-48v-6kw-6.webp"]},
  {"id": "x-deye-optimizer-sun-xl02-b", "cat": "solar-ekipmanlar", "brand": "Deye", "name": "Deye Optimizer SUN-XL02-B", "supplier": "mexxsun", "onRequest": true, "tags": ["İzleme"], "specs": {}, "img": ["public/images/products/deye-optimizer-sun-xl02-b.webp"]},
  {"id": "x-deye-optimizer-concentrator-sun-xl20-b", "cat": "solar-ekipmanlar", "brand": "Deye", "name": "Deye Optimizer Concentrator SUN-XL20-B", "supplier": "mexxsun", "onRequest": true, "tags": ["İzleme"], "specs": {}, "img": ["public/images/products/deye-optimizer-concentrator-sun-xl20-b.webp"]},
  {"id": "x-auxsol-8kw-monofaze", "cat": "sebeke-inverterleri", "brand": "Auxsol", "name": "Auxsol 8 kW Monofaze On-Grid İnverter", "supplier": "mexxsun", "onRequest": true, "tags": ["Monofaze", "≤10 kW"], "specs": {}, "img": ["public/images/products/auxsol-8kw-monofaze.webp", "public/images/products/auxsol-8kw-monofaze-2.webp", "public/images/products/auxsol-8kw-monofaze-3.webp", "public/images/products/auxsol-8kw-monofaze-4.webp", "public/images/products/auxsol-8kw-monofaze-5.webp", "public/images/products/auxsol-8kw-monofaze-6.webp"]},
  {"id": "x-deye-33kw-trifaze11", "cat": "sebeke-inverterleri", "brand": "Deye", "name": "Deye 33 kW Trifaze On-Grid İnverter", "supplier": "mexxsun", "onRequest": true, "tags": ["Trifaze", "30+ kW"], "specs": {}, "img": ["public/images/products/deye-33kw-trifaze11.webp", "public/images/products/deye-33kw-trifaze11-2.webp", "public/images/products/deye-33kw-trifaze11-3.webp", "public/images/products/deye-33kw-trifaze11-4.webp"]},
  {"id": "x-mexxsun-12-kw-hibrit-monofaze-lv-48v", "cat": "hibrit-inverterler", "brand": "Mexxun", "name": "Mexxun 12 kW Hibrit Monofaze İnverter LV 48V", "supplier": "mexxsun", "onRequest": true, "tags": ["Monofaze", "10–30 kW"], "specs": {}, "img": ["public/images/products/12-kw-hibrit-monofaze-lv-48v.webp", "public/images/products/12-kw-hibrit-monofaze-lv-48v-2.webp", "public/images/products/12-kw-hibrit-monofaze-lv-48v-3.webp", "public/images/products/12-kw-hibrit-monofaze-lv-48v-4.webp", "public/images/products/12-kw-hibrit-monofaze-lv-48v-5.webp"]},
  {"id": "x-pwm-12-24v-cm3", "cat": "sarj-regulatorleri", "brand": "Mexxun", "name": "Mexxun CM3 PWM Şarj Kontrol Cihazı (12/24V)", "supplier": "mexxsun", "onRequest": true, "tags": ["PWM"], "specs": {}, "img": ["public/images/products/pwm-12-24v-cm3.webp", "public/images/products/pwm-12-24v-cm3-2.webp", "public/images/products/pwm-12-24v-cm3-3.webp", "public/images/products/pwm-12-24v-cm3-4.webp", "public/images/products/pwm-12-24v-cm3-5.webp", "public/images/products/pwm-12-24v-cm3-6.webp"]},
  {"id": "x-ac-dc-aku-sarj-cihazi-12v-20a", "cat": "sarj-regulatorleri", "brand": "Mexxun", "name": "AC-DC Akü Şarj Cihazı 12V 20A", "supplier": "mexxsun", "onRequest": true, "tags": ["AC-DC Şarj"], "specs": {}, "img": ["public/images/products/ac-dc-aku-sarj-cihazi-12v-20a.webp", "public/images/products/ac-dc-aku-sarj-cihazi-12v-20a-2.webp", "public/images/products/ac-dc-aku-sarj-cihazi-12v-20a-3.webp", "public/images/products/ac-dc-aku-sarj-cihazi-12v-20a-4.webp", "public/images/products/ac-dc-aku-sarj-cihazi-12v-20a-5.webp", "public/images/products/ac-dc-aku-sarj-cihazi-12v-20a-6.webp"]},
  {"id": "x-ac-dc-aku-sarj-cihazi-12v-40a", "cat": "sarj-regulatorleri", "brand": "Mexxun", "name": "AC-DC Akü Şarj Cihazı 12V 40A", "supplier": "mexxsun", "onRequest": true, "tags": ["AC-DC Şarj"], "specs": {}, "img": ["public/images/products/ac-dc-aku-sarj-cihazi-12v-40a.webp", "public/images/products/ac-dc-aku-sarj-cihazi-12v-40a-2.webp", "public/images/products/ac-dc-aku-sarj-cihazi-12v-40a-3.webp", "public/images/products/ac-dc-aku-sarj-cihazi-12v-40a-4.webp", "public/images/products/ac-dc-aku-sarj-cihazi-12v-40a-5.webp", "public/images/products/ac-dc-aku-sarj-cihazi-12v-40a-6.webp"]},
  {"id": "x-ac-dc-aku-sarj-cihazi-24v-20a", "cat": "sarj-regulatorleri", "brand": "Mexxun", "name": "AC-DC Akü Şarj Cihazı 24V 20A", "supplier": "mexxsun", "onRequest": true, "tags": ["AC-DC Şarj"], "specs": {}, "img": ["public/images/products/ac-dc-aku-sarj-cihazi-24v-20a.webp", "public/images/products/ac-dc-aku-sarj-cihazi-24v-20a-2.webp", "public/images/products/ac-dc-aku-sarj-cihazi-24v-20a-3.webp", "public/images/products/ac-dc-aku-sarj-cihazi-24v-20a-4.webp", "public/images/products/ac-dc-aku-sarj-cihazi-24v-20a-5.webp", "public/images/products/ac-dc-aku-sarj-cihazi-24v-20a-6.webp"]},
  {"id": "x-ac-dc-aku-sarj-cihazi-48v-20a", "cat": "sarj-regulatorleri", "brand": "Mexxun", "name": "AC-DC Akü Şarj Cihazı 48V 20A", "supplier": "mexxsun", "onRequest": true, "tags": ["AC-DC Şarj"], "specs": {}, "img": ["public/images/products/ac-dc-aku-sarj-cihazi-48v-20a.webp", "public/images/products/ac-dc-aku-sarj-cihazi-48v-20a-2.webp", "public/images/products/ac-dc-aku-sarj-cihazi-48v-20a-3.webp", "public/images/products/ac-dc-aku-sarj-cihazi-48v-20a-4.webp", "public/images/products/ac-dc-aku-sarj-cihazi-48v-20a-5.webp", "public/images/products/ac-dc-aku-sarj-cihazi-48v-20a-6.webp"]},
  {"id": "x-mexxsun-lityum-aku-51-2v-300ah-lifepo4", "cat": "lityum-akuler", "brand": "Mexxun", "name": "Mexxun 300 Ah 51,2V LiFePO4 Lityum Akü (15,36 kWh)", "supplier": "mexxsun", "onRequest": true, "tags": ["300 Ah"], "specs": {}, "img": ["public/images/products/lityum-aku-51-2v-300ah-lifepo4.webp", "public/images/products/lityum-aku-51-2v-300ah-lifepo4-2.webp", "public/images/products/lityum-aku-51-2v-300ah-lifepo4-3.webp", "public/images/products/lityum-aku-51-2v-300ah-lifepo4-4.webp", "public/images/products/lityum-aku-51-2v-300ah-lifepo4-5.webp", "public/images/products/lityum-aku-51-2v-300ah-lifepo4-6.webp"]},
  {"id": "x-mexxsun-lityum-aku-12-8v-300ah-lifepo4-3840wh", "cat": "lityum-akuler", "brand": "Mexxun", "name": "Mexxun 300 Ah 12,8V LiFePO4 Lityum Akü (3,84 kWh)", "supplier": "mexxsun", "onRequest": true, "tags": ["300 Ah"], "specs": {}, "img": ["public/images/products/lityum-aku-12-8v-300ah-lifepo4-3840wh-3121.webp", "public/images/products/lityum-aku-12-8v-300ah-lifepo4-3840wh-3121-2.webp", "public/images/products/lityum-aku-12-8v-300ah-lifepo4-3840wh-3121-3.webp", "public/images/products/lityum-aku-12-8v-300ah-lifepo4-3840wh-3121-4.webp", "public/images/products/lityum-aku-12-8v-300ah-lifepo4-3840wh-3121-5.webp"]},
  {"id": "x-jel-aku-12v-100ah-orbus", "cat": "jel-akuler", "brand": "Orbus", "name": "Orbus 100 Ah 12V Jel Akü", "supplier": "mexxsun", "onRequest": true, "tags": ["Jel", "100 Ah"], "specs": {}, "img": ["public/images/products/jel-aku-12v-100ah-orbus.webp"]},
  {"id": "x-jel-aku-12v-150ah-orbus", "cat": "jel-akuler", "brand": "Orbus", "name": "Orbus 150 Ah 12V Jel Akü", "supplier": "mexxsun", "onRequest": true, "tags": ["Jel", "150 Ah"], "specs": {}, "img": ["public/images/products/jel-aku-12v-150ah-orbus.webp"]},
  {"id": "x-jel-aku-12v-200ah-orbus", "cat": "jel-akuler", "brand": "Orbus", "name": "Orbus 200 Ah 12V Jel Akü", "supplier": "mexxsun", "onRequest": true, "tags": ["Jel", "200 Ah"], "specs": {}, "img": ["public/images/products/jel-aku-12v-200ah-orbus.webp"]},
  {"id": "x-solar-surucu-uzaktan-kontrol-cihazi-mx600-serisi", "cat": "solar-ekipmanlar", "brand": "Mexxun", "name": "MX600 Serisi Sürücü Uzaktan Kumanda Cihazı", "supplier": "mexxsun", "onRequest": true, "tags": ["İzleme"], "specs": {}, "img": ["public/images/products/solar-surucu-uzaktan-kontrol-cihazi-mx600-serisi.webp", "public/images/products/solar-surucu-uzaktan-kontrol-cihazi-mx600-serisi-2.webp", "public/images/products/solar-surucu-uzaktan-kontrol-cihazi-mx600-serisi-3.webp", "public/images/products/solar-surucu-uzaktan-kontrol-cihazi-mx600-serisi-4.webp", "public/images/products/solar-surucu-uzaktan-kontrol-cihazi-mx600-serisi-5.webp", "public/images/products/solar-surucu-uzaktan-kontrol-cihazi-mx600-serisi-6.webp"]},
  {"id": "x-175hp-132-kw-solar-pompa-surucusu-trifaze", "cat": "tarimsal-sulama", "brand": "Mexxun", "name": "175 Hp (132 kW) Solar Pompa Sürücüsü Trifaze", "supplier": "mexxsun", "onRequest": true, "tags": ["Sürücü"], "specs": {}, "img": ["public/images/products/175hp-132-kw-solar-pompa-surucusu-trifaze.webp", "public/images/products/175hp-132-kw-solar-pompa-surucusu-trifaze-2.webp", "public/images/products/175hp-132-kw-solar-pompa-surucusu-trifaze-3.webp", "public/images/products/175hp-132-kw-solar-pompa-surucusu-trifaze-4.webp"]},
  {"id": "x-dc-yuzey-pompa-2hp-750w-sfp6-20-750w-72v", "cat": "tarimsal-sulama", "brand": "Mexxun", "name": "DC Yüzey Pompası 2 Hp 750 W 72V (SFP6-20)", "supplier": "mexxsun", "onRequest": true, "tags": ["DC Pompa"], "specs": {}, "img": ["public/images/products/dc-yuzey-pompa-2hp-750w-sfp6-20-750w-72v.webp", "public/images/products/dc-yuzey-pompa-2hp-750w-sfp6-20-750w-72v-2.webp", "public/images/products/dc-yuzey-pompa-2hp-750w-sfp6-20-750w-72v-3.webp", "public/images/products/dc-yuzey-pompa-2hp-750w-sfp6-20-750w-72v-4.webp", "public/images/products/dc-yuzey-pompa-2hp-750w-sfp6-20-750w-72v-5.webp", "public/images/products/dc-yuzey-pompa-2hp-750w-sfp6-20-750w-72v-6.webp"]},
  {"id": "x-dc-yuzey-pompa-1-5hp-1100w-sfp20-17-1100w-96v", "cat": "tarimsal-sulama", "brand": "Mexxun", "name": "DC Yüzey Pompası 1,5 Hp 1100 W 96V (SFP20-17)", "supplier": "mexxsun", "onRequest": true, "tags": ["DC Pompa"], "specs": {}, "img": ["public/images/products/dc-yuzey-pompa-1-5hp-1100w-sfp20-17-1100w-96v.webp", "public/images/products/dc-yuzey-pompa-1-5hp-1100w-sfp20-17-1100w-96v-2.webp", "public/images/products/dc-yuzey-pompa-1-5hp-1100w-sfp20-17-1100w-96v-3.webp", "public/images/products/dc-yuzey-pompa-1-5hp-1100w-sfp20-17-1100w-96v-4.webp", "public/images/products/dc-yuzey-pompa-1-5hp-1100w-sfp20-17-1100w-96v-5.webp", "public/images/products/dc-yuzey-pompa-1-5hp-1100w-sfp20-17-1100w-96v-6.webp"]},
  {"id": "x-dc-pompa-0-4-hp-300w-24v-3rdc3-35-24", "cat": "tarimsal-sulama", "brand": "Mexxun", "name": "DC Dalgıç Pompa 0,4 Hp 300 W 24V (3RDC3-35)", "supplier": "mexxsun", "onRequest": true, "tags": ["DC Pompa"], "specs": {}, "img": ["public/images/products/dc-pompa-0-4-hp-300w-24v-3rdc3-35-24-300.webp", "public/images/products/dc-pompa-0-4-hp-300w-24v-3rdc3-35-24-300-2.webp", "public/images/products/dc-pompa-0-4-hp-300w-24v-3rdc3-35-24-300-3.webp", "public/images/products/dc-pompa-0-4-hp-300w-24v-3rdc3-35-24-300-4.webp", "public/images/products/dc-pompa-0-4-hp-300w-24v-3rdc3-35-24-300-5.webp"]},
  {"id": "x-dc-pompa-0-8hp-600w-4ss600-48n", "cat": "tarimsal-sulama", "brand": "Mexxun", "name": "DC Dalgıç Pompa 0,8 Hp 600 W 48V (4SS600)", "supplier": "mexxsun", "onRequest": true, "tags": ["DC Pompa"], "specs": {}, "img": ["public/images/products/dc-pompa-0-8hp-600w-4ss600-48n.webp", "public/images/products/dc-pompa-0-8hp-600w-4ss600-48n-2.webp", "public/images/products/dc-pompa-0-8hp-600w-4ss600-48n-3.webp"]},
  {"id": "x-dc-pompa-1-hp-750w-72v-4dc6-56-72-750pm", "cat": "tarimsal-sulama", "brand": "Mexxun", "name": "DC Dalgıç Pompa 1 Hp 750 W 72V (4DC6-56)", "supplier": "mexxsun", "onRequest": true, "tags": ["DC Pompa"], "specs": {}, "img": ["public/images/products/dc-pompa-1-hp-750w-72v-4dc6-56-72-750pm.webp", "public/images/products/dc-pompa-1-hp-750w-72v-4dc6-56-72-750pm-2.webp", "public/images/products/dc-pompa-1-hp-750w-72v-4dc6-56-72-750pm-3.webp", "public/images/products/dc-pompa-1-hp-750w-72v-4dc6-56-72-750pm-4.webp", "public/images/products/dc-pompa-1-hp-750w-72v-4dc6-56-72-750pm-5.webp"]},
  {"id": "x-dc-pompa-1-5hp-1100w-72v-4dc6-84-72-1100", "cat": "tarimsal-sulama", "brand": "Mexxun", "name": "DC Dalgıç Pompa 1,5 Hp 1100 W 72V (4DC6-84)", "supplier": "mexxsun", "onRequest": true, "tags": ["DC Pompa"], "specs": {}, "img": ["public/images/products/dc-pompa-1-5hp-1100w-72v-4dc6-84-72-1100-826.webp", "public/images/products/dc-pompa-1-5hp-1100w-72v-4dc6-84-72-1100-826-2.webp", "public/images/products/dc-pompa-1-5hp-1100w-72v-4dc6-84-72-1100-826-3.webp", "public/images/products/dc-pompa-1-5hp-1100w-72v-4dc6-84-72-1100-826-4.webp", "public/images/products/dc-pompa-1-5hp-1100w-72v-4dc6-84-72-1100-826-5.webp"]},
  {"id": "x-dc-pompa-1-6hp-1300w-110v-4dc6-112-110", "cat": "tarimsal-sulama", "brand": "Mexxun", "name": "DC Dalgıç Pompa 1,6 Hp 1300 W 110V (4DC6-112)", "supplier": "mexxsun", "onRequest": true, "tags": ["DC Pompa"], "specs": {}, "img": ["public/images/products/dc-pompa-1-6hp-1300w-110v-4dc6-112-110-1300.webp", "public/images/products/dc-pompa-1-6hp-1300w-110v-4dc6-112-110-1300-2.webp", "public/images/products/dc-pompa-1-6hp-1300w-110v-4dc6-112-110-1300-3.webp", "public/images/products/dc-pompa-1-6hp-1300w-110v-4dc6-112-110-1300-4.webp", "public/images/products/dc-pompa-1-6hp-1300w-110v-4dc6-112-110-1300-5.webp", "public/images/products/dc-pompa-1-6hp-1300w-110v-4dc6-112-110-1300-6.webp"]},
  {"id": "x-dc-pompa-2hp-1500w-110v-3rdc3-8-180-110", "cat": "tarimsal-sulama", "brand": "Mexxun", "name": "DC Dalgıç Pompa 2 Hp 1500 W 110V (3RDC3-8-180)", "supplier": "mexxsun", "onRequest": true, "tags": ["DC Pompa"], "specs": {}, "img": ["public/images/products/dc-pompa-2hp-1500w-110v-3rdc3-8-180-110-1500.webp", "public/images/products/dc-pompa-2hp-1500w-110v-3rdc3-8-180-110-1500-2.webp", "public/images/products/dc-pompa-2hp-1500w-110v-3rdc3-8-180-110-1500-3.webp", "public/images/products/dc-pompa-2hp-1500w-110v-3rdc3-8-180-110-1500-4.webp", "public/images/products/dc-pompa-2hp-1500w-110v-3rdc3-8-180-110-1500-5.webp", "public/images/products/dc-pompa-2hp-1500w-110v-3rdc3-8-180-110-1500-6.webp"]},
  {"id": "x-dc-pompa-2hp-1500w-110v-ss-impeller-4rdss4-8-203-110", "cat": "tarimsal-sulama", "brand": "Mexxun", "name": "DC Dalgıç Pompa 2 Hp 1500 W 110V Paslanmaz Impeller (4RDSS4)", "supplier": "mexxsun", "onRequest": true, "tags": ["DC Pompa"], "specs": {}, "img": ["public/images/products/dc-pompa-2hp-1500w-110v-ss-impeller-4rdss4-8-203-110-1500.webp", "public/images/products/dc-pompa-2hp-1500w-110v-ss-impeller-4rdss4-8-203-110-1500-2.webp", "public/images/products/dc-pompa-2hp-1500w-110v-ss-impeller-4rdss4-8-203-110-1500-3.webp", "public/images/products/dc-pompa-2hp-1500w-110v-ss-impeller-4rdss4-8-203-110-1500-4.webp", "public/images/products/dc-pompa-2hp-1500w-110v-ss-impeller-4rdss4-8-203-110-1500-5.webp", "public/images/products/dc-pompa-2hp-1500w-110v-ss-impeller-4rdss4-8-203-110-1500-6.webp"]},
  {"id": "x-50w-monokristal-gunes-paneli", "cat": "gunes-panelleri", "brand": "Mexxun", "name": "50 W Monokristal Güneş Paneli", "supplier": "mexxsun", "onRequest": true, "tags": ["≤100 W"], "specs": {}, "img": ["public/images/products/50w-monokristal-gunes-paneli.webp", "public/images/products/50w-monokristal-gunes-paneli-2.webp", "public/images/products/50w-monokristal-gunes-paneli-3.webp"]},
  {"id": "x-tsm210-210w-12v-monokristal-solar-panel", "cat": "gunes-panelleri", "brand": "GESM Power", "name": "TSM210 210 W 12V Monokristal Güneş Paneli", "supplier": "mexxsun", "onRequest": true, "tags": ["100–300 W"], "specs": {}, "img": ["public/images/products/tsm210-210w-12v-monokristal-solar-panel.webp"]},
  {"id": "x-205w-monokristal-pantec-panel", "cat": "gunes-panelleri", "brand": "Pantec", "name": "Pantec 205 W Monokristal Güneş Paneli", "supplier": "mexxsun", "onRequest": true, "tags": ["100–300 W"], "specs": {}, "img": ["public/images/products/205w-monokristal-pantec-panel.webp"]},
  {"id": "x-solar-kablo-2-5mm-siyah", "cat": "solar-ekipmanlar", "brand": "Mexxun", "name": "Solar Kablo 2,5 mm² Siyah", "supplier": "mexxsun", "onRequest": true, "tags": ["Kablo"], "specs": {}, "img": ["public/images/products/solar-kablo-2-5mm-siyah.webp"]},
  {"id": "x-solar-kablo-16mm-siyah", "cat": "solar-ekipmanlar", "brand": "Mexxun", "name": "Solar Kablo 16 mm² Siyah", "supplier": "mexxsun", "onRequest": true, "tags": ["Kablo"], "specs": {}, "img": ["public/images/products/solar-kablo-16mm-siyah.webp", "public/images/products/solar-kablo-16mm-siyah-2.webp", "public/images/products/solar-kablo-16mm-siyah-3.webp"]},
  {"id": "x-solar-kablo-16mm-kirmizi", "cat": "solar-ekipmanlar", "brand": "Mexxun", "name": "Solar Kablo 16 mm² Kırmızı", "supplier": "mexxsun", "onRequest": true, "tags": ["Kablo"], "specs": {}, "img": ["public/images/products/solar-kablo-16mm-kirmizi.webp", "public/images/products/solar-kablo-16mm-kirmizi-2.webp", "public/images/products/solar-kablo-16mm-kirmizi-3.webp"]},
  {"id": "x-solar-twin-kablo-2-5mm", "cat": "solar-ekipmanlar", "brand": "Mexxun", "name": "Solar Twin Kablo 2,5 mm²", "supplier": "mexxsun", "onRequest": true, "tags": ["Kablo"], "specs": {}, "img": ["public/images/products/solar-twin-kablo-2-5mm.webp"]},
  {"id": "x-dc-sigorta-sigorta-yuvasi-16a-1000v-12-adet", "cat": "solar-ekipmanlar", "brand": "Mexxun", "name": "DC Sigorta + Yuva Seti 16A/1000V (12'li)", "supplier": "mexxsun", "onRequest": true, "tags": ["Sigorta"], "specs": {}, "img": ["public/images/products/dc-sigorta-sigorta-yuvasi-16a-1000v-12-adet.webp", "public/images/products/dc-sigorta-sigorta-yuvasi-16a-1000v-12-adet-2.webp", "public/images/products/dc-sigorta-sigorta-yuvasi-16a-1000v-12-adet-3.webp", "public/images/products/dc-sigorta-sigorta-yuvasi-16a-1000v-12-adet-4.webp", "public/images/products/dc-sigorta-sigorta-yuvasi-16a-1000v-12-adet-5.webp", "public/images/products/dc-sigorta-sigorta-yuvasi-16a-1000v-12-adet-6.webp"]},
  {"id": "x-dc-sigorta-sigorta-yuvasi-20a-1000v-12-adet", "cat": "solar-ekipmanlar", "brand": "Mexxun", "name": "DC Sigorta + Yuva Seti 20A/1000V (12'li)", "supplier": "mexxsun", "onRequest": true, "tags": ["Sigorta"], "specs": {}, "img": ["public/images/products/dc-sigorta-sigorta-yuvasi-20a-1000v-12-adet.webp", "public/images/products/dc-sigorta-sigorta-yuvasi-20a-1000v-12-adet-2.webp", "public/images/products/dc-sigorta-sigorta-yuvasi-20a-1000v-12-adet-3.webp", "public/images/products/dc-sigorta-sigorta-yuvasi-20a-1000v-12-adet-4.webp", "public/images/products/dc-sigorta-sigorta-yuvasi-20a-1000v-12-adet-5.webp", "public/images/products/dc-sigorta-sigorta-yuvasi-20a-1000v-12-adet-6.webp"]},
  {"id": "x-dc-sigorta-sigorta-yuvasi-32-1000v-12-adet", "cat": "solar-ekipmanlar", "brand": "Mexxun", "name": "DC Sigorta + Yuva Seti 32A/1000V (12'li)", "supplier": "mexxsun", "onRequest": true, "tags": ["Sigorta"], "specs": {}, "img": ["public/images/products/dc-sigorta-sigorta-yuvasi-32-1000v-12-adet.webp", "public/images/products/dc-sigorta-sigorta-yuvasi-32-1000v-12-adet-2.webp", "public/images/products/dc-sigorta-sigorta-yuvasi-32-1000v-12-adet-3.webp", "public/images/products/dc-sigorta-sigorta-yuvasi-32-1000v-12-adet-4.webp", "public/images/products/dc-sigorta-sigorta-yuvasi-32-1000v-12-adet-5.webp", "public/images/products/dc-sigorta-sigorta-yuvasi-32-1000v-12-adet-6.webp"]},
  {"id": "x-solar-konnektor-set-30a-1000v-50-adet", "cat": "solar-ekipmanlar", "brand": "Mexxun", "name": "MC4 Konnektör Seti 30A/1000V (50'li Paket)", "supplier": "mexxsun", "onRequest": true, "tags": ["Konnektör"], "specs": {}, "img": ["public/images/products/solar-konnektor-set-30a-1000v-50-adet.webp"]},
  {"id": "x-panel-sonlandirici-35mm-50-ad", "cat": "solar-ekipmanlar", "brand": "Mexxun", "name": "Panel Sonlandırıcı 35 mm (50'li Paket)", "supplier": "mexxsun", "onRequest": true, "tags": ["Montaj"], "specs": {}, "img": ["public/images/products/panel-sonlandirici-35mm-50-ad.webp", "public/images/products/panel-sonlandirici-35mm-50-ad-2.webp", "public/images/products/panel-sonlandirici-35mm-50-ad-3.webp"]},
  {"id": "x-panel-sonlandirici-50-ad", "cat": "solar-ekipmanlar", "brand": "Mexxun", "name": "Panel Sonlandırıcı (50'li Paket)", "supplier": "mexxsun", "onRequest": true, "tags": ["Montaj"], "specs": {}, "img": ["public/images/products/panel-sonlandirici-50-ad.webp", "public/images/products/panel-sonlandirici-50-ad-2.webp", "public/images/products/panel-sonlandirici-50-ad-3.webp", "public/images/products/panel-sonlandirici-50-ad-4.webp"]},
  {"id": "x-hareketli-kiremit-kancasi-20-ad", "cat": "solar-ekipmanlar", "brand": "Mexxun", "name": "Hareketli Kiremit Kancası (20'li Paket)", "supplier": "mexxsun", "onRequest": true, "tags": ["Montaj"], "specs": {}, "img": ["public/images/products/hareketli-kiremit-kancasi-20-ad.webp", "public/images/products/hareketli-kiremit-kancasi-20-ad-2.webp", "public/images/products/hareketli-kiremit-kancasi-20-ad-3.webp"]},
  {"id": "x-40x40-sigma-profil", "cat": "solar-ekipmanlar", "brand": "Mexxun", "name": "40×40 Sigma Montaj Profili", "supplier": "mexxsun", "onRequest": true, "tags": ["Montaj"], "specs": {}, "img": ["public/images/products/40x40-sigma-profil.webp"]},
  {"id": "x-karavan-montaj-takimi-4-kose-2-orta-buat", "cat": "solar-ekipmanlar", "brand": "Mexxun", "name": "Karavan Montaj Takımı (4 Köşe + 2 Orta + Buat)", "supplier": "mexxsun", "onRequest": true, "tags": ["Montaj"], "specs": {}, "img": ["public/images/products/karavan-montaj-takimi-4-kose-2-orta-buat.webp"]},
  {"id": "x-sivri-uclu-cati-vidasi-m5-5x27", "cat": "solar-ekipmanlar", "brand": "Mexxun", "name": "Sivri Uçlu Çatı Vidası M5,5×27", "supplier": "mexxsun", "onRequest": true, "tags": ["Montaj"], "specs": {}, "img": ["public/images/products/sivri-uclu-cati-vidasi-m5-5x27.webp", "public/images/products/sivri-uclu-cati-vidasi-m5-5x27-2.webp", "public/images/products/sivri-uclu-cati-vidasi-m5-5x27-3.webp", "public/images/products/sivri-uclu-cati-vidasi-m5-5x27-4.webp"]},
  {"id": "x-a-tipi-h55-asik-profil-55cm", "cat": "solar-ekipmanlar", "brand": "Mexxun", "name": "A Tipi H55 Aşık Profil (55 cm)", "supplier": "mexxsun", "onRequest": true, "tags": ["Montaj"], "specs": {}, "img": ["public/images/products/a-tipi-h55-asik-profil-55cm.webp", "public/images/products/a-tipi-h55-asik-profil-55cm-2.webp"]},
  {"id": "x-trapez-profil-3-5m", "cat": "solar-ekipmanlar", "brand": "Mexxun", "name": "Trapez Montaj Profili (3,5 m)", "supplier": "mexxsun", "onRequest": true, "tags": ["Montaj"], "specs": {}, "img": ["public/images/products/trapez-profil-3-5m.webp", "public/images/products/trapez-profil-3-5m-2.webp", "public/images/products/trapez-profil-3-5m-3.webp", "public/images/products/trapez-profil-3-5m-4.webp"]}
  ];
  EXTRA.forEach(function (o) { add(o); });

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

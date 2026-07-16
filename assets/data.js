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

  /* ---------- 1) Güneş Panelleri ---------- */
  add({ id: "pnl-245", cat: "gunes-panelleri", brand: "GESM Power", price: 2980,
    name: "245 W A+ Half-Cut Monokristal Perc Güneş Paneli", supplier: "mexxsun",
    tags: ["100–300 W"], specs: { "Güç": "245 Wp", "Hücre": "Half-Cut Monokristal Perc", "Sınıf": "A+", "Üretim": "Yerli" } });
  add({ id: "pnl-275", cat: "gunes-panelleri", brand: "GESM Power", price: 3100,
    name: "275 W A+ Half-Cut Monokristal Perc Güneş Paneli (72 Hücre)", supplier: "mexxsun",
    tags: ["100–300 W"], specs: { "Güç": "275 Wp", "Hücre": "72 hücre Half-Cut Mono Perc", "Sınıf": "A+", "Üretim": "Yerli" } });
  add({ id: "pnl-280-gaz", cat: "gunes-panelleri", brand: "Gazioğlu", price: 3290,
    name: "Gazioğlu 280 W A+ Half-Cut TopCon Güneş Paneli", supplier: "enerjipazari",
    tags: ["100–300 W"], specs: { "Güç": "280 Wp", "Teknoloji": "TopCon Half-Cut", "Sınıf": "A+" } });
  add({ id: "pnl-450-gaz", cat: "gunes-panelleri", brand: "Gazioğlu", onRequest: true,
    name: "Gazioğlu 450 W A+ Half-Cut Monokristal Perc Güneş Paneli", supplier: "enerjipazari",
    tags: ["450–600 W"], specs: { "Güç": "450 Wp", "Hücre": "Half-Cut Mono Perc", "Sınıf": "A+" } });
  add({ id: "pnl-550-gaz", cat: "gunes-panelleri", brand: "Gazioğlu", price: 5290, bestseller: true,
    name: "Gazioğlu 550 W A+ Half-Cut Monokristal Perc Güneş Paneli", supplier: "enerjipazari",
    tags: ["450–600 W"], specs: { "Güç": "550 Wp", "Hücre": "144 hücre Half-Cut Mono Perc", "Sınıf": "A+" } });
  add({ id: "pnl-600-gaz-eko", cat: "gunes-panelleri", brand: "Gazioğlu", price: 5150,
    name: "Gazioğlu 600 W A- Half-Cut TopCon Güneş Paneli (Ekonomik)", supplier: "enerjipazari",
    tags: ["450–600 W"], specs: { "Güç": "600 Wp", "Teknoloji": "TopCon Half-Cut", "Sınıf": "A-" } });
  add({ id: "pnl-600-gaz", cat: "gunes-panelleri", brand: "Gazioğlu", price: 5980,
    name: "Gazioğlu 600 W A+ Half-Cut TopCon Güneş Paneli", supplier: "enerjipazari",
    tags: ["450–600 W"], specs: { "Güç": "600 Wp", "Teknoloji": "TopCon Half-Cut", "Sınıf": "A+" } });
  add({ id: "pnl-600-cw", cat: "gunes-panelleri", brand: "CW Enerji", price: 6580,
    name: "CW Enerji 600 Wp 120PM M12 HC-MB Güneş Paneli", supplier: "enerjipazari",
    tags: ["450–600 W"], specs: { "Güç": "600 Wp", "Hücre": "120 Half-Cut M12", "Tip": "Multi Busbar" } });
  add({ id: "pnl-585-tt", cat: "gunes-panelleri", brand: "TommaTech", price: 6590,
    name: "TommaTech 585 Wp 156PM M10 HC-MB Güneş Paneli", supplier: "enerjipazari",
    tags: ["450–600 W"], specs: { "Güç": "585 Wp", "Hücre": "156 Half-Cut M10", "Tip": "Multi Busbar" } });
  add({ id: "pnl-600-cw-tnb", cat: "gunes-panelleri", brand: "CW Enerji", price: 6690, isNew: true,
    name: "CW Enerji 600 Wp 144TNB M10 G2G TopCon Güneş Paneli", supplier: "enerjipazari",
    tags: ["450–600 W"], specs: { "Güç": "600 Wp", "Teknoloji": "TopCon G2G (çift cam)", "Hücre": "144 TNB M10" } });

  /* ---------- 2) Lityum Aküler ---------- */
  add({ id: "aku-100-12", cat: "lityum-akuler", brand: "GESM Power", price: 14900, bestseller: true,
    name: "100 Ah 12V LiFePO4 Lityum Akü — Bluetooth/WiFi", supplier: "mexxsun",
    tags: ["12V", "100 Ah", "Bluetooth"], specs: { "Kapasite": "100 Ah / 1,28 kWh", "Voltaj": "12,8 V", "Kimya": "LiFePO4", "İzleme": "Bluetooth + WiFi", "Çevrim": "≥4000" } });
  add({ id: "aku-mc-100", cat: "lityum-akuler", brand: "Megacell", price: 16900,
    name: "Megacell 12,8V 100 Ah LiFePO4 Akü — ABS Standart", supplier: "enerjipazari",
    tags: ["12V", "100 Ah"], specs: { "Kapasite": "100 Ah / 1,28 kWh", "Voltaj": "12,8 V", "Kasa": "ABS", "Kimya": "LiFePO4" } });
  add({ id: "aku-mc-120", cat: "lityum-akuler", brand: "Megacell", price: 20100,
    name: "Megacell 12,8V 120 Ah LiFePO4 Akü — ABS Standart", supplier: "enerjipazari",
    tags: ["12V", "120 Ah"], specs: { "Kapasite": "120 Ah / 1,54 kWh", "Voltaj": "12,8 V", "Kasa": "ABS", "Kimya": "LiFePO4" } });
  add({ id: "aku-100-24", cat: "lityum-akuler", brand: "GESM Power", price: 23450, listPrice: 26800,
    name: "100 Ah 24V LiFePO4 Lityum Akü — Bluetooth/WiFi", supplier: "mexxsun",
    tags: ["24V", "100 Ah", "Bluetooth"], specs: { "Kapasite": "100 Ah / 2,56 kWh", "Voltaj": "25,6 V", "Kimya": "LiFePO4", "İzleme": "Bluetooth + WiFi" } });
  add({ id: "aku-mc-150s", cat: "lityum-akuler", brand: "Megacell", price: 24400,
    name: "Megacell 12,8V 150 Ah LiFePO4 Akü — ABS Standart", supplier: "enerjipazari",
    tags: ["12V", "150 Ah"], specs: { "Kapasite": "150 Ah / 1,92 kWh", "Voltaj": "12,8 V", "Kasa": "ABS", "Kimya": "LiFePO4" } });
  add({ id: "aku-mc-150b", cat: "lityum-akuler", brand: "Megacell", price: 24500,
    name: "Megacell 12,8V 150 Ah LiFePO4 Akü — ABS Bluetooth", supplier: "enerjipazari",
    tags: ["12V", "150 Ah", "Bluetooth"], specs: { "Kapasite": "150 Ah / 1,92 kWh", "Voltaj": "12,8 V", "İzleme": "Bluetooth", "Kimya": "LiFePO4" } });
  add({ id: "aku-mc-200b", cat: "lityum-akuler", brand: "Megacell", price: 31800,
    name: "Megacell 12,8V 200 Ah LiFePO4 Akü — ABS Bluetooth", supplier: "enerjipazari",
    tags: ["12V", "200 Ah", "Bluetooth"], specs: { "Kapasite": "200 Ah / 2,56 kWh", "Voltaj": "12,8 V", "İzleme": "Bluetooth", "Kimya": "LiFePO4" } });
  add({ id: "aku-100-36", cat: "lityum-akuler", brand: "GESM Power", price: 36900,
    name: "100 Ah 36V LiFePO4 Lityum Akü — Bluetooth/WiFi", supplier: "mexxsun",
    tags: ["36V", "100 Ah", "Bluetooth"], specs: { "Kapasite": "100 Ah / 3,84 kWh", "Voltaj": "38,4 V", "Kimya": "LiFePO4", "İzleme": "Bluetooth + WiFi" } });
  add({ id: "aku-51-wpu", cat: "lityum-akuler", brand: "GESM Power", price: 44200, isNew: true,
    name: "100 Ah 51,2V (5,4 kWh) LiFePO4 WPU Akü — Bluetooth", supplier: "mexxsun",
    tags: ["48V", "100 Ah", "Bluetooth"], specs: { "Kapasite": "100 Ah / 5,4 kWh", "Voltaj": "51,2 V", "Tip": "Duvar tipi (WPU)", "İzleme": "Bluetooth", "Kimya": "LiFePO4" } });

  /* ---------- 3) Jel Aküler ---------- */
  add({ id: "jel-100", cat: "jel-akuler", brand: "GESM Power", price: 4450,
    name: "12V 100 Ah Derin Döngü Jel Akü", supplier: "enerjipazari",
    tags: ["100 Ah"], specs: { "Kapasite": "100 Ah", "Voltaj": "12 V", "Tip": "Derin döngü jel", "Bakım": "Bakımsız" } });
  add({ id: "jel-150", cat: "jel-akuler", brand: "GESM Power", price: 6350,
    name: "12V 150 Ah Derin Döngü Jel Akü", supplier: "enerjipazari",
    tags: ["150 Ah"], specs: { "Kapasite": "150 Ah", "Voltaj": "12 V", "Tip": "Derin döngü jel", "Bakım": "Bakımsız" } });
  add({ id: "jel-200", cat: "jel-akuler", brand: "GESM Power", price: 8200,
    name: "12V 200 Ah Derin Döngü Jel Akü", supplier: "enerjipazari",
    tags: ["200 Ah"], specs: { "Kapasite": "200 Ah", "Voltaj": "12 V", "Tip": "Derin döngü jel", "Bakım": "Bakımsız" } });

  /* ---------- 4) Akıllı İnverterler (Off-Grid) ---------- */
  add({ id: "inv-1kw", cat: "akilli-inverterler", brand: "GESM Power", price: 7810,
    name: "1 kW MPPT 12V Akıllı İnverter", supplier: "mexxsun",
    tags: ["1–3 kW", "12V"], specs: { "Güç": "1 kW", "Akü Voltajı": "12 V", "Şarj": "Dahili MPPT", "Dalga": "Tam sinüs" } });
  add({ id: "inv-1-6kw", cat: "akilli-inverterler", brand: "GESM Power", price: 8380,
    name: "1,6 kW HV MPPT Akıllı İnverter 12V", supplier: "mexxsun",
    tags: ["1–3 kW", "12V"], specs: { "Güç": "1,6 kW", "Akü Voltajı": "12 V", "Şarj": "HV MPPT (yüksek PV girişi)", "Dalga": "Tam sinüs" } });
  add({ id: "inv-3kw", cat: "akilli-inverterler", brand: "GESM Power", price: 9265, listPrice: 10500, bestseller: true,
    name: "3 kW HV MPPT Akıllı İnverter 24V", supplier: "mexxsun",
    tags: ["1–3 kW", "24V"], specs: { "Güç": "3 kW", "Akü Voltajı": "24 V", "Şarj": "HV MPPT", "Dalga": "Tam sinüs" } });
  add({ id: "inv-4-2kw", cat: "akilli-inverterler", brand: "GESM Power", price: 13800,
    name: "4,2 kW HV MPPT Akıllı İnverter 24V", supplier: "mexxsun",
    tags: ["4–8 kW", "24V"], specs: { "Güç": "4,2 kW", "Akü Voltajı": "24 V", "Şarj": "HV MPPT", "Dalga": "Tam sinüs" } });
  add({ id: "inv-6-2kw", cat: "akilli-inverterler", brand: "GESM Power", price: 18300, bestseller: true,
    name: "6,2 kW HV MPPT Akıllı İnverter 48V", supplier: "mexxsun",
    tags: ["4–8 kW", "48V"], specs: { "Güç": "6,2 kW", "Akü Voltajı": "48 V", "Şarj": "HV MPPT", "Dalga": "Tam sinüs" } });
  add({ id: "inv-max8", cat: "akilli-inverterler", brand: "GESM Power", price: 29985, listPrice: 48750,
    name: "Tam Sinüs Akıllı İnverter 48V 8000W Twin (MAX 8000)", supplier: "mexxsun",
    tags: ["4–8 kW", "48V"], specs: { "Güç": "8 kW (2×4 kW twin)", "Akü Voltajı": "48 V", "Şarj": "Çift MPPT", "Dalga": "Tam sinüs" } });
  add({ id: "inv-11kw", cat: "akilli-inverterler", brand: "GESM Power", onRequest: true,
    name: "11 kW HV 2×MPPT Akıllı İnverter 48V", supplier: "mexxsun",
    tags: ["8+ kW", "48V"], specs: { "Güç": "11 kW", "Akü Voltajı": "48 V", "Şarj": "2× HV MPPT", "Dalga": "Tam sinüs" } });

  /* ---------- 5) Hibrit İnverterler ---------- */
  add({ id: "inv-deye-10m", cat: "hibrit-inverterler", brand: "Deye", price: 34500,
    name: "Deye 10 kW Hibrit İnverter — Monofaze", supplier: "enerjipazari",
    tags: ["8+ kW", "Monofaze"], specs: { "Güç": "10 kW", "Faz": "Monofaze", "Tip": "Hibrit (şebeke+akü+PV)", "Akü": "48 V LV" } });
  add({ id: "inv-deye-10t", cat: "hibrit-inverterler", brand: "Deye", price: 34900,
    name: "Deye 10 kW Hibrit İnverter — Trifaze", supplier: "enerjipazari",
    tags: ["8+ kW", "Trifaze"], specs: { "Güç": "10 kW", "Faz": "Trifaze", "Tip": "Hibrit (şebeke+akü+PV)", "Akü": "48 V LV" } });
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
  add({ id: "reg-pwm10", cat: "sarj-regulatorleri", brand: "GESM Power", price: 380,
    name: "10A PWM Şarj Kontrol Cihazı (12/24V)", supplier: "mexxsun",
    tags: ["PWM", "10–30 A"], specs: { "Teknoloji": "PWM", "Akım": "10 A", "Voltaj": "12/24 V otomatik" } });
  add({ id: "reg-pwm20", cat: "sarj-regulatorleri", brand: "GESM Power", price: 470,
    name: "20A PWM Şarj Kontrol Cihazı (12/24V)", supplier: "mexxsun",
    tags: ["PWM", "10–30 A"], specs: { "Teknoloji": "PWM", "Akım": "20 A", "Voltaj": "12/24 V otomatik" } });
  add({ id: "reg-pwm30", cat: "sarj-regulatorleri", brand: "GESM Power", price: 695,
    name: "30A PWM Şarj Kontrol Cihazı (12/24V)", supplier: "mexxsun",
    tags: ["PWM", "10–30 A"], specs: { "Teknoloji": "PWM", "Akım": "30 A", "Voltaj": "12/24 V otomatik" } });
  add({ id: "reg-mppt20", cat: "sarj-regulatorleri", brand: "GESM Power", price: 2180,
    name: "20A MPPT Şarj Kontrol Cihazı (12/24V, 60V panel girişi)", supplier: "mexxsun",
    tags: ["MPPT", "10–30 A"], specs: { "Teknoloji": "MPPT", "Akım": "20 A", "Maks. PV Girişi": "60 V", "Voltaj": "12/24 V" } });
  add({ id: "reg-mppt30", cat: "sarj-regulatorleri", brand: "GESM Power", price: 2720, bestseller: true,
    name: "30A MPPT Şarj Kontrol Cihazı (12/24V, 100V panel girişi)", supplier: "mexxsun",
    tags: ["MPPT", "10–30 A"], specs: { "Teknoloji": "MPPT", "Akım": "30 A", "Maks. PV Girişi": "100 V", "Voltaj": "12/24 V" } });
  add({ id: "reg-pc18f-60", cat: "sarj-regulatorleri", brand: "GESM Power", price: 6030,
    name: "PC18F 60A MPPT Şarj Kontrol Cihazı (12/24/48V)", supplier: "mexxsun",
    tags: ["MPPT", "60–100 A"], specs: { "Teknoloji": "MPPT", "Akım": "60 A", "Voltaj": "12/24/48 V", "Seri": "PC18F" } });
  add({ id: "reg-mpk8-60", cat: "sarj-regulatorleri", brand: "GESM Power", price: 7182,
    name: "MPK8 60A MPPT Şarj Kontrol Cihazı (12/24/48V)", supplier: "mexxsun",
    tags: ["MPPT", "60–100 A"], specs: { "Teknoloji": "MPPT", "Akım": "60 A", "Voltaj": "12/24/48 V", "Seri": "MPK8" } });
  add({ id: "reg-pc18f-80", cat: "sarj-regulatorleri", brand: "GESM Power", price: 7540,
    name: "PC18F 80A MPPT Şarj Kontrol Cihazı (12/24/48V)", supplier: "mexxsun",
    tags: ["MPPT", "60–100 A"], specs: { "Teknoloji": "MPPT", "Akım": "80 A", "Voltaj": "12/24/48 V", "Seri": "PC18F" } });
  add({ id: "reg-pc18f-100", cat: "sarj-regulatorleri", brand: "GESM Power", price: 8040,
    name: "PC18F 100A MPPT Şarj Kontrol Cihazı (12/24/48V)", supplier: "mexxsun",
    tags: ["MPPT", "60–100 A"], specs: { "Teknoloji": "MPPT", "Akım": "100 A", "Voltaj": "12/24/48 V", "Seri": "PC18F" } });
  add({ id: "reg-mpk8-100", cat: "sarj-regulatorleri", brand: "GESM Power", price: 9250,
    name: "MPK8 100A MPPT Şarj Kontrol Cihazı (12/24/48V)", supplier: "mexxsun",
    tags: ["MPPT", "60–100 A"], specs: { "Teknoloji": "MPPT", "Akım": "100 A", "Voltaj": "12/24/48 V", "Seri": "MPK8" } });

  /* ---------- 8) Tarımsal Sulama — Pompa Sürücüleri ---------- */
  function pump(id, hp, kw, price, extra) {
    add(Object.assign({ id: id, cat: "tarimsal-sulama", brand: "Agromot", price: price, supplier: "enerjipazari",
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
    tags: ["Sigorta"], specs: { "Akım": "15 A", "Gerilim": "1000 V DC", "İçerik": "Sigorta + ray tipi tutucu" } });
  add({ id: "eq-montaj", cat: "solar-ekipmanlar", brand: "GESM Power", price: 3450,
    name: "4 Panel Alüminyum Montaj Seti (Kiremit/Trapez)", supplier: "enerjipazari",
    tags: ["Montaj"], specs: { "Kapasite": "4 panel", "Malzeme": "Eloksallı alüminyum", "Çatı": "Kiremit ve trapez uyumlu" } });

  /* ---------- 10) Aksesuar & Diğer ---------- */
  add({ id: "aks-saksi", cat: "aksesuar", brand: "GESM Power", price: 950,
    name: "Güneş Enerjili Otomatik Saksı Sulama Cihazı", supplier: "enerjipazari",
    tags: ["Sulama"], specs: { "Güç": "Dahili solar panel", "Kapasite": "10 saksıya kadar", "Mod": "Zamanlayıcı + nem sensörü" } });
  add({ id: "aks-jenerator", cat: "aksesuar", brand: "GESM Power", onRequest: true,
    name: "11 kW Sessiz Jeneratör — Tek Faz", supplier: "enerjipazari",
    tags: ["Jeneratör"], specs: { "Güç": "11 kW", "Faz": "Monofaze", "Tip": "Sessiz kabinli", "Kullanım": "Yedek güç" } });

  /* ---------- 11) Solar Paketler (14 adet) ---------- */
  function pkt(id, name, price, scenario, tier, kw, comps, desc, extra) {
    add(Object.assign({ id: id, cat: "solar-paketler", brand: "GESM Power", price: price, supplier: "mexxsun",
      name: name, scenario: scenario, tier: tier || null,
      tags: [scenario].concat(tier ? [tier] : []),
      specs: Object.assign({ "Sistem Gücü": kw, "Kullanım": scenario, "Kurulum": "Tak-çalıştır set (montaj opsiyonel)" }, tier ? { "Seviye": tier } : {}),
      components: comps, desc: desc }, extra || {}));
  }
  pkt("pkt1", "Mini Solar Paket (PKT1)", 13690, "Karavan", null, "~250 W",
    [{ q: 1, name: "245 W Half-Cut Mono Perc panel", ref: "pnl-245" },
     { q: 1, name: "12V 100 Ah jel akü", ref: "jel-100" },
     { q: 1, name: "1000 W tam sinüs inverter" },
     { q: 1, name: "30A PWM şarj regülatörü", ref: "reg-pwm30" },
     { q: 1, name: "Kablo + sigorta + bağlantı seti" }],
    "Aydınlatma, telefon/laptop şarjı ve küçük TV için giriş seviyesi hazır sistem. Karavan, tekne ve kamelya kullanımına uygundur; kurulumu bir saat sürmez.");
  pkt("pkt2", "Karavan / Konteyner Solar Paket (PKT2)", 24650, "Karavan", null, "~550 W",
    [{ q: 1, name: "550 W Half-Cut panel", ref: "pnl-550-gaz" },
     { q: 1, name: "100 Ah 12V LiFePO4 lityum akü (Bluetooth)", ref: "aku-100-12" },
     { q: 1, name: "1,6 kW HV MPPT akıllı inverter", ref: "inv-1-6kw" },
     { q: 1, name: "Kablo + sigorta + montaj seti" }],
    "Karavan ve konteyner yaşamının standardı: buzdolabı, aydınlatma, TV ve şarj ihtiyaçlarını lityum akü konforuyla karşılar. Bluetooth ile şarj durumu telefondan izlenir.");
  pkt("pkt3", "Yayla / Bağ Evi Solar Paket (PKT3)", 34875, "Bağ Evi", null, "~1,1 kW",
    [{ q: 2, name: "550 W Half-Cut panel", ref: "pnl-550-gaz" },
     { q: 2, name: "12V 150 Ah jel akü", ref: "jel-150" },
     { q: 1, name: "3 kW HV MPPT akıllı inverter", ref: "inv-3kw" },
     { q: 1, name: "Kablo + sigorta + montaj seti", ref: "eq-montaj" }],
    "Hafta sonu kullanılan yayla ve bağ evleri için dengeli sistem: buzdolabı, aydınlatma, TV ve küçük ev aletlerini rahatça çalıştırır.");
  pkt("pkt4", "3 kW Solar Paket (PKT4)", 39900, "Bağ Evi", null, "~2,2 kW",
    [{ q: 4, name: "550 W Half-Cut panel", ref: "pnl-550-gaz" },
     { q: 2, name: "12V 200 Ah jel akü", ref: "jel-200" },
     { q: 1, name: "3 kW HV MPPT akıllı inverter", ref: "inv-3kw" },
     { q: 1, name: "4 panel montaj seti", ref: "eq-montaj" },
     { q: 1, name: "Kablo + sigorta seti" }],
    "Sürekli yaşanan bağ evleri için 3 kW sistem: çamaşır makinesi dahil temel ev yükünü taşır. Jel akü grubuyla ekonomik, dilerseniz lityuma yükseltilebilir.");
  pkt("pkt5", "4 kW Solar Paket (PKT5)", 56800, "Ev", null, "~3,3 kW",
    [{ q: 6, name: "550 W Half-Cut panel", ref: "pnl-550-gaz" },
     { q: 4, name: "12V 200 Ah jel akü", ref: "jel-200" },
     { q: 1, name: "4,2 kW HV MPPT akıllı inverter", ref: "inv-4-2kw" },
     { q: 2, name: "4 panel montaj seti", ref: "eq-montaj" },
     { q: 1, name: "Kablo + sigorta seti" }],
    "Şebekenin olmadığı müstakil evler için 4 kW jel akülü sistem: buzdolabı, çamaşır makinesi, TV, aydınlatma ve pompa gibi yükleri birlikte yönetir.");
  pkt("pkt6", "4 kW Lityum Solar Paket (PKT6)", 61750, "Ev", null, "~3,3 kW",
    [{ q: 6, name: "550 W Half-Cut panel", ref: "pnl-550-gaz" },
     { q: 1, name: "100 Ah 24V LiFePO4 lityum akü", ref: "aku-100-24" },
     { q: 1, name: "4,2 kW HV MPPT akıllı inverter", ref: "inv-4-2kw" },
     { q: 2, name: "4 panel montaj seti", ref: "eq-montaj" },
     { q: 1, name: "Kablo + sigorta seti" }],
    "PKT5'in lityum sürümü: daha uzun ömür, daha hızlı şarj, telefondan izleme. Günlük derin kullanımda toplam maliyeti jelden daha düşüktür.");
  pkt("pkt7", "6 kW Lityum Solar Paket (PKT7)", 92750, "Ev", null, "~5,5 kW",
    [{ q: 10, name: "550 W Half-Cut panel", ref: "pnl-550-gaz" },
     { q: 1, name: "5,4 kWh 51,2V LiFePO4 WPU akü", ref: "aku-51-wpu" },
     { q: 1, name: "6,2 kW HV MPPT akıllı inverter", ref: "inv-6-2kw" },
     { q: 3, name: "4 panel montaj seti", ref: "eq-montaj" },
     { q: 1, name: "Kablo + sigorta seti" }],
    "En çok tercih edilen ev paketi: klima ve elektrikli süpürge dahil modern ev yükünü 5,4 kWh lityum depolamayla gün boyu taşır.", { bestseller: true });
  pkt("pkt8", "8 kW Lityum Solar Paket (PKT8) — Ekonomik", 128500, "Ev", "Ekonomik", "~7,2 kW",
    [{ q: 13, name: "550 W Half-Cut panel", ref: "pnl-550-gaz" },
     { q: 1, name: "5,4 kWh 51,2V LiFePO4 WPU akü", ref: "aku-51-wpu" },
     { q: 1, name: "8 kW Twin akıllı inverter (MAX 8000)", ref: "inv-max8" },
     { q: 4, name: "4 panel montaj seti", ref: "eq-montaj" },
     { q: 1, name: "Kablo + sigorta seti" }],
    "Geniş evler için 8 kW gücün ekonomik konfigürasyonu: tek lityum modül ve twin inverter ile bütçe dostu başlangıç; akü kapasitesi sonradan artırılabilir.");
  pkt("pkt9", "8 kW Lityum Solar Paket (PKT9) — Pro", 179800, "Ev", "Pro", "~7,2 kW",
    [{ q: 13, name: "600 W TopCon panel", ref: "pnl-600-gaz" },
     { q: 2, name: "5,4 kWh 51,2V LiFePO4 WPU akü", ref: "aku-51-wpu" },
     { q: 1, name: "8 kW Twin akıllı inverter (MAX 8000)", ref: "inv-max8" },
     { q: 4, name: "4 panel montaj seti", ref: "eq-montaj" },
     { q: 1, name: "Kablo + sigorta seti" }],
    "8 kW'ın üst konfigürasyonu: TopCon paneller ve 10,8 kWh çift lityum depolama ile bulutlu günlerde bile kesintisiz konfor.");
  pkt("pkt10", "10,2 kW Lityum Solar Paket (PKT10)", 176000, "Ev", null, "~10 kW",
    [{ q: 17, name: "600 W TopCon panel", ref: "pnl-600-gaz" },
     { q: 2, name: "5,4 kWh 51,2V LiFePO4 WPU akü", ref: "aku-51-wpu" },
     { q: 1, name: "Deye 10 kW hibrit inverter (monofaze)", ref: "inv-deye-10m" },
     { q: 5, name: "4 panel montaj seti", ref: "eq-montaj" },
     { q: 1, name: "Kablo + sigorta seti" }],
    "Hibrit inverterli 10 kW sistem: şebekeyle mahsuplaşır, kesintide aküden besler. Yüksek tüketimli evler ve küçük işletmeler için ideal.");
  pkt("pkt11", "11 kW Lityum Solar Paket (PKT11) — Ekonomik", 193700, "Ev", "Ekonomik", "~11 kW",
    [{ q: 18, name: "600 W TopCon panel", ref: "pnl-600-gaz" },
     { q: 2, name: "5,4 kWh 51,2V LiFePO4 WPU akü", ref: "aku-51-wpu" },
     { q: 1, name: "Deye 10 kW hibrit inverter (trifaze)", ref: "inv-deye-10t" },
     { q: 5, name: "4 panel montaj seti", ref: "eq-montaj" },
     { q: 1, name: "Kablo + sigorta seti" }],
    "11 kW sınıfının giriş konfigürasyonu: trifaze hibrit inverter ve 10,8 kWh depolama ile ekonomik güç.");
  pkt("pkt12", "11 kW Lityum Solar Paket (PKT12) — Standart", 228000, "Ev", "Standart", "~11 kW",
    [{ q: 18, name: "600 W TopCon panel", ref: "pnl-600-gaz" },
     { q: 3, name: "5,4 kWh 51,2V LiFePO4 WPU akü", ref: "aku-51-wpu" },
     { q: 1, name: "Deye 12 kW hibrit inverter (trifaze LV)", ref: "inv-deye-12" },
     { q: 5, name: "4 panel montaj seti", ref: "eq-montaj" },
     { q: 1, name: "Kablo + sigorta seti" }],
    "11 kW'ın dengeli konfigürasyonu: Deye 12 kW trifaze hibrit ve 16,2 kWh depolama — konfor ile bütçenin kesişimi.");
  pkt("pkt13", "11 kW Lityum Solar Paket (PKT13) — Pro", 256000, "Ev", "Pro", "~11 kW",
    [{ q: 18, name: "600 W TopCon G2G çift cam panel", ref: "pnl-600-cw-tnb" },
     { q: 4, name: "5,4 kWh 51,2V LiFePO4 WPU akü", ref: "aku-51-wpu" },
     { q: 1, name: "Deye 12 kW hibrit inverter (trifaze LV)", ref: "inv-deye-12" },
     { q: 5, name: "4 panel montaj seti", ref: "eq-montaj" },
     { q: 1, name: "Kablo + sigorta seti" }],
    "Amiral gemisi: çift cam TopCon paneller, 21,6 kWh depolama ve Deye trifaze hibrit ile tam bağımsızlık. Uzun kesintilerde bile ev tam kapasite çalışır.");
  pkt("pkt14", "12 kW Lityum Solar Paket (PKT14)", 238900, "Ticari", null, "~12 kW",
    [{ q: 20, name: "600 W TopCon panel", ref: "pnl-600-gaz" },
     { q: 3, name: "5,4 kWh 51,2V LiFePO4 WPU akü", ref: "aku-51-wpu" },
     { q: 1, name: "Deye 12 kW hibrit inverter (trifaze LV)", ref: "inv-deye-12" },
     { q: 5, name: "4 panel montaj seti", ref: "eq-montaj" },
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

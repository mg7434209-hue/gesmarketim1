/* KATALOG ÜRETİCİSİ — TEK DOĞRU KAYNAK: tedarikçi fiyat listesi CSV'si.
   Çalıştır: node build-catalog.js  (npm run build içinde de koşar)

   data/lexron_fiyatlar_10_08_2026_marj22.csv → data/catalog.json
   Site ürünleri /api/products + /api/categories üzerinden BU dosyadan alır;
   assets/data.js kaldırılmıştır (çift katalog tutarsızlığının köküydü).

   Kurallar:
   - saleUsd = round2(cost_usd × config.pricing.usdMarkup)  — ₺ karşılığı
     çalışma anında güncel kurla hesaplanır (app.js priceOf).
   - MALİYET (cost_tl/cost_usd) müşteri kataloğuna ASLA yazılmaz (K1).
   - out_of_stock → inStock:false ("Stokta Yok" rozeti, sepete eklenemez).
   - Görseller: public/images/products/<slug>* varsa o; yoksa
     data/gorsel-eslesme.json (önceki katalogdan devralınan görseller);
     o da yoksa SVG yer tutucu (app.js üretir).
   - Aşama: SADECE LEXRON — yeni marka listeleri kendi aşamasında eklenecek. */
"use strict";
const fs = require("fs");
const path = require("path");

global.window = global;
require("./assets/config.js");
const cfg = global.GESM.config;

const CSV = path.join(__dirname, "data", "lexron_fiyatlar_10_08_2026_marj22.csv");
const OUT = path.join(__dirname, "data", "catalog.json");
const IMG_DIR = path.join(__dirname, "public", "images", "products");
// Görsel devralma dosyası — KALICI KURAL: bir ürünün görselinde FARKLI marka
// görünemez. Devralma yalnız AYNI MARKA içinde yapılır (kaydın kaynakMarka'sı
// ürünün markasıyla eşleşmeli); "_dislama" listesindeki dosyalar kaynağı
// doğrulanamadığı için exact-slug eşleşmesinde de KULLANILMAZ.
const ALIAS_FILE = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, "data", "gorsel-eslesme.json"), "utf8")); }
  catch (e) { return {}; }
})();
const ALIAS = ALIAS_FILE.devralmalar || {};
const IMG_EXCLUDE = new Set(ALIAS_FILE._dislama || []);

const TR = { "Ç": "c", "Ğ": "g", "I": "i", "İ": "i", "Ö": "o", "Ş": "s", "Ü": "u", "ç": "c", "ğ": "g", "ı": "i", "ö": "o", "ş": "s", "ü": "u" };
function slugify(s) {
  return s.replace(/[ÇĞIİÖŞÜçğıöşü]/g, (c) => TR[c] || c).toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
}
function r2(n) { return Math.round(n * 100) / 100; }

const CATEGORIES = [
  { slug: "panel", name: "Panel", icon: "☀️", desc: "Polikristal, monokristal ve TopCon güneş panelleri — 12 W'tan 750 W'a.",
    seo: "Güneş paneli seçerken ilk bakılacak değer panel gücüdür (Wp). Karavan ve küçük sistemlerde 100–300 W, ev tipi ve tarımsal sistemlerde 450–750 W TopCon paneller çatı alanından ve kablolamadan tasarruf sağlar. Kaç panel gerektiğini bilmiyorsanız Sistem Kurucu'ya cihazlarınızı girin, doğru gücü önersin." },
  { slug: "inverter", name: "İnverter", icon: "⚡", desc: "HV MPPT akıllı inverterler ve modifiye sinüs çeviriciler.",
    seo: "Akıllı inverterler MPPT şarj kontrolünü ve tam sinüs çıkışı tek cihazda birleştirir; şebekesiz bağ evi ve karavan sistemlerinin kalbidir. Seçimde üç değer kritiktir: sürekli çıkış gücü (kW), akü voltajı (24/48V) ve maksimum PV giriş gerilimi." },
  { slug: "aku-batarya", name: "Akü Batarya", icon: "🔋", desc: "LiFePO4 lityum bataryalar, nano karbon jel ve AGM aküler.",
    seo: "LiFePO4 lityum bataryalar jel akülere göre kat kat uzun çevrim ömrü ve %90'a varan kullanılabilir kapasite sunar. Voltaj seçimi inverterinize göre yapılır: 12V küçük sistemler, 24V orta boy, 48/51,2V ev tipi. Jel aküler ekonomik başlangıç ve yedek güç için uygundur (%50 deşarj)." },
  { slug: "sarj-kontrol", name: "Şarj Kontrol", icon: "🎛️", desc: "PWM ve MPPT şarj kontrol cihazları — 10A'dan 80A'ya.",
    seo: "Şarj regülatörü panelden gelen enerjiyi aküye güvenle aktarır. PWM ekonomiktir; MPPT panelden %20–30 daha fazla hasat yapar ve yüksek voltajlı dizilere izin verir. Amper seçimi: panel gücü ÷ akü voltajı × 1,25." },
  { slug: "solar-pompa", name: "Solar Pompa", icon: "💧", desc: "Solar pompa inverterleri 3 Hp – 210 Hp ve sulama ekipmanları.",
    seo: "Güneş enerjili tarımsal sulama mazot ve şebeke maliyetini sıfırlar; pompa inverteri panellerden gelen DC enerjiyi mevcut trifaze dalgıç pompanıza uygun AC'ye çevirir. Sürücü gücü pompa etiketinin bir üst kademesi, panel gücü pompanın ~1,3 katı seçilmelidir." },
  { slug: "aydinlatma", name: "Aydınlatma", icon: "💡", desc: "Solar aydınlatma armatürleri ve projektörler.",
    seo: "Solar aydınlatmalar şebeke gerektirmeden bahçe, tarla ve tesis çevresini aydınlatır; gün içinde şarj olur, karanlıkta otomatik yanar. Watt değeri aydınlatılacak alanla orantılı seçilir." },
  { slug: "kablo-konnektor", name: "Kablo Konnektör", icon: "🔌", desc: "Solar kablo, MC4 konnektör, branch ve panel tutucular.",
    seo: "Doğru kesitte solar kablo gerilim düşümünü, kaliteli MC4 konnektör temas direncini önler. 100 metreye kadar %2 gerilim düşümü hedeflenmelidir; paralel dizilerde T-branch konnektör kullanılır." },
];

const DESC = {
  "panel": (p) => p.name + " — Lexron kalitesiyle güneş paneli. Çatı, karavan ve arazi uygulamalarında kullanılır; 10 yıl ürün, 25 yıl performans garantisi kapsamındadır. Stok ve kargo için WhatsApp'tan ulaşabilirsiniz.",
  "inverter": (p) => p.name + " — güç elektroniği Lexron güvencesinde. Şebekesiz sistemlerde panel, akü ve yükleri tek noktadan yönetir. Kurulum desteği için bize ulaşın.",
  "aku-batarya": (p) => p.name + " — solar enerji depolama çözümü. Dahili koruma devreleri standarttır; doğru voltaj ve kapasite seçimi için Sistem Kurucu'yu kullanabilirsiniz.",
  "sarj-kontrol": (p) => p.name + " — panelden aküye şarjı güvenle yönetir. Aşırı şarj, derin deşarj ve ters polarite korumaları standarttır.",
  "solar-pompa": (p) => p.name + " — tarımsal sulamada mazot ve şebeke maliyetini sıfırlar. Kuyu bilgilerinizi iletin, panel sayısını ücretsiz boyutlandıralım.",
  "aydinlatma": (p) => p.name + " — şebekesiz solar aydınlatma; gün içinde şarj olur, karanlıkta otomatik çalışır.",
  "kablo-konnektor": (p) => p.name + " — solar kurulumların güvenli ve uzun ömürlü olması için TSE/IEC uyumlu bağlantı ekipmanı.",
};

// Basit CSV ayrıştırıcı (tırnaklı alan desteği)
function parseCsv(text) {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  const head = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = []; let cur = "", q = false;
    for (const ch of line) {
      if (ch === '"') q = !q;
      else if (ch === "," && !q) { cells.push(cur); cur = ""; }
      else cur += ch;
    }
    cells.push(cur);
    const row = {};
    head.forEach((h, i) => { row[h] = (cells[i] || "").trim(); });
    return row;
  });
}

const CAT_BY_NAME = { "Panel": "panel", "İnverter": "inverter", "Akü Batarya": "aku-batarya",
  "Şarj Kontrol": "sarj-kontrol", "Solar Pompa": "solar-pompa", "Aydınlatma": "aydinlatma",
  "Kablo Konnektör": "kablo-konnektor" };

const files = fs.readdirSync(IMG_DIR);
function imagesFor(slug, brand) {
  const own = files.filter((f) => (f === slug + ".webp" || f.startsWith(slug + "-")) && !IMG_EXCLUDE.has(f))
    .sort().map((f) => "public/images/products/" + f);
  if (own.length) return own;
  const a = ALIAS[slug];
  if (!a) return [];
  // Markalar arası slug eşleşmesi ASLA görsel taşımaz.
  if ((a.kaynakMarka || "").toLowerCase() !== (brand || "").toLowerCase()) {
    console.warn("[görsel] marka uyuşmazlığı, devralma atlandı:", slug, "←", a.kaynakMarka);
    return [];
  }
  return (a.img || []).filter((im) => !IMG_EXCLUDE.has(im.split("/").pop()));
}

const rows = parseCsv(fs.readFileSync(CSV, "utf8"));
const markup = (cfg.pricing && cfg.pricing.usdMarkup) || 1.22;
const used = new Set();
const bestOf = new Set(); // kategori başına ilk stoktaki ürün → "Çok Satanlar"
const products = [];
for (const r of rows) {
  const cost = parseFloat(r.cost_usd);
  const cat = CAT_BY_NAME[r.category];
  if (!r.name || !Number.isFinite(cost) || cost <= 0 || !cat) {
    console.warn("[atla] geçersiz satır:", r.name || "?");
    continue;
  }
  let slug = slugify(r.name);
  if (used.has(slug)) slug = slug + "-2";
  used.add(slug);
  const inStock = slugify(r.stock_status) !== "out-of-stock";
  const bestseller = inStock && !bestOf.has(cat) ? (bestOf.add(cat), true) : false;
  products.push({
    id: slug,
    code: "GM-" + slug.replace(/-/g, "").toUpperCase().slice(0, 14),
    cat,
    brand: "Lexron",
    name: r.name,
    saleUsd: r2(cost * markup), // SATIŞ fiyatı $ — maliyet değildir (K1: maliyet yazılmaz)
    inStock,
    bestseller,
    tags: [],
    specs: {},
    img: imagesFor(slug, "Lexron"),
    desc: (DESC[cat] || ((p) => p.name))({ name: r.name }),
  });
}

const catalog = {
  phase: "lexron",
  priceDate: rows[0] && rows[0].price_date ? rows[0].price_date : null,
  categories: CATEGORIES.map((c, i) => Object.assign({ sortOrder: i + 1 }, c)),
  products,
};
fs.writeFileSync(OUT, JSON.stringify(catalog, null, 1));
const perCat = {};
products.forEach((p) => { perCat[p.cat] = (perCat[p.cat] || 0) + 1; });
console.log("catalog.json üretildi —", products.length, "ürün ·", CATEGORIES.length, "kategori");
console.log("dağılım:", JSON.stringify(perCat));
console.log("görselli:", products.filter((p) => p.img.length).length, "· stokta yok:", products.filter((p) => !p.inStock).length);

/* GES MARKETİM — bağımlılıksız statik sunucu (Railway uyumlu)
   + /api/kur: günlük USD/TL kuru (GET herkese açık, POST admin şifreli).
   Kur DATA_DIR/kur.json'da tutulur (Railway Volume önerilir; yoksa ./data —
   Volume yoksa her deploy'da config.js kuruna döner).
   + OTOMATİK KUR: sunucu açılışta ve KUR_REFRESH_HOURS'ta bir (varsayılan 6)
   serbest piyasa USD/TRY kurunu ücretsiz kaynaklardan çeker ve yayınlar
   (Google'ın gösterdiği piyasa kuruyla aynı veri). Elle yayınlanan kur
   24 saat korunur. Kapatmak için AUTO_KUR=false. */
"use strict";
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;

// config.js'ten varsayılan kur + admin şifresi (tarayıcı globali şimi)
global.window = global;
require("./assets/config.js");
const CFG = global.GESM.config;
const ADMIN_PASS = process.env.ADMIN_PASS || (CFG.admin && CFG.admin.pass) || "";

const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, "data");
const KUR_FILE = path.join(DATA_DIR, "kur.json");

// ---------- Katalog API ----------
// TEK KAYNAK: data/catalog.json (build-catalog.js CSV'den üretir, repoda durur).
// Site ürün/kategori verisini /api/products + /api/categories'ten çeker;
// gömülü assets/data.js kaldırıldı (çift katalog tutarsızlığının köküydü).
const CATALOG_FILE = path.join(ROOT, "data", "catalog.json");
let CATALOG = { categories: [], products: [] };
function loadCatalog() {
  try {
    CATALOG = JSON.parse(fs.readFileSync(CATALOG_FILE, "utf8"));
    console.log("[katalog] " + (CATALOG.products || []).length + " ürün, " +
      (CATALOG.categories || []).length + " kategori yüklendi");
  } catch (e) {
    console.error("[katalog] data/catalog.json okunamadı — `npm run build` çalıştırın");
  }
}
loadCatalog();

/* ---------- Admin: çalışma zamanı fiyat override'ları + siparişler ----------
   Kalıcılık DATA_DIR'dedir (Railway Volume önerilir; Volume yoksa deploy'da
   sıfırlanır). KALICI fiyat = data/fiyat-override.json + npm run build + commit. */
const OVR_FILE = path.join(DATA_DIR, "overrides.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
let OVERRIDES = {};
try { OVERRIDES = JSON.parse(fs.readFileSync(OVR_FILE, "utf8")) || {}; } catch (e) { /* yok */ }

function saveOverrides() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(OVR_FILE, JSON.stringify(OVERRIDES));
}
function readOrders() {
  try { return JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8")) || []; } catch (e) { return []; }
}
function writeOrders(list) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(list.slice(-500))); // son 500 sipariş
}
function mergedProducts() {
  return (CATALOG.products || []).map((p) => {
    const o = OVERRIDES[p.id];
    return o && Number.isFinite(o.priceTL) && o.priceTL > 0
      ? Object.assign({}, p, { priceTL: o.priceTL }) : p;
  });
}
// Sunucu tarafı ₺ hesabı (istemcideki priceTL ile aynı formül) — sipariş tutarı
function tlOf(p) {
  const step = (CFG.pricing && CFG.pricing.roundTo) || 1;
  if (Number.isFinite(p.priceTL) && p.priceTL > 0) return Math.round(p.priceTL / step) * step;
  const kur = readKur().usdTry;
  const raw = p.saleUsd * kur * (1 + ((CFG.pricing && CFG.pricing.fxBufferPct) || 0) / 100);
  return Math.round(raw / step) * step;
}
function adminOk(pass) { return Boolean(ADMIN_PASS) && pass === ADMIN_PASS; }
function readBody(req, limit, cb) {
  let b = "";
  req.on("data", (c) => { b += c; if (b.length > limit) req.destroy(); });
  req.on("end", () => { let d; try { d = JSON.parse(b); } catch (e) { d = null; } cb(d); });
}

/* ---------- iyzico ödeme (Checkout Form) ----------
   NOT: iyzico tek kanaldan/tek siteden izin verdiği için kart tahsilatının
   ASIL yolu artık gespaenerji.com'daki link ödeme sayfasıdır
   (config.payments.kartUrl → odeme.html?t=&a=&s= — sepet oraya yönlendirir,
   ödeme onayı admin panelde elle "Ödeme alındı" ile işaretlenir).
   Aşağıdaki yerinde Checkout Form kodu, kartUrl boşaltılır ve env
   anahtarları girilirse çalışan YEDEK yoldur.
   ANAHTARLAR YALNIZCA ENV'DEN OKUNUR (IYZICO_API_KEY / IYZICO_SECRET_KEY) —
   koda/konfige ASLA yazılmaz. Env yoksa kartla ödeme seçeneği sitede
   görünmez (payments.kart=false), havale/WhatsApp akışı aynen çalışır.
   Akış: sepet → POST /api/orders (pay=kart) → POST /api/pay/init → iyzico
   ödeme sayfasına yönlendirme → iyzico tarayıcıyı POST /api/pay/callback'e
   döndürür → sunucu token ile sonucu iyzico'dan doğrular (retrieve) →
   sipariş "odendi" işaretlenir → /odeme-sonuc sayfasına 302.
   İmza: resmi iyzipay-node SDK'sının IYZWSv2 HMAC-SHA256 şemasıyla birebir. */
const IYZ = {
  key: process.env.IYZICO_API_KEY || "",
  secret: process.env.IYZICO_SECRET_KEY || "",
  base: (process.env.IYZICO_BASE_URL || "https://api.iyzipay.com").replace(/\/+$/, "")
};
const KART_AKTIF = Boolean(IYZ.key && IYZ.secret);
const IYZ_INIT_PATH = "/payment/iyzipos/checkoutform/initialize/auth/ecom";
const IYZ_DETAIL_PATH = "/payment/iyzipos/checkoutform/auth/ecom/detail";

function iyzPost(pathName, bodyObj, cb) {
  const payload = JSON.stringify(bodyObj);
  const rnd = process.hrtime()[0] + Math.random().toString(8).slice(2);
  const sig = crypto.createHmac("sha256", IYZ.secret).update(rnd + pathName + payload).digest("hex");
  const auth = "IYZWSv2 " + Buffer.from(
    "apiKey:" + IYZ.key + "&randomKey:" + rnd + "&signature:" + sig).toString("base64");
  let u;
  try { u = new URL(IYZ.base + pathName); } catch (e) { return cb(null); }
  const mod = u.protocol === "https:" ? https : http;
  const rq = mod.request(u, { method: "POST", headers: {
    Authorization: auth, "x-iyzi-rnd": rnd,
    "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload)
  }}, (r) => {
    let b = "";
    r.on("data", (c) => { b += c; if (b.length > 1048576) rq.destroy(); });
    r.on("end", () => { let j; try { j = JSON.parse(b); } catch (e) { j = null; } cb(j); });
  });
  rq.setTimeout(20000, () => { rq.destroy(); cb(null); });
  rq.on("error", () => cb(null));
  rq.end(payload);
}
// iyzico fiyat biçimi: ondalıklı dize ("1234.0" / "1234.5")
const iyzFiyat = (n) => {
  const s = String(Math.round(n * 100) / 100);
  return s.includes(".") ? s : s + ".0";
};
// Telefonu +90'lı biçime getir (iyzico gsmNumber)
function iyzTel(t) {
  const d = String(t || "").replace(/\D/g, "");
  if (d.startsWith("90") && d.length === 12) return "+" + d;
  if (d.startsWith("0") && d.length === 11) return "+9" + d;
  if (d.length === 10) return "+90" + d;
  return "+905000000000";
}

// /api/config — GÜVENLİ alt küme (K1): admin şifresi ve tedarikçi bilgisi
// ASLA çıkmaz. React SPA iletişim/kur/kargo katsayılarını buradan okur.
const PUBLIC_CFG = JSON.stringify({
  company: CFG.company,
  announcement: CFG.announcement,
  commerce: CFG.commerce,
  pricing: { roundTo: CFG.pricing.roundTo, fxBufferPct: CFG.pricing.fxBufferPct },
  brands: CFG.brands,
  builder: CFG.builder,
  visitors: CFG.visitors || null,
  seo: CFG.seo,
  // kartUrl doluysa kart tahsilatı gespaenerji.com'daki link ödeme sayfasında
  // yapılır (iyzico tek site izni); kart=true yalnız yerinde Checkout Form'u
  // (env anahtarları) bildirir. Sınırlar gespaenerji /api/pay/custom ile aynı.
  payments: {
    kart: KART_AKTIF,
    kartUrl: (CFG.payments && CFG.payments.kartUrl) || "",
    kartMinTL: (CFG.payments && CFG.payments.kartMinTL) || 0,
    kartMaxTL: (CFG.payments && CFG.payments.kartMaxTL) || 0
  }
});

/* ---------- Ziyaretçi sayacı ---------- */
// Çerez başına günde 1 artış, botlar sayılmaz. Kalıcı veri DATA_DIR/visitors.json.
const VISITORS_FILE = path.join(DATA_DIR, "visitors.json");
function readVisitors() {
  try {
    const j = JSON.parse(fs.readFileSync(VISITORS_FILE, "utf8"));
    if (j && Number.isFinite(j.count) && j.count >= 0) return j;
  } catch (e) { /* yok */ }
  return { count: 0 };
}
const BOT_RE = /bot|crawl|spider|slurp|preview|fetch|monitor|curl|wget|python|headless|lighthouse/i;

function readKur() {
  try {
    const j = JSON.parse(fs.readFileSync(KUR_FILE, "utf8"));
    if (j && j.usdTry > 0) return j;
  } catch (e) { /* dosya yok → config varsayılanı */ }
  return { usdTry: CFG.commerce.usdTry, updatedAt: null, source: "config" };
}

/* ---------- Otomatik kur güncelleme ---------- */
// Kaynaklar sırayla denenir (anahtarsız, ücretsiz). KUR_AUTO_URL env'i ile
// özel/test kaynağı eklenebilir (er-api JSON formatında beklenir).
const KUR_SOURCES = [
  { name: "er-api", url: "https://open.er-api.com/v6/latest/USD",
    pick: (j) => j && j.rates && Number(j.rates.TRY) },
  { name: "frankfurter", url: "https://api.frankfurter.app/latest?from=USD&to=TRY",
    pick: (j) => j && j.rates && Number(j.rates.TRY) }
];
if (process.env.KUR_AUTO_URL) {
  KUR_SOURCES.unshift({ name: "custom", url: process.env.KUR_AUTO_URL,
    pick: (j) => (j && j.rates && Number(j.rates.TRY)) || (j && Number(j.usdTry)) });
}

function fetchJson(url, cb) {
  const mod = url.startsWith("https:") ? https : http;
  const req2 = mod.get(url, { headers: { "User-Agent": "gesmarketim-kur/1.0" } }, (r) => {
    if (r.statusCode !== 200) { r.resume(); return cb(null); }
    let body = "";
    r.on("data", (c) => { body += c; if (body.length > 262144) req2.destroy(); });
    r.on("end", () => { try { cb(JSON.parse(body)); } catch (e) { cb(null); } });
  });
  req2.on("error", () => cb(null));
  req2.setTimeout(8000, () => { req2.destroy(); cb(null); });
}

function writeKur(rate, source) {
  const out = { usdTry: Math.round(rate * 10000) / 10000, updatedAt: new Date().toISOString(), source };
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(KUR_FILE, JSON.stringify(out));
  return out;
}

function autoUpdateKur() {
  if ((process.env.AUTO_KUR || "true").toLowerCase() === "false") return;
  const cur = readKur();
  // Elle yayınlanan kur 24 saat korunur — o gün admin ne dediyse o geçerli.
  if (cur.source === "admin" && cur.updatedAt &&
      Date.now() - Date.parse(cur.updatedAt) < 24 * 60 * 60 * 1000) {
    console.log("[kur] elle yayınlanmış kur korunuyor (24 saat):", cur.usdTry);
    return;
  }
  (function trySource(i) {
    if (i >= KUR_SOURCES.length) { console.warn("[kur] hiçbir kaynaktan kur alınamadı"); return; }
    const s = KUR_SOURCES[i];
    fetchJson(s.url, (j) => {
      const rate = s.pick(j);
      if (!Number.isFinite(rate) || rate <= 0 || rate > 10000) return trySource(i + 1);
      // Emniyet: tek adımda %15'ten büyük sıçramayı yazma (kaynak arızası koruması)
      if (cur.usdTry > 0 && Math.abs(rate / cur.usdTry - 1) > 0.15) {
        console.warn("[kur] şüpheli sıçrama atlandı:", cur.usdTry, "→", rate, "(" + s.name + ")");
        return trySource(i + 1);
      }
      const out = writeKur(rate, "auto:" + s.name);
      console.log("[kur] güncellendi:", out.usdTry, "₺ (" + s.name + ")");
    });
  })(0);
}

function handleKurApi(req, res) {
  if (req.method === "GET") {
    return send(res, 200, JSON.stringify(readKur()), {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-cache"
    });
  }
  if (req.method === "POST") {
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > 4096) req.destroy(); });
    req.on("end", () => {
      let data;
      try { data = JSON.parse(body); } catch (e) { data = null; }
      const rate = data && Number(data.usdTry);
      if (!data || data.pass !== ADMIN_PASS || !ADMIN_PASS) {
        return send(res, 403, '{"error":"yetki"}', { "Content-Type": "application/json" });
      }
      if (!Number.isFinite(rate) || rate <= 0 || rate > 10000) {
        return send(res, 400, '{"error":"gecersiz_kur"}', { "Content-Type": "application/json" });
      }
      let out;
      try {
        out = writeKur(rate, "admin"); // elle yayın — otomatik güncelleme 24 saat dokunmaz
      } catch (e) {
        return send(res, 500, '{"error":"yazilamadi"}', { "Content-Type": "application/json" });
      }
      send(res, 200, JSON.stringify({ ok: true, usdTry: out.usdTry, updatedAt: out.updatedAt }), { "Content-Type": "application/json" });
    });
    return;
  }
  send(res, 405, '{"error":"method"}', { "Content-Type": "application/json" });
}

/* ---------- Sistem Kur v2 — backend proxy ----------
   /api/hesapla, /api/asistan, /api/leads istekleri gesmarketim backend'ine
   (SISTEMKUR_API env — ör. https://backend.up.railway.app) aktarılır; SPA
   aynı origin'de kalır, CORS gerekmez. Env yoksa uçlar 503 döner — asistan
   "kapalı" mesajı verir, sihirbaz çalışmaya devam eder. */
const SISTEMKUR_API = (process.env.SISTEMKUR_API || "").replace(/\/+$/, "");
const SK_TIMEOUT = { "/api/hesapla": 20000, "/api/asistan": 90000, "/api/leads": 20000 };
const SK_KAPALI = {
  "/api/asistan": '{"error":"asistan_kapali","message":"AI asistan şu an kullanılamıyor. Sihirbazla devam edebilirsiniz."}',
  "/api/hesapla": '{"error":"servis_kapali","message":"Hesap servisi şu an kullanılamıyor. Lütfen WhatsApp üzerinden ulaşın."}',
  "/api/leads": '{"error":"servis_kapali","message":"Kayıt servisi şu an kullanılamıyor. Lütfen WhatsApp üzerinden ulaşın."}'
};
// Asistan pahalı (LLM çağrısı) → IP başına saatte 20 istek yerel sınır; proxy
// arkasında backend'in kendi limiti site geneline düşeceği için asıl koruma bu.
const SK_LIMIT = { windowMs: 60 * 60 * 1000, max: 20 };
const skBuckets = new Map();
function skClientIp(req) {
  const xf = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return xf || req.socket.remoteAddress || "?";
}
function skLimited(ip) {
  const now = Date.now();
  let b = skBuckets.get(ip);
  if (!b || b.resetAt <= now) { b = { count: 0, resetAt: now + SK_LIMIT.windowMs }; skBuckets.set(ip, b); }
  if (skBuckets.size > 5000) { for (const [k, v] of skBuckets) if (v.resetAt <= now) skBuckets.delete(k); }
  b.count++;
  return b.count > SK_LIMIT.max;
}
function proxySistemKur(req, res, apiPath) {
  const HDR = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-cache" };
  if (req.method !== "POST") return send(res, 405, '{"error":"method"}', HDR);
  if (!SISTEMKUR_API) return send(res, 503, SK_KAPALI[apiPath], HDR);
  const ip = skClientIp(req);
  if (apiPath === "/api/asistan" && skLimited(ip)) {
    return send(res, 429, '{"error":"rate_limited","message":"Asistan için saatlik istek sınırına ulaşıldı. Lütfen biraz sonra tekrar deneyin."}', HDR);
  }
  let body = "";
  req.on("data", (c) => { body += c; if (body.length > 65536) req.destroy(); });
  req.on("end", () => {
    let target;
    try { target = new URL(SISTEMKUR_API + apiPath); } catch (e) {
      return send(res, 503, SK_KAPALI[apiPath], HDR);
    }
    const mod = target.protocol === "https:" ? https : http;
    const up = mod.request(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Content-Length": Buffer.byteLength(body),
        // Gerçek ziyaretçi IP'sini ilet — backend rate limit'i kişi başına kalsın
        "X-Forwarded-For": ip
      }
    }, (r2) => {
      let out = "";
      r2.on("data", (c) => { out += c; if (out.length > 1048576) up.destroy(); });
      r2.on("end", () => send(res, r2.statusCode || 502, out || "{}", HDR));
    });
    up.setTimeout(SK_TIMEOUT[apiPath], () => {
      up.destroy();
      send(res, 504, '{"error":"zaman_asimi","message":"Yanıt alınamadı. Lütfen tekrar deneyin."}', HDR);
    });
    up.on("error", () => {
      if (!res.headersSent) send(res, 502, SK_KAPALI[apiPath], HDR);
    });
    up.end(body);
  });
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".woff2": "font/woff2"
};

function send(res, code, body, headers) {
  res.writeHead(code, Object.assign({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  }, headers));
  res.end(body);
}

function serveFile(res, filePath, cacheOverride) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || "application/octet-stream";
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, "404 Not Found", { "Content-Type": "text/plain; charset=utf-8" });
    const cache = cacheOverride || (ext === ".html" ? "no-cache" : "public, max-age=86400");
    send(res, 200, data, { "Content-Type": mime, "Cache-Control": cache });
  });
}

/* SPA (React) dist/'ten servis edilir; dist commit'lidir (Railway'de build yok).
   Eski çok-sayfalı URL'ler SEO için yeni rotalara 301 yönlendirilir. */
const DIST = path.join(ROOT, "dist");
const LEGACY = {
  "/index.html": "/", "/sistem-kur.html": "/hesaplayici", "/sepet.html": "/sepet",
  "/iletisim.html": "/iletisim", "/hakkimizda.html": "/hakkimizda", "/sss.html": "/sss",
  "/kargo-teslimat.html": "/kargo-teslimat", "/iade-degisim.html": "/iade-degisim",
  "/mesafeli-satis.html": "/mesafeli-satis", "/gizlilik.html": "/kvkk",
  "/favoriler.html": "/", "/404.html": "/"
};
function legacyRedirect(urlPath, query) {
  if (urlPath === "/urun.html") return "/urun/" + encodeURIComponent(query.get("u") || "");
  if (urlPath === "/kategori.html") {
    const k = query.get("k"), q = query.get("q");
    return k ? "/kategori/" + encodeURIComponent(k) : (q ? "/kategori?q=" + encodeURIComponent(q) : "/kategori");
  }
  return LEGACY[urlPath] || null;
}

// Kanonik alan adı (config.company.domain) — www ve http istekleri buraya
// 301'lenir. Railway edge'i x-forwarded-proto başlığı verir; başlık yoksa
// (yerel geliştirme) yönlendirme yapılmaz. Sertifikanın kendisi Railway
// panelinde "Custom Domain" olarak apex + www eklenerek üretilir.
const CANON_HOST = (() => {
  try { return new URL(CFG.company.domain).host.toLowerCase(); } catch (e) { return null; }
})();

const server = http.createServer((req, res) => {
  let urlPath, query;
  try {
    const u = new URL(req.url, "http://x");
    urlPath = decodeURIComponent(u.pathname);
    query = u.searchParams;
  } catch (e) { return send(res, 400, "Bad Request", { "Content-Type": "text/plain" }); }

  // HTTPS + kanonik host zorlaması (yalnız proxy arkasında).
  // www'lu/www'suz karşı biçim her iki yönde kanonik adrese çevrilir.
  const proto = req.headers["x-forwarded-proto"];
  const host = String(req.headers.host || "").toLowerCase().split(":")[0];
  if (proto && CANON_HOST) {
    const target = (host === "www." + CANON_HOST || CANON_HOST === "www." + host)
      ? CANON_HOST : host;
    if (proto !== "https" || target !== host) {
      return send(res, 301, "", { Location: "https://" + target + req.url });
    }
    // Sertifika doğrulanmış bağlantılarda HSTS (1 yıl)
    res.setHeader("Strict-Transport-Security", "max-age=31536000");
  }

  /* ---------- API ---------- */
  if (urlPath === "/api/kur") return handleKurApi(req, res);
  const JSON_HDR = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-cache" };

  // Ziyaretçi sayacı: bot değilse ve bugünün çerezi yoksa 1 artır
  if (urlPath === "/api/visitors") {
    const ua = String(req.headers["user-agent"] || "");
    const isBot = !ua || BOT_RE.test(ua);
    const today = new Date().toISOString().slice(0, 10);
    const seen = /(?:^|;\s*)gesm_v=([0-9-]+)/.exec(String(req.headers.cookie || ""));
    const v = readVisitors();
    const headers = Object.assign({}, JSON_HDR);
    if (!isBot && (!seen || seen[1] !== today)) {
      v.count++;
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(VISITORS_FILE, JSON.stringify({ count: v.count }));
      } catch (e) { /* yazılamazsa sessizce yalnız göster */ }
      headers["Set-Cookie"] = "gesm_v=" + today + "; Path=/; Max-Age=86400; SameSite=Lax";
    }
    return send(res, 200, JSON.stringify({ count: v.count }), headers);
  }
  if (urlPath === "/api/products") return send(res, 200, JSON.stringify(mergedProducts()), JSON_HDR);
  if (urlPath === "/api/categories") return send(res, 200, JSON.stringify(CATALOG.categories || []), JSON_HDR);
  if (urlPath === "/api/config") return send(res, 200, PUBLIC_CFG, JSON_HDR);
  if (urlPath.startsWith("/api/products/")) {
    const id = urlPath.slice("/api/products/".length);
    const p = mergedProducts().find((x) => x.id === id);
    return p ? send(res, 200, JSON.stringify(p), JSON_HDR)
             : send(res, 404, '{"error":"bulunamadi"}', JSON_HDR);
  }

  // Sipariş bırakma (herkese açık) — sepet WhatsApp'a ek olarak buraya da yazar
  if (urlPath === "/api/orders" && req.method === "POST") {
    return readBody(req, 32768, (d) => {
      if (!d || !String(d.name || "").trim() || !String(d.phone || "").trim() ||
          !String(d.addr || "").trim() || !Array.isArray(d.items) || !d.items.length || d.items.length > 60) {
        return send(res, 400, '{"error":"eksik_alan"}', JSON_HDR);
      }
      const all = mergedProducts();
      const items = [];
      let subtotal = 0;
      for (const it of d.items) {
        const p = all.find((x) => x.id === it.id);
        const qty = Math.min(999, Math.max(1, parseInt(it.qty, 10) || 0));
        if (!p || !qty) continue;
        const tl = tlOf(p);
        subtotal += tl * qty;
        items.push({ id: p.id, name: p.name, code: p.code, qty, tl });
      }
      if (!items.length) return send(res, 400, '{"error":"gecersiz_kalem"}', JSON_HDR);
      // Kargo modu "alici" = karşı ödemeli: siparişe kargo ücreti EKLENMEZ
      // (ücret teslimatta kargo firmasına ödenir; iyzico sepetine de girmez).
      const aliciOdemeli = CFG.commerce.kargoModu === "alici";
      const shipping = aliciOdemeli ? 0 :
        (subtotal >= CFG.commerce.freeShippingLimit ? 0 : CFG.commerce.shippingFlat);
      const pay = d.pay === "kart" ? "kart" : "havale";
      const disc = pay === "havale" ? (CFG.commerce.havaleDiscountPct || 0) / 100 : 0;
      const total = Math.round(subtotal * (1 - disc)) + shipping;
      const order = {
        no: "GM" + Date.now().toString().slice(-8),
        createdAt: new Date().toISOString(),
        name: String(d.name).slice(0, 120), phone: String(d.phone).slice(0, 40),
        email: String(d.email || "").slice(0, 120),
        addr: String(d.addr).slice(0, 500), note: String(d.note || "").slice(0, 500),
        pay, items, subtotal, shipping, total, done: false,
        kargo: aliciOdemeli ? "alici" : "dahil",
        odendi: false, paymentId: null
      };
      try {
        const list = readOrders(); list.push(order); writeOrders(list);
      } catch (e) { return send(res, 500, '{"error":"yazilamadi"}', JSON_HDR); }
      console.log("[sipariş]", order.no, "·", items.length, "kalem ·", total, "₺");
      // total yanıtta döner: kart link ödemesinde tutar sunucu hesabıyla taşınır
      send(res, 200, JSON.stringify({ ok: true, no: order.no, total: order.total }), JSON_HDR);
    });
  }

  /* ---------- iyzico: ödeme başlat + dönüş ---------- */
  if (urlPath === "/api/pay/init" && req.method === "POST") {
    if (!KART_AKTIF) return send(res, 503, '{"error":"kart_kapali","message":"Kartla ödeme şu an kullanılamıyor."}', JSON_HDR);
    return readBody(req, 4096, (d) => {
      const list = readOrders();
      const o = d && list.find((x) => x.no === d.no);
      if (!o) return send(res, 404, '{"error":"siparis_yok"}', JSON_HDR);
      if (o.pay !== "kart") return send(res, 400, '{"error":"odeme_tipi_kart_degil"}', JSON_HDR);
      if (o.odendi) return send(res, 400, '{"error":"zaten_odendi"}', JSON_HDR);

      const adParca = String(o.name).trim().split(/\s+/);
      const ad = adParca.slice(0, -1).join(" ") || adParca[0];
      const soyad = adParca.length > 1 ? adParca[adParca.length - 1] : "Musteri";
      const email = o.email || "musteri@gesmarketim.com";
      const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
        req.socket.remoteAddress || "85.34.0.1";
      // Callback: proxy arkasında (canlı) kanonik https adres; yerelde istek
      // host'u (port dahil) — iyzico tarayıcıyı buraya form-POST ile döndürür.
      const arkasindaProxy = Boolean(req.headers["x-forwarded-proto"]);
      const cb2 = arkasindaProxy
        ? "https://" + (CANON_HOST || String(req.headers.host || "").split(":")[0]) + "/api/pay/callback"
        : "http://" + String(req.headers.host || ("127.0.0.1:" + PORT)) + "/api/pay/callback";

      const sepet = o.items.map((it) => ({
        id: String(it.id).slice(0, 64), name: String(it.name).slice(0, 120),
        category1: "Solar", itemType: "PHYSICAL", price: iyzFiyat(it.tl * it.qty)
      }));
      if (o.shipping > 0) sepet.push({ id: "kargo", name: "Kargo", category1: "Hizmet", itemType: "PHYSICAL", price: iyzFiyat(o.shipping) });

      const istek = {
        locale: "tr", conversationId: o.no, basketId: o.no,
        price: iyzFiyat(o.total), paidPrice: iyzFiyat(o.total), currency: "TRY",
        paymentGroup: "PRODUCT", callbackUrl: cb2,
        buyer: {
          id: o.no, name: ad, surname: soyad, gsmNumber: iyzTel(o.phone), email,
          identityNumber: "11111111111", registrationAddress: o.addr,
          ip, city: "Belirtilmedi", country: "Turkey"
        },
        shippingAddress: { contactName: o.name, city: "Belirtilmedi", country: "Turkey", address: o.addr },
        billingAddress: { contactName: o.name, city: "Belirtilmedi", country: "Turkey", address: o.addr },
        basketItems: sepet
      };

      iyzPost(IYZ_INIT_PATH, istek, (j) => {
        if (!j || j.status !== "success" || !j.paymentPageUrl) {
          console.error("[iyzico] init hata:", j && (j.errorCode + " " + j.errorMessage));
          return send(res, 502, JSON.stringify({
            error: "odeme_baslatilamadi",
            message: (j && j.errorMessage) || "Ödeme sayfası açılamadı. Lütfen tekrar deneyin ya da havale seçin."
          }), JSON_HDR);
        }
        o.iyzToken = j.token;
        try { writeOrders(list); } catch (e) { /* token yazılamazsa callback basketId ile bulur */ }
        console.log("[iyzico] init", o.no, "→ ödeme sayfası");
        send(res, 200, JSON.stringify({ ok: true, url: j.paymentPageUrl }), JSON_HDR);
      });
    });
  }
  if (urlPath === "/api/pay/callback") {
    if (req.method !== "POST") return send(res, 302, "", { Location: "/sepet" });
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > 8192) req.destroy(); });
    req.on("end", () => {
      const token = new URLSearchParams(body).get("token");
      if (!token) return send(res, 302, "", { Location: "/odeme-sonuc?durum=hata" });
      iyzPost(IYZ_DETAIL_PATH, { locale: "tr", token }, (j) => {
        const list = readOrders();
        const o = list.find((x) => x.iyzToken === token) ||
          (j && list.find((x) => x.no === j.basketId || x.no === j.conversationId));
        const basarili = j && j.status === "success" && j.paymentStatus === "SUCCESS";
        if (o && basarili && !o.odendi) {
          o.odendi = true;
          o.paymentId = String(j.paymentId || "");
          try { writeOrders(list); } catch (e) { console.error("[iyzico] sipariş yazılamadı", e); }
          console.log("[iyzico] ÖDENDİ", o.no, "paymentId:", o.paymentId);
        } else if (!basarili) {
          console.warn("[iyzico] ödeme başarısız/iptal", o ? o.no : "?", j && j.errorMessage);
        }
        const q = "?durum=" + (basarili ? "basarili" : "hata") + (o ? "&no=" + encodeURIComponent(o.no) : "");
        send(res, 302, "", { Location: "/odeme-sonuc" + q });
      });
    });
    return;
  }

  /* ---------- Admin API (ADMIN_PASS) ---------- */
  if (urlPath === "/api/admin/orders" && req.method === "GET") {
    if (!adminOk(req.headers["x-admin-pass"])) return send(res, 403, '{"error":"yetki"}', JSON_HDR);
    return send(res, 200, JSON.stringify(readOrders().slice().reverse()), JSON_HDR);
  }
  if (urlPath === "/api/admin/order-status" && req.method === "POST") {
    return readBody(req, 4096, (d) => {
      if (!d || !adminOk(d.pass)) return send(res, 403, '{"error":"yetki"}', JSON_HDR);
      const list = readOrders();
      const o = list.find((x) => x.no === d.no);
      if (!o) return send(res, 404, '{"error":"bulunamadi"}', JSON_HDR);
      // Kısmi güncelleme: done (sipariş tamamlandı) ve/veya odendi (ödeme
      // alındı — havalede elle işaretlenir; kartta iyzico callback'i yazar).
      if (typeof d.done === "boolean") o.done = d.done;
      if (typeof d.odendi === "boolean") o.odendi = d.odendi;
      try { writeOrders(list); } catch (e) { return send(res, 500, '{"error":"yazilamadi"}', JSON_HDR); }
      send(res, 200, '{"ok":true}', JSON_HDR);
    });
  }
  if (urlPath === "/api/admin/price" && req.method === "POST") {
    return readBody(req, 4096, (d) => {
      if (!d || !adminOk(d.pass)) return send(res, 403, '{"error":"yetki"}', JSON_HDR);
      const p = (CATALOG.products || []).find((x) => x.id === d.id);
      if (!p) return send(res, 404, '{"error":"urun_yok"}', JSON_HDR);
      const tl = Number(d.priceTL);
      if (d.priceTL == null || d.priceTL === "") {
        delete OVERRIDES[p.id]; // override kaldır → katalog fiyatına dön
      } else if (Number.isFinite(tl) && tl > 0 && tl < 100000000) {
        OVERRIDES[p.id] = { priceTL: Math.round(tl), updatedAt: new Date().toISOString() };
      } else {
        return send(res, 400, '{"error":"gecersiz_fiyat"}', JSON_HDR);
      }
      try { saveOverrides(); } catch (e) { return send(res, 500, '{"error":"yazilamadi"}', JSON_HDR); }
      console.log("[fiyat]", p.id, "→", OVERRIDES[p.id] ? OVERRIDES[p.id].priceTL + " ₺" : "katalog fiyatı");
      send(res, 200, JSON.stringify({ ok: true, id: p.id, priceTL: OVERRIDES[p.id] ? OVERRIDES[p.id].priceTL : null }), JSON_HDR);
    });
  }
  if (urlPath === "/api/admin/overrides" && req.method === "GET") {
    if (!adminOk(req.headers["x-admin-pass"])) return send(res, 403, '{"error":"yetki"}', JSON_HDR);
    return send(res, 200, JSON.stringify(OVERRIDES), JSON_HDR);
  }

  // Sistem Kur v2 (AI danışman + hesap + lead) → gesmarketim backend proxy'si
  if (SK_TIMEOUT[urlPath]) return proxySistemKur(req, res, urlPath);

  if (urlPath.startsWith("/api/")) return send(res, 404, '{"error":"bulunamadi"}', JSON_HDR);

  /* ---------- Eski URL'ler → SPA rotaları (301) ---------- */
  const redir = legacyRedirect(urlPath, query);
  if (redir) return send(res, 301, "", { Location: redir });

  /* ---------- Statik dosyalar ---------- */
  // Ürün görselleri repo kökündeki public/ altında durur (dist'e kopyalanmaz).
  if (urlPath.startsWith("/public/")) {
    const fp = path.join(ROOT, urlPath);
    if (!fp.startsWith(ROOT + path.sep)) return send(res, 404, "404", { "Content-Type": "text/plain" });
    return serveFile(res, fp);
  }
  if (urlPath === "/sitemap.xml" || urlPath === "/robots.txt") {
    return serveFile(res, path.join(ROOT, urlPath));
  }
  if (path.extname(urlPath)) {
    const fp = path.join(DIST, urlPath);
    if (!fp.startsWith(DIST + path.sep)) return send(res, 404, "404", { "Content-Type": "text/plain" });
    // Vite çıktıları isim-hash'lidir → uzun önbellek; diğerleri 1 gün
    const cache = urlPath.startsWith("/assets/") ? "public, max-age=31536000, immutable" : null;
    return serveFile(res, fp, cache);
  }
  // Uzantısız her GET → SPA (history fallback); rotayı React çözer
  serveFile(res, path.join(DIST, "index.html"), "no-cache");
});

server.listen(PORT, () => {
  console.log("GES MARKETİM yayında → http://localhost:" + PORT);
  // Otomatik kur: açılışta (3 sn sonra) + periyodik (varsayılan 6 saat)
  const hours = Number(process.env.KUR_REFRESH_HOURS) > 0 ? Number(process.env.KUR_REFRESH_HOURS) : 6;
  setTimeout(autoUpdateKur, 3000).unref();
  setInterval(autoUpdateKur, hours * 60 * 60 * 1000).unref();
});

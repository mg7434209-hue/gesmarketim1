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

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;

// config.js'ten varsayılan kur + admin şifresi (tarayıcı globali şimi)
global.window = global;
require("./assets/config.js");
const CFG = global.GESM.config;
const ADMIN_PASS = process.env.ADMIN_PASS || (CFG.admin && CFG.admin.pass) || "";

const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, "data");
const KUR_FILE = path.join(DATA_DIR, "kur.json");

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

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || "application/octet-stream";
  fs.readFile(filePath, (err, data) => {
    if (err) return serve404(res);
    const cache = ext === ".html" ? "no-cache" : "public, max-age=86400";
    send(res, 200, data, { "Content-Type": mime, "Cache-Control": cache });
  });
}

function serve404(res) {
  fs.readFile(path.join(ROOT, "404.html"), (err, data) => {
    if (err) return send(res, 404, "404 Not Found", { "Content-Type": "text/plain" });
    send(res, 404, data, { "Content-Type": "text/html; charset=utf-8" });
  });
}

const server = http.createServer((req, res) => {
  let urlPath;
  try { urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname); }
  catch (e) { return send(res, 400, "Bad Request", { "Content-Type": "text/plain" }); }

  if (urlPath === "/api/kur") return handleKurApi(req, res);

  if (urlPath === "/") urlPath = "/index.html";
  if (!path.extname(urlPath)) urlPath += ".html"; // /sepet -> /sepet.html

  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) return serve404(res);
  serveFile(res, filePath);
});

server.listen(PORT, () => {
  console.log("GES MARKETİM yayında → http://localhost:" + PORT);
  // Otomatik kur: açılışta (3 sn sonra) + periyodik (varsayılan 6 saat)
  const hours = Number(process.env.KUR_REFRESH_HOURS) > 0 ? Number(process.env.KUR_REFRESH_HOURS) : 6;
  setTimeout(autoUpdateKur, 3000).unref();
  setInterval(autoUpdateKur, hours * 60 * 60 * 1000).unref();
});

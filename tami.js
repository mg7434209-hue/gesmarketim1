/* tami (Garanti BBVA Ödeme Sistemleri) sanal POS istemcisi — bağımlılıksız.
   Akış (3D'li satış, API v3):
     1) POST {TAMI_BASE_URL}/payment/auth  → threeDSHtmlContent (base64 HTML)
        müşterinin tarayıcısında açılır, banka 3D sayfasına kendiliğinden gider.
     2) Banka → tami → tarayıcı callbackUrl'imize döner (3D doğrulama cevabı);
        hashedData HMAC-SHA256(secretKey) ile doğrulanır.
     3) 3D tamamlama isteği (orderId + securityHash) satışı kesinleştirir.
   ANAHTARLAR YALNIZ ENV'DEN: TAMI_MERCHANT_NUMBER · TAMI_TERMINAL_NUMBER ·
   TAMI_SECRET_KEY · TAMI_KID · TAMI_K · TAMI_BASE_URL (sandbox:
   https://sandbox-paymentapi.tami.com.tr). Repoya/konfige ASLA yazılmaz.
   KART VERİSİ (numara, SKT, CVV) yalnız bellekte tami isteğine konur; log'a,
   orders.json'a, e-postaya YAZILMAZ. Kayda yalnız maskeli numara girer.

   Kaynak: tami resmî kod örnekleri (NodeJS/PHP/Java/C#, securityHashV3).
   Env eksikse ready() false döner, kart seçeneği tami yoluyla AÇILMAZ. */
"use strict";
const crypto = require("crypto");
const http = require("http");
const https = require("https");

const cfg = {
  merchant: String(process.env.TAMI_MERCHANT_NUMBER || "").trim(),
  terminal: String(process.env.TAMI_TERMINAL_NUMBER || "").trim(),
  secret: String(process.env.TAMI_SECRET_KEY || "").trim(),
  kid: String(process.env.TAMI_KID || "").trim(),   // örneklerde fixedKidValue
  k: String(process.env.TAMI_K || "").trim(),       // örneklerde fixedKValue (base64url)
  base: String(process.env.TAMI_BASE_URL || "").trim().replace(/\/+$/, "")
};

const PATHS = {
  auth: "/payment/auth",
  complete: "/payment/complete-3ds"
};

// PG-Auth-Token = merchantNumber:terminalNumber:base64(sha256(m + t + secretKey))
// (tami "Hash Hesaplama": Java örneği printBase64Binary kullanır — hex DEĞİL)
function authToken() {
  const hash = crypto.createHash("sha256")
    .update(cfg.merchant + cfg.terminal + cfg.secret, "utf8").digest("base64");
  return cfg.merchant + ":" + cfg.terminal + ":" + hash;
}

// İstek securityHash'i = JWS (HS512): header {alg,typ,kid} · payload = gövdenin
// securityHash ALANI HARİÇ JSON metni · anahtar = base64url-çözülmüş k.
// Gövde aynı anahtar sırasıyla gönderilir; securityHash en sona eklenir.
const b64u = (buf) => buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64uDecode = (s) => Buffer.from(String(s).replace(/-/g, "+").replace(/_/g, "/"), "base64");
function securityHash(body) {
  const header = b64u(Buffer.from(JSON.stringify({ alg: "HS512", typ: "JWT", kid: cfg.kid }), "utf8"));
  const payload = b64u(Buffer.from(JSON.stringify(body), "utf8"));
  const sig = crypto.createHmac("sha512", b64uDecode(cfg.k)).update(header + "." + payload, "utf8").digest();
  return header + "." + payload + "." + b64u(sig);
}

function ready() {
  return Boolean(cfg.merchant && cfg.terminal && cfg.secret && cfg.kid && cfg.k && cfg.base);
}

function post(pathName, body, cb) {
  let u;
  try { u = new URL(cfg.base + pathName); } catch (e) { return cb(null); }
  const payload = JSON.stringify(body);
  const mod = u.protocol === "https:" ? https : http;
  let bitti = false;
  const done = (j) => { if (!bitti) { bitti = true; cb(j); } };
  const rq = mod.request(u, { method: "POST", headers: {
    "Content-Type": "application/json",
    "Accept-Language": "tr",
    "Content-Length": Buffer.byteLength(payload),
    correlationId: "GM" + crypto.randomUUID(),
    "PG-Auth-Token": authToken(),
    "PG-Api-Version": "v3"
  }}, (r) => {
    let b = "";
    r.on("data", (c) => { b += c; if (b.length > 2097152) rq.destroy(); });
    r.on("end", () => { let j; try { j = JSON.parse(b); } catch (e) { j = null; } done(j); });
    r.on("error", () => done(null));
  });
  rq.setTimeout(25000, () => rq.destroy());
  rq.on("error", () => done(null));
  rq.on("close", () => setImmediate(() => done(null)));
  rq.end(payload);
}

/* ---------- Kart doğrulama (gönderimden önce, sunucuda) ---------- */
function luhn(d) {
  let s = 0, alt = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = d.charCodeAt(i) - 48;
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    s += n; alt = !alt;
  }
  return s % 10 === 0;
}
// → { card } ya da { error }
function checkCard(c, now = new Date()) {
  if (!c || typeof c !== "object") return { error: "Kart bilgileri eksik." };
  const number = String(c.number || "").replace(/[\s-]/g, "");
  const holderName = String(c.holderName || "").trim().replace(/\s+/g, " ");
  const cvv = String(c.cvv || "").trim();
  const ay = parseInt(c.expireMonth, 10);
  let yil = parseInt(c.expireYear, 10);
  if (yil < 100) yil += 2000;
  if (holderName.length < 3 || holderName.length > 60) return { error: "Kart üzerindeki adı yazın." };
  if (!/^\d{12,19}$/.test(number) || !luhn(number)) return { error: "Kart numarası geçersiz." };
  if (!(ay >= 1 && ay <= 12) || !(yil >= 2000 && yil <= 2100)) return { error: "Son kullanma tarihi geçersiz." };
  const simdi = now.getFullYear() * 12 + now.getMonth() + 1;
  if (yil * 12 + ay < simdi) return { error: "Kartın son kullanma tarihi geçmiş." };
  if (!/^\d{3,4}$/.test(cvv)) return { error: "CVV geçersiz (kartın arkasındaki 3 hane)." };
  return { card: { holderName, cvv, expireMonth: ay, expireYear: yil, number } };
}

/* ---------- 3D başlatma gövdesi ---------- */
const para = (n) => Math.round(n * 100) / 100;
function tsLocal(d = new Date()) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 23);
}
// order: orders.json kaydı (tutar SUNUCUDA hesaplanmıştır). → gövde ya da null
function authBody(order, card, { orderId, ip, callbackUrl }) {
  const items = order.items.map((it) => ({
    itemId: String(it.id).slice(0, 64), name: String(it.name).slice(0, 120),
    itemType: "PHYSICAL", category: "Solar",
    numberOfProducts: it.qty, unitPrice: para(it.tl), totalPrice: para(it.tl * it.qty)
  }));
  if (order.shipping > 0) items.push({ itemId: "kargo", name: "Kargo", itemType: "PHYSICAL",
    category: "Hizmet", numberOfProducts: 1, unitPrice: para(order.shipping), totalPrice: para(order.shipping) });
  const toplam = para(items.reduce((s, i) => s + i.totalPrice, 0));
  if (toplam !== para(order.total)) return null; // sepet ≠ tutar → gönderme

  const parca = String(order.name).trim().split(/\s+/);
  const name = parca.length > 1 ? parca.slice(0, -1).join(" ") : parca[0];
  const surName = parca.length > 1 ? parca[parca.length - 1] : "-";
  const phone = String(order.phone || "").replace(/\D/g, "").slice(-10);
  const email = order.email || "siparis@gesmarketim.com";
  const city = order.city || "Belirtilmedi";
  const adres = { address: String(order.addr).slice(0, 250), city, companyName: "",
    country: "Türkiye", district: "", contactName: order.name, phoneNumber: phone, zipCode: "" };
  const simdi = tsLocal();
  return {
    orderId, amount: para(order.total), callbackUrl, currency: "TRY",
    installmentCount: 1, motoInd: false, paymentGroup: "PRODUCT", paymentChannel: "WEB",
    card,
    billingAddress: { ...adres, emailAddress: email },
    shippingAddress: { ...adres, emailAddress: email },
    buyer: {
      ipAddress: ip, buyerId: order.no, name, surName, identityNumber: 11111111111,
      city, country: "Türkiye", zipCode: "", emailAddress: email, phoneNumber: phone,
      registrationAddress: String(order.addr).slice(0, 250),
      lastLoginDate: simdi, registrationDate: simdi
    },
    basket: { basketId: order.no, basketItems: items }
  };
}

/* ---------- 3D doğrulama cevabı: hashedData ---------- */
// data = cardOrg + cardBrand + cardType + maskedNumber + installmentCount +
//        currency + originalAmount + orderId + systemTime + status
// hashedData = base64(HMAC-SHA256(secretKey, data))
function responseHash(f) {
  const data = String(f.cardOrganization ?? "") + String(f.cardBrand ?? "") + String(f.cardType ?? "") +
    String(f.maskedNumber ?? "") + String(f.installmentCount ?? "") + String(f.currency ?? "") +
    String(f.amount ?? "") + String(f.orderId ?? "") + String(f.systemTime ?? "") + String(f.status ?? "");
  return crypto.createHmac("sha256", cfg.secret).update(data, "utf8").digest("base64");
}
const esit = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
// Doküman tutar ve para birimi metninin biçimini vermiyor (10 / 10.0 / 10.00;
// TRY / 949): makul biçimlerin her biri denenir. Gizli anahtar olmadan hiçbiri
// üretilemeyeceği için bu, güvenliği zayıflatmaz.
function verifyCallback(cb, pending) {
  if (!cfg.secret || !cb || !cb.hashedData) return false;
  const n = Number(pending.amount);
  const tutarlar = [...new Set([String(cb.txnAmount ?? ""), String(n), n.toFixed(2), n.toFixed(1)].filter(Boolean))];
  const kurlar = [...new Set([String(cb.currencyCode ?? ""), pending.currency || "TRY"].filter(Boolean))];
  for (const amount of tutarlar) for (const currency of kurlar) {
    const h = responseHash({
      cardOrganization: cb.cardOrganization, cardBrand: cb.cardBrand, cardType: cb.cardType,
      maskedNumber: cb.maskedNumber, installmentCount: cb.installmentCount ?? pending.installmentCount,
      currency, amount, orderId: cb.orderId, systemTime: cb.systemTime, status: cb.success
    });
    if (esit(h, cb.hashedData)) return true;
  }
  return false;
}

const truthy = (v) => v === true || String(v).toLowerCase() === "true";

module.exports = {
  cfg, PATHS, authToken, securityHash, ready,
  post, checkCard, luhn, authBody, responseHash, verifyCallback, truthy
};

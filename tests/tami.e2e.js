// tami uçtan uca test: sahte tami sunucusu + gerçek server.js (ağ gerekmez).
// Çalıştır: npm run test:tami — imza, kart doğrulama, kart verisinin diske
// düşmemesi, sahte dönüşün reddi, tutar uyuşmazlığı ve başarılı ödeme.
const http = require("http"), crypto = require("crypto"), fs = require("fs"), os = require("os"), path = require("path"), assert = require("assert");
const REPO = path.join(__dirname, ".."), DATA = fs.mkdtempSync(path.join(os.tmpdir(), "gesm-tami-"));
const M = "77006950", T = "84006953", SEC = "test-secret", KID = "kid-1", K = "1pMeYKQb3SD79LJR5GLbuLh9wM52oGdfbkjxysTx6C4-7Sh16ElfZ94TTFdUEzeHFPP4eyf1-0QCW4wZGbgnyw";
let seen = {};
const mock = http.createServer((req, res) => {
  let b = ""; req.on("data", c => b += c); req.on("end", () => {
    const j = JSON.parse(b); seen[req.url] = { headers: req.headers, body: j };
    const tok = M + ":" + T + ":" + crypto.createHash("sha256").update(M + T + SEC).digest("base64");
    assert.strictEqual(req.headers["pg-auth-token"], tok, "auth token");
    assert.strictEqual(req.headers["pg-api-version"], "v3");
    // securityHash: payload = body without securityHash
    const { securityHash, ...rest } = j;
    const [h, p, s] = securityHash.split(".");
    assert.strictEqual(Buffer.from(p, "base64url").toString(), JSON.stringify(rest), "payload");
    const sig = crypto.createHmac("sha512", Buffer.from(K, "base64url")).update(h + "." + p).digest("base64url");
    assert.strictEqual(s, sig, "imza");
    res.setHeader("Content-Type", "application/json");
    if (req.url === "/payment/auth") {
      return res.end(JSON.stringify({ success: true, orderId: j.orderId, amount: j.amount, currency: "TRY",
        card: { maskedNumber: "4824-9105-xxxx-xx14", cardBrand: "GARANTI", cardOrganization: "VISA", cardType: "CREDIT" },
        threeDSHtmlContent: Buffer.from("<html><body>BANKA3D</body></html>").toString("base64") }));
    }
    if (req.url === "/payment/complete-3ds") {
      return res.end(JSON.stringify({ success: true, orderId: j.orderId, amount: global.AMT, currency: "TRY",
        bankAuthCode: "471xxx", bankReferenceNumber: "5222134", installmentCount: 1 }));
    }
    res.statusCode = 404; res.end("{}");
  });
});
mock.listen(0, async () => {
  Object.assign(process.env, { PORT: "39811", KUR_AUTO_URL: "http://127.0.0.1:1/", DATA_DIR: DATA, TAMI_MERCHANT_NUMBER: M, TAMI_TERMINAL_NUMBER: T,
    TAMI_SECRET_KEY: SEC, TAMI_KID: KID, TAMI_K: K, TAMI_BASE_URL: "http://127.0.0.1:" + mock.address().port, AUTO_KUR: "false" });
  require(path.join(REPO, "server.js"));
  await new Promise(r => setTimeout(r, 800));
  const B = "http://127.0.0.1:39811";
  const J = (u, o) => fetch(B + u, { ...o, headers: { "Content-Type": "application/json" } }).then(r => r.json());
  const cfg = await J("/api/config"); assert.strictEqual(cfg.payments.tami, true, "tami açık");
  const prods = await J("/api/products"); const p = prods.find(x => x.inStock !== false && x.saleUsd > 0) || prods[0];
  const ord = await J("/api/orders", { method: "POST", body: JSON.stringify({ name: "Ali Veli Test", phone: "0543 111 22 33", addr: "Manavgat", email: "a@b.co", pay: "kart", items: [{ id: p.id, qty: 2 }] }) });
  global.AMT = ord.total;
  const CARD = "4824910501747014";
  // geçersiz kart → 400
  let r = await fetch(B + "/api/pay/tami/init", { method: "POST", body: JSON.stringify({ no: ord.no, card: { holderName: "Ali Veli", number: "4824910501747015", expireMonth: 4, expireYear: 2030, cvv: "123" } }) });
  assert.strictEqual(r.status, 400);
  const init = await J("/api/pay/tami/init", { method: "POST", body: JSON.stringify({ no: ord.no, card: { holderName: "Ali Veli", number: CARD, expireMonth: 4, expireYear: 30, cvv: "123" } }) });
  assert.ok(init.ok && init.html.includes("BANKA3D"), "3D html");
  const ab = seen["/payment/auth"].body;
  assert.strictEqual(ab.amount, ord.total); assert.strictEqual(ab.card.expireYear, 2030);
  assert.strictEqual(ab.basket.basketItems.reduce((s, i) => s + i.totalPrice, 0), ord.total, "sepet=tutar");
  const oid = ab.orderId; assert.strictEqual(oid, ord.no + "-1");
  // kart verisi diske düşmemeli
  const disk = fs.readFileSync(path.join(DATA, "orders.json"), "utf8");
  assert.ok(!disk.includes(CARD) && !disk.includes('"cvv"'), "kart diske yazılmamalı");
  // callback: sahte hash → hata, ödendi değil
  const cb = { cardOrganization: "VISA", cardBrand: "GARANTI", cardType: "CREDIT", maskedNumber: "4824-9105-xxxx-xx14",
    installmentCount: "1", currencyCode: "TRY", txnAmount: String(ord.total), orderId: oid, systemTime: "2026-10-08T10:00:00.1", success: "true", mdStatus: "1" };
  const post = (f) => fetch(B + "/api/pay/tami/callback", { method: "POST", redirect: "manual",
    headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(f).toString() });
  r = await post({ ...cb, hashedData: "AAAA" });
  assert.match(r.headers.get("location"), /durum=hata/);
  assert.ok(!seen["/payment/complete-3ds"], "sahte dönüşte tamamlama çağrılmamalı");
  // geçerli hash (tutar "1234.00" biçimiyle)
  const data = cb.cardOrganization + cb.cardBrand + cb.cardType + cb.maskedNumber + "1" + "TRY" + ord.total.toFixed(2) + oid + cb.systemTime + "true";
  const hd = crypto.createHmac("sha256", SEC).update(data).digest("base64");
  r = await post({ ...cb, txnAmount: ord.total.toFixed(2), hashedData: hd });
  assert.match(r.headers.get("location"), new RegExp("durum=basarili&no=" + ord.no));
  assert.strictEqual(seen["/payment/complete-3ds"].body.orderId, oid);
  const o = JSON.parse(fs.readFileSync(path.join(DATA, "orders.json"), "utf8")).find(x => x.no === ord.no);
  assert.ok(o.odendi && o.paymentId === "5222134" && o.tami.maskedNumber.includes("xxxx"));
  // tekrar başlatma → zaten ödendi
  r = await fetch(B + "/api/pay/tami/init", { method: "POST", body: JSON.stringify({ no: ord.no, card: { holderName: "Ali Veli", number: CARD, expireMonth: 4, expireYear: 30, cvv: "123" } }) });
  assert.strictEqual(r.status, 400);
  // tutar uyuşmazsa ödendi sayılmaz
  const ord2 = await J("/api/orders", { method: "POST", body: JSON.stringify({ name: "B C", phone: "05431112233", addr: "X", email: "a@b.co", pay: "kart", items: [{ id: p.id, qty: 1 }] }) });
  await J("/api/pay/tami/init", { method: "POST", body: JSON.stringify({ no: ord2.no, card: { holderName: "B C", number: CARD, expireMonth: 4, expireYear: 30, cvv: "123" } }) });
  global.AMT = ord2.total + 5;
  const oid2 = ord2.no + "-1", cb2 = { ...cb, orderId: oid2, txnAmount: String(ord2.total) };
  cb2.hashedData = crypto.createHmac("sha256", SEC).update(cb.cardOrganization + cb.cardBrand + cb.cardType + cb.maskedNumber + "1TRY" + String(ord2.total) + oid2 + cb.systemTime + "true").digest("base64");
  r = await post(cb2); assert.match(r.headers.get("location"), /durum=hata/);
  assert.ok(!JSON.parse(fs.readFileSync(path.join(DATA, "orders.json"), "utf8")).find(x => x.no === ord2.no).odendi);
  console.log("TÜM TAMI TESTLERİ GEÇTİ ✔ toplam", ord.total);
  process.exit(0);
});
setTimeout(() => { console.error("zaman aşımı"); process.exit(1); }, 20000);

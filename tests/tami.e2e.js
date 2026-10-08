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
    if (req.url === "/installment/installment-info") {
      return res.end(JSON.stringify({ success: true, bankName: "GARANTI BBVA", cardType: "CREDIT", cardOrg: "VISA",
        rewardType: "Bonus", isInstallment: j.binNumber.startsWith("4824") }));
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
  // --- TAKSİT ---
  const tb = await J("/api/pay/tami/taksit", { method: "POST", body: JSON.stringify({ bin: "48249105" }) });
  assert.ok(tb.ok && tb.taksit === true && tb.program === "Bonus", "taksit sorgu");
  r = await fetch(B + "/api/pay/tami/taksit", { method: "POST", body: JSON.stringify({ bin: "4824" }) });
  assert.strictEqual(r.status, 400, "eksik BIN");
  global.GESM.config.payments.taksit.farkPct[3] = 4.5;
  const ord3 = await J("/api/orders", { method: "POST", body: JSON.stringify({ name: "T K", phone: "05431112233", addr: "X", email: "a@b.co", pay: "kart", items: [{ id: p.id, qty: 3 }] }) });
  const KRT = { holderName: "T K", number: CARD, expireMonth: 4, expireYear: 30, cvv: "123" };
  r = await fetch(B + "/api/pay/tami/init", { method: "POST", body: JSON.stringify({ no: ord3.no, card: KRT, taksit: 7 }) });
  assert.strictEqual(r.status, 400, "listede olmayan taksit");
  r = await fetch(B + "/api/pay/tami/init", { method: "POST", body: JSON.stringify({ no: ord3.no, card: { ...KRT, number: "5421190122944522" }, taksit: 3 }) });
  assert.strictEqual((await r.json()).error, "taksit_yok", "taksitsiz kart");
  const i3 = await J("/api/pay/tami/init", { method: "POST", body: JSON.stringify({ no: ord3.no, card: KRT, taksit: 3 }) });
  assert.ok(i3.ok);
  const b3 = seen["/payment/auth"].body, beklenen = Math.round((ord3.total + Math.round(ord3.total * 4.5) / 100) * 100) / 100;
  assert.strictEqual(b3.installmentCount, 3); assert.strictEqual(b3.amount, beklenen, "vade farklı tutar");
  assert.strictEqual(Math.round(b3.basket.basketItems.reduce((s, i) => s + i.totalPrice, 0) * 100) / 100, beklenen, "sepet=tutar (vade farkı kalemi)");
  assert.ok(b3.basket.basketItems.some((i) => i.itemId === "vade-farki"));
  global.AMT = beklenen;
  const cb3 = { ...cb, orderId: b3.orderId, installmentCount: "3", txnAmount: String(beklenen) };
  cb3.hashedData = crypto.createHmac("sha256", SEC).update(cb.cardOrganization + cb.cardBrand + cb.cardType + cb.maskedNumber + "3TRY" + String(beklenen) + b3.orderId + cb.systemTime + "true").digest("base64");
  r = await post(cb3); assert.match(r.headers.get("location"), /durum=basarili/, "taksitli ödeme");
  const o3 = JSON.parse(fs.readFileSync(path.join(DATA, "orders.json"), "utf8")).find(x => x.no === ord3.no);
  assert.ok(o3.odendi && o3.tami.installmentCount === 3 && o3.tami.vadeFarki > 0);
  console.log("TÜM TAMI TESTLERİ GEÇTİ ✔ toplam", ord.total, "· 3 taksit", beklenen);
  process.exit(0);
});
setTimeout(() => { console.error("zaman aşımı"); process.exit(1); }, 20000);

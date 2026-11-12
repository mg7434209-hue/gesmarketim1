// Gespa OS özeti: belirteçle açılır, salt okunur, siparişteki kişisel veri ÇIKMAZ.
const assert = require("node:assert/strict");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.join(__dirname, "..");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gesm-os-"));
const TOKEN = "os-test-belirteci-0123456789abcdefghij", PASS = "test-yonetici-sifresi";
fs.writeFileSync(path.join(dir, "orders.json"), JSON.stringify([{
  no: "GM12345678", createdAt: new Date().toISOString(), name: "Ayşe Gizli", phone: "05551112233",
  email: "ayse@example.com", addr: "Gizli Sok. 1", note: "kapıcıya bırakın", pay: "havale",
  items: [{ id: "x", code: "LX-1", name: "Panel", qty: 2, tl: 1000 }], subtotal: 2000, shipping: 0,
  total: 1940, done: false, odendi: false, paymentId: null
}]));
const port = 4391, ingestPort = 4392, INGEST = "defter-test-belirteci-0123456789abcdef";
// Sahte Gespa OS: sipariş defteri gönderimlerini toplar
const got = [];
const ingest = require("node:http").createServer((rq, rs) => {
  let b = ""; rq.on("data", (c) => (b += c));
  rq.on("end", () => { got.push({ url: rq.url, token: rq.headers["x-ingest-token"], raw: b }); rs.end("{}"); });
}).listen(ingestPort);
const srv = spawn(process.execPath, ["server.js"], {
  cwd: root, env: { ...process.env, PORT: String(port), DATA_DIR: dir, AUTO_KUR: "false", OS_TOKEN: TOKEN, ADMIN_PASS: PASS,
    OS_INGEST_URL: `http://127.0.0.1:${ingestPort}/`, OS_INGEST_TOKEN: INGEST }
});
let out = "";
srv.stdout.on("data", (d) => (out += d)); srv.stderr.on("data", (d) => (out += d));
const fail = (e) => { srv.kill(); ingest.close(); console.error(out); console.error(e); process.exit(1); };
setTimeout(() => fail(new Error("sunucu açılmadı")), 15000).unref();

(async () => {
  for (let i = 0; i < 50; i++) {
    try { await fetch(`http://127.0.0.1:${port}/api/config`); break; } catch { await new Promise((r) => setTimeout(r, 200)); }
  }
  const u = `http://127.0.0.1:${port}/api/os/summary`;
  let r = await fetch(u); assert.equal(r.status, 403, "belirteçsiz 403");
  r = await fetch(u, { headers: { "X-OS-Token": PASS } }); assert.equal(r.status, 403, "yönetici şifresi OS belirteci değil");
  r = await fetch(u, { method: "POST", headers: { "X-OS-Token": TOKEN } }); assert.equal(r.status, 405, "salt okunur");
  r = await fetch(u, { headers: { "X-OS-Token": TOKEN } }); assert.equal(r.status, 200);
  const raw = await r.text(), j = JSON.parse(raw);
  assert.equal(j.orders.count, 1); assert.equal(j.orders.unpaid, 1);
  assert.deepEqual(j.orders.items[0].items, [{ id: "x", code: "LX-1", name: "Panel", qty: 2 }]);
  for (const leak of ["Ayşe Gizli", "05551112233", "ayse@example.com", "Gizli Sok", "kapıcıya"]) assert.ok(!raw.includes(leak), "sızıntı: " + leak);
  assert.ok(j.catalog.count > 0 && Array.isArray(j.catalog.outOfStock) && Array.isArray(j.catalog.noImage));
  assert.ok(j.kur.usdTry > 0 && "count" in j.visitors);

  // Sipariş defteri: açılışta dosyadaki sipariş, sonra "ödendi" işareti yeniden gider
  const wait = async (n) => { for (let i = 0; i < 80 && got.length < n; i++) await new Promise((r) => setTimeout(r, 150)); };
  await wait(1);
  assert.equal(got.length, 1, "açılışta defter gönderimi"); assert.equal(got[0].url, "/api/ingest/orders"); assert.equal(got[0].token, INGEST);
  let g = JSON.parse(got[0].raw);
  assert.equal(g.site, "gesmarketim");
  assert.deepEqual(g.orders[0], { ref: "GM12345678", channel: "havale", status: "pending", fulfilled: false,
    createdAt: g.orders[0].createdAt, totalTL: 1940, paidTL: null, taksit: null,
    items: [{ id: "x", name: "Panel", qty: 2, unitTL: 1000 }] });
  r = await fetch(`http://127.0.0.1:${port}/api/admin/order-status`, { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pass: PASS, no: "GM12345678", odendi: true }) });
  assert.equal(r.status, 200, "yönetici ödendi işareti");
  await wait(2);
  assert.equal(got.length, 2, "durum değişince yeniden gönderim");
  g = JSON.parse(got[1].raw); assert.equal(g.orders[0].status, "paid"); assert.equal(g.orders[0].paidTL, 1940);
  await new Promise((r) => setTimeout(r, 1500));
  assert.equal(got.length, 2, "değişiklik yokken tekrar göndermez");
  for (const x of got) for (const leak of ["Ayşe Gizli", "05551112233", "ayse@example.com", "Gizli Sok", "kapıcıya"]) assert.ok(!x.raw.includes(leak), "defter sızıntısı: " + leak);
  srv.kill(); ingest.close();
  console.log("os özeti + sipariş defteri: belirteç, salt okuma ve kişisel veri denetimi geçti");
})().catch(fail);

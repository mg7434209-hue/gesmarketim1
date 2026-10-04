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
const port = 4391;
const srv = spawn(process.execPath, ["server.js"], {
  cwd: root, env: { ...process.env, PORT: String(port), DATA_DIR: dir, AUTO_KUR: "false", OS_TOKEN: TOKEN, ADMIN_PASS: PASS }
});
let out = "";
srv.stdout.on("data", (d) => (out += d)); srv.stderr.on("data", (d) => (out += d));
const fail = (e) => { srv.kill(); console.error(out); console.error(e); process.exit(1); };
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
  srv.kill();
  console.log("os özeti: belirteç, salt okuma ve kişisel veri denetimi geçti");
})().catch(fail);

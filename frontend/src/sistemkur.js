// Sistem Kur v2 — asistan/hesap/lead API katmanı + yerel katalog eşleme.
//
// Uçlar aynı origin'dedir; server.js bunları gesmarketim backend'ine proxy'ler
// (SISTEMKUR_API env). Fiyat BU DOSYAYA GÖMÜLMEZ: teklif satırları yerel
// katalog ürünlerine eşlenir ve ekranda YEREL priceTL() fiyatı gösterilir
// (kural: tüm fiyatlar canlı /api/products verisinden).

/* ---------- API ---------- */

export class AsistanKapaliError extends Error {
  constructor(message) { super(message || "asistan_kapali"); this.name = "AsistanKapaliError"; }
}
export class SistemKurApiError extends Error {
  constructor(message, status) { super(message); this.name = "SistemKurApiError"; this.status = status; }
}

async function postJson(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  let data = null;
  try { data = await res.json(); } catch { /* gövdesiz yanıt */ }
  if (!res.ok) {
    if (res.status === 503 || (data && data.error === "asistan_kapali")) {
      throw new AsistanKapaliError(data && data.message);
    }
    throw new SistemKurApiError(
      (data && data.message) || "İstek başarısız (" + res.status + "). Lütfen tekrar deneyin.",
      res.status,
    );
  }
  return data;
}

/** Deterministik boyutlandırma — backend /api/hesapla. */
export function hesaplaApi(input) { return postJson("/api/hesapla", input); }

/** AI danışman — 15-30 sn sürebilir; çağıran iskelet gösterir. gecmis ≤ 10 tur. */
export function asistanSor(mesaj, gecmis) {
  return postJson("/api/asistan", { mesaj, gecmis: (gecmis || []).slice(-10) });
}

/** Lead kaydı (tip: dogrulama | whatsapp | pdf). website = honeypot. */
export function leadGonder(payload) { return postJson("/api/leads", payload); }

/* ---------- Senaryo eşlemesi ---------- */
// Yerel preset id'leri ↔ backend hesapla senaryo enum'u
export const SENARYO_MAP = {
  karavan: "karavan",
  bagevi: "bag_evi",
  ev: "mustakil_ev",
  ticari: "isletme",
  sulama: "tarimsal_sulama",
};

/* ---------- Teklif satırı → yerel katalog eşleme ---------- */
// Backend katalogu ile site katalogu aynı Lexron listesinden gelir ama id/slug
// biçimleri farklıdır → normalize edilmiş AD ile eşleşir. Eşleşmeyen satır
// sepete EKLENMEZ (yanlış ürün, eşleşmemekten kötü).

function norm(s) {
  return String(s || "")
    .toLocaleUpperCase("tr-TR")
    .replace(/LEXRON/g, "")
    .replace(/[İI]/g, "I")
    .replace(/Ğ/g, "G").replace(/Ü/g, "U").replace(/Ş/g, "S")
    .replace(/Ö/g, "O").replace(/Ç/g, "C")
    .replace(/[^A-Z0-9]/g, "");
}

/** Üründeki W/KW değerini addan okur (25.6V gibi voltlar sayılmaz). */
export function wattFromName(name) {
  const m = /(\d+(?:[.,]\d+)?)\s*(K?)W(?![A-Za-zĞÜŞİÖÇğüşiöç])/i.exec(String(name || ""));
  if (!m) return null;
  const n = Number(m[1].replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return m[2] ? n * 1000 : n;
}

function ahFromName(name) {
  const m = /(\d+(?:[.,]\d+)?)\s*AH(?![A-Za-z])/i.exec(String(name || ""));
  return m ? Number(m[1].replace(",", ".")) : null;
}

/** Teklif satırını (backend ürün adı) yerel katalog ürününe eşle; yoksa null. */
export function matchLocalProduct(teklifSatiri, products) {
  const hedef = norm(teklifSatiri.ad);
  if (!hedef) return null;
  const uygun = (p) => p.inStock !== false;

  // 1) Birebir normalize eşleşme
  let hit = products.find((p) => uygun(p) && norm(p.name) === hedef);
  if (hit) return hit;

  // 2) Kapsama eşleşmesi (biri diğerini içerir) — en kısa ad farkını seç
  let best = null, bestDiff = Infinity;
  for (const p of products) {
    if (!uygun(p)) continue;
    const n = norm(p.name);
    if (!n) continue;
    if (n.includes(hedef) || hedef.includes(n)) {
      const diff = Math.abs(n.length - hedef.length);
      if (diff < bestDiff) { best = p; bestDiff = diff; }
    }
  }
  if (best) return best;

  // 3) Aynı watt + Ah imzası (ör. "100AH 25.6V LİTYUM" farklı sözcük sırasıyla)
  const w = wattFromName(teklifSatiri.ad);
  const ah = ahFromName(teklifSatiri.ad);
  if (w || ah) {
    const tip = /PANEL/i.test(teklifSatiri.ad) ? "panel"
      : /INVERTER|İNVERTER/i.test(teklifSatiri.ad) ? "inverter"
        : /AKÜ|AKU|BATARYA|LITYUM|LİTYUM|JEL/i.test(teklifSatiri.ad) ? "aku" : null;
    hit = products.find((p) => {
      if (!uygun(p)) return false;
      if (w && wattFromName(p.name) !== w) return false;
      if (ah && ahFromName(p.name) !== ah) return false;
      if (tip === "panel" && !/PANEL/i.test(p.name)) return false;
      if (tip === "inverter" && !/INVERTER|İNVERTER/i.test(p.name)) return false;
      if (tip === "aku" && !/AKÜ|AKU|BATARYA/i.test(p.name)) return false;
      return Boolean(w || ah);
    });
    if (hit) return hit;
  }
  return null;
}

/** Teklifteki panel satırlarından toplam panel W tahmini (10 kW vurgusu için). */
export function teklifPanelWatt(satirlar) {
  let toplam = 0;
  for (const u of satirlar || []) {
    if (!/panel/i.test(u.ad)) continue;
    const w = wattFromName(u.ad);
    if (w) toplam += w * (u.adet || 1);
  }
  return toplam;
}

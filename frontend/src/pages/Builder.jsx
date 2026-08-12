// Sistem Kurucu — eski app.js pageBuilder() mantığının React portu.
// TÜM katsayılar /api/config → config.builder'dan gelir; koda sayı gömülmez.
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useStore, priceTL, havaleTL, fmtTL, cartGet, cartAdd, waLink } from "../api.js";
import { useSeo } from "../hooks.js";
import { PlaceholderImg } from "../components/ui.jsx";

const BLD_KEY = "gesm.builder";

export default function Builder() {
  const store = useStore();
  const B = store.config.builder;
  const [sp] = useSearchParams();
  useSeo({
    title: "Sistem Kurucu — Kendi Solar Projenizi Oluşturun | " + store.config.company.brand,
    description: "Cihazlarınızı seçin; panel, akü ve inverteri yapay zekâ destekli sihirbazla saniyeler içinde boyutlandırın.",
  });

  const byId = (ref) => store.products.find((p) => p.id === ref);
  const presetOf = (id) => B.presets.find((p) => p.id === id) || B.presets[0];
  const existingPanels = (list) =>
    (list || []).filter((r) => { const p = byId(r); return p && B.catalog.panels[r] && p.inStock !== false; });

  // Durum: localStorage + ?profil=/?tip= ön seçimi
  const [st, setSt] = useState(() => {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(BLD_KEY)) || {}; } catch { /* boş */ }
    const tip = sp.get("profil") || sp.get("tip");
    if (tip && presetOf(tip).id === tip && s.tip !== tip) s = { tip };
    if (!s.tip || presetOf(s.tip).id !== s.tip) s.tip = B.presets[0].id;
    return ensure(s);
  });
  useEffect(() => { localStorage.setItem(BLD_KEY, JSON.stringify(st)); }, [st]);

  function ensure(s) {
    const p = presetOf(s.tip);
    const out = { ...s };
    if (!out.items) out.items = { ...p.items };
    if (!out.chem) out.chem = p.chem;
    const panels = existingPanels(p.panels);
    if (!out.panelRef || !panels.includes(out.panelRef)) out.panelRef = panels[0] || null;
    out.qtyOv = out.qtyOv || {};
    return out;
  }

  const preset = presetOf(st.tip);
  const SZ = B.sizing;

  /* ---------- hesap (eski calc() birebir) ---------- */
  const c = useMemo(() => {
    let dailyWh = 0, contW = 0, maxSurge = 0, anySelected = false;
    B.appliances.forEach((a) => {
      const q = st.items[a.id] || 0; if (!q) return;
      anySelected = true;
      dailyWh += q * a.w * a.h;
      contW += q * a.w;
      maxSurge = Math.max(maxSurge, a.w * (a.surge || 1));
    });
    const invW = Math.max(contW * SZ.simultaneity, maxSurge) * SZ.surgeHeadroom;
    const kwp = dailyWh / (SZ.sunHours * SZ.systemEff) / 1000;

    const invOk = (cd) => { const p = byId(cd.ref); return p && p.inStock !== false; };
    let inv = B.catalog.inverters.find((cd) => invOk(cd) && cd.kw * 1000 >= invW) || null;
    if (!inv) inv = [...B.catalog.inverters].reverse().find(invOk) || null;

    const panelW = st.panelRef ? B.catalog.panels[st.panelRef] : 0;
    const panelQty = panelW ? Math.max(1, Math.ceil((kwp * 1000) / panelW - 0.05)) : 0;

    const dod = SZ.dod[st.chem] || 0.8;
    const needWh = (dailyWh * preset.autonomyDays) / dod / SZ.invEff;
    let bat = null, batQty = 0, batCost = Infinity;
    if (inv) {
      B.catalog.batteries.forEach((b) => {
        const bp = byId(b.ref);
        if (b.chem !== st.chem || !bp || bp.inStock === false) return;
        const seriesOf = inv.v / b.v;
        if (seriesOf < 1 || seriesOf % 1 !== 0) return;
        let units = Math.max(seriesOf, Math.ceil(needWh / b.wh));
        units = Math.ceil(units / seriesOf) * seriesOf;
        const cost = units * priceTL(bp, store);
        if (cost < batCost) { bat = b; batQty = units; batCost = cost; }
      });
    }

    const cableQty = Math.round(SZ.cableBaseM + SZ.cablePerKwM * kwp);
    return { anySelected, dailyWh, invW, kwp, inv, panelQty, bat, batQty, needWh, cableQty };
  }, [st, store.products]);

  /* ---------- öneri satırları ---------- */
  const lines = useMemo(() => {
    const out = [];
    if (st.panelRef && c.panelQty) out.push(["panel", st.panelRef, c.panelQty, "Güneş paneli"]);
    if (c.bat) out.push(["bat", c.bat.ref, c.batQty, "Akü (" + (st.chem === "jel" ? "jel" : "LiFePO4") + ")"]);
    if (c.inv) out.push(["inv", c.inv.ref, 1, "Akıllı inverter (MPPT dahili)"]);
    if (B.catalog.extras.cable && byId(B.catalog.extras.cable) && c.cableQty)
      out.push(["cable", B.catalog.extras.cable, c.cableQty, "Solar kablo (metre)"]);
    if (B.catalog.extras.mc4 && byId(B.catalog.extras.mc4) && c.panelQty)
      out.push(["mc4", B.catalog.extras.mc4, c.panelQty, "MC4 konnektör (çift)"]);
    return out.map(([key, ref, auto, role]) => ({
      key, ref, role, auto,
      qty: st.qtyOv[key] != null ? st.qtyOv[key] : auto,
      p: byId(ref),
    })).filter((l) => l.p);
  }, [st, c, store.products]);

  const total = lines.reduce((s, l) => s + priceTL(l.p, store) * l.qty, 0);
  const panels = existingPanels(preset.panels);
  const [toast, setToast] = useState("");

  const addAll = () => {
    let n = 0;
    lines.forEach((l) => { if (l.qty > 0) { cartAdd(l.ref, l.qty); n += l.qty; } });
    void cartGet();
    setToast(n + " ürün sepete eklendi — sepetten sipariş verebilirsiniz.");
    setTimeout(() => setToast(""), 3500);
  };

  const waMsg = "Merhaba! Sistem Kurucu ile " + preset.label + " projesi hazırladım:\n" +
    lines.filter((l) => l.qty > 0).map((l) => "• " + l.qty + " × " + l.p.name).join("\n") +
    "\nGünlük tüketim: " + (c.dailyWh / 1000).toFixed(1) + " kWh" +
    (total ? "\nTahmini toplam: " + fmtTL(total) : "") + "\nKesin teklif rica ediyorum.";

  const num = (v, d = 1) => v.toFixed(d).replace(".", ",");

  return (
    <div className="wrap py-8">
      <h1 className="text-2xl md:text-3xl">🛠️ Sistem Kurucu</h1>
      <p className="text-brand-ink/60 mt-1 mb-6 max-w-2xl">
        İhtiyaçtan siparişe: senaryonuzu seçin, cihazlarınızı işaretleyin —
        paneli, aküyü ve inverteri sizin için boyutlandıralım.
      </p>

      {/* 1) Senaryo */}
      <Step n="1" t="Kullanım senaryonuz">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {B.presets.map((p) => (
            <button key={p.id}
              onClick={() => setSt(ensure({ tip: p.id }))}
              className={"card p-4 text-left transition hover:-translate-y-0.5 " +
                (p.id === st.tip ? "ring-2 ring-brand-amber bg-brand-amber/10" : "")}>
              <span className="text-2xl">{p.icon}</span>
              <b className="block text-sm mt-1">{p.label}</b>
              <span className="text-xs text-brand-ink/60 leading-4 block mt-0.5">{p.desc}</span>
            </button>
          ))}
        </div>
      </Step>

      {/* 2) Cihazlar */}
      <Step n="2" t="Cihazlarınız ve adetleri">
        <div className="grid md:grid-cols-2 gap-2">
          {B.appliances.map((a) => {
            const q = st.items[a.id] || 0;
            return (
              <div key={a.id} className={"card px-3 py-2.5 flex items-center gap-3 " + (q ? "ring-1 ring-brand-green/50" : "")}>
                <span className="text-xl">{a.icon}</span>
                <span className="grow text-sm">
                  {a.name}
                  <span className="text-brand-ink/50 text-xs"> · {a.w} W × {String(a.h).replace(".", ",")} sa/gün</span>
                </span>
                <span className="flex items-center border border-surface-line rounded-btn">
                  <button className="px-2.5 py-1 font-bold" aria-label="Azalt"
                    onClick={() => setSt((s) => ({ ...s, items: { ...s.items, [a.id]: Math.max(0, q - 1) }, qtyOv: {} }))}>−</button>
                  <b className="w-7 text-center text-sm">{q}</b>
                  <button className="px-2.5 py-1 font-bold" aria-label="Artır"
                    onClick={() => setSt((s) => ({ ...s, items: { ...s.items, [a.id]: q + 1 }, qtyOv: {} }))}>+</button>
                </span>
              </div>
            );
          })}
        </div>
      </Step>

      {/* 3) İhtiyaç */}
      <Step n="3" t="Hesaplanan ihtiyacınız">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            [num(c.dailyWh / 1000) + " kWh", "günlük tüketim"],
            [num(c.kwp, 2) + " kWp", "önerilen panel gücü"],
            [num(c.needWh / 1000) + " kWh", "akü bankası"],
            [num(c.invW / 1000) + " kW", "inverter gücü"],
          ].map(([v, l]) => (
            <div key={l} className="card p-4 text-center">
              <b className="text-xl text-[#9a6a12]">{v}</b>
              <span className="block text-xs text-brand-ink/60 mt-1">{l}</span>
            </div>
          ))}
        </div>
      </Step>

      {/* 4) Seçenekler */}
      <Step n="4" t="Tercihleriniz">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex rounded-btn border border-surface-line overflow-hidden">
            {[["lityum", "LiFePO4 · uzun ömür"], ["jel", "Jel · ekonomik"]].map(([v, l]) => (
              <button key={v}
                onClick={() => setSt((s) => { const q = { ...s.qtyOv }; delete q.bat; return { ...s, chem: v, qtyOv: q }; })}
                className={"px-4 py-2 text-sm font-semibold " +
                  (st.chem === v ? "bg-brand-amber text-[#3d3005]" : "bg-surface-card")}>
                {l}
              </button>
            ))}
          </div>
          {panels.length > 1 && (
            <select className="input max-w-xs" value={st.panelRef || ""} aria-label="Panel modeli"
              onChange={(e) => setSt((s) => { const q = { ...s.qtyOv }; delete q.panel; delete q.mc4; return { ...s, panelRef: e.target.value, qtyOv: q }; })}>
              {panels.map((r) => <option key={r} value={r}>{byId(r).name}</option>)}
            </select>
          )}
        </div>
      </Step>

      {/* 5) Önerilen sistem */}
      <Step n="5" t="Önerilen sisteminiz">
        {!c.anySelected ? (
          <p className="text-brand-ink/60">Cihaz seçince önerilen sistem burada listelenir.</p>
        ) : (
          <>
            <div className="space-y-2">
              {lines.map((l) => (
                <div key={l.key} className="card p-3 flex items-center gap-3">
                  <Link to={"/urun/" + l.ref} className="w-16 h-14 shrink-0 rounded-btn overflow-hidden bg-surface-alt">
                    {l.p.img && l.p.img.length
                      ? <img src={"/" + l.p.img[0]} alt="" loading="lazy" className="w-full h-full object-cover" />
                      : <PlaceholderImg product={l.p} className="w-full h-full" />}
                  </Link>
                  <div className="grow min-w-0">
                    <span className="text-xs text-brand-ink/50">{l.role}</span>
                    <Link to={"/urun/" + l.ref} className="block font-semibold text-sm leading-snug hover:text-brand-blue line-clamp-2">
                      {l.p.name}
                    </Link>
                    <span className="text-xs text-brand-ink/60">{fmtTL(priceTL(l.p, store))} × {l.qty}</span>
                  </div>
                  <span className="flex items-center border border-surface-line rounded-btn shrink-0">
                    <button className="px-2.5 py-1 font-bold" aria-label="Azalt"
                      onClick={() => setSt((s) => ({ ...s, qtyOv: { ...s.qtyOv, [l.key]: Math.max(l.key === "inv" ? 1 : 0, l.qty - 1) } }))}>−</button>
                    <b className="w-7 text-center text-sm">{l.qty}</b>
                    <button className="px-2.5 py-1 font-bold" aria-label="Artır"
                      onClick={() => setSt((s) => ({ ...s, qtyOv: { ...s.qtyOv, [l.key]: l.qty + 1 } }))}>+</button>
                  </span>
                  <b className="w-24 text-right shrink-0">{fmtTL(priceTL(l.p, store) * l.qty)}</b>
                  {l.qty !== l.auto && (
                    <button className="text-xs text-brand-blue hover:underline shrink-0" title="Önerilen adede dön"
                      onClick={() => setSt((s) => { const q = { ...s.qtyOv }; delete q[l.key]; return { ...s, qtyOv: q }; })}>
                      ↺ {l.auto}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="card p-5 mt-4 max-w-xl">
              <div className="flex justify-between text-lg font-extrabold">
                <span>Sistem toplamı</span><span className="text-[#9a6a12]">{fmtTL(total)}</span>
              </div>
              <div className="flex justify-between text-sm text-brand-green font-semibold mt-1">
                <span>💰 Havale/EFT ile</span>
                <span>{fmtTL(havaleTL(total, store))} (%{store.config.commerce.havaleDiscountPct} indirimli)</span>
              </div>
              <p className="text-xs text-brand-ink/60 mt-2">
                KDV dahil · kargo hariç · fiyatlar tahmini liste fiyatıdır, kesin teklif için bize ulaşın.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <button className="btn btn-primary grow" onClick={addAll}>🛒 Hepsini Sepete Ekle</button>
                <a className="btn btn-wa grow" target="_blank" rel="noopener noreferrer" href={waLink(store, waMsg)}>
                  WhatsApp ile Teklif İste
                </a>
              </div>
              {toast && <p className="text-sm text-brand-green mt-3">✓ {toast} <Link to="/sepet" className="underline">Sepete git →</Link></p>}
            </div>
          </>
        )}
      </Step>
    </div>
  );
}

function Step({ n, t, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg mb-3 flex items-center gap-2">
        <span className="w-7 h-7 rounded-full bg-brand-amber text-[#3d3005] text-sm flex items-center justify-center font-extrabold">{n}</span>
        {t}
      </h2>
      {children}
    </section>
  );
}

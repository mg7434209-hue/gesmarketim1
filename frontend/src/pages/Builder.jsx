// Sistem Kur v2 — /hesaplayici (rota ve menü adı değişmedi)
//
// Üç katman:
//  1) HERO doğal dil girişi → /api/asistan (server.js → gesmarketim backend
//     proxy'si). tip=soru → sohbet balonu; tip=teklif → teklif kartı.
//  2) "veya hazır senaryodan başlayın" → mevcut sihirbaz (küçültülmüş senaryo
//     kartları). Tarımsal sulamada cihaz listesi YOK: pompa HP + günlük saat
//     → /api/hesapla. Karavan/bağ evi: Minimal/Standart/Konforlu profilleri +
//     "özelleştir" ile detay listesi. Müstakil ev/işletme: detay listesi.
//  3) Sonucun altında uyarı + ücretsiz proje doğrulaması (→ /api/leads).
//
// Fiyat kuralı: teklif satırları YEREL kataloğa eşlenir ve priceTL() ile
// gösterilir — koda fiyat gömülmez; eşleşmeyen satır sepete eklenmez.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useStore, priceTL, havaleTL, fmtTL, cartGet, cartAdd, waLink } from "../api.js";
import { useSeo } from "../hooks.js";
import { PlaceholderImg } from "../components/ui.jsx";
import {
  asistanSor, hesaplaApi, leadGonder, matchLocalProduct, teklifPanelWatt,
  SENARYO_MAP, AsistanKapaliError, SistemKurApiError,
} from "../sistemkur.js";

const BLD_KEY = "gesm.builder";
const ORNEKLER = [
  "Bağ evinde buzdolabı, 5 lamba, akşam 3 saat TV",
  "10 beygir pompam var, günde 6 saat sulama",
];
const TEL_RE = /^[0-9+\s()-]{10,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Builder() {
  const store = useStore();
  const B = store.config.builder;
  const [sp] = useSearchParams();
  useSeo({
    title: "Sistem Kur — İhtiyacınıza Göre Güneş Enerjisi Sistemi | " + store.config.company.brand,
    description: "İhtiyacınızı yazın ya da senaryo seçin: panel, akü ve inverteri yapay zekâ destekli danışmanla boyutlandırın, canlı fiyatlarla paket teklifi alın.",
  });

  const byId = (ref) => store.products.find((p) => p.id === ref);
  const presetOf = (id) => B.presets.find((p) => p.id === id) || B.presets[0];
  const existingPanels = (list) =>
    (list || []).filter((r) => { const p = byId(r); return p && B.catalog.panels[r] && p.inStock !== false; });

  /* ================= Asistan sohbeti ================= */
  const [chat, setChat] = useState([]);
  const [mesaj, setMesaj] = useState("");
  const [busyAI, setBusyAI] = useState(false);
  const [asistanKapali, setAsistanKapali] = useState(false);
  const [aiHata, setAiHata] = useState("");
  const [teklif, setTeklif] = useState(null);
  const teklifRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (teklif) teklifRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [teklif]);
  useEffect(() => {
    if (chat.length || busyAI) chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [chat, busyAI]);

  async function gonder(text) {
    const temiz = String(text || "").trim();
    if (!temiz || busyAI) return;
    setAiHata("");
    setBusyAI(true);
    setMesaj("");
    const oncesi = chat;
    setChat([...oncesi, { rol: "user", metin: temiz }]);
    try {
      const y = await asistanSor(temiz, oncesi);
      setChat((c) => [...c, { rol: "asistan", metin: y.metin }]);
      if (y.tip === "teklif" && y.teklif) setTeklif(y.teklif);
    } catch (err) {
      if (err instanceof AsistanKapaliError) setAsistanKapali(true);
      else setAiHata(err instanceof SistemKurApiError ? err.message
        : "Şu an asistana ulaşılamıyor — hazır senaryolardan devam edebilirsiniz.");
      setChat(oncesi); // yanıtsız mesajı geri al
      setMesaj(temiz);
    } finally {
      setBusyAI(false);
    }
  }

  /* ================= Sihirbaz durumu ================= */
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
  const sulama = st.tip === "sulama";
  const profiller = preset.profiles || [];
  const [ozellestir, setOzellestir] = useState(false);
  const [profilSecili, setProfilSecili] = useState("");

  /* ---- Tarımsal sulama (pompa) ---- */
  const HPler = B.pompaHpKademeleri || [3, 5.5, 7.5, 10, 15, 20, 25, 30, 40];
  const [pompaHp, setPompaHp] = useState(HPler[3] || HPler[0]);
  const [sulamaSaat, setSulamaSaat] = useState(6);
  const [pompaSonuc, setPompaSonuc] = useState(null);
  const [pompaBusy, setPompaBusy] = useState(false);
  const [pompaHata, setPompaHata] = useState("");

  async function pompaHesapla(e) {
    e.preventDefault();
    setPompaBusy(true);
    setPompaHata("");
    try {
      const sonuc = await hesaplaApi({
        senaryo: SENARYO_MAP.sulama,
        pompa: { hp: pompaHp, gunlukSaat: sulamaSaat },
      });
      setPompaSonuc({ ...sonuc, girdi: { hp: pompaHp, saat: sulamaSaat } });
    } catch (err) {
      setPompaHata(err && err.message
        ? err.message : "Hesap şu an yapılamadı. Lütfen tekrar deneyin.");
    } finally {
      setPompaBusy(false);
    }
  }

  /* ---- Cihaz bazlı hesap (mevcut calc birebir) ---- */
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

  const waMsg = "Merhaba! Sistem Kur ile " + preset.label + " projesi hazırladım:\n" +
    lines.filter((l) => l.qty > 0).map((l) => "• " + l.qty + " × " + l.p.name).join("\n") +
    "\nGünlük tüketim: " + (c.dailyWh / 1000).toFixed(1) + " kWh" +
    (total ? "\nTahmini toplam: " + fmtTL(total) : "") + "\nKesin teklif rica ediyorum.";

  const num = (v, d = 1) => v.toFixed(d).replace(".", ",");

  /* ---- Sihirbaz sonucundan asistana köprü ---- */
  function pompaUrunIste() {
    if (!pompaSonuc || busyAI) return;
    void gonder(
      "Tarımsal sulama için " + pompaSonuc.girdi.hp + " HP pompam var, günde " +
      pompaSonuc.girdi.saat + " saat sulama yapıyorum. Bu ihtiyaca uygun ürünlerden bir paket teklifi hazırlar mısın?",
    );
  }

  /* ---- 10 kW vurgusu + lead özeti ---- */
  const panelWattToplam = teklif
    ? teklifPanelWatt(teklif.urunler)
    : sulama
      ? (pompaSonuc ? pompaSonuc.gereksinim.panelWatt : 0)
      : (st.panelRef ? (B.catalog.panels[st.panelRef] || 0) * c.panelQty : 0);
  const buyukSistem = panelWattToplam > 10000;

  const leadOzet = teklif
    ? { kaynak: "asistan", paketSku: teklif.paketSku, toplamTL: teklif.toplamTL,
        urunler: teklif.urunler.map((u) => ({ ad: u.ad, adet: u.adet, birimFiyat: u.birimFiyat })),
        hesapOzeti: teklif.hesapOzeti }
    : sulama && pompaSonuc
      ? { kaynak: "pompa", girdi: pompaSonuc.girdi, gereksinim: pompaSonuc.gereksinim, tasarruf: pompaSonuc.tasarruf }
      : { kaynak: "sihirbaz", senaryo: preset.label,
          gunlukKwh: Math.round(c.dailyWh / 100) / 10,
          urunler: lines.filter((l) => l.qty > 0).map((l) => ({ ad: l.p.name, adet: l.qty })),
          toplamTL: total };

  const sonucVar = Boolean(teklif || (sulama && pompaSonuc) || (!sulama && c.anySelected && lines.length));

  return (
    <div className="wrap py-8">
      <h1 className="text-2xl md:text-3xl">🛠️ Sistem Kur</h1>

      {/* ================= 1) HERO — doğal dil ================= */}
      <section className="card mt-4 p-5 md:p-7 bg-gradient-to-br from-brand-amber/15 via-surface-card to-brand-blue/10">
        <h2 className="text-xl md:text-2xl">İhtiyacınızı yazın, sistemi biz hesaplayalım</h2>
        <p className="text-brand-ink/60 text-sm mt-1 max-w-2xl">
          Cihazlarınızı ya da pompanızı kendi cümlenizle anlatın; yapay zekâ destekli danışmanımız
          panel, akü ve inverteri boyutlandırıp canlı fiyatlarla paket teklifi hazırlasın.
        </p>

        {asistanKapali ? (
          <p role="status" className="mt-4 rounded-btn border border-surface-line bg-surface-alt px-4 py-3 text-sm">
            ⚡ Şu an asistana ulaşılamıyor — aşağıdaki hazır senaryolardan devam edebilirsiniz.
          </p>
        ) : (
          <div className="mt-4 max-w-2xl">
            {(chat.length > 0 || busyAI) && (
              <div className="mb-3 flex max-h-80 flex-col gap-2 overflow-y-auto rounded-card bg-surface-alt p-3" aria-live="polite">
                {chat.map((m, i) => (
                  <div key={i}
                    className={"max-w-[85%] whitespace-pre-wrap rounded-card px-3.5 py-2.5 text-sm leading-relaxed " +
                      (m.rol === "user"
                        ? "self-end bg-brand-amber/90 text-[#3d3005]"
                        : "self-start bg-surface-card border border-surface-line")}>
                    {m.metin}
                  </div>
                ))}
                {busyAI && (
                  <div className="self-start flex flex-col gap-1.5 rounded-card bg-surface-card border border-surface-line px-3.5 py-3 w-64 max-w-[85%]" aria-hidden="true">
                    <span className="h-2.5 w-11/12 animate-pulse rounded bg-surface-line" />
                    <span className="h-2.5 w-full animate-pulse rounded bg-surface-line" />
                    <span className="h-2.5 w-2/3 animate-pulse rounded bg-surface-line" />
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); void gonder(mesaj); }}>
              <label htmlFor="sk-mesaj" className="sr-only">İhtiyacınızı yazın</label>
              <textarea id="sk-mesaj" rows={3} maxLength={2000} disabled={busyAI}
                value={mesaj} onChange={(e) => setMesaj(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void gonder(mesaj); } }}
                placeholder={chat.length ? "Cevabınızı yazın…" : "Örn: Bağ evimde buzdolabı ve 5 lamba var, akşamları 3 saat TV izliyoruz…"}
                className="input resize-none !py-3 text-base disabled:opacity-60" />
              {aiHata && <p role="alert" className="mt-2 text-sm font-semibold text-brand-red">{aiHata}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button type="submit" className="btn btn-primary" disabled={busyAI || !mesaj.trim()}>
                  {busyAI ? "Hesaplanıyor…" : "Hesapla"}
                </button>
                {busyAI && <span className="text-xs text-brand-ink/60">Asistan sizin için hesaplıyor — bu 15-30 saniye sürebilir.</span>}
              </div>
            </form>

            {chat.length === 0 && !busyAI && (
              <div className="mt-3 flex flex-wrap gap-2">
                {ORNEKLER.map((o) => (
                  <button key={o} type="button" onClick={() => void gonder(o)}
                    className="rounded-full border border-surface-line bg-surface-card px-3.5 py-2 text-xs font-medium hover:border-brand-amber hover:bg-brand-amber/10 transition">
                    “{o}”
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ================= Asistan teklifi ================= */}
      <div ref={teklifRef}>
        {teklif && <TeklifKarti teklif={teklif} store={store} />}
      </div>

      {/* ================= 2) Hazır senaryolar ================= */}
      <h2 className="text-lg mt-10 mb-3 text-brand-ink/80">… veya hazır senaryodan başlayın</h2>

      {/* Senaryo kartları (küçültülmüş ikincil sıra) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-6">
        {B.presets.map((p) => (
          <button key={p.id}
            onClick={() => { setSt(ensure({ tip: p.id })); setOzellestir(false); setProfilSecili(""); setPompaSonuc(null); }}
            className={"card p-3 text-left transition hover:-translate-y-0.5 " +
              (p.id === st.tip ? "ring-2 ring-brand-amber bg-brand-amber/10" : "")}>
            <span className="text-xl">{p.icon}</span>
            <b className="block text-sm mt-0.5">{p.label}</b>
            <span className="text-[11px] text-brand-ink/60 leading-4 block mt-0.5">{p.desc}</span>
          </button>
        ))}
      </div>

      {/* ---- TARIMSAL SULAMA: cihaz listesi YOK, pompa formu ---- */}
      {sulama ? (
        <>
          <form onSubmit={pompaHesapla} className="card p-5 max-w-2xl">
            <p className="font-semibold text-sm">
              Pompanızı seçin — tarımsal sulamada akü gerekmez, pompa gündüz doğrudan panelden çalışır.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <label className="block text-sm text-brand-ink/70">
                Pompa gücü
                <select className="input mt-1.5 font-semibold" value={pompaHp}
                  onChange={(e) => setPompaHp(Number(e.target.value))}>
                  {HPler.map((hp) => <option key={hp} value={hp}>{String(hp).replace(".", ",")} HP</option>)}
                </select>
              </label>
              <label className="block text-sm text-brand-ink/70">
                Günlük sulama süresi (saat)
                <input type="number" min="1" max="24" step="0.5" className="input mt-1.5 font-semibold"
                  value={sulamaSaat} onChange={(e) => setSulamaSaat(Number(e.target.value))} />
              </label>
            </div>
            {pompaHata && <p role="alert" className="mt-3 text-sm font-semibold text-brand-red">{pompaHata}</p>}
            <button type="submit" className="btn btn-primary mt-4" disabled={pompaBusy}>
              {pompaBusy ? "Hesaplanıyor…" : "Sistemi hesapla"}
            </button>
          </form>

          {pompaSonuc && (
            <section className="card p-5 mt-5">
              <h3 className="text-lg">Sulama sisteminiz için gereksinim</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                {[
                  [num(pompaSonuc.gereksinim.panelWatt / 1000, 2) + " kWp", "panel gücü"],
                  [String(pompaSonuc.gereksinim.pompaSurucuHp).replace(".", ",") + " HP", "pompa sürücüsü"],
                  [String(pompaSonuc.gereksinim.pompaSurucuKw).replace(".", ",") + " kW", "sürücü gücü"],
                  [num(pompaSonuc.gunlukTuketimWh / 1000) + " kWh", "günlük tüketim"],
                ].map(([v, l]) => (
                  <div key={l} className="card p-4 text-center">
                    <b className="text-xl text-[#9a6a12]">{v}</b>
                    <span className="block text-xs text-brand-ink/60 mt-1">{l}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 rounded-btn bg-brand-green/10 px-4 py-3 text-sm font-semibold">
                ☀️ Bu sistem yılda ~{new Intl.NumberFormat("tr-TR").format(pompaSonuc.tasarruf.yillikUretimKwh)} kWh
                üretir ≈ {fmtTL(pompaSonuc.tasarruf.yillikTasarrufTL)} fatura tasarrufu
              </p>
              {pompaSonuc.notlar && pompaSonuc.notlar.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-brand-ink/60">
                  {pompaSonuc.notlar.map((n, i) => <li key={i}>ℹ️ {n}</li>)}
                </ul>
              )}
              <div className="flex flex-wrap gap-2 mt-4">
                {!asistanKapali && (
                  <button className="btn btn-primary" onClick={pompaUrunIste} disabled={busyAI}>
                    {busyAI ? "Ürünler seçiliyor…" : "Bu sisteme uygun ürünleri getir"}
                  </button>
                )}
                <Link className="btn" to="/kategori/solar-pompa">Solar pompa ürünleri →</Link>
                <a className="btn btn-wa" target="_blank" rel="noopener noreferrer"
                  href={waLink(store,
                    "Merhaba! Tarımsal sulama için " + pompaSonuc.girdi.hp + " HP pompa, günde " +
                    pompaSonuc.girdi.saat + " saat sulama. Önerilen: " +
                    num(pompaSonuc.gereksinim.panelWatt / 1000, 2) + " kWp panel + " +
                    pompaSonuc.gereksinim.pompaSurucuHp + " HP sürücü. Teklif rica ediyorum.")}>
                  WhatsApp ile Teklif İste
                </a>
              </div>
            </section>
          )}
        </>
      ) : (
        <>
          {/* ---- Karavan / Bağ evi: hazır profiller ---- */}
          {profiller.length > 0 && !ozellestir && (
            <section className="mb-8">
              <p className="text-sm text-brand-ink/70 mb-3">
                Hazır profil seçin ya da <button type="button" className="font-semibold text-brand-blue hover:underline"
                  onClick={() => setOzellestir(true)}>cihazları tek tek işaretleyin →</button>
              </p>
              <div className="grid sm:grid-cols-3 gap-2.5 max-w-3xl">
                {profiller.map((pr) => (
                  <button key={pr.id} type="button"
                    onClick={() => { setSt((s) => ({ ...s, items: { ...pr.items }, qtyOv: {} })); setProfilSecili(pr.id); }}
                    className={"card p-4 text-left transition hover:-translate-y-0.5 " +
                      (profilSecili === pr.id ? "ring-2 ring-brand-green bg-brand-green/10" : "")}>
                    <b className="block text-sm">{pr.label}</b>
                    <span className="text-[11px] text-brand-ink/60 block mt-0.5">{pr.desc}</span>
                    <span className="text-[11px] text-brand-ink/50 block mt-1.5 leading-4">
                      {Object.entries(pr.items).map(([id, q]) => {
                        const a = B.appliances.find((x) => x.id === id);
                        return a ? q + "× " + a.name.split(" (")[0] : null;
                      }).filter(Boolean).join(" · ")}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ---- Detaylı cihaz listesi (müstakil ev / işletme / özelleştir) ---- */}
          {(profiller.length === 0 || ozellestir) && (
            <Step n="1" t="Cihazlarınız ve adetleri">
              {profiller.length > 0 && (
                <button type="button" className="text-sm font-semibold text-brand-blue hover:underline mb-3"
                  onClick={() => setOzellestir(false)}>← Hazır profillere dön</button>
              )}
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
          )}

          {/* ---- Hesaplanan ihtiyaç ---- */}
          {c.anySelected && (
            <Step n="2" t="Hesaplanan ihtiyacınız">
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
          )}

          {/* ---- Tercihler ---- */}
          {c.anySelected && (
            <Step n="3" t="Tercihleriniz">
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
          )}

          {/* ---- Önerilen sistem (canlı yerel fiyatlar) ---- */}
          <Step n="4" t="Önerilen sisteminiz">
            {!c.anySelected ? (
              <p className="text-brand-ink/60">Profil ya da cihaz seçince önerilen sistem burada listelenir.</p>
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
                    <button className="btn btn-primary grow" onClick={addAll}>🛒 Sistemi Sepete Ekle</button>
                    <a className="btn btn-wa grow" target="_blank" rel="noopener noreferrer" href={waLink(store, waMsg)}>
                      WhatsApp ile Teklif İste
                    </a>
                  </div>
                  {toast && <p className="text-sm text-brand-green mt-3">✓ {toast} <Link to="/sepet" className="underline">Sepete git →</Link></p>}
                </div>
              </>
            )}
          </Step>
        </>
      )}

      {/* ================= 3) Uyarı + ücretsiz proje doğrulaması ================= */}
      {sonucVar && <UyariDogrulama vurgulu={buyukSistem} ozet={leadOzet} />}
    </div>
  );
}

/* ================= Asistan teklif kartı ================= */
// Fiyat kuralı: satırlar yerel kataloğa eşlenir; eşleşen satır YEREL priceTL()
// ile gösterilir ve sepete o ürün eklenir. Eşleşmeyen satır bilgi amaçlı
// backend fiyatıyla listelenir ama sepete EKLENMEZ.
function TeklifKarti({ teklif, store }) {
  const [toast, setToast] = useState("");
  const lines = useMemo(
    () => teklif.urunler.map((u) => ({ ...u, local: matchLocalProduct(u, store.products) })),
    [teklif, store.products],
  );
  const toplam = lines.reduce(
    (s, l) => s + (l.local ? priceTL(l.local, store) : l.birimFiyat) * l.adet, 0);
  const eslesen = lines.filter((l) => l.local);

  const sepeteEkle = () => {
    let n = 0;
    eslesen.forEach((l) => { cartAdd(l.local.id, l.adet); n += l.adet; });
    void cartGet();
    setToast(n + " ürün sepete eklendi" +
      (eslesen.length < lines.length ? " (eşleşmeyen " + (lines.length - eslesen.length) + " kalem eklenmedi)" : "") + ".");
    setTimeout(() => setToast(""), 4000);
  };

  const waMsg = "Merhaba! Sistem Kur asistanıyla paket hazırladım (Ref: " + teklif.paketSku + "):\n" +
    lines.map((l) => "• " + l.adet + " × " + (l.local ? l.local.name : l.ad) + " — " +
      fmtTL((l.local ? priceTL(l.local, store) : l.birimFiyat))).join("\n") +
    "\nToplam: " + fmtTL(toplam) + " (KDV dahil)\nKesin teklif rica ediyorum.";

  return (
    <section className="card mt-5 p-5 md:p-6 ring-2 ring-brand-amber">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg md:text-xl">Size özel paket teklifi</h2>
        <span className="text-[11px] font-bold tracking-wide text-brand-ink/50">Ref: {teklif.paketSku}</span>
      </div>

      <div className="space-y-2 mt-4">
        {lines.map((l, i) => (
          <div key={i} className="card p-3 flex items-center gap-3">
            {l.local ? (
              <Link to={"/urun/" + l.local.id} className="w-16 h-14 shrink-0 rounded-btn overflow-hidden bg-surface-alt">
                {l.local.img && l.local.img.length
                  ? <img src={"/" + l.local.img[0]} alt="" loading="lazy" className="w-full h-full object-cover" />
                  : <PlaceholderImg product={l.local} className="w-full h-full" />}
              </Link>
            ) : (
              <span className="w-16 h-14 shrink-0 rounded-btn bg-surface-alt flex items-center justify-center text-xl">📦</span>
            )}
            <div className="grow min-w-0">
              {l.local ? (
                <Link to={"/urun/" + l.local.id} className="block font-semibold text-sm leading-snug hover:text-brand-blue line-clamp-2">
                  {l.local.name}
                </Link>
              ) : (
                <>
                  <span className="block font-semibold text-sm leading-snug line-clamp-2">{l.ad}</span>
                  <span className="badge bg-brand-amber/20 text-[#9a6a12] mt-0.5">stok teyidi gerekli</span>
                </>
              )}
              <span className="text-xs text-brand-ink/60">
                {fmtTL(l.local ? priceTL(l.local, store) : l.birimFiyat)} × {l.adet}
              </span>
            </div>
            <b className="w-24 text-right shrink-0">
              {fmtTL((l.local ? priceTL(l.local, store) : l.birimFiyat) * l.adet)}
            </b>
          </div>
        ))}
      </div>

      <div className="card p-5 mt-4 max-w-xl">
        <div className="flex justify-between text-lg font-extrabold">
          <span>Paket toplamı</span><span className="text-[#9a6a12]">{fmtTL(toplam)}</span>
        </div>
        <div className="flex justify-between text-sm text-brand-green font-semibold mt-1">
          <span>💰 Havale/EFT ile</span>
          <span>{fmtTL(havaleTL(toplam, store))} (%{store.config.commerce.havaleDiscountPct} indirimli)</span>
        </div>
        {teklif.hesapOzeti && (
          <p className="mt-3 rounded-btn bg-brand-green/10 px-3.5 py-2.5 text-sm leading-relaxed">☀️ {teklif.hesapOzeti}</p>
        )}
        <p className="text-xs text-brand-ink/60 mt-2">KDV dahil · kargo hariç · stok ve fiyat sipariş anında teyit edilir.</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <button className="btn btn-primary grow" onClick={sepeteEkle} disabled={!eslesen.length}>
            🛒 Sistemi Sepete Ekle
          </button>
          <a className="btn btn-wa grow" target="_blank" rel="noopener noreferrer" href={waLink(store, waMsg)}>
            WhatsApp'tan sor
          </a>
        </div>
        <EpostaTeklif ozet={{ kaynak: "asistan", paketSku: teklif.paketSku, toplamTL: toplam,
          urunler: lines.map((l) => ({ ad: l.local ? l.local.name : l.ad, adet: l.adet })) }} />
        {toast && <p className="text-sm text-brand-green mt-3">✓ {toast} <Link to="/sepet" className="underline">Sepete git →</Link></p>}
      </div>
    </section>
  );
}

/* ================= "Teklifi e-posta ile al" (lead tip=pdf) ================= */
function EpostaTeklif({ ozet }) {
  const [acik, setAcik] = useState(false);
  return (
    <div className="mt-3">
      {!acik ? (
        <button type="button" className="btn w-full" onClick={() => setAcik(true)}>✉️ Teklifi e-posta ile al</button>
      ) : (
        <LeadFormu tip="pdf" ozet={ozet} emailZorunlu
          basarili="Talebiniz alındı — teklifiniz en kısa sürede e-posta ile iletilecek."
          gonderMetni="Teklifi gönder" onKapat={() => setAcik(false)} />
      )}
    </div>
  );
}

/* ================= Uyarı + ücretsiz proje doğrulaması ================= */
function UyariDogrulama({ vurgulu, ozet }) {
  const [acik, setAcik] = useState(false);
  return (
    <section className={"card mt-8 p-5 md:p-6 " + (vurgulu ? "ring-2 ring-brand-amber bg-brand-amber/10" : "bg-surface-alt")}>
      <p className="text-sm leading-relaxed">
        ⚠️ Bu hesaplama, verdiğiniz bilgilere dayalı bir <b>ön simülasyondur</b>. Çatı yönü, gölgelenme,
        kablo mesafesi ve kurulum koşulları sonucu etkileyebilir. Kesin sistem tasarımı için sipariş
        öncesi <b>ücretsiz proje doğrulaması</b> alın.
      </p>
      {vurgulu && (
        <p className="mt-2 text-sm font-bold">
          Sisteminiz 10 kW üzerinde — bu ölçekte keşif ve projelendirme özellikle önemlidir.
        </p>
      )}
      <div className="mt-4 max-w-md">
        {!acik ? (
          <button type="button" className="btn btn-primary" onClick={() => setAcik(true)}>
            Ücretsiz proje doğrulaması iste
          </button>
        ) : (
          <LeadFormu tip="dogrulama" ozet={ozet}
            basarili="Talebiniz alındı — uzmanımız en geç 1 iş günü içinde arayacak."
            gonderMetni="Doğrulama iste" onKapat={() => setAcik(false)} />
        )}
      </div>
    </section>
  );
}

/* ================= Ortak mini lead formu (honeypot'lu) ================= */
function LeadFormu({ tip, ozet, basarili, gonderMetni, emailZorunlu = false, onKapat }) {
  const [ad, setAd] = useState("");
  const [telefon, setTelefon] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — insan görmez
  const [busy, setBusy] = useState(false);
  const [hata, setHata] = useState("");
  const [tamam, setTamam] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setHata("");
    if (ad.trim().length < 2) return setHata("Adınızı girin.");
    if (!TEL_RE.test(telefon.trim())) return setHata("Geçerli bir telefon numarası girin.");
    if (emailZorunlu && !EMAIL_RE.test(email.trim())) return setHata("Geçerli bir e-posta adresi girin.");
    setBusy(true);
    try {
      const payload = { tip, ad: ad.trim(), telefon: telefon.trim(), ozet };
      if (email.trim()) payload.email = email.trim();
      if (website) payload.website = website;
      await leadGonder(payload);
      setTamam(true);
    } catch (err) {
      setHata(err && err.message ? err.message : "Gönderilemedi. Lütfen tekrar deneyin ya da WhatsApp'tan ulaşın.");
    } finally {
      setBusy(false);
    }
  }

  if (tamam) {
    return <p role="status" className="rounded-btn bg-brand-green/10 px-4 py-3 text-sm font-semibold">✅ {basarili}</p>;
  }

  return (
    <form onSubmit={submit} className="card p-4">
      <div className="grid gap-2.5">
        <label className="block text-xs font-semibold text-brand-ink/70">
          Ad Soyad
          <input className="input mt-1" value={ad} onChange={(e) => setAd(e.target.value)} autoComplete="name" />
        </label>
        <label className="block text-xs font-semibold text-brand-ink/70">
          Telefon
          <input className="input mt-1" type="tel" value={telefon} onChange={(e) => setTelefon(e.target.value)}
            autoComplete="tel" placeholder="05xx xxx xx xx" />
        </label>
        {emailZorunlu && (
          <label className="block text-xs font-semibold text-brand-ink/70">
            E-posta
            <input className="input mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              autoComplete="email" />
          </label>
        )}
        <div className="hidden" aria-hidden="true">
          <label>Web siteniz
            <input type="text" tabIndex={-1} autoComplete="off" value={website}
              onChange={(e) => setWebsite(e.target.value)} />
          </label>
        </div>
      </div>
      {hata && <p role="alert" className="mt-2 text-sm font-semibold text-brand-red">{hata}</p>}
      <div className="mt-3 flex items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Gönderiliyor…" : gonderMetni}
        </button>
        <button type="button" className="text-sm text-brand-ink/60 hover:text-brand-ink" onClick={onKapat}>Vazgeç</button>
      </div>
    </form>
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

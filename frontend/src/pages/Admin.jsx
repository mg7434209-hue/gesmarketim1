// Yönetim paneli — /admin (menüde YOK, robots'ta engelli, noindex).
// Fiyat düzenleme (çalışma zamanı override → DATA_DIR/overrides.json),
// gelen siparişler ve elle kur yayınlama. Şifre: ADMIN_PASS (sunucuda).
import { useEffect, useMemo, useState } from "react";
import { useStore, fmtTL, fmtKur } from "../api.js";
import { useSeo } from "../hooks.js";

const PASS_KEY = "gesm.admin";
const TR = (s) => s.toLocaleLowerCase("tr");

export default function Admin() {
  const store = useStore();
  useSeo({ title: "Yönetim | " + store.config.company.brand });
  useEffect(() => {
    const m = document.createElement("meta");
    m.name = "robots"; m.content = "noindex,nofollow";
    document.head.appendChild(m);
    return () => m.remove();
  }, []);

  const [pass, setPass] = useState(() => localStorage.getItem(PASS_KEY) || "");
  const [authed, setAuthed] = useState(false);
  const [err, setErr] = useState("");

  const login = async (p) => {
    setErr("");
    try {
      const r = await fetch("/api/admin/orders", { headers: { "x-admin-pass": p } });
      if (r.status === 403) return setErr("Şifre hatalı.");
      if (!r.ok) return setErr("Sunucuya ulaşılamadı.");
      localStorage.setItem(PASS_KEY, p);
      setPass(p); setAuthed(true);
    } catch { setErr("Sunucuya ulaşılamadı — panel yalnız canlı sunucuda çalışır."); }
  };
  useEffect(() => { if (pass) login(pass); }, []); // kayıtlı şifreyle otomatik dene

  if (!authed) return <Login onSubmit={login} err={err} />;
  return <Panel pass={pass} onLogout={() => { localStorage.removeItem(PASS_KEY); setAuthed(false); setPass(""); }} />;
}

function Login({ onSubmit, err }) {
  const [p, setP] = useState("");
  return (
    <div className="wrap py-20 max-w-sm">
      <div className="card p-6">
        <h1 className="text-xl mb-1">🔐 Yönetim Paneli</h1>
        <p className="text-xs text-brand-ink/60 mb-4">Fiyat düzenleme · siparişler · kur yayınlama</p>
        <form onSubmit={(e) => { e.preventDefault(); if (p) onSubmit(p); }}>
          <input className="input" type="password" placeholder="Yönetici şifresi" value={p}
            onChange={(e) => setP(e.target.value)} aria-label="Yönetici şifresi" autoFocus />
          {err && <p className="text-brand-red text-sm mt-2">{err}</p>}
          <button className="btn btn-primary w-full mt-3">Giriş</button>
        </form>
      </div>
    </div>
  );
}

function Panel({ pass, onLogout }) {
  const [tab, setTab] = useState("fiyat");
  return (
    <div className="wrap py-8">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <h1 className="text-2xl">🔐 Yönetim Paneli</h1>
        <button className="btn" onClick={onLogout}>Çıkış</button>
      </div>
      <p className="text-xs text-brand-ink/60 mb-4">
        ⚠️ Buradaki fiyat/sipariş verileri sunucunun DATA_DIR'inde tutulur — Railway'de kalıcılık için
        Volume bağlı olmalıdır. Kalıcı liste fiyatı değişikliği için data/fiyat-override.json + build önerilir.
      </p>
      <div className="flex gap-1 mb-6 border-b border-surface-line">
        {[["fiyat", "💰 Fiyatlar"], ["siparis", "📦 Siparişler"], ["kur", "💱 Kur"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={"px-4 py-2 text-sm font-semibold rounded-t-btn " +
              (tab === k ? "bg-brand-amber/20 text-[#9a6a12] border border-b-0 border-surface-line" : "text-brand-ink/60")}>
            {l}
          </button>
        ))}
      </div>
      {tab === "fiyat" && <PriceTab pass={pass} />}
      {tab === "siparis" && <OrdersTab pass={pass} />}
      {tab === "kur" && <KurTab pass={pass} />}
    </div>
  );
}

/* ---------------- Fiyatlar ---------------- */
function PriceTab({ pass }) {
  const store = useStore();
  const [products, setProducts] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  const refresh = async () => {
    const [ps, ov] = await Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/admin/overrides", { headers: { "x-admin-pass": pass } }).then((r) => r.json()),
    ]);
    setProducts(ps); setOverrides(ov || {});
  };
  useEffect(() => { refresh(); }, []);

  const list = useMemo(() => {
    const t = TR(q);
    return products.filter((p) => !t || TR(p.name + " " + p.id + " " + p.code).includes(t));
  }, [products, q]);

  const save = async (id, val) => {
    setMsg("");
    const r = await fetch("/api/admin/price", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pass, id, priceTL: val === "" ? null : Number(val) }),
    }).then((x) => x.json()).catch(() => null);
    if (!r || !r.ok) return setMsg("❌ Kaydedilemedi: " + ((r && r.error) || "bağlantı"));
    setMsg("✅ " + id + (r.priceTL ? " → " + fmtTL(r.priceTL) : " → katalog fiyatına döndü"));
    refresh();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input className="input max-w-xs" placeholder="Ürün ara…" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="text-xs text-brand-ink/60">
          {Object.keys(overrides).length} geçici override aktif · Sabit ₺ girilen üründe fiyat kurdan bağımsız olur;
          boş bırakıp kaydet = katalog fiyatına dön.
        </span>
      </div>
      {msg && <p className="text-sm mb-3">{msg}</p>}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left border-b border-surface-line text-xs text-brand-ink/60">
              <th className="p-3">Ürün</th><th className="p-3">Güncel ₺</th>
              <th className="p-3">Kaynak</th><th className="p-3">Sabit ₺ (yeni)</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => <PriceRow key={p.id} p={p} store={store} ovr={overrides[p.id]} onSave={save} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PriceRow({ p, store, ovr, onSave }) {
  const [val, setVal] = useState("");
  const step = store.config.pricing.roundTo || 1;
  const cur = p.priceTL > 0 ? Math.round(p.priceTL / step) * step
    : Math.round((p.saleUsd * store.kur * (1 + (store.config.pricing.fxBufferPct || 0) / 100)) / step) * step;
  return (
    <tr className="border-b border-surface-line last:border-0">
      <td className="p-3">
        <b className="block leading-tight">{p.name.slice(0, 52)}</b>
        <span className="text-xs text-brand-ink/50">{p.code}</span>
      </td>
      <td className="p-3 font-bold whitespace-nowrap">{fmtTL(cur)}</td>
      <td className="p-3 text-xs whitespace-nowrap">
        {ovr ? <span className="badge bg-brand-amber/25 text-[#9a6a12]">geçici sabit</span>
          : p.priceTL > 0 ? <span className="badge bg-brand-blue/15 text-[#2b7d97]">katalog sabit</span>
          : <span className="text-brand-ink/50">USD × kur</span>}
      </td>
      <td className="p-3">
        <input className="input w-28" type="number" min="0" placeholder={ovr ? String(ovr.priceTL) : "₺"}
          value={val} onChange={(e) => setVal(e.target.value)} aria-label={"Yeni fiyat: " + p.name} />
      </td>
      <td className="p-3 whitespace-nowrap">
        <button className="btn btn-primary px-3 py-1.5 text-xs" onClick={() => onSave(p.id, val)}>Kaydet</button>
        {ovr && <button className="btn px-3 py-1.5 text-xs ml-1" title="Override'ı kaldır"
          onClick={() => onSave(p.id, "")}>↺</button>}
      </td>
    </tr>
  );
}

/* ---------------- Siparişler ---------------- */
function OrdersTab({ pass }) {
  const [orders, setOrders] = useState(null);
  const refresh = () =>
    fetch("/api/admin/orders", { headers: { "x-admin-pass": pass } })
      .then((r) => r.json()).then(setOrders).catch(() => setOrders([]));
  useEffect(() => { refresh(); }, []);

  const toggle = async (no, done) => {
    await fetch("/api/admin/order-status", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pass, no, done }),
    });
    refresh();
  };

  if (!orders) return <p className="text-brand-ink/60">Yükleniyor…</p>;
  if (!orders.length) return (
    <p className="text-brand-ink/60 py-8">
      Henüz sipariş yok. Sepetten gönderilen her sipariş WhatsApp'a ek olarak buraya da düşer.
    </p>
  );
  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o.no} className={"card p-4 " + (o.done ? "opacity-60" : "")}>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <b>#{o.no}</b>
            <span className="text-xs text-brand-ink/60">{String(o.createdAt).slice(0, 16).replace("T", " ")}</span>
            <span className={"badge " + (o.pay === "havale" ? "bg-brand-green/15 text-[#3f7d55]" : "bg-brand-blue/15 text-[#2b7d97]")}>
              {o.pay === "havale" ? "Havale/EFT" : "Kredi kartı"}
            </span>
            <b className="ml-auto text-[#9a6a12]">{fmtTL(o.total)}</b>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="checkbox" checked={o.done} onChange={(e) => toggle(o.no, e.target.checked)} />
              Tamamlandı
            </label>
          </div>
          <div className="text-sm">👤 {o.name} · 📞 <a className="text-brand-blue" href={"tel:" + o.phone}>{o.phone}</a></div>
          <div className="text-sm text-brand-ink/70">📍 {o.addr}{o.note ? <> · 📝 {o.note}</> : null}</div>
          <ul className="mt-2 text-xs text-brand-ink/80 space-y-0.5">
            {o.items.map((it) => (
              <li key={it.id}>• {it.qty} × {it.name} <span className="text-brand-ink/50">({it.code})</span> — {fmtTL(it.tl * it.qty)}</li>
            ))}
          </ul>
          <div className="text-xs text-brand-ink/60 mt-1.5">
            Ara toplam {fmtTL(o.subtotal)} · Kargo {o.kargo === "alici" ? "alıcı ödemeli" : (o.shipping ? fmtTL(o.shipping) : "ücretsiz")}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Kur ---------------- */
function KurTab({ pass }) {
  const [kur, setKur] = useState(null);
  const [val, setVal] = useState("");
  const [msg, setMsg] = useState("");
  const refresh = () => fetch("/api/kur").then((r) => r.json()).then(setKur);
  useEffect(() => { refresh(); }, []);

  const publish = async () => {
    setMsg("");
    const r = await fetch("/api/kur", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pass, usdTry: Number(val) }),
    }).then((x) => x.json()).catch(() => null);
    if (!r || !r.ok) return setMsg("❌ Yayınlanamadı: " + ((r && r.error) || "bağlantı"));
    setMsg("✅ Kur yayınlandı — 24 saat otomatik güncellemeye ezdirilmez.");
    setVal(""); refresh();
  };

  return (
    <div className="card p-6 max-w-md">
      <h2 className="text-lg mb-2">Günlük USD/TL Kuru</h2>
      {kur && (
        <p className="text-sm text-brand-ink/70 mb-4">
          Güncel: <b className="text-[#9a6a12]">1 $ = {fmtKur(kur.usdTry)} ₺</b>
          <span className="text-xs"> · kaynak: {kur.source || "config"}
            {kur.updatedAt ? " · " + String(kur.updatedAt).slice(0, 16).replace("T", " ") : ""}</span>
        </p>
      )}
      <p className="text-xs text-brand-ink/60 mb-3">
        Kur 6 saatte bir piyasadan otomatik güncellenir. Elle yayınlarsan 24 saat boyunca otomatik
        güncelleme üzerine yazmaz.
      </p>
      <div className="flex gap-2">
        <input className="input" type="number" step="0.01" min="0" placeholder="örn. 47.85"
          value={val} onChange={(e) => setVal(e.target.value)} aria-label="Yeni kur" />
        <button className="btn btn-primary whitespace-nowrap" onClick={publish} disabled={!val}>Yayınla</button>
      </div>
      {msg && <p className="text-sm mt-3">{msg}</p>}
    </div>
  );
}

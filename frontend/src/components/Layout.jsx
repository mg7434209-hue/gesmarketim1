import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useStore, cartCount, onCart, fmtKur, waLink } from "../api.js";

export default function Layout() {
  const store = useStore();
  const { company, announcement } = store.config;
  const [count, setCount] = useState(cartCount());
  const [menu, setMenu] = useState(false);
  const loc = useLocation();
  useEffect(() => onCart(() => setCount(cartCount())), []);
  useEffect(() => { setMenu(false); window.scrollTo(0, 0); }, [loc.pathname]);

  const nav = [
    { to: "/", label: "Ana Sayfa", end: true },
    ...store.categories.map((c) => ({ to: "/kategori/" + c.slug, label: c.name })),
    { to: "/hesaplayici", label: "Sistem Kur 🛠️" },
    { to: "/iletisim", label: "İletişim" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Duyuru + kur rozeti */}
      <div className="bg-brand-amber/15 border-b border-surface-line text-[13px]">
        <div className="wrap py-1.5 flex items-center justify-center gap-3 flex-wrap text-center">
          <span>{announcement}</span>
          <span className="badge bg-surface-card border border-surface-line text-[#9a6a12]"
            title={"Tüm fiyatlar USD tabanlıdır, günlük kurla ₺'ye çevrilir" + (store.kurAt ? " · " + String(store.kurAt).slice(0, 10) : "")}>
            💱 1 $ = {fmtKur(store.kur)} ₺
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-card/95 backdrop-blur border-b border-surface-line">
        <div className="wrap flex items-center gap-4 py-3">
          <Link to="/" className="flex items-center gap-2.5 font-extrabold text-lg whitespace-nowrap">
            <img src="/gespa-icon-72.png" alt="" width="36" height="36" className="rounded-[10px]" />
            GES <span className="text-[#9a6a12]">MARKETİM</span>
          </Link>
          <SearchBox className="hidden md:flex flex-1 max-w-md" />
          <div className="ml-auto flex items-center gap-2">
            <Link to="/sepet" className="btn btn-ghost relative" aria-label="Sepet">
              🛒
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 badge bg-brand-red text-white">{count}</span>
              )}
            </Link>
            <button className="btn btn-ghost lg:hidden" aria-label="Menü" onClick={() => setMenu(!menu)}>☰</button>
          </div>
        </div>
        <nav className={(menu ? "block" : "hidden") + " lg:block border-t border-surface-line"}>
          <div className="wrap flex flex-col lg:flex-row gap-1 py-2 text-sm font-semibold">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}
                className={({ isActive }) =>
                  "px-3 py-1.5 rounded-btn hover:bg-surface-alt " +
                  (isActive ? "text-[#9a6a12] bg-brand-amber/15" : "text-brand-ink/80")}>
                {n.label}
              </NavLink>
            ))}
          </div>
        </nav>
        <div className="wrap pb-3 md:hidden"><SearchBox /></div>
      </header>

      <main className="grow"><Outlet /></main>

      {/* Yüzen WhatsApp */}
      <a href={waLink(store, "Merhaba, gesmarketim.com üzerinden yazıyorum.")}
        target="_blank" rel="noopener noreferrer" aria-label="WhatsApp destek"
        className="fixed bottom-5 right-5 z-40 w-14 h-14 flex items-center justify-center rounded-full bg-brand-green text-white shadow-card text-2xl">
        💬
      </a>

      {/* Footer */}
      <footer className="bg-surface-alt border-t border-surface-line mt-10">
        <div className="wrap py-10 grid gap-8 md:grid-cols-3 text-sm">
          <div>
            <div className="font-extrabold text-base mb-2">GES MARKETİM</div>
            <p className="text-brand-ink/70">
              Solar enerjide uçtan uca çözüm: panel, batarya, inverter ve pompa sistemleri.
              KDV dahil şeffaf fiyat, günlük kur, uzman destek.
            </p>
            <p className="mt-3 text-brand-ink/70">📞 {company.phone.display}<br />✉️ {company.email}</p>
          </div>
          <div>
            <div className="font-bold mb-2">Kategoriler</div>
            <ul className="space-y-1.5">
              {store.categories.map((c) => (
                <li key={c.slug}><Link className="hover:text-brand-blue" to={"/kategori/" + c.slug}>{c.name}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-bold mb-2">Kurumsal</div>
            <ul className="space-y-1.5">
              <li><Link className="hover:text-brand-blue" to="/hakkimizda">Hakkımızda</Link></li>
              <li><Link className="hover:text-brand-blue" to="/sss">Sık Sorulan Sorular</Link></li>
              <li><Link className="hover:text-brand-blue" to="/kargo-teslimat">Kargo &amp; Teslimat</Link></li>
              <li><Link className="hover:text-brand-blue" to="/iade-degisim">İptal, İade &amp; Değişim</Link></li>
              <li><Link className="hover:text-brand-blue" to="/mesafeli-satis">Mesafeli Satış Sözleşmesi</Link></li>
              <li><Link className="hover:text-brand-blue" to="/kvkk">Gizlilik &amp; KVKK</Link></li>
            </ul>
            <p className="mt-3 text-brand-ink/60">{company.address}<br />{company.hours}</p>
          </div>
        </div>
        <div className="border-t border-surface-line">
          <div className="wrap py-4 text-xs text-brand-ink/60 flex flex-wrap justify-between items-center gap-2">
            <span>© {new Date().getFullYear()} {company.legal} — Tüm hakları saklıdır.</span>
            <VisitCounter />
            <span>🔒 256-bit SSL · 14 gün koşulsuz iade · Havale/EFT indirimi</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* Ziyaretçi sayacı rozeti — gösterilen toplam = config.visitors.base +
   sunucu sayacı (/api/visitors çerezle günde 1 sayar, botları saymaz).
   API'ye ulaşılamazsa yalnız taban gösterilir. */
function VisitCounter() {
  const store = useStore();
  const cfg = store.config.visitors;
  const [n, setN] = useState(null);
  useEffect(() => {
    if (!cfg || !cfg.show) return;
    fetch("/api/visitors")
      .then((r) => r.json())
      .then((j) => setN((cfg.base || 0) + (Number(j.count) || 0)))
      .catch(() => setN(cfg.base || 0));
  }, []);
  if (!cfg || !cfg.show || n == null) return null;
  return (
    <span className="badge bg-surface-card border border-surface-line" title="Toplam ziyaretçi">
      👥 {new Intl.NumberFormat("tr-TR").format(n)} ziyaretçi
    </span>
  );
}

function SearchBox({ className = "" }) {
  const [q, setQ] = useState("");
  return (
    <form className={"flex " + className}
      onSubmit={(e) => { e.preventDefault(); if (q.trim()) location.assign("/kategori?q=" + encodeURIComponent(q.trim())); }}>
      <input className="input rounded-r-none border-r-0" placeholder="Ürün ara: 655W panel, 100Ah batarya…"
        value={q} onChange={(e) => setQ(e.target.value)} aria-label="Ürün ara" />
      <button className="btn btn-primary rounded-l-none" aria-label="Ara">🔍</button>
    </form>
  );
}

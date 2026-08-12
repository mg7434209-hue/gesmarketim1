import { Link } from "react-router-dom";
import { useStore } from "../api.js";
import { useCountUp, useSeo } from "../hooks.js";
import { ProductGrid, Section } from "../components/ui.jsx";

export default function Home() {
  const store = useStore();
  const { seo } = store.config;
  useSeo({ title: seo.defaultTitle, description: seo.defaultDesc });

  const best = store.products.filter((p) => p.bestseller && p.inStock).slice(0, 8);
  const newest = store.products.filter((p) => p.inStock && !p.bestseller).slice(0, 4);

  return (
    <>
      <Hero />
      <Stats />

      {/* Kategoriler — API'den, kategori-bağımsız (yeni kategori = kod değişmez) */}
      <Section title="Kategoriler" sub="İhtiyacınız olan her solar bileşen tek çatı altında">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {store.categories.map((c) => (
            <Link key={c.slug} to={"/kategori/" + c.slug}
              className="card p-5 flex flex-col gap-1.5 hover:-translate-y-1 hover:shadow-lg transition">
              <span className="text-3xl">{c.icon}</span>
              <b className="text-[15px]">{c.name}</b>
              <span className="text-xs text-brand-ink/60 leading-5">{c.desc}</span>
            </Link>
          ))}
        </div>
      </Section>

      {/* Yapay Zekâ ile proje tasarımı — 3 profil kartı */}
      <Section alt title="Yapay Zekâ ile Projenizi Tasarlayın"
        sub="Cihazlarınızı seçin; panel, akü ve inverteri saniyeler içinde sizin için boyutlandıralım.">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { id: "karavan", icon: "🚐", t: "Karavan & Tekne", d: "Buzdolabı, aydınlatma ve şarj için kompakt 12/24V sistem — yola çıkmaya hazır." },
            { id: "ev", icon: "🏠", t: "Müstakil Ev", d: "Klima ve çamaşır makinesi dahil tam ev yükü için 48V LiFePO4 çözümü." },
            { id: "sulama", icon: "🌾", t: "Tarımsal Sulama", d: "Gündüz güneşle çalışan pompa sistemi — elektrik hattı olmayan bahçe ve tarla." },
          ].map((k) => (
            <div key={k.id} className="card p-6 flex flex-col gap-2">
              <span className="text-4xl">{k.icon}</span>
              <b className="text-lg">{k.t}</b>
              <p className="text-sm text-brand-ink/70 leading-6 grow">{k.d}</p>
              <Link className="btn btn-primary mt-2" to={"/hesaplayici?profil=" + k.id}>
                🛠️ Sistemimi Kur
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-brand-ink/60 mt-6">
          Hazır senaryolar başlangıç noktasıdır — cihaz listesini dilediğiniz gibi değiştirebilirsiniz.
        </p>
      </Section>

      {best.length > 0 && (
        <Section title="Çok Satanlar" sub="Her kategorinin en çok tercih edilen ürünü"
          action={<Link to="/kategori" className="btn btn-ghost whitespace-nowrap">Tümü →</Link>}>
          <ProductGrid products={best} />
        </Section>
      )}

      {newest.length > 0 && (
        <Section alt title="Öne Çıkanlar">
          <ProductGrid products={newest} />
        </Section>
      )}
    </>
  );
}

/* ---------- Hero: gerçek panel fotoğrafı (LCP) + CSS/SVG enerji animasyonu ---------- */
function Hero() {
  const store = useStore();
  const limit = new Intl.NumberFormat("tr-TR").format(store.config.commerce.freeShippingLimit);
  return (
    <section className="bg-gradient-to-b from-brand-blue/10 via-surface to-surface border-b border-surface-line overflow-hidden">
      <div className="wrap py-10 md:py-16 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <p className="badge bg-brand-lime/25 text-[#4e6b2a] mb-4">☀️ Güneşten prizinize — uçtan uca çözüm</p>
          <h1 className="text-3xl md:text-5xl leading-tight">
            Güneş Enerjisinde <span className="text-[#9a6a12]">Şeffaf Fiyat</span>,
            Doğru Boyutlandırma
          </h1>
          <p className="mt-4 text-brand-ink/70 text-[15px] md:text-lg leading-7 max-w-xl">
            Lexron güneş panelleri, LiFePO4 lityum bataryalar, MPPT akıllı inverterler ve
            solar pompa çözümleri. Tüm fiyatlar KDV dahil, günlük kurla güncel.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/kategori" className="btn btn-primary text-base px-7 py-3">Ürünleri Keşfet</Link>
            <Link to="/hesaplayici" className="btn text-base px-7 py-3">🛠️ Kendi Sistemini Kur</Link>
          </div>
          <p className="mt-5 text-xs text-brand-ink/60">
            🚚 {limit} ₺ üzeri ücretsiz kargo · 💰 Havale/EFT indirimi · ↩️ 14 gün koşulsuz iade
          </p>
        </div>
        <HeroScene />
      </div>
    </section>
  );
}

function HeroScene() {
  return (
    <div className="relative max-w-md mx-auto w-full" aria-hidden="true">
      {/* Dönen ışınlı güneş */}
      <svg viewBox="0 0 120 120" className="absolute -top-8 -left-8 w-28 h-28 md:w-36 md:h-36 z-10">
        <g className="anim-rays" stroke="#FDC722" strokeWidth="4" strokeLinecap="round">
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * 30 * Math.PI) / 180;
            return <line key={i}
              x1={60 + Math.cos(a) * 34} y1={60 + Math.sin(a) * 34}
              x2={60 + Math.cos(a) * 48} y2={60 + Math.sin(a) * 48} />;
          })}
        </g>
        <circle className="anim-sun" cx="60" cy="60" r="26" fill="#FDC722" />
        <circle cx="60" cy="60" r="26" fill="url(#hg)" opacity=".25" />
        <defs>
          <radialGradient id="hg"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#FDC722" /></radialGradient>
        </defs>
      </svg>

      {/* Gerçek panel fotoğrafı + parlama süpürmesi */}
      <div className="card overflow-hidden relative">
        <img src="/hero-panel.webp" alt="Lexron half-cut TopCon güneş paneli"
          width="800" height="800" fetchpriority="high" decoding="async"
          className="w-full aspect-square object-cover" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="anim-shine absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12" />
        </div>
      </div>

      {/* Enerji akışı: panel → inverter → ev */}
      <svg viewBox="0 0 400 70" className="w-full mt-3">
        <path className="anim-flow" d="M60 35 H165" stroke="#36C5EC" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path className="anim-flow" d="M235 35 H340" stroke="#6ABF89" strokeWidth="3" fill="none" strokeLinecap="round" />
        <text x="35" y="43" fontSize="26" textAnchor="middle">🔆</text>
        <text x="200" y="43" fontSize="26" textAnchor="middle">🔌</text>
        <text x="365" y="43" fontSize="26" textAnchor="middle">🏠</text>
        <text x="112" y="20" fontSize="11" textAnchor="middle" fill="#47494899">DC</text>
        <text x="287" y="20" fontSize="11" textAnchor="middle" fill="#47494899">AC 220V</text>
      </svg>
    </div>
  );
}

/* ---------- Sayan istatistikler ---------- */
function Stats() {
  const store = useStore();
  const items = [
    { n: store.products.length, suf: "+", label: "Ürün çeşidi" },
    { n: store.categories.length, suf: "", label: "Kategori" },
    { n: 25, suf: " yıl", label: "Panel performans garantisi" },
    { n: 14, suf: " gün", label: "Koşulsuz iade hakkı" },
  ];
  return (
    <div className="border-b border-surface-line bg-surface-card">
      <div className="wrap py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        {items.map((it) => <Stat key={it.label} {...it} />)}
      </div>
    </div>
  );
}

function Stat({ n, suf, label }) {
  const [val, ref] = useCountUp(n);
  return (
    <div ref={ref}>
      <div className="text-2xl md:text-3xl font-extrabold text-[#9a6a12]">{val}{suf}</div>
      <div className="text-xs text-brand-ink/60 mt-1">{label}</div>
    </div>
  );
}

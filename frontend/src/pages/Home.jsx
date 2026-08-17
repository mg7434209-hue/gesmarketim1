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
  const aliciOdemeli = store.config.commerce.kargoModu === "alici";
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
            {aliciOdemeli
              ? <>🚚 Tüm Türkiye'ye kargo · 💰 Havale/EFT indirimi · ↩️ 14 gün koşulsuz iade</>
              : <>🚚 {limit} ₺ üzeri ücretsiz kargo · 💰 Havale/EFT indirimi · ↩️ 14 gün koşulsuz iade</>}
          </p>
        </div>
        <HeroScene />
      </div>
    </section>
  );
}

/* Güneş → panel → inverter/akü → ev enerji akışı — tamamı SVG çizim,
   dış görsel yok. Animasyonlar yalnız transform/opacity (GPU dostu);
   prefers-reduced-motion'da index.css hepsini kapatır. */
function HeroScene() {
  return (
    <div className="max-w-xl mx-auto w-full" aria-hidden="true">
      <svg viewBox="0 0 560 380" className="w-full">
        <defs>
          <radialGradient id="hSunGlow">
            <stop offset="0" stopColor="#FDC722" stopOpacity=".45" />
            <stop offset="1" stopColor="#FDC722" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hCell" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3c6180" />
            <stop offset="1" stopColor="#2b4a66" />
          </linearGradient>
          <clipPath id="hPanelClip"><rect x="112" y="187" width="176" height="111" rx="6" /></clipPath>
        </defs>

        {/* Zemin */}
        <ellipse cx="290" cy="350" rx="250" ry="16" fill="#6ABF89" opacity=".14" />
        <line x1="60" y1="346" x2="520" y2="346" stroke="#47494822" strokeWidth="2" strokeLinecap="round" />

        {/* Güneş — dönen ışınlar + nefes */}
        <circle cx="82" cy="84" r="58" fill="url(#hSunGlow)" />
        <g className="anim-rays" stroke="#FDC722" strokeWidth="5" strokeLinecap="round">
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * 30 * Math.PI) / 180;
            return <line key={i}
              x1={82 + Math.cos(a) * 40} y1={84 + Math.sin(a) * 40}
              x2={82 + Math.cos(a) * 54} y2={84 + Math.sin(a) * 54} />;
          })}
        </g>
        <circle className="anim-sun" cx="82" cy="84" r="29" fill="#FDC722" />

        {/* Güneş ışığı → panele akış */}
        <path className="anim-flow" d="M116 116 Q150 150 178 180" stroke="#FDC722" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".8" />

        {/* Panel dizisi (ayaklı) + parlama süpürmesi */}
        <line x1="152" y1="298" x2="152" y2="346" stroke="#9aa7ac" strokeWidth="6" strokeLinecap="round" />
        <line x1="248" y1="298" x2="248" y2="346" stroke="#9aa7ac" strokeWidth="6" strokeLinecap="round" />
        <rect x="108" y="183" width="184" height="119" rx="9" fill="#dfe7ea" />
        <rect x="112" y="187" width="176" height="111" rx="6" fill="url(#hCell)" />
        <g stroke="#ffffff" strokeOpacity=".28" strokeWidth="2">
          {[1, 2, 3, 4, 5].map((i) => <line key={"c" + i} x1={112 + i * 29.33} y1="187" x2={112 + i * 29.33} y2="298" />)}
          {[1, 2].map((i) => <line key={"r" + i} x1="112" y1={187 + i * 37} x2="288" y2={187 + i * 37} />)}
        </g>
        <g clipPath="url(#hPanelClip)">
          <rect className="anim-sweep" x="96" y="175" width="38" height="135" fill="#ffffff" opacity=".33" />
        </g>

        {/* DC hattı: panel → inverter kabini */}
        <path className="anim-flow" d="M200 302 C200 330 280 322 324 318" stroke="#36C5EC" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <text x="258" y="308" fontSize="13" fontWeight="700" textAnchor="middle" fill="#2b97b5">DC</text>

        {/* İnverter + akü kabini */}
        <rect x="326" y="288" width="40" height="58" rx="6" fill="#ffffff" stroke="#d5dde0" strokeWidth="2" />
        <rect x="333" y="296" width="26" height="14" rx="3" fill="#36C5EC" opacity=".85" />
        <circle cx="337" cy="320" r="3" fill="#6ABF89" />
        <circle cx="347" cy="320" r="3" fill="#F65863" opacity=".7" />
        <rect x="333" y="329" width="26" height="10" rx="2" fill="#6ABF89" opacity=".9" />
        <rect x="335" y="331" width="16" height="6" rx="1" fill="#ffffff" opacity=".5" />

        {/* AC hattı: inverter → ev */}
        <path className="anim-flow" d="M366 316 C380 316 388 316 402 316" stroke="#6ABF89" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <text x="384" y="296" fontSize="12" fontWeight="700" textAnchor="middle" fill="#4d9668">AC</text>
        <text x="384" y="308" fontSize="9" fontWeight="600" textAnchor="middle" fill="#4d9668">220V</text>

        {/* Ev */}
        <rect x="402" y="228" width="128" height="118" rx="4" fill="#ffffff" stroke="#e0e6e3" strokeWidth="2" />
        <polygon points="390,230 466,158 542,230" fill="#5b7f8f" />
        <polygon points="404,222 466,164 528,222" fill="#6e93a3" />
        <rect className="anim-glow" x="424" y="252" width="30" height="30" rx="4" fill="#FDC722" />
        <g stroke="#ffffff" strokeWidth="2"><line x1="439" y1="252" x2="439" y2="282" /><line x1="424" y1="267" x2="454" y2="267" /></g>
        <rect x="482" y="290" width="34" height="56" rx="3" fill="#47494826" />
        <circle cx="510" cy="319" r="2.5" fill="#474948" opacity=".6" />
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

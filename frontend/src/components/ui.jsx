// Ortak bileşenler — tüm sayfalar aynı token'ları/bileşenleri kullanır.
import { Link } from "react-router-dom";
import { useStore, priceTL, havaleTL, fmtTL, fmtUSD, cartAdd } from "../api.js";

/** Markalı SVG yer tutucu — görselsiz ürünler için (K5). */
export function PlaceholderImg({ product, className = "" }) {
  const cat = useStore().categories.find((c) => c.slug === product.cat);
  return (
    <svg viewBox="0 0 400 312" className={className} role="img" aria-label={product.name}>
      <defs>
        <linearGradient id={"g" + product.id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eef7fb" />
          <stop offset="1" stopColor="#e2f1e8" />
        </linearGradient>
      </defs>
      <rect width="400" height="312" fill={"url(#g" + product.id + ")"} />
      <circle cx="340" cy="40" r="70" fill="#36C5EC" opacity=".08" />
      <circle cx="30" cy="290" r="90" fill="#6ABF89" opacity=".08" />
      <text x="200" y="150" fontSize="72" textAnchor="middle">{cat ? cat.icon : "🔆"}</text>
      <text x="200" y="215" fontSize="24" fontWeight="800" textAnchor="middle" fill="#474948">
        {product.brand}
      </text>
      <text x="200" y="245" fontSize="14" textAnchor="middle" fill="#47494899">
        Görsel yakında
      </text>
    </svg>
  );
}

export function ProductImg({ product, eager = false, className = "" }) {
  if (!product.img || !product.img.length) return <PlaceholderImg product={product} className={className} />;
  return (
    <img
      src={"/" + product.img[0]}
      alt={product.name}
      width="400" height="312"
      loading={eager ? "eager" : "lazy"}
      fetchpriority={eager ? "high" : undefined}
      decoding="async"
      className={className + " object-cover"}
    />
  );
}

/** Fiyat bloğu — spec: ₺ büyük; altında ≈ $X · günlük kur · KDV dahil · Havale. */
export function PriceBlock({ product, size = "sm" }) {
  const store = useStore();
  const tl = priceTL(product, store);
  return (
    <div>
      <div className={(size === "lg" ? "text-3xl" : "text-xl") + " font-extrabold text-[#9a6a12]"}>
        {fmtTL(tl)}
      </div>
      <div className="text-xs text-brand-ink/60 leading-5">
        {product.priceTL > 0 ? "KDV dahil" : <>≈ {fmtUSD(product.saleUsd)} · günlük kur · KDV dahil</>}
        <br />
        💰 Havale ile <b className="text-brand-green">{fmtTL(havaleTL(tl, store))}</b>
      </div>
    </div>
  );
}

export function StockBadge({ product, className = "" }) {
  if (product.inStock) return null;
  return <span className={"badge bg-brand-ink/70 text-white " + className}>STOKTA YOK</span>;
}

export function ProductCard({ product }) {
  return (
    <article className="card overflow-hidden flex flex-col group relative">
      <StockBadge product={product} className="absolute left-3 top-3 z-10" />
      <Link to={"/urun/" + product.id} className="block aspect-[4/3] bg-surface-alt overflow-hidden">
        <ProductImg product={product} className="w-full h-full transition group-hover:scale-[1.03]" />
      </Link>
      <div className="p-4 flex flex-col gap-2 grow">
        <span className="text-[11px] font-bold tracking-widest text-brand-ink/50 uppercase">{product.brand}</span>
        <Link to={"/urun/" + product.id} className="font-semibold text-[15px] leading-snug hover:text-brand-blue min-h-[42px]">
          {product.name}
        </Link>
        <PriceBlock product={product} />
        <div className="flex gap-2 mt-auto pt-2">
          {product.inStock ? (
            <button className="btn btn-primary flex-1" onClick={() => cartAdd(product.id)}>Sepete Ekle</button>
          ) : (
            <button className="btn flex-1" disabled>Stokta Yok</button>
          )}
          <Link to={"/urun/" + product.id} className="btn btn-ghost">İncele</Link>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, empty = "Ürün bulunamadı." }) {
  if (!products.length) return <p className="text-brand-ink/60 py-8">{empty}</p>;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}

export function Section({ title, sub, action, children, alt = false }) {
  return (
    <section className={alt ? "bg-surface-alt border-y border-surface-line" : ""}>
      <div className="wrap py-10 md:py-14">
        {(title || action) && (
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl">{title}</h2>
              {sub && <p className="text-brand-ink/60 mt-1">{sub}</p>}
            </div>
            {action}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

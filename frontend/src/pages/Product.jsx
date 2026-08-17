import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStore, priceTL, havaleTL, fmtTL, cartAdd, waLink } from "../api.js";
import { useSeo } from "../hooks.js";
import { PlaceholderImg, PriceBlock, StockBadge, ProductGrid, Section } from "../components/ui.jsx";
import NotFound from "./NotFound.jsx";

export default function Product() {
  const store = useStore();
  const { id } = useParams();
  const p = store.products.find((x) => x.id === id);
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [added, setAdded] = useState(false);

  const { company, commerce } = store.config;
  const cat = p && store.categories.find((c) => c.slug === p.cat);
  const tl = p ? priceTL(p, store) : 0;

  useSeo(p ? {
    title: p.name + " | " + company.brand,
    description: (p.desc || p.name).slice(0, 160),
    jsonLd: {
      "@context": "https://schema.org", "@type": "Product",
      name: p.name, sku: p.code, description: p.desc,
      brand: { "@type": "Brand", name: p.brand },
      image: (p.img || []).map((i) => company.domain + "/" + i),
      offers: {
        "@type": "Offer", url: company.domain + "/urun/" + p.id,
        priceCurrency: "TRY", price: tl,
        availability: "https://schema.org/" + (p.inStock ? "InStock" : "OutOfStock"),
        itemCondition: "https://schema.org/NewCondition",
      },
    },
  } : { title: "Ürün bulunamadı | " + company.brand });

  if (!p) return <NotFound />;

  const imgs = p.img || [];
  const related = store.products.filter((x) => x.cat === p.cat && x.id !== p.id && x.inStock).slice(0, 4);
  const specs = Object.entries(p.specs || {});
  const freeShip = tl * qty >= commerce.freeShippingLimit;

  const add = () => {
    cartAdd(p.id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      <div className="wrap py-8">
        <nav className="text-xs text-brand-ink/60 mb-4" aria-label="breadcrumb">
          <Link to="/" className="hover:text-brand-blue">Ana Sayfa</Link>
          {cat && <> › <Link to={"/kategori/" + cat.slug} className="hover:text-brand-blue">{cat.name}</Link></>}
          {" › "}<span className="text-brand-ink/80">{p.name.slice(0, 40)}…</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Galeri */}
          <div>
            <div className="card overflow-hidden aspect-[4/3] bg-surface-alt relative">
              <StockBadge product={p} className="absolute left-3 top-3 z-10" />
              {imgs.length
                ? <img src={"/" + imgs[imgIdx]} alt={p.name} width="800" height="600"
                    fetchpriority="high" decoding="async" className="w-full h-full object-contain" />
                : <PlaceholderImg product={p} className="w-full h-full" />}
            </div>
            {imgs.length > 1 && (
              <div className="flex gap-2 mt-2">
                {imgs.map((im, i) => (
                  <button key={im} onClick={() => setImgIdx(i)} aria-label={"Görsel " + (i + 1)}
                    className={"card overflow-hidden w-20 h-16 " + (i === imgIdx ? "ring-2 ring-brand-blue" : "")}>
                    <img src={"/" + im} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Satın alma kutusu */}
          <div>
            <span className="text-xs font-bold tracking-widest text-brand-ink/50 uppercase">{p.brand}</span>
            <h1 className="text-xl md:text-2xl leading-snug mt-1">{p.name}</h1>
            <p className="text-xs text-brand-ink/50 mt-1 mb-4">Ürün kodu: {p.code}</p>

            <PriceBlock product={p} size="lg" />

            {p.inStock ? (
              <div className="flex flex-wrap items-center gap-3 mt-5">
                <div className="flex items-center border border-surface-line rounded-btn bg-surface-card">
                  <button className="px-3.5 py-2.5 font-bold" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Azalt">−</button>
                  <b className="w-8 text-center">{qty}</b>
                  <button className="px-3.5 py-2.5 font-bold" onClick={() => setQty(qty + 1)} aria-label="Artır">+</button>
                </div>
                <button className="btn btn-primary px-8 py-3 text-base" onClick={add}>
                  {added ? "✓ Sepete eklendi" : "🛒 Sepete Ekle"}
                </button>
                <Link to="/sepet" className="btn py-3">Sepete Git</Link>
              </div>
            ) : (
              <div className="mt-5">
                <button className="btn text-base px-8 py-3" disabled>Stokta Yok</button>
                <a className="btn btn-wa ml-2 py-3" target="_blank" rel="noopener noreferrer"
                  href={waLink(store, `Merhaba! "${p.name}" (${p.code}) stoğa gelince haber almak istiyorum.`)}>
                  💬 Stok gelince haber ver
                </a>
              </div>
            )}

            <ul className="mt-6 space-y-2 text-sm text-brand-ink/80">
              <li>✅ Tüm fiyatlar <b>KDV dahildir</b> — sürpriz yok.</li>
              <li>💰 Havale/EFT ile <b className="text-brand-green">{fmtTL(havaleTL(tl, store) * qty)}</b> (%{commerce.havaleDiscountPct} indirim).</li>
              <li>🚚 {commerce.kargoModu === "alici"
                ? <>Kargo <b>alıcı ödemeli</b> — ücret teslimatta kargo firmasına ödenir.</>
                : freeShip
                  ? <><b>Kargo ücretsiz</b> — sipariş tutarınız limitin üzerinde.</>
                  : <>Kargo {fmtTL(commerce.shippingFlat)} · <b>{fmtTL(commerce.freeShippingLimit)}</b> üzeri ücretsiz.</>}</li>
              <li>↩️ 14 gün koşulsuz iade hakkı.</li>
              <li>🛡️ Lexron distribütör garantisi kapsamında.</li>
            </ul>

            <a className="btn btn-wa w-full mt-5 py-3" target="_blank" rel="noopener noreferrer"
              href={waLink(store, `Merhaba! "${p.name}" (${p.code} · ${fmtTL(tl)}) hakkında bilgi almak istiyorum.`)}>
              💬 WhatsApp'tan Sor
            </a>
          </div>
        </div>

        {/* Açıklama + teknik */}
        <div className="mt-10 grid md:grid-cols-2 gap-6 items-start">
          <div className="card p-6">
            <h2 className="text-lg mb-3">Ürün Açıklaması</h2>
            <p className="text-[15px] leading-7 text-brand-ink/85">{p.desc}</p>
          </div>
          {specs.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg mb-3">Teknik Özellikler</h2>
              <table className="w-full text-sm">
                <tbody>
                  {specs.map(([k, v]) => (
                    <tr key={k} className="border-b border-surface-line last:border-0">
                      <td className="py-2 font-semibold pr-4">{k}</td>
                      <td className="py-2 text-brand-ink/80">{String(v)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <Section alt title="Benzer Ürünler">
          <ProductGrid products={related} />
        </Section>
      )}
    </>
  );
}

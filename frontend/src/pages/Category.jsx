import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useStore, priceTL } from "../api.js";
import { useSeo } from "../hooks.js";
import { ProductGrid } from "../components/ui.jsx";

const PER_PAGE = 24;
const TR = (s) => s.toLocaleLowerCase("tr");

export default function Category() {
  const store = useStore();
  const { slug } = useParams();
  const [sp] = useSearchParams();
  const q = sp.get("q") || "";

  const cat = slug ? store.categories.find((c) => c.slug === slug) : null;

  // Taban liste: kategori / arama / tümü
  const base = useMemo(() => {
    if (q) {
      const terms = TR(q).split(/\s+/).filter(Boolean);
      return store.products.filter((p) => {
        const hay = TR([p.name, p.brand, p.desc || "", (p.tags || []).join(" ")].join(" "));
        return terms.every((t) => hay.includes(t));
      });
    }
    if (cat) return store.products.filter((p) => p.cat === cat.slug);
    return store.products;
  }, [store.products, cat, q]);

  const title = q ? `"${q}" için sonuçlar` : cat ? cat.name : "Tüm Ürünler";
  const desc = q ? `${base.length} ürün bulundu` : cat ? cat.desc : "Kataloğumuzdaki tüm solar ürünler";
  useSeo({
    title: title + " | " + store.config.company.brand,
    description: desc,
    jsonLd: cat && {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: store.config.company.domain + "/" },
        { "@type": "ListItem", position: 2, name: cat.name, item: store.config.company.domain + "/kategori/" + cat.slug },
      ],
    },
  });

  // Filtre durumu — kategori/arama değişince sıfırlanması için key ile remount
  return (
    <FilterableList key={(cat ? cat.slug : "all") + "|" + q}
      base={base} cat={cat} title={title} desc={desc} store={store} />
  );
}

function FilterableList({ base, cat, title, desc, store }) {
  const [state, setState] = useState({ brands: [], min: "", max: "", stock: false, sort: "featured", page: 1 });
  const [showFilters, setShowFilters] = useState(false);
  const set = (patch) => setState((s) => ({ ...s, page: 1, ...patch }));

  const brandOptions = useMemo(
    () => [...new Set(base.map((p) => p.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b, "tr")),
    [base]
  );

  const list = useMemo(() => {
    let l = base.filter((p) => {
      if (state.brands.length && !state.brands.includes(p.brand)) return false;
      if (state.stock && !p.inStock) return false;
      const tl = priceTL(p, store);
      if (state.min !== "" && tl < +state.min) return false;
      if (state.max !== "" && tl > +state.max) return false;
      return true;
    });
    if (state.sort === "priceAsc") l.sort((a, b) => priceTL(a, store) - priceTL(b, store));
    else if (state.sort === "priceDesc") l.sort((a, b) => priceTL(b, store) - priceTL(a, store));
    else if (state.sort === "name") l.sort((a, b) => a.name.localeCompare(b.name, "tr"));
    else l.sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0) || (b.inStock ? 1 : 0) - (a.inStock ? 1 : 0));
    return l;
  }, [base, state, store]);

  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const page = Math.min(state.page, pages);
  const slice = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="wrap py-8">
      <nav className="text-xs text-brand-ink/60 mb-3" aria-label="breadcrumb">
        <Link to="/" className="hover:text-brand-blue">Ana Sayfa</Link> › {cat ? cat.name : "Ürünler"}
      </nav>
      <h1 className="text-2xl md:text-3xl">{title}</h1>
      <p className="text-brand-ink/60 mt-1 mb-6">{desc}</p>

      <div className="grid lg:grid-cols-[240px_1fr] gap-6 items-start">
        {/* Filtre paneli */}
        <aside className="card p-4 lg:sticky lg:top-32">
          <button className="btn w-full lg:hidden mb-2" onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? "Filtreleri Gizle" : "🔍 Filtrele"}
          </button>
          <div className={(showFilters ? "block" : "hidden") + " lg:block space-y-5"}>
            <div>
              <b className="text-sm">Fiyat (₺)</b>
              <div className="flex gap-2 mt-2">
                <input type="number" min="0" placeholder="Min" className="input" value={state.min}
                  onChange={(e) => set({ min: e.target.value })} aria-label="En düşük fiyat" />
                <input type="number" min="0" placeholder="Max" className="input" value={state.max}
                  onChange={(e) => set({ max: e.target.value })} aria-label="En yüksek fiyat" />
              </div>
            </div>
            {brandOptions.length > 1 && (
              <div>
                <b className="text-sm">Marka</b>
                {brandOptions.map((b) => (
                  <label key={b} className="flex items-center gap-2 mt-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={state.brands.includes(b)}
                      onChange={(e) => set({ brands: e.target.checked ? [...state.brands, b] : state.brands.filter((x) => x !== b) })} />
                    {b}
                  </label>
                ))}
              </div>
            )}
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={state.stock} onChange={(e) => set({ stock: e.target.checked })} />
              Sadece stoktakiler
            </label>
            <button className="btn w-full"
              onClick={() => setState({ brands: [], min: "", max: "", stock: false, sort: "featured", page: 1 })}>
              Filtreleri Temizle
            </button>
          </div>
        </aside>

        {/* Liste */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="text-sm text-brand-ink/60">{list.length} ürün</span>
            <select className="input max-w-[210px]" value={state.sort} aria-label="Sırala"
              onChange={(e) => set({ sort: e.target.value })}>
              <option value="featured">Öne çıkanlar</option>
              <option value="priceAsc">Fiyat: düşükten yükseğe</option>
              <option value="priceDesc">Fiyat: yüksekten düşüğe</option>
              <option value="name">İsme göre (A–Z)</option>
            </select>
          </div>

          <ProductGrid products={slice} empty="Bu kriterlere uyan ürün bulunamadı — filtreleri gevşetmeyi deneyin." />

          {pages > 1 && (
            <div className="flex gap-2 justify-center mt-8">
              {Array.from({ length: pages }, (_, i) => (
                <button key={i} onClick={() => { setState((s) => ({ ...s, page: i + 1 })); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className={"btn px-4 " + (page === i + 1 ? "btn-primary" : "")}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}

          {cat && cat.seo && (
            <div className="mt-10 card p-6 text-sm leading-7 text-brand-ink/80">
              <h2 className="text-lg mb-2">{cat.name} Seçim Rehberi</h2>
              <p>{cat.seo}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

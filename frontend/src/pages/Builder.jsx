// Sistem Kur — /hesaplayici (rota ve menü adı değişmez)
//
// SADE 3 BÖLÜM (sekme kartları):
//  1) 🧩 Kendi Projeni Kendin Oluştur — panel/inverter/akü kayar-açılır (akordeon)
//     menülerle seçilir; UYUMLULUK canlı denetlenir (akü bankası ↔ inverter
//     voltajı, panel dizisi ↔ MPPT aralığı, PV gücü ↔ inverter sınırı).
//  2) 💧 Solar Sulama — pompa HP + faz seçilir; SMART VFD500 datasheet
//     değerleriyle sürücü + panel önerilir (katalog ürünü varsa fiyatıyla).
//  3) 📦 Size Özel Paketler — config.builder.paketler doldurulunca listelenir.
// Üstte ince "AI Danışman" şeridi (isteğe bağlı, /api/asistan) durur; teklif
// dönerse teklif kartı gösterilir. Her sonucun altında ücretsiz proje
// doğrulaması bloğu (/api/leads) vardır.
//
// KURAL: hiçbir katsayı/fiyat koda gömülmez — katsayılar config.builder'dan,
// fiyatlar canlı /api/products + priceTL()'den gelir.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useStore, priceTL, havaleTL, fmtTL, cartGet, cartAdd, waLink } from "../api.js";
import { useSeo } from "../hooks.js";
import { PlaceholderImg } from "../components/ui.jsx";
import {
  asistanSor, leadGonder, matchLocalProduct, teklifPanelWatt,
  AsistanKapaliError, SistemKurApiError,
} from "../sistemkur.js";

const OEM_KEY = "gesm.oem";
const ORNEKLER = [
  "Bağ evinde buzdolabı, 5 lamba, akşam 3 saat TV",
  "10 beygir pompam var, günde 6 saat sulama",
];
const TEL_RE = /^[0-9+\s()-]{10,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Akü nominal voltajını sistem sınıfına indirger: 12,8→12 · 25,6→24 · 51,2→48 */
const batSinif = (v) => (v <= 13.5 ? 12 : v <= 27 ? 24 : 48);
const fmtV = (v) => String(v).replace(".", ",") + "V";

export default function Builder() {
  const store = useStore();
  const B = store.config.builder;
  const [sp] = useSearchParams();
  useSeo({
    title: "Sistem Kur — Kendi Solar Projenizi Oluşturun | " + store.config.company.brand,
    description:
      "Panel, inverter ve aküyü uyumluluk kontrolüyle kendiniz seçin; solar sulama pompanıza uygun sürücü ve panel önerisi alın ya da hazır paketlere göz atın.",
  });

  // ?profil=sulama → sulama sekmesi; diğerleri OEM
  const [mode, setMode] = useState(() => {
    const p = (sp.get("profil") || sp.get("tip") || "").toLowerCase();
    if (p === "sulama") return "sulama";
    if (p.startsWith("paket")) return "paketler";
    return "oem";
  });

  // --- AI danışman (isteğe bağlı ince şerit) + teklif ---
  const [teklif, setTeklif] = useState(null);
  const teklifRef = useRef(null);
  useEffect(() => {
    if (teklif) teklifRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [teklif]);

  const MODLAR = [
    { id: "oem", icon: "🧩", ad: "Kendi Projeni Kendin Oluştur",
      desc: "Panel, inverter ve aküyü kendin seç — uyumluluğu biz kontrol edelim." },
    { id: "sulama", icon: "💧", ad: "Solar Sulama Sistemi",
      desc: "Pompanın gücünü söyle; sürücüyü ve paneli biz önerelim." },
    { id: "paketler", icon: "📦", ad: "Size Özel Paketler",
      desc: "Kullanıma hazır, uyumu test edilmiş sistem paketleri." },
  ];

  return (
    <div className="wrap py-8">
      <h1 className="text-2xl md:text-3xl">🛠️ Sistem Kur</h1>
      <p className="text-brand-ink/60 mt-1 mb-5 max-w-2xl">
        Projenizi üç yoldan kurun: kendiniz seçin, sulama pompanıza göre önerelim
        ya da hazır paketlerden başlayın.
      </p>

      <AiDanisman onTeklif={setTeklif} />

      <div ref={teklifRef}>
        {teklif && (
          <>
            <TeklifKarti teklif={teklif} store={store} />
            <UyariDogrulama
              vurgulu={teklifPanelWatt(teklif.urunler) > 10000}
              ozet={{ kaynak: "asistan", paketSku: teklif.paketSku,
                urunler: teklif.urunler.map((u) => ({ ad: u.ad, adet: u.adet })) }}
            />
          </>
        )}
      </div>

      {/* --- 3 bölüm kartı --- */}
      <div className="grid sm:grid-cols-3 gap-3 mt-6 mb-6">
        {MODLAR.map((m) => (
          <button key={m.id} type="button" onClick={() => setMode(m.id)}
            aria-pressed={mode === m.id}
            className={"card p-4 text-left transition hover:-translate-y-0.5 " +
              (mode === m.id ? "ring-2 ring-brand-amber bg-brand-amber/10" : "")}>
            <span className="text-2xl">{m.icon}</span>
            <b className="block mt-1">{m.ad}</b>
            <span className="text-xs text-brand-ink/60 leading-5 block mt-0.5">{m.desc}</span>
          </button>
        ))}
      </div>

      {mode === "oem" && <OemKurucu store={store} B={B} />}
      {mode === "sulama" && <SulamaSihirbazi store={store} B={B} />}
      {mode === "paketler" && <Paketler store={store} B={B} />}
    </div>
  );
}

/* ========================================================================
   1) OEM KURUCU — akordeonlarla parça seçimi + canlı uyumluluk
   ======================================================================== */
function OemKurucu({ store, B }) {
  const byId = (ref) => store.products.find((p) => p.id === ref);
  const stokta = (p) => p && p.inStock !== false;

  const [sel, setSel] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem(OEM_KEY)) || {};
      return { panelRef: s.panelRef || null, panelQty: s.panelQty || 0,
        invRef: s.invRef || null, batRef: s.batRef || null, batQty: s.batQty || 0,
        cableM: s.cableM || 0, mc4: s.mc4 || 0 };
    } catch {
      return { panelRef: null, panelQty: 0, invRef: null, batRef: null, batQty: 0, cableM: 0, mc4: 0 };
    }
  });
  useEffect(() => { localStorage.setItem(OEM_KEY, JSON.stringify(sel)); }, [sel]);
  const [acik, setAcik] = useState("panel"); // açık akordeon
  const [toast, setToast] = useState("");

  const inv = B.catalog.inverters.find((i) => i.ref === sel.invRef) || null;
  const panelDef = sel.panelRef ? B.catalog.panels[sel.panelRef] : null;
  const bat = B.catalog.batteries.find((b) => b.ref === sel.batRef) || null;

  /* ---- uyumluluk hesapları (tüm eşikler config'ten) ---- */
  // Akü ↔ inverter: seri adet = inverter V / akü sınıf V (tam sayı olmalı)
  const batSeriFor = (b) => {
    if (!inv) return null;
    const s = inv.v / batSinif(b.v);
    return s >= 1 && s % 1 === 0 ? s : 0; // 0 = uyumsuz
  };
  // Panel ↔ MPPT: bu panelden kaç adet seri bağlanabilir?
  const seriAralik = (pd) => {
    if (!inv || !pd) return null;
    const [mMin, mMax] = inv.mppt;
    const sMin = Math.ceil(mMin / pd.voc);
    const sMax = Math.floor(mMax / pd.voc);
    return sMax >= 1 && sMin <= sMax ? [sMin, sMax] : [0, 0]; // [0,0] = uyumsuz
  };
  // Adet, seri×paralel olarak MPPT aralığına oturuyor mu?
  const panelDurum = useMemo(() => {
    if (!panelDef || !sel.panelQty) return null;
    if (!inv) return { ok: true, bilgi: "İnverter seçince dizi kontrolü yapılır." };
    const [sMin, sMax] = seriAralik(panelDef);
    if (sMax === 0) return { ok: false, neden: "Bu panelin gerilimi bu inverterin MPPT aralığına uymuyor — farklı panel ya da inverter seçin." };
    if (sel.panelQty < sMin)
      return { ok: false, neden: "Bu inverter için en az " + sMin + " panel seri bağlanmalı.", oneri: sMin };
    let dizi = null;
    for (let s = sMax; s >= sMin; s--) if (sel.panelQty % s === 0) { dizi = [s, sel.panelQty / s]; break; }
    if (!dizi) {
      const oneri = Math.ceil(sel.panelQty / sMin) * sMin;
      return { ok: false, neden: "Adet " + sMin + "–" + sMax + " seri dizilere bölünemiyor.", oneri };
    }
    return { ok: true, dizi, aralik: [sMin, sMax] };
  }, [panelDef, sel.panelQty, inv]);
  // Toplam PV gücü inverter sınırında mı?
  const pvDurum = useMemo(() => {
    if (!inv || !panelDef || !sel.panelQty) return null;
    const toplamW = panelDef.w * sel.panelQty;
    const maxW = inv.kw * 1000 * (B.oem.pvHeadroom || 1.3);
    return { ok: toplamW <= maxW, toplamW, maxW };
  }, [inv, panelDef, sel.panelQty]);
  const batDurum = useMemo(() => {
    if (!bat || !sel.batQty) return null;
    if (!inv) return { ok: true, bilgi: "İnverter seçince voltaj kontrolü yapılır." };
    const seri = batSeriFor(bat);
    if (!seri) return { ok: false, neden: fmtV(inv.v) + " inverter " + fmtV(bat.v) + " aküyle uyumsuz — " + fmtV(inv.v) + " sınıfı akü seçin." };
    if (sel.batQty % seri !== 0)
      return { ok: false, neden: fmtV(inv.v) + " sistem için akü adedi " + seri + "'in katı olmalı.", oneri: Math.max(seri, Math.ceil(sel.batQty / seri) * seri) };
    return { ok: true, seri, banka: sel.batQty / seri };
  }, [bat, sel.batQty, inv]);

  /* ---- satırlar + toplam ---- */
  const satirlar = useMemo(() => {
    const out = [];
    const push = (ref, qty, rol) => { const p = byId(ref); if (p && qty > 0) out.push({ ref, qty, rol, p }); };
    push(sel.panelRef, sel.panelQty, "Güneş paneli");
    if (sel.invRef) push(sel.invRef, 1, "Akıllı inverter (MPPT)");
    push(sel.batRef, sel.batQty, "Akü");
    if (B.catalog.extras.cable) push(B.catalog.extras.cable, sel.cableM, "Solar kablo (metre)");
    if (B.catalog.extras.mc4) push(B.catalog.extras.mc4, sel.mc4, "MC4 konnektör (çift)");
    return out;
  }, [sel, store.products]);
  const toplam = satirlar.reduce((s, l) => s + priceTL(l.p, store) * l.qty, 0);
  const sertHata = (batDurum && !batDurum.ok && !batDurum.oneri) || (panelDurum && !panelDurum.ok && !panelDurum.oneri);
  const herhangiUyari = [panelDurum, pvDurum, batDurum].some((d) => d && !d.ok);

  const sepeteEkle = () => {
    let n = 0;
    satirlar.forEach((l) => { cartAdd(l.ref, l.qty); n += l.qty; });
    void cartGet();
    setToast(n + " ürün sepete eklendi.");
    setTimeout(() => setToast(""), 3500);
  };
  const waMsg = "Merhaba! Sistem Kur'da kendi projemi oluşturdum:\n" +
    satirlar.map((l) => "• " + l.qty + " × " + l.p.name).join("\n") +
    (toplam ? "\nTahmini toplam: " + fmtTL(toplam) : "") + "\nKesin teklif rica ediyorum.";

  /* ---- seçim yardımcıları (akıllı varsayılan adetler) ---- */
  const panelSec = (ref) => {
    const pd = B.catalog.panels[ref];
    let qty = sel.panelRef === ref && sel.panelQty ? sel.panelQty : 2;
    if (inv && pd) { const [sMin, sMax] = seriAralik(pd); if (sMax > 0) qty = sMin; }
    setSel((s) => ({ ...s, panelRef: ref, panelQty: qty }));
  };
  const invSec = (ref) => setSel((s) => ({ ...s, invRef: ref }));
  const batSec = (b) => {
    const seri = inv ? (inv.v / batSinif(b.v)) : 1;
    const qty = seri >= 1 && seri % 1 === 0 ? seri : 1;
    setSel((s) => ({ ...s, batRef: b.ref, batQty: qty }));
  };

  const panelList = Object.entries(B.catalog.panels)
    .map(([ref, pd]) => ({ ref, ...pd, p: byId(ref) }))
    .filter((x) => stokta(x.p));
  const invList = B.catalog.inverters.map((i) => ({ ...i, p: byId(i.ref) })).filter((x) => stokta(x.p));
  const batList = B.catalog.batteries.map((b) => ({ ...b, p: byId(b.ref) })).filter((x) => stokta(x.p));

  return (
    <div>
      <div className="space-y-3">
        {/* -------- PANEL -------- */}
        <Akordeon acikMi={acik === "panel"} onToggle={() => setAcik(acik === "panel" ? "" : "panel")}
          icon="☀️" baslik="Güneş Paneli"
          ozet={sel.panelRef && byId(sel.panelRef) ? sel.panelQty + " × " + byId(sel.panelRef).name : "Seçilmedi"}>
          <div className="space-y-2">
            {panelList.map((x) => {
              const aralik = inv ? seriAralik(x) : null;
              const uyumsuz = aralik && aralik[1] === 0;
              return (
                <SecimSatiri key={x.ref} p={x.p} store={store} secili={sel.panelRef === x.ref}
                  disabled={uyumsuz}
                  rozet={uyumsuz
                    ? { tip: "kotu", metin: "MPPT aralığına uymuyor" }
                    : aralik ? { tip: "iyi", metin: aralik[0] + "–" + aralik[1] + " adet seri bağlanabilir" }
                      : { tip: "notr", metin: x.w + " W · Voc " + fmtV(x.voc) }}
                  onSec={() => panelSec(x.ref)} />
              );
            })}
          </div>
          {sel.panelRef && (
            <AdetSecici etiket="Panel adedi" deger={sel.panelQty}
              onDegis={(q) => setSel((s) => ({ ...s, panelQty: q }))} min={0} max={200} />
          )}
        </Akordeon>

        {/* -------- İNVERTER -------- */}
        <Akordeon acikMi={acik === "inv"} onToggle={() => setAcik(acik === "inv" ? "" : "inv")}
          icon="⚡" baslik="İnverter"
          ozet={sel.invRef && byId(sel.invRef) ? byId(sel.invRef).name : "Seçilmedi"}>
          <div className="space-y-2">
            {invList.map((x) => (
              <SecimSatiri key={x.ref} p={x.p} store={store} secili={sel.invRef === x.ref}
                rozet={{ tip: "notr", metin: x.kw + " kW · " + fmtV(x.v) + " akü · MPPT " + x.mppt[0] + "–" + x.mppt[1] + "V" }}
                onSec={() => invSec(x.ref)} />
            ))}
          </div>
          <p className="text-xs text-brand-ink/50 mt-3">
            💡 İnverteri seçince panel ve akü listelerinde uyumluluk rozetleri görünür.
          </p>
        </Akordeon>

        {/* -------- AKÜ -------- */}
        <Akordeon acikMi={acik === "aku"} onToggle={() => setAcik(acik === "aku" ? "" : "aku")}
          icon="🔋" baslik="Akü / Batarya"
          ozet={sel.batRef && byId(sel.batRef) ? sel.batQty + " × " + byId(sel.batRef).name : "Seçilmedi (şebeke bağlantılıysa gerekmez)"}>
          <div className="space-y-2">
            {batList.map((x) => {
              const seri = inv ? batSeriFor(x) : null;
              const uyumsuz = seri === 0;
              return (
                <SecimSatiri key={x.ref} p={x.p} store={store} secili={sel.batRef === x.ref}
                  disabled={uyumsuz}
                  rozet={uyumsuz
                    ? { tip: "kotu", metin: fmtV(inv.v) + " inverterle uyumsuz" }
                    : seri ? { tip: "iyi", metin: seri === 1 ? "Tek başına uyumlu" : seri + " adet seri = " + fmtV(inv.v) + " banka" }
                      : { tip: "notr", metin: fmtV(x.v) + " · " + (x.wh / 1000).toFixed(1).replace(".", ",") + " kWh · " + (x.chem === "jel" ? "Jel" : "LiFePO4") }}
                  onSec={() => batSec(x)} />
              );
            })}
          </div>
          {sel.batRef && (
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <AdetSecici etiket="Akü adedi" deger={sel.batQty}
                onDegis={(q) => setSel((s) => ({ ...s, batQty: q }))} min={0} max={64} />
              <button type="button" className="text-xs text-brand-blue hover:underline"
                onClick={() => setSel((s) => ({ ...s, batRef: null, batQty: 0 }))}>
                Akü istemiyorum ✕
              </button>
            </div>
          )}
        </Akordeon>

        {/* -------- KABLO & MONTAJ -------- */}
        <Akordeon acikMi={acik === "ekstra"} onToggle={() => setAcik(acik === "ekstra" ? "" : "ekstra")}
          icon="🔌" baslik="Kablo & Bağlantı"
          ozet={(sel.cableM ? sel.cableM + " m kablo" : "") + (sel.cableM && sel.mc4 ? " · " : "") + (sel.mc4 ? sel.mc4 + " çift MC4" : "") || "İsteğe bağlı"}>
          <div className="grid sm:grid-cols-2 gap-4">
            {B.catalog.extras.cable && byId(B.catalog.extras.cable) && (
              <div>
                <p className="text-sm font-semibold mb-1">{byId(B.catalog.extras.cable).name}</p>
                <AdetSecici etiket="Metre" deger={sel.cableM}
                  onDegis={(q) => setSel((s) => ({ ...s, cableM: q }))} min={0} max={500} />
              </div>
            )}
            {B.catalog.extras.mc4 && byId(B.catalog.extras.mc4) && (
              <div>
                <p className="text-sm font-semibold mb-1">{byId(B.catalog.extras.mc4).name}</p>
                <AdetSecici etiket="Çift" deger={sel.mc4}
                  onDegis={(q) => setSel((s) => ({ ...s, mc4: q }))} min={0} max={100} />
                {panelDurum && panelDurum.ok && panelDurum.dizi && (
                  <p className="text-xs text-brand-ink/50 mt-1">Öneri: dizi başına 1 çift ({panelDurum.dizi[1]} paralel dizi)</p>
                )}
              </div>
            )}
          </div>
        </Akordeon>
      </div>

      {/* -------- SİSTEM ÖZETİ + UYUM KONTROLÜ -------- */}
      {satirlar.length > 0 && (
        <div className="card p-5 mt-5">
          <h3 className="text-lg mb-3">Sistem özetiniz</h3>
          <div className="space-y-1.5 text-sm">
            {satirlar.map((l) => (
              <div key={l.ref} className="flex justify-between gap-3">
                <span className="min-w-0">
                  <span className="text-brand-ink/50 text-xs">{l.rol} · </span>
                  <Link to={"/urun/" + l.ref} className="hover:text-brand-blue">{l.p.name}</Link>
                  <span className="text-brand-ink/50"> × {l.qty}</span>
                </span>
                <b className="shrink-0">{fmtTL(priceTL(l.p, store) * l.qty)}</b>
              </div>
            ))}
          </div>

          {/* uyum kontrol listesi */}
          <ul className="mt-4 space-y-1.5 text-sm">
            {batDurum && (
              <KontrolSatiri ok={batDurum.ok}
                metin={batDurum.ok
                  ? (batDurum.bilgi || fmtV(inv.v) + " akü bankası: " + batDurum.seri + " seri × " + batDurum.banka + " paralel ✓")
                  : batDurum.neden}
                oneri={batDurum.oneri}
                onDuzelt={batDurum.oneri ? () => setSel((s) => ({ ...s, batQty: batDurum.oneri })) : null} />
            )}
            {panelDurum && (
              <KontrolSatiri ok={panelDurum.ok}
                metin={panelDurum.ok
                  ? (panelDurum.bilgi || "Panel dizisi: " + panelDurum.dizi[0] + " seri × " + panelDurum.dizi[1] + " paralel (MPPT " + inv.mppt[0] + "–" + inv.mppt[1] + "V) ✓")
                  : panelDurum.neden}
                oneri={panelDurum.oneri}
                onDuzelt={panelDurum.oneri ? () => setSel((s) => ({ ...s, panelQty: panelDurum.oneri })) : null} />
            )}
            {pvDurum && (
              <KontrolSatiri ok={pvDurum.ok}
                metin={pvDurum.ok
                  ? "PV gücü " + (pvDurum.toplamW / 1000).toFixed(2).replace(".", ",") + " kW — inverter sınırında ✓"
                  : "PV gücü inverter sınırını aşıyor (azami ~" + (pvDurum.maxW / 1000).toFixed(1).replace(".", ",") + " kW) — panel adedini azaltın ya da büyük inverter seçin."} />
            )}
            {!inv && (sel.panelRef || sel.batRef) && (
              <li className="text-brand-ink/50 text-xs">💡 İnverter seçince voltaj ve dizi uyumluluğu burada denetlenir.</li>
            )}
          </ul>

          <div className="flex justify-between text-lg font-extrabold mt-4 pt-3 border-t border-surface-line">
            <span>Toplam</span><span className="text-[#9a6a12]">{fmtTL(toplam)}</span>
          </div>
          <div className="flex justify-between text-sm text-brand-green font-semibold mt-1">
            <span>💰 Havale/EFT ile</span>
            <span>{fmtTL(havaleTL(toplam, store))} (%{store.config.commerce.havaleDiscountPct} indirimli)</span>
          </div>
          <p className="text-xs text-brand-ink/60 mt-2">KDV dahil · kargo hariç · fiyatlar liste fiyatıdır.</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <button className="btn btn-primary grow" onClick={sepeteEkle} disabled={Boolean(sertHata)}>
              🛒 Sistemi Sepete Ekle
            </button>
            <a className="btn btn-wa grow" target="_blank" rel="noopener noreferrer" href={waLink(store, waMsg)}>
              WhatsApp ile Teklif İste
            </a>
          </div>
          {sertHata && <p className="text-xs text-brand-red font-semibold mt-2">Uyumsuz seçim var — yukarıdaki uyarıları giderin.</p>}
          {toast && <p className="text-sm text-brand-green mt-3">✓ {toast} <Link to="/sepet" className="underline">Sepete git →</Link></p>}
        </div>
      )}

      {satirlar.length > 0 && (
        <UyariDogrulama vurgulu={Boolean(panelDef && sel.panelQty && panelDef.w * sel.panelQty > 10000)}
          ozet={{ kaynak: "oem",
            urunler: satirlar.map((l) => ({ ad: l.p.name, adet: l.qty })), toplamTL: toplam,
            uyari: herhangiUyari ? "uyum uyarısı var" : undefined }} />
      )}
    </div>
  );
}

function Akordeon({ icon, baslik, ozet, acikMi, onToggle, children }) {
  return (
    <section className="card overflow-hidden">
      <button type="button" onClick={onToggle} aria-expanded={acikMi}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-alt transition">
        <span className="text-xl" aria-hidden="true">{icon}</span>
        <span className="grow min-w-0">
          <b className="block text-sm">{baslik}</b>
          <span className="block text-xs text-brand-ink/60 truncate">{ozet}</span>
        </span>
        <span className={"text-brand-ink/40 transition-transform " + (acikMi ? "rotate-180" : "")} aria-hidden="true">▾</span>
      </button>
      <div className={"transition-all duration-300 ease-in-out overflow-hidden " + (acikMi ? "max-h-[3000px]" : "max-h-0")}>
        <div className="px-4 pb-4">{children}</div>
      </div>
    </section>
  );
}

function SecimSatiri({ p, store, secili, disabled, rozet, onSec }) {
  return (
    <button type="button" onClick={onSec} disabled={disabled}
      className={"w-full card p-2.5 flex items-center gap-3 text-left transition " +
        (secili ? "ring-2 ring-brand-amber " : "hover:border-brand-amber/60 ") +
        (disabled ? "opacity-45" : "")}>
      <span className="w-14 h-12 shrink-0 rounded-btn overflow-hidden bg-surface-alt">
        {p.img && p.img.length
          ? <img src={"/" + p.img[0]} alt="" loading="lazy" className="w-full h-full object-cover" />
          : <PlaceholderImg product={p} className="w-full h-full" />}
      </span>
      <span className="grow min-w-0">
        <span className="block text-sm font-semibold leading-snug line-clamp-2">{p.name}</span>
        {rozet && (
          <span className={"badge mt-0.5 " +
            (rozet.tip === "iyi" ? "bg-brand-green/15 text-brand-green"
              : rozet.tip === "kotu" ? "bg-brand-red/15 text-brand-red"
                : "bg-surface-alt text-brand-ink/60")}>
            {rozet.metin}
          </span>
        )}
      </span>
      <b className="shrink-0 text-sm">{fmtTL(priceTL(p, store))}</b>
    </button>
  );
}

function AdetSecici({ etiket, deger, onDegis, min = 0, max = 99 }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-brand-ink/70 mt-3">
      {etiket}
      <span className="flex items-center border border-surface-line rounded-btn bg-surface-card">
        <button type="button" className="px-2.5 py-1 font-bold" aria-label="Azalt"
          onClick={() => onDegis(Math.max(min, deger - 1))}>−</button>
        <input type="number" value={deger} min={min} max={max}
          onChange={(e) => onDegis(Math.min(max, Math.max(min, Math.floor(Number(e.target.value) || 0))))}
          className="w-14 text-center text-sm font-bold bg-transparent focus:outline-none" />
        <button type="button" className="px-2.5 py-1 font-bold" aria-label="Artır"
          onClick={() => onDegis(Math.min(max, deger + 1))}>+</button>
      </span>
    </label>
  );
}

function KontrolSatiri({ ok, metin, onDuzelt, oneri }) {
  return (
    <li className={"flex items-start gap-2 " + (ok ? "text-brand-green" : "text-brand-red")}>
      <span aria-hidden="true">{ok ? "✓" : "⚠"}</span>
      <span className="grow">{metin}
        {!ok && onDuzelt && (
          <button type="button" onClick={onDuzelt}
            className="ml-2 text-xs font-bold text-brand-blue hover:underline">
            {oneri} adede getir ↺
          </button>
        )}
      </span>
    </li>
  );
}

/* ========================================================================
   2) SOLAR SULAMA — HP + faz → SMART datasheet değerleriyle sürücü + panel
   ======================================================================== */
function SulamaSihirbazi({ store, B }) {
  const S = B.sulama;
  const byId = (ref) => store.products.find((p) => p.id === ref);
  const [faz, setFaz] = useState("380");
  const liste = S.suruculer.filter((d) => d.faz === faz);
  const [hp, setHp] = useState(liste[0]?.hp ?? 3);
  useEffect(() => {
    if (!liste.some((d) => d.hp === hp)) setHp(liste[0]?.hp ?? 3);
  }, [faz]); // eslint-disable-line react-hooks/exhaustive-deps
  const [toast, setToast] = useState("");

  const surucu = liste.find((d) => d.hp === hp) || null;
  const sinif = S.siniflar[faz];
  const surucuP = surucu && surucu.ref ? byId(surucu.ref) : null;
  const surucuSatilir = surucuP && surucuP.inStock !== false;

  // Panel önerisi: hedef güç = sürücü kW × pvOversize. Dizi GERİLİMİ sabit bir
  // gereksinimdir (MPPT aralığı) — seri adet oneriV/voc'tan gelir; güç, paralel
  // dizilerle hedefe YUKARI tamamlanır. Varsayılan panel modeli, gerilim şartını
  // sağlarken hedefi EN AZ aşan model olarak otomatik seçilir (küçük pompaya
  // dev panel dizisi önermemek için); kullanıcı istediği modele geçebilir.
  const panelSecenekleri = Object.entries(B.catalog.panels)
    .map(([ref, pd]) => ({ ref, ...pd, p: byId(ref) }))
    .filter((x) => x.p && x.p.inStock !== false)
    .sort((a, b) => b.w - a.w);

  const diziHesabi = (pd, hedefW) => {
    let seri = Math.max(1, Math.round(sinif.oneriV / pd.voc));
    while (seri > 1 && seri * pd.voc > sinif.maxDcV) seri--;
    const paralel = Math.max(1, Math.ceil(hedefW / (seri * pd.w)));
    const adet = seri * paralel;
    return { seri, paralel, adet, toplamW: adet * pd.w, gerilimOk: seri * pd.voc >= sinif.mppt[0] };
  };

  const enUygunRef = useMemo(() => {
    if (!surucu || panelSecenekleri.length === 0) return null;
    const hedefW = surucu.kw * 1000 * S.pvOversize;
    let best = null;
    for (const x of panelSecenekleri) {
      const d = diziHesabi(x, hedefW);
      const aday = { ref: x.ref, ...d, fiyat: priceTL(x.p, store) * d.adet };
      if (!best) { best = aday; continue; }
      // Önce gerilim şartını sağlayanlar; sonra müşteri için EN EKONOMİK dizi
      // (toplam ₺); eşitse az panel (az montaj) tercih edilir.
      if (aday.gerilimOk !== best.gerilimOk) { if (aday.gerilimOk) best = aday; continue; }
      if (aday.fiyat < best.fiyat || (aday.fiyat === best.fiyat && aday.adet < best.adet)) best = aday;
    }
    return best ? best.ref : null;
  }, [surucu, faz, store.products, store.kur]); // eslint-disable-line react-hooks/exhaustive-deps

  const [panelManuel, setPanelManuel] = useState(null); // kullanıcı elle seçerse
  const panelRef = panelManuel || enUygunRef;
  const panel = panelSecenekleri.find((x) => x.ref === panelRef) || panelSecenekleri[0] || null;

  const oneri = useMemo(() => {
    if (!surucu || !panel) return null;
    const hedefW = surucu.kw * 1000 * S.pvOversize;
    const d = diziHesabi(panel, hedefW);
    const uyari = !d.gerilimOk
      ? "Bu panelle dizi gerilimi önerilen MPPT aralığının altında kalıyor — daha yüksek Voc'lu panel tercih edin ya da bize danışın."
      : null;
    const gerilimNotu = d.toplamW > hedefW * 1.5
      ? "Dizi gerilimi gereksinimi (MPPT " + sinif.mppt[0] + "–" + sinif.mppt[1] + "V) nedeniyle panel gücü hedefin üzerinde çıkar — pompanız sabah ve akşam saatlerinde de tam verimle çalışır."
      : null;
    return { hedefW, ...d, uyari, gerilimNotu };
  }, [surucu, panel, faz]);

  const panelToplam = panel && oneri ? priceTL(panel.p, store) * oneri.adet : 0;
  const toplam = panelToplam + (surucuSatilir ? priceTL(surucuP, store) : 0);

  const sepeteEkle = () => {
    if (!oneri) return;
    let n = 0;
    if (surucuSatilir) { cartAdd(surucuP.id, 1); n += 1; }
    if (panel) { cartAdd(panel.ref, oneri.adet); n += oneri.adet; }
    void cartGet();
    setToast(n + " ürün sepete eklendi.");
    setTimeout(() => setToast(""), 3500);
  };

  const waMsg = surucu
    ? "Merhaba! Solar sulama sistemi istiyorum:\n• Pompa: " + String(surucu.hp).replace(".", ",") +
      " HP (" + String(surucu.kw).replace(".", ",") + " kW, " + sinif.cikis + " çıkış)\n" +
      (oneri && panel ? "• Panel: " + oneri.adet + " × " + panel.p.name + " (" + oneri.seri + " seri × " + oneri.paralel + " paralel)\n" : "") +
      (toplam ? "Tahmini toplam: " + fmtTL(toplam) + "\n" : "") + "Kesin teklif rica ediyorum."
    : "";

  return (
    <div>
      <div className="card p-5">
        <p className="font-semibold text-sm">
          Pompanızı seçin — sulamada akü gerekmez, pompa gündüz doğrudan panelden çalışır.
        </p>
        <div className="grid sm:grid-cols-3 gap-4 mt-4">
          <label className="block text-sm text-brand-ink/70">
            Motor tipi / şebeke
            <select className="input mt-1.5 font-semibold" value={faz} onChange={(e) => setFaz(e.target.value)}>
              <option value="380">Trifaze (3×380V çıkış)</option>
              <option value="220">Monofaze şebeke (3×220V çıkış)</option>
            </select>
          </label>
          <label className="block text-sm text-brand-ink/70">
            Pompa gücü
            <select className="input mt-1.5 font-semibold" value={hp} onChange={(e) => setHp(Number(e.target.value))}>
              {liste.map((d) => (
                <option key={d.hp} value={d.hp}>
                  {String(d.hp).replace(".", ",")} HP ({String(d.kw).replace(".", ",")} kW)
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-brand-ink/70">
            Panel modeli
            <select className="input mt-1.5 font-semibold" value={panelRef || ""} onChange={(e) => setPanelManuel(e.target.value)}>
              {panelSecenekleri.map((x) => (
                <option key={x.ref} value={x.ref}>
                  {x.p.name}{x.ref === enUygunRef ? " (önerilen)" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {surucu && oneri && panel && (
        <div className="card p-5 mt-4">
          <h3 className="text-lg">Önerilen sulama sisteminiz</h3>

          <div className="space-y-2 mt-3">
            {/* Sürücü satırı */}
            <div className="card p-3 flex items-center gap-3">
              {surucuP ? (
                <Link to={"/urun/" + surucuP.id} className="w-16 h-14 shrink-0 rounded-btn overflow-hidden bg-surface-alt">
                  {surucuP.img && surucuP.img.length
                    ? <img src={"/" + surucuP.img[0]} alt="" loading="lazy" className="w-full h-full object-cover" />
                    : <PlaceholderImg product={surucuP} className="w-full h-full" />}
                </Link>
              ) : (
                <span className="w-16 h-14 shrink-0 rounded-btn bg-surface-alt flex items-center justify-center text-xl">⚙️</span>
              )}
              <div className="grow min-w-0">
                <span className="text-xs text-brand-ink/50">MPPT pompa sürücüsü</span>
                {surucuP ? (
                  <Link to={"/urun/" + surucuP.id} className="block font-semibold text-sm leading-snug hover:text-brand-blue line-clamp-2">
                    {surucuP.name}
                  </Link>
                ) : (
                  <span className="block font-semibold text-sm leading-snug">
                    {String(surucu.kw).replace(".", ",")} kW MPPT sürücü ({String(surucu.hp).replace(".", ",")} HP · {sinif.cikis})
                  </span>
                )}
                <span className="text-xs text-brand-ink/60">
                  MPPT {sinif.mppt[0]}–{sinif.mppt[1]}V · önerilen PV girişi {sinif.oneriV}V · azami {sinif.maxDcV}V DC
                </span>
              </div>
              <b className="shrink-0 text-sm">
                {surucuSatilir ? fmtTL(priceTL(surucuP, store))
                  : surucuP ? "Stok sorun" : "Teklifle"}
              </b>
            </div>

            {/* Panel satırı */}
            <div className="card p-3 flex items-center gap-3">
              <Link to={"/urun/" + panel.ref} className="w-16 h-14 shrink-0 rounded-btn overflow-hidden bg-surface-alt">
                {panel.p.img && panel.p.img.length
                  ? <img src={"/" + panel.p.img[0]} alt="" loading="lazy" className="w-full h-full object-cover" />
                  : <PlaceholderImg product={panel.p} className="w-full h-full" />}
              </Link>
              <div className="grow min-w-0">
                <span className="text-xs text-brand-ink/50">Güneş paneli · {oneri.seri} seri × {oneri.paralel} paralel</span>
                <Link to={"/urun/" + panel.ref} className="block font-semibold text-sm leading-snug hover:text-brand-blue line-clamp-2">
                  {panel.p.name}
                </Link>
                <span className="text-xs text-brand-ink/60">
                  {fmtTL(priceTL(panel.p, store))} × {oneri.adet} · toplam {(oneri.toplamW / 1000).toFixed(2).replace(".", ",")} kW
                  {" (hedef ~" + (oneri.hedefW / 1000).toFixed(1).replace(".", ",") + " kW)"}
                </span>
              </div>
              <b className="shrink-0 text-sm">{fmtTL(panelToplam)}</b>
            </div>
          </div>

          {oneri.uyari && <p className="mt-3 text-xs font-semibold text-brand-red">⚠ {oneri.uyari}</p>}
          {oneri.gerilimNotu && <p className="mt-3 text-xs text-brand-ink/60">ℹ️ {oneri.gerilimNotu}</p>}
          {!surucuSatilir && surucuP && (
            <p className="mt-3 text-xs font-semibold text-brand-red">⚠ Sürücü şu an stokta yok — WhatsApp'tan stok bilgisi alın.</p>
          )}

          <div className="flex justify-between text-lg font-extrabold mt-4 pt-3 border-t border-surface-line">
            <span>Toplam{surucuSatilir ? "" : " (panel)"}</span>
            <span className="text-[#9a6a12]">{fmtTL(toplam)}</span>
          </div>
          <div className="flex justify-between text-sm text-brand-green font-semibold mt-1">
            <span>💰 Havale/EFT ile</span>
            <span>{fmtTL(havaleTL(toplam, store))} (%{store.config.commerce.havaleDiscountPct} indirimli)</span>
          </div>
          <p className="text-xs text-brand-ink/60 mt-2">
            KDV dahil · kargo hariç{surucuSatilir ? "" : " · sürücü fiyatı teklifle netleşir"} · montaj ve kablolama keşifle belirlenir.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <button className="btn btn-primary grow" onClick={sepeteEkle}>🛒 Sistemi Sepete Ekle</button>
            <a className="btn btn-wa grow" target="_blank" rel="noopener noreferrer" href={waLink(store, waMsg)}>
              WhatsApp ile Teklif İste
            </a>
          </div>
          {toast && <p className="text-sm text-brand-green mt-3">✓ {toast} <Link to="/sepet" className="underline">Sepete git →</Link></p>}
        </div>
      )}

      {surucu && oneri && (
        <UyariDogrulama vurgulu={oneri.toplamW > 10000}
          ozet={{ kaynak: "sulama", faz, hp: surucu.hp, surucuKw: surucu.kw,
            panel: panel ? { ad: panel.p.name, adet: oneri.adet } : null, toplamTL: toplam }} />
      )}
    </div>
  );
}

/* ========================================================================
   3) SİZE ÖZEL PAKETLER — config.builder.paketler doldurulunca listelenir
   ======================================================================== */
function Paketler({ store, B }) {
  const byId = (ref) => store.products.find((p) => p.id === ref);
  const paketler = (B.paketler || [])
    .map((pk) => {
      const satirlar = (pk.urunler || [])
        .map((u) => ({ ...u, p: byId(u.ref) }))
        .filter((u) => u.p && u.p.inStock !== false);
      const toplam = satirlar.reduce((s, u) => s + priceTL(u.p, store) * u.adet, 0);
      return { ...pk, satirlar, toplam };
    })
    .filter((pk) => pk.satirlar.length > 0);
  const [toast, setToast] = useState("");

  if (paketler.length === 0) {
    return (
      <div className="card p-8 text-center">
        <span className="text-3xl" aria-hidden="true">📦</span>
        <h3 className="text-lg mt-2">Hazır paketler çok yakında</h3>
        <p className="text-sm text-brand-ink/60 mt-1 max-w-md mx-auto">
          Karavan, bağ evi ve sulama için uyumu test edilmiş hazır sistem paketlerini
          burada bulacaksınız. O zamana kadar istediğiniz sistemi WhatsApp'tan sorabilirsiniz.
        </p>
        <a className="btn btn-wa mt-4" target="_blank" rel="noopener noreferrer"
          href={waLink(store, "Merhaba! Hazır solar sistem paketleri hakkında bilgi almak istiyorum.")}>
          WhatsApp'tan Sor
        </a>
      </div>
    );
  }

  const paketiEkle = (pk) => {
    let n = 0;
    pk.satirlar.forEach((u) => { cartAdd(u.ref, u.adet); n += u.adet; });
    void cartGet();
    setToast(pk.ad + " sepete eklendi (" + n + " ürün).");
    setTimeout(() => setToast(""), 3500);
  };

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-4">
        {paketler.map((pk) => (
          <div key={pk.id} className="card p-5 flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg">{pk.ad}</h3>
              {pk.etiket && <span className="badge bg-brand-amber/20 text-[#9a6a12]">{pk.etiket}</span>}
            </div>
            {pk.aciklama && <p className="text-sm text-brand-ink/60 mt-1">{pk.aciklama}</p>}
            <ul className="mt-3 space-y-1 text-sm grow">
              {pk.satirlar.map((u) => (
                <li key={u.ref} className="flex justify-between gap-2">
                  <Link to={"/urun/" + u.ref} className="min-w-0 truncate hover:text-brand-blue">
                    {u.adet} × {u.p.name}
                  </Link>
                  <span className="shrink-0 text-brand-ink/60">{fmtTL(priceTL(u.p, store) * u.adet)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between text-lg font-extrabold mt-3 pt-3 border-t border-surface-line">
              <span>Toplam</span><span className="text-[#9a6a12]">{fmtTL(pk.toplam)}</span>
            </div>
            <button className="btn btn-primary mt-3" onClick={() => paketiEkle(pk)}>🛒 Paketi Sepete Ekle</button>
          </div>
        ))}
      </div>
      {toast && <p className="text-sm text-brand-green mt-3">✓ {toast} <Link to="/sepet" className="underline">Sepete git →</Link></p>}
    </div>
  );
}

/* ========================================================================
   AI DANIŞMAN — ince, isteğe bağlı şerit (açılınca sohbet)
   ======================================================================== */
function AiDanisman({ onTeklif }) {
  const [acik, setAcik] = useState(false);
  const [chat, setChat] = useState([]);
  const [mesaj, setMesaj] = useState("");
  const [busy, setBusy] = useState(false);
  const [kapali, setKapali] = useState(false);
  const [hata, setHata] = useState("");
  const sonRef = useRef(null);
  useEffect(() => {
    if (chat.length || busy) sonRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [chat, busy]);

  async function gonder(text) {
    const temiz = String(text || "").trim();
    if (!temiz || busy) return;
    setHata(""); setBusy(true); setMesaj("");
    const oncesi = chat;
    setChat([...oncesi, { rol: "user", metin: temiz }]);
    try {
      const y = await asistanSor(temiz, oncesi);
      setChat((c) => [...c, { rol: "asistan", metin: y.metin }]);
      if (y.tip === "teklif" && y.teklif) onTeklif(y.teklif);
    } catch (err) {
      if (err instanceof AsistanKapaliError) setKapali(true);
      else setHata(err instanceof SistemKurApiError ? err.message : "Şu an asistana ulaşılamıyor — aşağıdaki bölümlerden devam edebilirsiniz.");
      setChat(oncesi);
      setMesaj(temiz);
    } finally { setBusy(false); }
  }

  return (
    <section className="card overflow-hidden bg-gradient-to-r from-brand-amber/10 to-brand-blue/10">
      <button type="button" onClick={() => setAcik(!acik)} aria-expanded={acik}
        className="w-full flex items-center gap-3 p-4 text-left">
        <span className="text-xl" aria-hidden="true">🤖</span>
        <span className="grow">
          <b className="block text-sm">Kararsız mısınız? İhtiyacınızı yazın, yapay zekâ sistemi önersin</b>
          <span className="block text-xs text-brand-ink/60">"Bağ evimde buzdolabı ve 5 lamba var" demeniz yeter — paket teklifi hazırlar.</span>
        </span>
        <span className={"text-brand-ink/40 transition-transform " + (acik ? "rotate-180" : "")} aria-hidden="true">▾</span>
      </button>

      {acik && (
        <div className="px-4 pb-4">
          {kapali ? (
            <p role="status" className="rounded-btn border border-surface-line bg-surface-card px-4 py-3 text-sm">
              ⚡ Şu an asistana ulaşılamıyor — aşağıdaki bölümlerden devam edebilirsiniz.
            </p>
          ) : (
            <>
              {(chat.length > 0 || busy) && (
                <div className="mb-3 flex max-h-72 flex-col gap-2 overflow-y-auto rounded-card bg-surface-card/70 p-3" aria-live="polite">
                  {chat.map((m, i) => (
                    <div key={i}
                      className={"max-w-[85%] whitespace-pre-wrap rounded-card px-3.5 py-2.5 text-sm leading-relaxed " +
                        (m.rol === "user" ? "self-end bg-brand-amber/90 text-[#3d3005]" : "self-start bg-surface-card border border-surface-line")}>
                      {m.metin}
                    </div>
                  ))}
                  {busy && (
                    <div className="self-start flex flex-col gap-1.5 rounded-card bg-surface-card border border-surface-line px-3.5 py-3 w-64 max-w-[85%]" aria-hidden="true">
                      <span className="h-2.5 w-11/12 animate-pulse rounded bg-surface-line" />
                      <span className="h-2.5 w-full animate-pulse rounded bg-surface-line" />
                      <span className="h-2.5 w-2/3 animate-pulse rounded bg-surface-line" />
                    </div>
                  )}
                  <div ref={sonRef} />
                </div>
              )}
              <form onSubmit={(e) => { e.preventDefault(); void gonder(mesaj); }} className="flex gap-2">
                <input className="input grow" maxLength={2000} disabled={busy}
                  value={mesaj} onChange={(e) => setMesaj(e.target.value)}
                  placeholder={chat.length ? "Cevabınızı yazın…" : "Örn: Karavanımda buzdolabı ve TV çalışsın istiyorum…"} />
                <button type="submit" className="btn btn-primary shrink-0" disabled={busy || !mesaj.trim()}>
                  {busy ? "…" : "Sor"}
                </button>
              </form>
              {hata && <p role="alert" className="mt-2 text-sm font-semibold text-brand-red">{hata}</p>}
              {busy && <p className="text-xs text-brand-ink/60 mt-2">Asistan hesaplıyor — bu 15-30 saniye sürebilir.</p>}
              {chat.length === 0 && !busy && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {ORNEKLER.map((o) => (
                    <button key={o} type="button" onClick={() => void gonder(o)}
                      className="rounded-full border border-surface-line bg-surface-card px-3 py-1.5 text-xs font-medium hover:border-brand-amber transition">
                      "{o}"
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

/* ========================================================================
   AI teklif kartı — satırlar yerel kataloğa eşlenir, YEREL fiyat gösterilir
   ======================================================================== */
function TeklifKarti({ teklif, store }) {
  const [toast, setToast] = useState("");
  const lines = useMemo(
    () => teklif.urunler.map((u) => ({ ...u, local: matchLocalProduct(u, store.products) })),
    [teklif, store.products],
  );
  const toplam = lines.reduce((s, l) => s + (l.local ? priceTL(l.local, store) : l.birimFiyat) * l.adet, 0);
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
    <section className="card mt-4 p-5 md:p-6 ring-2 ring-brand-amber">
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

/* ---- "Teklifi e-posta ile al" (lead tip=pdf) ---- */
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

/* ---- Uyarı + ücretsiz proje doğrulaması ---- */
function UyariDogrulama({ vurgulu, ozet }) {
  const [acik, setAcik] = useState(false);
  return (
    <section className={"card mt-5 p-5 md:p-6 " + (vurgulu ? "ring-2 ring-brand-amber bg-brand-amber/10" : "bg-surface-alt")}>
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

/* ---- Ortak mini lead formu (honeypot'lu) ---- */
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

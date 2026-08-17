import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStore, priceTL, havaleTL, fmtTL, cartGet, cartSetQty, onCart, waLink } from "../api.js";
import { useSeo } from "../hooks.js";
import { PlaceholderImg } from "../components/ui.jsx";

export default function Cart() {
  const store = useStore();
  const { commerce, company } = store.config;
  useSeo({ title: "Sepetim | " + company.brand, description: "Sepetiniz ve sipariş özeti." });

  const [cart, setCart] = useState(cartGet());
  const [form, setForm] = useState({ name: "", phone: "", addr: "", email: "", note: "", pay: "havale", kvkk: false });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => onCart(setCart), []);
  // iyzico env anahtarları sunucuda tanımlıysa kartla online ödeme açıktır
  const kartAktif = Boolean(store.config.payments && store.config.payments.kart);

  const items = Object.entries(cart)
    .map(([id, qty]) => ({ p: store.products.find((x) => x.id === id), qty }))
    .filter((it) => it.p);

  if (!items.length) {
    return (
      <div className="wrap py-20 text-center">
        <div className="text-5xl mb-3">🛒</div>
        <h1 className="text-2xl">Sepetiniz boş</h1>
        <p className="text-brand-ink/60 mt-2 mb-6">Kataloğumuza göz atarak başlayabilirsiniz.</p>
        <Link to="/kategori" className="btn btn-primary">Ürünleri İncele</Link>
      </div>
    );
  }

  const subtotal = items.reduce((s, it) => s + priceTL(it.p, store) * it.qty, 0);
  // Kargo modu "alici" = karşı ödemeli: ücret tahsil edilmez, teslimatta
  // kargo firmasına ödenir (config.commerce.kargoModu).
  const aliciOdemeli = commerce.kargoModu === "alici";
  const shipping = aliciOdemeli ? 0 :
    (subtotal >= commerce.freeShippingLimit ? 0 : commerce.shippingFlat);
  const havaleTotal = havaleTL(subtotal, store) + shipping;
  const cardTotal = subtotal + shipping;

  const send = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.addr.trim())
      return setErr("Lütfen ad, telefon ve adres alanlarını doldurun.");
    if (!form.kvkk) return setErr("Lütfen sözleşme onay kutusunu işaretleyin.");
    const kartOnline = form.pay === "kart" && kartAktif;
    if (kartOnline && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      return setErr("Kartla ödeme için geçerli bir e-posta adresi girin (makbuz iletimi).");
    setErr("");

    // --- KARTLA ONLINE ÖDEME: sipariş → iyzico ödeme sayfasına yönlendir ---
    // Sepet burada temizlenmez; ödeme başarılı dönünce /odeme-sonuc temizler.
    if (kartOnline) {
      setBusy(true);
      try {
        const r = await fetch("/api/orders", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(), phone: form.phone.trim(), addr: form.addr.trim(),
            email: form.email.trim(), note: form.note.trim(), pay: "kart",
            items: items.map((it) => ({ id: it.p.id, qty: it.qty })),
          }),
          signal: AbortSignal.timeout(8000),
        }).then((x) => x.json());
        if (!r || !r.no) throw new Error("siparis");
        const p = await fetch("/api/pay/init", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ no: r.no }),
          signal: AbortSignal.timeout(25000),
        }).then((x) => x.json());
        if (p && p.ok && p.url) { window.location.href = p.url; return; }
        setErr((p && p.message) || "Ödeme sayfası açılamadı. Lütfen tekrar deneyin ya da havale seçin.");
      } catch {
        setErr("Ödeme başlatılamadı. Lütfen tekrar deneyin ya da havale/WhatsApp ile devam edin.");
      } finally {
        setBusy(false);
      }
      return;
    }

    // --- HAVALE / WHATSAPP AKIŞI (mevcut davranış) ---
    // Sipariş sunucuya da yazılır (admin panel "Siparişler" listesi);
    // sunucuya ulaşılamazsa yalnız WhatsApp ile devam edilir.
    let no = "GM" + String(Date.now()).slice(-8);
    try {
      const r = await fetch("/api/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(), phone: form.phone.trim(), addr: form.addr.trim(),
          email: form.email.trim(), note: form.note.trim(), pay: form.pay,
          items: items.map((it) => ({ id: it.p.id, qty: it.qty })),
        }),
        signal: AbortSignal.timeout(2500),
      }).then((x) => x.json());
      if (r && r.no) no = r.no;
    } catch { /* statik yayında sipariş yalnız WhatsApp'a düşer */ }
    const lines = items.map((it) =>
      `• ${it.qty} × ${it.p.name} (${it.p.code}) — ${fmtTL(priceTL(it.p, store) * it.qty)}`).join("\n");
    const total = form.pay === "havale" ? havaleTotal : cardTotal;
    const msg = `🛒 YENİ SİPARİŞ — ${no}\n\n${lines}\n\nAra toplam: ${fmtTL(subtotal)}` +
      `\nKargo: ${aliciOdemeli ? "Alıcı ödemeli (teslimatta kargo firmasına)" : (shipping ? fmtTL(shipping) : "Ücretsiz")}` +
      `\nÖdeme: ${form.pay === "havale" ? `Havale/EFT (%${commerce.havaleDiscountPct} indirimli)` : "Kredi kartı"}` +
      `\nTOPLAM: ${fmtTL(total)}\n\n👤 ${form.name}\n📞 ${form.phone}\n📍 ${form.addr}` +
      (form.note.trim() ? `\n📝 ${form.note.trim()}` : "");
    window.open(waLink(store, msg), "_blank", "noopener");
  };

  const F = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  return (
    <div className="wrap py-8">
      <h1 className="text-2xl md:text-3xl mb-6">Sepetim</h1>
      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Kalemler */}
        <div className="space-y-3">
          {items.map(({ p, qty }) => {
            const tl = priceTL(p, store);
            return (
              <div key={p.id} className="card p-3 flex gap-3 items-center">
                <Link to={"/urun/" + p.id} className="w-20 h-16 shrink-0 rounded-btn overflow-hidden bg-surface-alt">
                  {p.img && p.img.length
                    ? <img src={"/" + p.img[0]} alt="" loading="lazy" className="w-full h-full object-cover" />
                    : <PlaceholderImg product={p} className="w-full h-full" />}
                </Link>
                <div className="grow min-w-0">
                  <Link to={"/urun/" + p.id} className="font-semibold text-sm leading-snug hover:text-brand-blue line-clamp-2">{p.name}</Link>
                  <div className="text-xs text-brand-ink/60 mt-0.5">{fmtTL(tl)} × {qty}</div>
                  <div className="inline-flex items-center border border-surface-line rounded-btn mt-1.5">
                    <button className="px-2.5 py-1 font-bold" onClick={() => cartSetQty(p.id, Math.max(1, qty - 1))} aria-label="Azalt">−</button>
                    <b className="w-7 text-center text-sm">{qty}</b>
                    <button className="px-2.5 py-1 font-bold" onClick={() => cartSetQty(p.id, qty + 1)} aria-label="Artır">+</button>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <b>{fmtTL(tl * qty)}</b><br />
                  <button className="text-xs text-brand-red mt-2 hover:underline" onClick={() => cartSetQty(p.id, 0)}>Kaldır</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Özet + sipariş formu */}
        <div className="card p-5 lg:sticky lg:top-32">
          <h2 className="text-lg mb-3">Sipariş Özeti</h2>
          <div className="space-y-1.5 text-sm">
            <Row l="Ara toplam" v={fmtTL(subtotal)} />
            <Row l="Kargo" v={aliciOdemeli ? "Alıcı ödemeli" : (shipping ? fmtTL(shipping) : "Ücretsiz 🎉")} />
            <div className="flex justify-between text-brand-green font-semibold">
              <span>Havale/EFT ile (%{commerce.havaleDiscountPct} indirimli)</span><b>{fmtTL(havaleTotal)}</b>
            </div>
            <div className="flex justify-between border-t border-surface-line pt-2 mt-2 text-base font-extrabold">
              <span>Toplam (kart)</span><span>{fmtTL(cardTotal)}</span>
            </div>
          </div>
          {aliciOdemeli ? (
            <p className="text-xs text-brand-ink/60 mt-2">
              🚚 Kargo <b>karşı (alıcı) ödemeli</b> gönderilir — ücret teslimatta
              kargo firmasına ödenir, sipariş tutarına eklenmez.
            </p>
          ) : (!shipping || (
            <p className="text-xs text-brand-ink/60 mt-2">
              🚚 {fmtTL(commerce.freeShippingLimit)} üzeri siparişlerde kargo ücretsiz.
            </p>
          ))}

          <h3 className="font-bold text-sm mt-5 mb-2">Teslimat Bilgileri</h3>
          <div className="space-y-2">
            <input className="input" placeholder="Ad Soyad *" value={form.name} onChange={F("name")} aria-label="Ad Soyad" />
            <input className="input" type="tel" placeholder="Telefon * — 05__ ___ __ __" value={form.phone} onChange={F("phone")} aria-label="Telefon" />
            <textarea className="input" rows="2" placeholder="Adres *" value={form.addr} onChange={F("addr")} aria-label="Adres" />
            <input className="input" placeholder="Sipariş notu (isteğe bağlı)" value={form.note} onChange={F("note")} aria-label="Sipariş notu" />
          </div>

          <div className="space-y-2 mt-3">
            {[
              { v: "havale", t: <b>Havale / EFT</b>, d: `%${commerce.havaleDiscountPct} indirim — IBAN onay mesajıyla iletilir.` },
              kartAktif
                ? { v: "kart", t: <b>Kredi / Banka Kartı</b>, d: "iyzico güvenli ödeme sayfasında 256-bit SSL ile ödersiniz." }
                : { v: "kart", t: <b>Kredi kartı</b>, d: "Güvenli ödeme linki WhatsApp'tan gönderilir." },
            ].map((o) => (
              <label key={o.v} className={"flex gap-2 items-start border rounded-btn p-3 text-sm cursor-pointer " +
                (form.pay === o.v ? "border-brand-amber bg-brand-amber/10" : "border-surface-line")}>
                <input type="radio" name="pay" value={o.v} checked={form.pay === o.v} onChange={F("pay")} className="mt-0.5" />
                <span>{o.t} — <span className="text-brand-ink/70">{o.d}</span></span>
              </label>
            ))}
            {form.pay === "kart" && kartAktif && (
              <input className="input" type="email" placeholder="E-posta * (ödeme makbuzu için)"
                value={form.email} onChange={F("email")} aria-label="E-posta" />
            )}
          </div>

          <label className="flex gap-2 items-start text-xs mt-3 cursor-pointer">
            <input type="checkbox" checked={form.kvkk} onChange={F("kvkk")} className="mt-0.5" />
            <span>
              <Link to="/mesafeli-satis" target="_blank" className="underline">Mesafeli satış sözleşmesini</Link> ve{" "}
              <Link to="/kvkk" target="_blank" className="underline">KVKK metnini</Link> okudum, onaylıyorum.
            </span>
          </label>

          {err && <p className="text-brand-red text-sm mt-2">{err}</p>}
          <button className="btn btn-primary w-full mt-3 py-3" onClick={send} disabled={busy}>
            {form.pay === "kart" && kartAktif
              ? (busy ? "Ödeme sayfası açılıyor…" : "💳 Güvenli Ödemeye Geç")
              : "📲 Siparişi WhatsApp ile Gönder"}
          </button>
          <p className="text-xs text-brand-ink/60 mt-2 leading-5">
            {form.pay === "kart" && kartAktif
              ? "iyzico güvenli ödeme sayfasına yönlendirileceksiniz; kart bilgileriniz sitemizde tutulmaz."
              : "Siparişiniz WhatsApp üzerinden ekibimize iletilir; stok teyidi ve ödeme adımı için sizi arıyoruz."}
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ l, v }) {
  return <div className="flex justify-between"><span className="text-brand-ink/70">{l}</span><b>{v}</b></div>;
}

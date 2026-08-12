import { useState } from "react";
import { useStore, waLink } from "../api.js";
import { useSeo } from "../hooks.js";

const TOPICS = ["Ürün / fiyat bilgisi", "Sistem boyutlandırma", "Sipariş takibi", "İade / değişim", "Diğer"];

export default function Contact() {
  const store = useStore();
  const { company } = store.config;
  useSeo({
    title: "İletişim | " + company.brand,
    description: "GES MARKETİM iletişim: telefon, WhatsApp, e-posta ve adres. Boyutlandırma ve keşif desteği ücretsizdir.",
  });

  const [f, setF] = useState({ name: "", phone: "", topic: TOPICS[0], msg: "" });
  const F = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const send = () => {
    const msg = "📩 İLETİŞİM FORMU\nKonu: " + f.topic +
      (f.name ? "\n👤 " + f.name : "") + (f.phone ? "\n📞 " + f.phone : "") +
      (f.msg ? "\n\n" + f.msg : "");
    window.open(waLink(store, msg), "_blank", "noopener");
  };

  return (
    <div className="wrap py-8">
      <h1 className="text-2xl md:text-3xl">📞 İletişim</h1>
      <p className="text-brand-ink/60 mt-1 mb-6">
        Solar sisteminizle ilgili her soru için buradayız — boyutlandırma ve keşif desteği ücretsizdir.
      </p>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="card p-6">
          <h2 className="text-lg mb-3">Bize Ulaşın</h2>
          <ul className="space-y-2.5 text-[15px]">
            <li>📞 Telefon: <a className="text-brand-blue font-semibold" href={"tel:" + company.phone.tel}>{company.phone.display}</a></li>
            <li>✉️ E-posta: <a className="text-brand-blue font-semibold" href={"mailto:" + company.email}>{company.email}</a></li>
            <li>📍 Adres: {company.address}</li>
            <li>🕘 Çalışma saatleri: {company.hours}</li>
          </ul>
          <a className="btn btn-wa w-full mt-5 py-3" target="_blank" rel="noopener noreferrer"
            href={waLink(store, "Merhaba, bilgi almak istiyorum.")}>
            💬 WhatsApp'tan Yazın
          </a>
        </div>

        <div className="card p-6">
          <h2 className="text-lg mb-3">Mesaj Bırakın</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <input className="input" placeholder="Ad Soyad" value={f.name} onChange={F("name")} aria-label="Ad Soyad" />
            <input className="input" type="tel" placeholder="Telefon — 05__ ___ __ __" value={f.phone} onChange={F("phone")} aria-label="Telefon" />
            <select className="input sm:col-span-2" value={f.topic} onChange={F("topic")} aria-label="Konu">
              {TOPICS.map((t) => <option key={t}>{t}</option>)}
            </select>
            <textarea className="input sm:col-span-2" rows="4" placeholder="Mesajınız" value={f.msg} onChange={F("msg")} aria-label="Mesajınız" />
          </div>
          <button className="btn btn-primary w-full mt-3 py-3" onClick={send}>📩 WhatsApp ile Gönder</button>
          <p className="text-xs text-brand-ink/60 mt-2">
            Formunuz WhatsApp mesajına dönüştürülür — göndermeden önce düzenleyebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}

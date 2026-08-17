// iyzico ödeme dönüş sayfası — /odeme-sonuc?durum=basarili|hata&no=GM...
// Sunucu, iyzico callback'ini token ile doğruladıktan SONRA buraya 302'ler;
// bu sayfa yalnızca sonucu gösterir (ödeme kararı sunucuda verilir).
import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useStore, cartClear, waLink } from "../api.js";
import { useSeo } from "../hooks.js";

export default function OdemeSonuc() {
  const store = useStore();
  const [sp] = useSearchParams();
  const basarili = sp.get("durum") === "basarili";
  const no = sp.get("no") || "";
  useSeo({ title: "Ödeme Sonucu | " + store.config.company.brand, description: "Ödeme işlem sonucu." });

  // Ödeme onaylandıysa sepeti şimdi temizle (ödeme öncesi temizlenmez ki
  // başarısız denemede müşteri sepetini kaybetmesin).
  useEffect(() => { if (basarili) cartClear(); }, [basarili]);

  if (basarili) {
    return (
      <div className="wrap py-20 text-center max-w-xl mx-auto">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl md:text-3xl">Ödemeniz alındı — teşekkürler!</h1>
        {no && <p className="mt-2 text-brand-ink/70">Sipariş numaranız: <b>{no}</b></p>}
        <p className="text-brand-ink/60 mt-3 leading-6">
          Siparişiniz hazırlanmaya alındı. Kargo takip bilgisi telefonunuza /
          e-postanıza iletilecek. Sorunuz olursa sipariş numaranızla bize ulaşın.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          <Link to="/" className="btn btn-primary">Alışverişe Devam Et</Link>
          <a className="btn btn-wa" target="_blank" rel="noopener noreferrer"
            href={waLink(store, "Merhaba! " + (no ? no + " numaralı " : "") + "siparişim hakkında bilgi almak istiyorum.")}>
            WhatsApp ile Ulaş
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap py-20 text-center max-w-xl mx-auto">
      <div className="text-6xl mb-4">😕</div>
      <h1 className="text-2xl md:text-3xl">Ödeme tamamlanamadı</h1>
      <p className="text-brand-ink/60 mt-3 leading-6">
        Ödemeniz onaylanmadı ya da işlemi yarıda bıraktınız — kartınızdan tahsilat
        yapılmadıysa merak etmeyin. Sepetiniz aynen duruyor; yeniden deneyebilir
        veya havale/WhatsApp ile devam edebilirsiniz.
      </p>
      <div className="flex flex-wrap justify-center gap-2 mt-6">
        <Link to="/sepet" className="btn btn-primary">Sepete Dön ve Tekrar Dene</Link>
        <a className="btn btn-wa" target="_blank" rel="noopener noreferrer"
          href={waLink(store, "Merhaba! Sitede kartla ödeme sırasında sorun yaşadım" + (no ? " (sipariş: " + no + ")" : "") + ", yardımcı olur musunuz?")}>
          WhatsApp Destek
        </a>
      </div>
    </div>
  );
}

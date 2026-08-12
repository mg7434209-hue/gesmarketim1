import { Link } from "react-router-dom";
import { useStore } from "../api.js";
import { useSeo } from "../hooks.js";

export default function NotFound() {
  const store = useStore();
  useSeo({ title: "Sayfa bulunamadı | " + store.config.company.brand });
  return (
    <div className="wrap py-24 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="text-3xl">Sayfa bulunamadı</h1>
      <p className="text-brand-ink/60 mt-2 mb-8">
        Aradığınız sayfa taşınmış ya da kaldırılmış olabilir.
      </p>
      <div className="flex gap-3 justify-center flex-wrap">
        <Link to="/" className="btn btn-primary">Ana Sayfa</Link>
        <Link to="/kategori" className="btn">Ürünlere Göz At</Link>
        <Link to="/iletisim" className="btn">İletişim</Link>
      </div>
    </div>
  );
}

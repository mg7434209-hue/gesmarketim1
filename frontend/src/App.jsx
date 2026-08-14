import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx"; // ana sayfa eager — LCP rotası

// Diğer rotalar tembel yüklenir (route-level code splitting)
const Category = lazy(() => import("./pages/Category.jsx"));
const Product = lazy(() => import("./pages/Product.jsx"));
const Cart = lazy(() => import("./pages/Cart.jsx"));
const Builder = lazy(() => import("./pages/Builder.jsx"));
const Contact = lazy(() => import("./pages/Contact.jsx"));
const Static = lazy(() => import("./pages/Static.jsx"));
const Admin = lazy(() => import("./pages/Admin.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

function Fallback() {
  return (
    <div className="wrap py-24 text-center text-brand-ink/50" role="status" aria-label="Yükleniyor">
      <span className="inline-block w-8 h-8 border-4 border-brand-amber border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="kategori" element={<Category />} />
          <Route path="kategori/:slug" element={<Category />} />
          <Route path="urun/:id" element={<Product />} />
          <Route path="sepet" element={<Cart />} />
          <Route path="hesaplayici" element={<Builder />} />
          <Route path="iletisim" element={<Contact />} />
          <Route path="hakkimizda" element={<Static page="hakkimizda" />} />
          <Route path="sss" element={<Static page="sss" />} />
          <Route path="kargo-teslimat" element={<Static page="kargo" />} />
          <Route path="iade-degisim" element={<Static page="iade" />} />
          <Route path="mesafeli-satis" element={<Static page="mesafeli" />} />
          <Route path="kvkk" element={<Static page="kvkk" />} />
          <Route path="admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

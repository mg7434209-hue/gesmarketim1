// Veri katmanı — TEK KAYNAK: sunucu API'leri. Frontend hiçbir yerde maliyet
// (cost) alanı BEKLEMEZ ve KULLANMAZ; yalnız satış fiyatı (saleUsd) gelir.
import { createContext, useContext } from "react";

export const StoreCtx = createContext(null);
export const useStore = () => useContext(StoreCtx);

export async function loadAll() {
  const [products, categories, config, kur] = await Promise.all([
    fetch("/api/products").then((r) => r.json()),
    fetch("/api/categories").then((r) => r.json()),
    fetch("/api/config").then((r) => r.json()),
    fetch("/api/kur").then((r) => r.json()).catch(() => null),
  ]);
  return {
    products,
    categories,
    config,
    kur: kur && kur.usdTry > 0 ? kur.usdTry : (config.commerce && config.commerce.usdTry) || 0,
    kurAt: kur ? kur.updatedAt : null,
  };
}

/* ---------- Fiyat: sabit ₺ (priceTL) > saleUsd × güncel kur × (1 + tampon) ---------- */
export function priceTL(p, store) {
  const { pricing } = store.config;
  const step = pricing.roundTo || 1;
  if (p.priceTL > 0) return Math.round(p.priceTL / step) * step; // admin/katalog sabit fiyatı
  const raw = p.saleUsd * store.kur * (1 + (pricing.fxBufferPct || 0) / 100);
  return Math.round(raw / step) * step;
}
export function havaleTL(tl, store) {
  return tl * (1 - (store.config.commerce.havaleDiscountPct || 0) / 100);
}
export const fmtTL = (n) => new Intl.NumberFormat("tr-TR").format(Math.round(n)) + " ₺";
export const fmtUSD = (n) =>
  "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
export const fmtKur = (n) =>
  new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

/* ---------- Sepet (localStorage `gesm.cart` — eski anahtarla uyumlu) ---------- */
const CART_KEY = "gesm.cart";
const listeners = new Set();
export function cartGet() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch { return {}; }
}
function cartSet(c) {
  localStorage.setItem(CART_KEY, JSON.stringify(c));
  listeners.forEach((fn) => fn(c));
}
export function cartAdd(id, qty = 1) {
  const c = cartGet();
  c[id] = (c[id] || 0) + qty;
  cartSet(c);
}
export function cartSetQty(id, qty) {
  const c = cartGet();
  if (qty <= 0) delete c[id]; else c[id] = qty;
  cartSet(c);
}
export function cartClear() { cartSet({}); }
export function cartCount() { return Object.values(cartGet()).reduce((a, b) => a + b, 0); }
export function onCart(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function waLink(store, text) {
  return "https://wa.me/" + store.config.company.phone.wa + "?text=" + encodeURIComponent(text);
}

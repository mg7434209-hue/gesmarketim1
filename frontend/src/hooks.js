import { useEffect, useRef, useState } from "react";

/** 0'dan hedefe sayan istatistik — IntersectionObserver + rAF (~1.2 sn).
    prefers-reduced-motion'da doğrudan hedefi basar. */
export function useCountUp(target, durationMs = 1200) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVal(target);
      return;
    }
    let raf;
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t) => {
        const k = Math.min(1, (t - t0) / durationMs);
        setVal(Math.round(target * (1 - Math.pow(1 - k, 3))));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [target, durationMs]);
  return [val, ref];
}

/** Sayfa başına dinamik title/description + opsiyonel JSON-LD. */
export function useSeo({ title, description, jsonLd }) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) {
        m = document.createElement("meta");
        m.name = "description";
        document.head.appendChild(m);
      }
      m.content = description;
    }
    let s;
    if (jsonLd) {
      s = document.createElement("script");
      s.type = "application/ld+json";
      s.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(s);
    }
    return () => { if (s) s.remove(); };
  }, [title, description, JSON.stringify(jsonLd || null)]);
}

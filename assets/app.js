/* ============================================================
   GES MARKETİM — Uygulama katmanı
   Sayfa yönlendirmesi: <body data-page="...">
   K1: supplier/cost alanları müşteri arayüzünde asla render edilmez.
   ============================================================ */
(function () {
  "use strict";
  var cfg = GESM.config;
  var ALL = GESM.data.products;
  // Gerçek ürün görselleri (assets/img-map.js — tools/gorselleri_isle.py üretir)
  var IMGMAP = GESM.imgmap || {};
  ALL.forEach(function (p) { if (IMGMAP[p.id]) p.img = IMGMAP[p.id]; });
  // Şimdilik gizli kategoriler (config.hiddenCategories): liste/arama/ana
  // sayfada görünmez; veri durur, doğrudan ürün URL'si çalışır.
  var HIDDEN_CATS = cfg.hiddenCategories || [];
  function isHiddenCat(slug) { return HIDDEN_CATS.indexOf(slug) >= 0; }
  var VISIBLE = ALL.filter(function (p) { return !isHiddenCat(p.cat); });

  /* ================= Yardımcılar ================= */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(n) { return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + " ₺"; }
  function fmt0(n) { return new Intl.NumberFormat("tr-TR").format(Math.round(n)) + " ₺"; }
  function fmtUsd(n) { return "$" + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n); }
  function fmtUsd2(n) { return "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }
  function fmtKur(n) { return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }
  function param(k) { return new URLSearchParams(location.search).get(k); }
  function store(k, v) {
    try {
      if (v === undefined) { var raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : null; }
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) { return null; }
  }
  function toast(msg) {
    var t = $(".toast"); if (t) t.remove();
    t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600);
  }
  function byId(id) { for (var i = 0; i < ALL.length; i++) if (ALL[i].id === id) return ALL[i]; return null; }
  function catOf(slug) { for (var i = 0; i < cfg.categories.length; i++) if (cfg.categories[i].slug === slug) return cfg.categories[i]; return null; }
  function waLink(text) { return "https://wa.me/" + cfg.company.phone.wa + "?text=" + encodeURIComponent(text); }
  function prodUrl(p) { return "urun.html?u=" + encodeURIComponent(p.id); }
  function catUrl(c) { return "kategori.html?k=" + encodeURIComponent(c.slug); }

  /* ================= Fiyat motoru (K2/K3) — USD TABANLI =================
     TÜM fiyatlar USD tutulur (p.saleUsd | p.priceUsd); ₺ karşılık GÜNCEL
     kurla hesaplanır: ₺ = USD × kur × (1 + fxBufferPct/100).
     Kur öncelik sırası: admin cihaz-yerel override (gesm.admin.usdTry) >
     sunucudan çekilen günlük kur (/api/kur → gesm.kur) > config.commerce.usdTry.
     Admin panelden "Kuru Yayınla" tüm ziyaretçilerin kurunu günceller. */
  var ADMIN_KEY = "gesm.admin";
  var KUR_KEY = "gesm.kur";
  function adminState() {
    return store(ADMIN_KEY) || { products: {}, adj: { global: 0, cat: {}, sup: {} }, margins: { sup: {}, cat: {} }, announcement: "" };
  }
  function currentKur() {
    var st = adminState();
    if (st.usdTry > 0) return st.usdTry; // cihaz-yerel deneme/override
    var k = store(KUR_KEY);
    if (k && k.usdTry > 0) return k.usdTry; // sunucudan günlük kur
    return cfg.commerce.usdTry || 0;
  }
  function fxMult() { return 1 + ((cfg.pricing.fxBufferPct || 0) / 100); }
  // Günlük kuru sunucudan tazele (3 saatte bir; API yoksa sessizce geç).
  function initKur(done) {
    var k = store(KUR_KEY);
    if (k && k.at && Date.now() - k.at < 3 * 60 * 60 * 1000) { done(); return; }
    var finished = false;
    function finish() { if (!finished) { finished = true; done(); } }
    var t = setTimeout(finish, 1200); // API cevapsızsa sayfayı bekletme
    fetch("/api/kur").then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (j && j.usdTry > 0) {
        store(KUR_KEY, { usdTry: j.usdTry, updatedAt: j.updatedAt || null, at: Date.now() });
      } else {
        store(KUR_KEY, Object.assign({ at: Date.now() }, k || {}, { at: Date.now() }));
      }
      clearTimeout(t); finish();
    }).catch(function () {
      store(KUR_KEY, Object.assign({}, k || {}, { at: Date.now() })); // Pages: 3 saat sorma
      clearTimeout(t); finish();
    });
  }
  function marginFor(p, st) {
    var m;
    if (st.margins.cat[p.cat] != null) m = st.margins.cat[p.cat];
    else if (st.margins.sup[p.supplier] != null) m = st.margins.sup[p.supplier];
    else if (cfg.pricing.marginByCategory[p.cat] != null) m = cfg.pricing.marginByCategory[p.cat];
    else if (cfg.pricing.marginBySupplier[p.supplier] != null) m = cfg.pricing.marginBySupplier[p.supplier];
    else m = cfg.pricing.defaultMarginPct;
    return m;
  }
  function roundP(n) { var r = cfg.pricing.roundTo || 1; return Math.round(n / r) * r; }
  function priceOf(p) {
    if (p.onRequest) return { onRequest: true };
    var st = adminState();
    var ov = st.products[p.id] || {};
    var base, usd = null, list = ov.listPrice != null ? ov.listPrice : (p.listPrice || null);
    if (ov.price != null) {
      base = ov.price; // tekil manuel ₺ fiyat — kurdan ve toplu ayarlardan bağımsız
    } else if (p.saleUsd != null || p.priceUsd != null) {
      // USD tabanı: satış USD'si × güncel kur × kur tamponu → ₺
      usd = p.saleUsd != null ? p.saleUsd : p.priceUsd;
      base = usd * currentKur() * fxMult();
    } else {
      base = p.price != null ? p.price : (p.cost || 0) * (1 + marginFor(p, st) / 100);
      var adj = (1 + (st.adj.global || 0) / 100) * (1 + (st.adj.cat[p.cat] || 0) / 100) * (1 + (st.adj.sup[p.supplier] || 0) / 100);
      base = base * adj;
    }
    base = roundP(base);
    if (list != null && list <= base) list = null;
    return { price: base, usd: usd, listPrice: list, discountPct: list ? Math.round((1 - base / list) * 100) : 0 };
  }
  function havalePrice(n) { return n * (1 - cfg.commerce.havaleDiscountPct / 100); }

  /* ================= Görsel üretici (SVG yer tutucu) ================= */
  var CAT_HUE = { "gunes-panelleri": 38, "lityum-akuler": 145, "jel-akuler": 200, "hibrit-inverterler": 265, "akilli-inverterler": 288, "sebeke-inverterleri": 215, "sarj-regulatorleri": 12, "solar-paketler": 32, "tarimsal-sulama": 190, "solar-ekipmanlar": 90, "aksesuar": 330 };
  function thumbSVG(p, big) {
    var c = catOf(p.cat) || { icon: "🔆", name: "" };
    var hue = CAT_HUE[p.cat] || 38;
    var kv = "";
    var s = p.specs || {};
    kv = s["Güç"] || s["Kapasite"] || s["Akım"] || s["Pompa Gücü"] || s["Sistem Gücü"] || s["Kesit"] || "";
    var short = p.brand;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 312" role="img" aria-label="' + esc(p.name) + '">' +
      '<defs><linearGradient id="g' + p.id + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="hsl(' + hue + ',48%,95%)"/><stop offset="1" stop-color="hsl(' + hue + ',42%,88%)"/></linearGradient></defs>' +
      '<rect width="400" height="312" fill="url(#g' + p.id + ')"/>' +
      '<circle cx="340" cy="40" r="70" fill="hsla(' + hue + ',60%,45%,.10)"/>' +
      '<circle cx="30" cy="290" r="90" fill="hsla(' + hue + ',60%,45%,.07)"/>' +
      '<text x="200" y="' + (big ? 138 : 148) + '" font-size="76" text-anchor="middle">' + c.icon + '</text>' +
      '<text x="200" y="212" font-size="26" font-weight="800" text-anchor="middle" fill="hsl(' + hue + ',55%,28%)" font-family="system-ui">' + esc(kv) + '</text>' +
      '<text x="200" y="244" font-size="15" text-anchor="middle" fill="rgba(62,55,42,.65)" font-family="system-ui">' + esc(short) + '</text>' +
      '</svg>';
  }
  // Gerçek foto varsa <img> (lazy), yoksa SVG yer tutucu
  function thumbMedia(p, opts) {
    opts = opts || {};
    if (p.img && p.img.length) {
      return '<img src="' + esc(p.img[0]) + '" alt="' + esc(p.name) + '"' +
        (opts.eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async">';
    }
    return thumbSVG(p, opts.big);
  }

  /* ================= Sepet & Favoriler ================= */
  var CART_KEY = "gesm.cart", FAV_KEY = "gesm.favs";
  function cart() { return store(CART_KEY) || {}; }
  function cartCount() { var c = cart(), n = 0; for (var k in c) n += c[k]; return n; }
  function setCart(c) { store(CART_KEY, c); updateBadges(); }
  function addToCart(id, qty) {
    var p = byId(id); if (!p || p.onRequest) return;
    var c = cart(); c[id] = (c[id] || 0) + (qty || 1); setCart(c);
    toast("Sepete eklendi: " + p.name);
  }
  function favs() { return store(FAV_KEY) || []; }
  function toggleFav(id) {
    var f = favs(), i = f.indexOf(id);
    if (i >= 0) { f.splice(i, 1); toast("Favorilerden çıkarıldı"); } else { f.push(id); toast("Favorilere eklendi ❤"); }
    store(FAV_KEY, f); updateBadges();
    return f.indexOf(id) >= 0;
  }
  function updateBadges() {
    var cb = $("#cartBadge"); if (cb) { var n = cartCount(); cb.textContent = n; cb.style.display = n ? "" : "none"; }
    var fb = $("#favBadge"); if (fb) { var m = favs().length; fb.textContent = m; fb.style.display = m ? "" : "none"; }
  }

  /* ================= SVG ikon seti ================= */
  var ICONS = {
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3h2l2.6 12.4A2 2 0 0 0 9.6 17h8.7a2 2 0 0 0 2-1.6L22 8H6"/><circle cx="9.5" cy="21" r="1.4" fill="currentColor" stroke="none"/><circle cx="18" cy="21" r="1.4" fill="currentColor" stroke="none"/></svg>',
    wa: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/></svg>'
  };

  /* ================= Ortak iskelet (header/nav/footer) ================= */
  function pageActive() { return document.body.getAttribute("data-page") || ""; }
  function renderChrome() {
    var an = adminState().announcement || cfg.announcement;
    var kurInfo = store(KUR_KEY); // günlük kur rozeti için (updatedAt)
    var mount = $("#chrome-top");
    if (mount) {
      var curCat = pageActive() === "kategori" ? param("k") : null;
      var curTag = pageActive() === "kategori" ? param("t") : null;
      function navLink(c, cls) {
        var act = curCat === c.slug;
        return '<a href="' + catUrl(c) + '" class="' + (cls || "") + (act ? " active" : "") + '">' + esc(c.name) + "</a>";
      }
      // Child öğe: slug (string) veya { label, cat, tag } → ?t= özellik filtresi
      function kidOf(s) {
        if (typeof s === "string") { var c = catOf(s); return c && { label: c.name, slug: c.slug, tag: null }; }
        var c2 = catOf(s.cat); return c2 && { label: s.label || c2.name, slug: c2.slug, tag: s.tag || null };
      }
      function kidLink(k, cls) {
        var href = "kategori.html?k=" + k.slug + (k.tag ? "&t=" + encodeURIComponent(k.tag) : "");
        var act = curCat === k.slug && (k.tag ? curTag === k.tag : !curTag);
        return '<a href="' + href + '" class="' + cls + (act ? " active" : "") + '">' + esc(k.label) + "</a>";
      }
      var navHtml = cfg.nav.map(function (item) {
        if (item.children) {
          var kids = item.children.map(kidOf).filter(Boolean);
          var parentAct = kids.some(function (k) { return curCat === k.slug; });
          return '<div class="nav-item has-sub' + (parentAct ? " active" : "") + '">' +
            '<button type="button" class="nav-link' + (parentAct ? " active" : "") + '" aria-expanded="false">' + esc(item.label) + ' <span class="caret">▾</span></button>' +
            '<div class="sub">' + kids.map(function (k) { return kidLink(k, "sub-link"); }).join("") + "</div></div>";
        }
        if (item.cat) {
          var c = catOf(item.cat);
          return c ? '<div class="nav-item">' + navLink(c, "nav-link") + "</div>" : "";
        }
        var act = pageActive() === item.key;
        return '<div class="nav-item"><a href="' + item.href + '" class="nav-link' + (act ? " active" : "") + '">' + esc(item.label) + "</a></div>";
      }).join("");
      // Mobil menü: gruplar açılır-kapanır bölümler halinde
      var mobHtml = cfg.nav.map(function (item) {
        if (item.children) {
          var kids = item.children.map(kidOf).filter(Boolean);
          return '<details class="m-group"' + (kids.some(function (k) { return curCat === k.slug; }) ? " open" : "") + "><summary>" + esc(item.label) + "</summary>" +
            kids.map(function (k) { return kidLink(k, "m-link m-sub"); }).join("") + "</details>";
        }
        if (item.cat) { var c = catOf(item.cat); return c ? navLink(c, "m-link") : ""; }
        return '<a class="m-link" href="' + item.href + '">' + esc(item.label) + "</a>";
      }).join("");
      mount.innerHTML =
        '<div class="announce"><span class="announce-text">' + esc(an) + "</span>" +
        '<span class="fx-badge" title="Tüm fiyatlar USD tabanlıdır ve bu kurla ₺\'ye çevrilir — kur günlük güncellenir' +
        (kurInfo && kurInfo.updatedAt ? " (son güncelleme: " + esc(String(kurInfo.updatedAt).slice(0, 10)) + ")" : "") +
        '">💱 1 $ = ' + fmtKur(currentKur()) + " ₺</span></div>" +
        '<header class="site-header"><div class="container header-in">' +
        '<button class="hamburger icon-btn" id="menuBtn" aria-label="Menü" aria-expanded="false">' + ICONS.menu + "</button>" +
        '<a class="logo" href="index.html"><span class="sun">☀</span><span>GES <b>MARKETİM</b></span></a>' +
        '<form class="search-box" action="kategori.html" method="get">' +
        '<input type="search" name="q" placeholder="Ürün ara: 655W panel, 100Ah akü, 3kW paket…" aria-label="Ürün ara">' +
        '<button type="submit" aria-label="Ara">' + ICONS.search + "</button></form>" +
        '<div class="header-actions">' +
        '<a class="icon-btn wa-green" href="' + waLink("Merhaba, bilgi almak istiyorum.") + '" target="_blank" rel="noopener" title="WhatsApp" aria-label="WhatsApp">' + ICONS.wa + "</a>" +
        '<a class="icon-btn" href="favoriler.html" title="Favoriler" aria-label="Favoriler">' + ICONS.heart + '<span class="badge" id="favBadge" style="display:none">0</span></a>' +
        '<a class="icon-btn" href="sepet.html" title="Sepet" aria-label="Sepet">' + ICONS.cart + '<span class="badge" id="cartBadge" style="display:none">0</span></a>' +
        "</div></div>" +
        '<nav class="site-nav" aria-label="Kategoriler"><div class="container nav-in">' + navHtml + "</div></nav>" +
        '<nav class="mobile-nav" id="mobileNav" aria-label="Mobil menü">' + mobHtml + "</nav></header>";
      // Açılır menü etkileşimi (dokunmatik + klavye uyumlu)
      $$(".has-sub > .nav-link").forEach(function (b) {
        b.addEventListener("click", function (e) {
          e.stopPropagation();
          var it = b.parentElement, open = it.classList.contains("open");
          $$(".has-sub.open").forEach(function (x) { x.classList.remove("open"); });
          if (!open) it.classList.add("open");
          b.setAttribute("aria-expanded", String(!open));
        });
      });
      document.addEventListener("click", function () {
        $$(".has-sub.open").forEach(function (x) { x.classList.remove("open"); });
      });
      var mb = $("#menuBtn");
      if (mb) mb.addEventListener("click", function () {
        var nav = $("#mobileNav"), open = nav.classList.toggle("open");
        mb.setAttribute("aria-expanded", String(open));
      });
    }
    var fmount = $("#chrome-footer");
    if (fmount) {
      fmount.innerHTML =
        '<footer class="site-footer"><div class="container">' +
        '<div class="footer-grid">' +
        "<div><h4>GES MARKETİM</h4><p class='muted'>Solar enerjide uçtan uca çözüm: panel, akü, inverter, hazır paketler ve tarımsal sulama. KDV dahil şeffaf fiyat, hızlı kargo, gerçek destek.</p>" +
        '<p><a href="' + waLink("Merhaba!") + '" target="_blank" rel="noopener">💬 WhatsApp Destek</a><br>' +
        '<a href="tel:' + cfg.company.phone.tel + '">📞 ' + esc(cfg.company.phone.display) + "</a><br>" +
        '<a href="mailto:' + cfg.company.email + '">✉️ ' + esc(cfg.company.email) + "</a></p></div>" +
        "<div><h4>Kategoriler</h4><ul>" +
        cfg.categories.slice(0, 6).map(function (c) { return '<li><a href="' + catUrl(c) + '">' + esc(c.name) + "</a></li>"; }).join("") +
        "</ul></div>" +
        "<div><h4>Kurumsal</h4><ul>" +
        '<li><a href="hakkimizda.html">Hakkımızda</a></li>' +
        '<li><a href="sss.html">Sık Sorulan Sorular</a></li>' +
        '<li><a href="iletisim.html">İletişim</a></li>' +
        '<li><a href="kargo-teslimat.html">Kargo &amp; Teslimat</a></li>' +
        "</ul></div>" +
        "<div><h4>Bilgilendirme</h4><ul>" +
        '<li><a href="iade-degisim.html">İptal, İade &amp; Değişim</a></li>' +
        '<li><a href="mesafeli-satis.html">Mesafeli Satış Sözleşmesi</a></li>' +
        '<li><a href="gizlilik.html">Gizlilik &amp; KVKK</a></li>' +
        '<li><a href="sepet.html">Sepetim</a></li>' +
        "</ul><p class='muted small'>" + esc(cfg.company.address) + "<br>" + esc(cfg.company.hours) + "</p></div>" +
        "</div>" +
        '<div class="footer-bottom"><span>© ' + new Date().getFullYear() + " " + esc(cfg.company.legal) + " — Tüm hakları saklıdır.</span>" +
        "<span>🔒 256-bit SSL · 14 gün koşulsuz iade · Havale/EFT indirimi</span></div>" +
        "</div></footer>";
    }
    // Yüzen butonlar + asistan
    var fl = document.createElement("div"); fl.className = "float-stack";
    fl.innerHTML =
      '<button class="float-btn float-ai" id="aiOpen" title="AI Asistan" aria-label="AI Asistan">🤖</button>' +
      '<a class="float-btn float-wa" href="' + waLink("Merhaba, gesmarketim.com üzerinden yazıyorum.") + '" target="_blank" rel="noopener" title="WhatsApp" aria-label="WhatsApp">' + ICONS.wa + "</a>";
    document.body.appendChild(fl);
    var ai = $("#aiOpen"); if (ai) ai.addEventListener("click", openChat);
    updateBadges();
    injectSiteJsonLd();
  }

  /* ================= JSON-LD ================= */
  function jsonLd(obj) {
    var s = document.createElement("script"); s.type = "application/ld+json";
    s.textContent = JSON.stringify(obj); document.head.appendChild(s);
  }
  function injectSiteJsonLd() {
    jsonLd({
      "@context": "https://schema.org", "@type": "Organization",
      name: cfg.company.brand, url: cfg.company.domain, email: cfg.company.email,
      telephone: cfg.company.phone.intl,
      address: { "@type": "PostalAddress", streetAddress: cfg.company.address, addressLocality: "Manavgat", addressRegion: "Antalya", addressCountry: "TR" }
    });
    if (pageActive() === "home") {
      jsonLd({
        "@context": "https://schema.org", "@type": "WebSite",
        name: cfg.company.brand, url: cfg.company.domain,
        potentialAction: { "@type": "SearchAction", target: cfg.company.domain + "/kategori.html?q={search_term_string}", "query-input": "required name=search_term_string" }
      });
    }
  }

  /* ================= Ürün kartı ================= */
  function cardHTML(p) {
    var pr = priceOf(p);
    var ribbons = "";
    if (pr.discountPct) ribbons += '<span class="ribbon">%' + pr.discountPct + " İNDİRİM</span>";
    else if (p.isNew) ribbons += '<span class="ribbon new">YENİ</span>';
    else if (p.tier) ribbons += '<span class="ribbon tier">' + esc(p.tier.toUpperCase()) + "</span>";
    var isFav = favs().indexOf(p.id) >= 0;
    var priceHtml = p.onRequest
      ? '<div class="price-row"><span class="price" style="font-size:.98rem">Fiyat için teklif alın</span></div>'
      : '<div class="price-row">' + (pr.listPrice ? '<span class="price-old">' + fmt0(pr.listPrice) + "</span>" : "") +
        '<span class="price">' + fmt0(pr.price) + "</span>" +
        '<div class="price-note">' +
        (pr.usd != null ? "≈ " + fmtUsd(pr.usd) + " · günlük kur · " : "") +
        "KDV dahil · Havale ile " + fmt0(havalePrice(pr.price)) + "</div></div>";
    var actions = p.onRequest
      ? '<div class="prod-actions"><a class="btn btn-sm btn-primary" href="' + prodUrl(p) + '">Teklif Al</a></div>'
      : '<div class="prod-actions"><button class="btn btn-sm btn-primary" data-add="' + p.id + '">Sepete Ekle</button>' +
        '<a class="btn btn-sm btn-ghost" href="' + prodUrl(p) + '">İncele</a></div>';
    return '<article class="prod-card">' + ribbons +
      '<button class="fav-toggle' + (isFav ? " on" : "") + '" data-fav="' + p.id + '" aria-label="Favori">' + (isFav ? "♥" : "♡") + "</button>" +
      '<a class="prod-thumb" href="' + prodUrl(p) + '" aria-hidden="true" tabindex="-1">' + thumbMedia(p) + "</a>" +
      '<div class="prod-body"><span class="prod-brand">' + esc(p.brand) + "</span>" +
      '<a class="prod-name" href="' + prodUrl(p) + '">' + esc(p.name) + "</a>" +
      priceHtml + actions + "</div></article>";
  }
  function bindCards(root) {
    $$("[data-add]", root).forEach(function (b) {
      b.addEventListener("click", function () { addToCart(b.getAttribute("data-add"), 1); });
    });
    $$("[data-fav]", root).forEach(function (b) {
      b.addEventListener("click", function () {
        var on = toggleFav(b.getAttribute("data-fav"));
        b.classList.toggle("on", on); b.textContent = on ? "♥" : "♡";
      });
    });
  }
  function renderGrid(el, list, emptyMsg) {
    if (!list.length) { el.innerHTML = '<p class="muted">' + esc(emptyMsg || "Ürün bulunamadı.") + "</p>"; return; }
    el.innerHTML = '<div class="prod-grid">' + list.map(cardHTML).join("") + "</div>";
    bindCards(el);
  }

  /* ================= Arama (doğal dil ayrıştırma) ================= */
  function norm(s) { return s.toLocaleLowerCase("tr-TR").replace(/[.,;:!?()]/g, " "); }
  function searchProducts(q) {
    var t = norm(q).split(/\s+/).filter(Boolean);
    if (!t.length) return [];
    return VISIBLE.map(function (p) {
      var hay = norm(p.name + " " + p.brand + " " + (p.tags || []).join(" ") + " " + (catOf(p.cat) || {}).name + " " + Object.keys(p.specs || {}).map(function (k) { return k + " " + p.specs[k]; }).join(" "));
      var score = 0;
      t.forEach(function (w) { if (hay.indexOf(w) >= 0) score += w.length > 2 ? 2 : 1; });
      return { p: p, score: score };
    }).filter(function (x) { return x.score >= Math.min(2, t.length); })
      .sort(function (a, b) { return b.score - a.score; })
      .map(function (x) { return x.p; });
  }

  /* ================= Sayfa: Ana sayfa ================= */
  function pageHome() {
    var campaigns = VISIBLE.filter(function (p) { return !p.onRequest && priceOf(p).discountPct > 0; });
    var best = VISIBLE.filter(function (p) { return p.bestseller; });
    var news = VISIBLE.filter(function (p) { return p.isNew; });
    var stats = $("#heroStats");
    if (stats) stats.innerHTML =
      "<div><b>" + VISIBLE.length + "+</b><span class='muted small'>ürün çeşidi</span></div>" +
      "<div><b>" + cfg.categories.filter(function (c) { return !isHiddenCat(c.slug); }).length + "</b><span class='muted small'>kategori</span></div>" +
      "<div><b>3 dk</b><span class='muted small'>sistem kurucu ile proje</span></div>" +
      "<div><b>14 gün</b><span class='muted small'>koşulsuz iade</span></div>";
    var cg = $("#catGrid");
    if (cg) cg.innerHTML = cfg.categories.filter(function (c) { return !isHiddenCat(c.slug); }).map(function (c) {
      var n = VISIBLE.filter(function (p) { return p.cat === c.slug; }).length;
      return '<a class="cat-card" href="' + catUrl(c) + '"><div class="ico">' + c.icon + "</div><b>" + esc(c.name) + "</b><span>" + n + " ürün</span></a>";
    }).join("");
    // "Kendi Projenizi Oluşturun" bölümündeki WhatsApp uzman bağlantısı
    $$("[data-wa-expert]").forEach(function (a) {
      a.setAttribute("href", waLink("Merhaba, sistemimi kurmak için uzman desteği istiyorum."));
      a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener");
    });
    var cs = $("#campGrid"); if (cs) renderGrid(cs, campaigns, "Şu an aktif kampanya yok.");
    var bs = $("#bestGrid"); if (bs) renderGrid(bs, best.slice(0, 8));
    var ns = $("#newGrid"); if (ns) renderGrid(ns, news, "Yeni ürünler yakında.");
  }

  /* ================= Sayfa: Sistem Kurucu (sistem-kur.html) =================
     "Kendi Projenizi Oluşturun": senaryo → cihazlar → ihtiyaç → katalogdan
     öneri → sepete ekle / WhatsApp teklif. Tüm katsayılar cfg.builder'dadır. */
  var BLD_KEY = "gesm.builder";
  function pageBuilder() {
    var B = cfg.builder; if (!B) return;
    var SZ = B.sizing;
    var appById = {}; B.appliances.forEach(function (a) { appById[a.id] = a; });
    function presetOf(id) { for (var i = 0; i < B.presets.length; i++) if (B.presets[i].id === id) return B.presets[i]; return B.presets[0]; }
    // Katalogda gerçekten var olan ürünlere indirge (ürün silinirse zarifçe düş)
    function existingPanels(list) { return (list || []).filter(function (r) { return byId(r) && B.catalog.panels[r]; }); }

    var st = store(BLD_KEY) || {};
    var tipParam = param("tip");
    if (tipParam && presetOf(tipParam).id === tipParam && st.tip !== tipParam) st = { tip: tipParam };
    if (!st.tip) st.tip = B.presets[0].id;
    function preset() { return presetOf(st.tip); }
    function ensureDefaults() {
      var p = preset();
      if (!st.items) st.items = Object.assign({}, p.items);
      if (!st.chem) st.chem = p.chem;
      var panels = existingPanels(p.panels);
      if (!st.panelRef || panels.indexOf(st.panelRef) < 0) st.panelRef = panels[0] || null;
      st.qtyOv = st.qtyOv || {};
    }
    ensureDefaults();
    function save() { store(BLD_KEY, st); }

    /* ---- hesap ---- */
    function calc() {
      var dailyWh = 0, contW = 0, maxSurge = 0, anySelected = false;
      B.appliances.forEach(function (a) {
        var q = st.items[a.id] || 0; if (!q) return;
        anySelected = true;
        dailyWh += q * a.w * a.h;
        contW += q * a.w;
        maxSurge = Math.max(maxSurge, a.w * (a.surge || 1));
      });
      var invW = Math.max(contW * SZ.simultaneity, maxSurge) * SZ.surgeHeadroom;
      var kwp = dailyWh / (SZ.sunHours * SZ.systemEff) / 1000;

      // İnverter: gücü karşılayan, FİYATI YAYINDA olan en küçük model
      // (onRequest ürünler öneriye girmez — sepette fiyatsız kalem olmasın)
      function invOk(c) { var p = byId(c.ref); return p && !p.onRequest; }
      var inv = null;
      for (var i = 0; i < B.catalog.inverters.length; i++) {
        var cand = B.catalog.inverters[i];
        if (invOk(cand) && cand.kw * 1000 >= invW) { inv = cand; break; }
      }
      if (!inv) { // hiçbiri yetmiyorsa en büyüğü öner
        for (var j = B.catalog.inverters.length - 1; j >= 0; j--) if (invOk(B.catalog.inverters[j])) { inv = B.catalog.inverters[j]; break; }
      }

      // Panel
      var panelW = st.panelRef ? B.catalog.panels[st.panelRef] : 0;
      var panelQty = panelW ? Math.max(1, Math.ceil((kwp * 1000) / panelW - 0.05)) : 0;

      // Akü: kimya + inverter voltajına uyan en ekonomik banka
      var dod = SZ.dod[st.chem] || 0.8;
      var needWh = (dailyWh * preset().autonomyDays) / dod / SZ.invEff;
      var bat = null, batQty = 0, batCost = Infinity;
      if (inv) {
        B.catalog.batteries.forEach(function (b) {
          if (b.chem !== st.chem || !byId(b.ref)) return;
          var seriesOf = inv.v / b.v;
          if (seriesOf < 1 || seriesOf % 1 !== 0) return;
          var units = Math.max(seriesOf, Math.ceil(needWh / b.wh));
          units = Math.ceil(units / seriesOf) * seriesOf;
          var pr = priceOf(byId(b.ref)); if (pr.onRequest) return;
          var cost = units * pr.price;
          if (cost < batCost) { bat = b; batQty = units; batCost = cost; }
        });
      }

      var cableQty = Math.round(SZ.cableBaseM + SZ.cablePerKwM * kwp);
      return { anySelected: anySelected, dailyWh: dailyWh, invW: invW, kwp: kwp,
        inv: inv, panelQty: panelQty, bat: bat, batQty: batQty, needWh: needWh, cableQty: cableQty };
    }

    // Öneri satırları: [key, ref, önerilenAdet, rolEtiketi]
    function lines(c) {
      var out = [];
      if (st.panelRef && c.panelQty) out.push(["panel", st.panelRef, c.panelQty, "Güneş paneli"]);
      if (c.bat) out.push(["bat", c.bat.ref, c.batQty, "Akü (" + (st.chem === "jel" ? "jel" : "LiFePO4") + ")"]);
      if (c.inv) out.push(["inv", c.inv.ref, 1, "Akıllı inverter (MPPT dahili)"]);
      if (B.catalog.extras.cable && byId(B.catalog.extras.cable) && c.cableQty) out.push(["cable", B.catalog.extras.cable, c.cableQty, "Solar kablo (metre)"]);
      if (B.catalog.extras.mc4 && byId(B.catalog.extras.mc4) && c.panelQty) out.push(["mc4", B.catalog.extras.mc4, c.panelQty, "MC4 konnektör (çift)"]);
      return out.map(function (l) {
        var qty = st.qtyOv[l[0]] != null ? st.qtyOv[l[0]] : l[2];
        return { key: l[0], ref: l[1], qty: qty, auto: l[2], role: l[3], p: byId(l[1]) };
      });
    }

    /* ---- çizim ---- */
    var elScen = $("#bldScen"), elApps = $("#bldApps"), elNeeds = $("#bldNeeds"),
        elOpts = $("#bldOpts"), elList = $("#bldList"), elTotal = $("#bldTotal");

    function drawScen() {
      elScen.innerHTML = B.presets.map(function (p) {
        return '<button class="cat-card bld-scen' + (p.id === st.tip ? " on" : "") + '" data-tip="' + p.id + '">' +
          '<div class="ico">' + p.icon + "</div><b>" + esc(p.label) + "</b><span>" + esc(p.desc) + "</span></button>";
      }).join("");
      $$("[data-tip]", elScen).forEach(function (b) {
        b.addEventListener("click", function () {
          st = { tip: b.getAttribute("data-tip") }; ensureDefaults(); save();
          drawScen(); drawApps(); drawAll();
        });
      });
    }

    function drawApps() {
      elApps.innerHTML = B.appliances.map(function (a) {
        var q = st.items[a.id] || 0;
        return '<div class="bld-app' + (q ? " on" : "") + '" data-app="' + a.id + '">' +
          '<span class="bld-app-ico">' + a.icon + '</span>' +
          '<span class="bld-app-name">' + esc(a.name) + '<span class="muted small"> · ' + a.w + " W × " + String(a.h).replace(".", ",") + " sa/gün</span></span>" +
          '<span class="qty-box"><button data-d="-1" aria-label="Azalt">−</button><b>' + q + '</b><button data-d="1" aria-label="Artır">+</button></span></div>';
      }).join("");
      $$(".bld-app", elApps).forEach(function (row) {
        var id = row.getAttribute("data-app");
        $$("button", row).forEach(function (b) {
          b.addEventListener("click", function () {
            var q = Math.max(0, (st.items[id] || 0) + parseInt(b.getAttribute("data-d"), 10));
            st.items[id] = q; st.qtyOv = {}; save(); drawApps(); drawAll();
          });
        });
      });
    }

    function drawAll() {
      var c = calc();
      // İhtiyaç kartları
      elNeeds.innerHTML =
        '<div><b>' + (c.dailyWh / 1000).toFixed(1).replace(".", ",") + " kWh</b><span class='muted small'>günlük tüketim</span></div>" +
        '<div><b>' + c.kwp.toFixed(2).replace(".", ",") + " kWp</b><span class='muted small'>önerilen panel gücü</span></div>" +
        '<div><b>' + (c.needWh / 1000).toFixed(1).replace(".", ",") + " kWh</b><span class='muted small'>akü bankası</span></div>" +
        '<div><b>' + (c.invW / 1000).toFixed(1).replace(".", ",") + " kW</b><span class='muted small'>inverter gücü</span></div>";
      // Seçenekler: akü kimyası + panel modeli
      var panels = existingPanels(preset().panels);
      elOpts.innerHTML =
        '<div class="bld-opt"><b>Akü tipi</b><div class="bld-seg">' +
          '<button data-chem="lityum" class="' + (st.chem === "lityum" ? "on" : "") + '">LiFePO4 · uzun ömür</button>' +
          '<button data-chem="jel" class="' + (st.chem === "jel" ? "on" : "") + '">Jel · ekonomik</button></div></div>' +
        (panels.length > 1
          ? '<div class="bld-opt"><b>Panel modeli</b><select id="bldPanelSel">' +
            panels.map(function (r) { var p = byId(r); return '<option value="' + r + '"' + (r === st.panelRef ? " selected" : "") + ">" + esc(p.name) + "</option>"; }).join("") +
            "</select></div>"
          : "");
      $$("[data-chem]", elOpts).forEach(function (b) {
        b.addEventListener("click", function () { st.chem = b.getAttribute("data-chem"); delete st.qtyOv.bat; save(); drawAll(); });
      });
      var ps = $("#bldPanelSel");
      if (ps) ps.addEventListener("change", function () { st.panelRef = ps.value; delete st.qtyOv.panel; delete st.qtyOv.mc4; save(); drawAll(); });

      // Öneri listesi + toplam
      if (!c.anySelected) {
        elList.innerHTML = '<p class="muted">Cihaz seçince önerilen sistem burada listelenir.</p>';
        elTotal.innerHTML = ""; return;
      }
      var ls = lines(c), total = 0, anyPrice = false;
      elList.innerHTML = ls.map(function (l) {
        if (!l.p) return "";
        var pr = priceOf(l.p);
        var sum = pr.onRequest ? null : pr.price * l.qty;
        if (sum != null) { total += sum; anyPrice = true; }
        return '<div class="bld-line" data-key="' + l.key + '">' +
          '<a class="bld-line-thumb" href="' + prodUrl(l.p) + '">' + thumbMedia(l.p) + "</a>" +
          '<div class="bld-line-body"><span class="muted small">' + esc(l.role) + "</span>" +
          '<a href="' + prodUrl(l.p) + '">' + esc(l.p.name) + "</a>" +
          '<span class="muted small">' + (pr.onRequest ? "Fiyat için teklif" : fmt0(pr.price) + " × " + l.qty) + "</span></div>" +
          '<span class="qty-box"><button data-d="-1" aria-label="Azalt">−</button><b>' + l.qty + '</b><button data-d="1" aria-label="Artır">+</button></span>' +
          '<b class="bld-line-sum">' + (sum == null ? "—" : fmt0(sum)) + "</b>" +
          (l.qty !== l.auto ? '<button class="bld-auto" data-auto="' + l.key + '" title="Önerilen adede dön">↺ ' + l.auto + "</button>" : "") +
          "</div>";
      }).join("");
      $$(".bld-line", elList).forEach(function (row) {
        var key = row.getAttribute("data-key");
        $$(".qty-box button", row).forEach(function (b) {
          b.addEventListener("click", function () {
            var cur = null;
            lines(calc()).forEach(function (l) { if (l.key === key) cur = l.qty; });
            st.qtyOv[key] = Math.max(key === "inv" ? 1 : 0, (cur || 0) + parseInt(b.getAttribute("data-d"), 10));
            save(); drawAll();
          });
        });
      });
      $$("[data-auto]", elList).forEach(function (b) {
        b.addEventListener("click", function () { delete st.qtyOv[b.getAttribute("data-auto")]; save(); drawAll(); });
      });

      var tipLabel = preset().label;
      elTotal.innerHTML = anyPrice
        ? '<div class="bld-total-row"><span>Sistem toplamı</span><b>' + fmt0(total) + "</b></div>" +
          '<div class="bld-total-row muted small"><span>💰 Havale/EFT ile</span><span>' + fmt0(havalePrice(total)) + " (%" + cfg.commerce.havaleDiscountPct + " indirimli)</span></div>" +
          '<p class="muted small">KDV dahil · kargo hariç · fiyatlar tahmini liste fiyatıdır, kesin teklif için bize ulaşın.</p>' +
          '<div class="bld-total-cta"><button class="btn btn-primary" id="bldAddAll">🛒 Hepsini Sepete Ekle</button>' +
          '<a class="btn btn-wa" id="bldWa" target="_blank" rel="noopener">WhatsApp ile Teklif İste</a></div>'
        : "";
      var addBtn = $("#bldAddAll");
      if (addBtn) addBtn.addEventListener("click", function () {
        var ct = cart(), n = 0;
        lines(calc()).forEach(function (l) { if (l.p && !l.p.onRequest && l.qty > 0) { ct[l.ref] = (ct[l.ref] || 0) + l.qty; n += l.qty; } });
        setCart(ct); toast(n + " ürün sepete eklendi — sepetten sipariş verebilirsiniz.");
      });
      var waBtn = $("#bldWa");
      if (waBtn) {
        var msg = "Merhaba! Sistem Kurucu ile " + tipLabel + " projesi hazırladım:\n" +
          lines(c).filter(function (l) { return l.p && l.qty > 0; }).map(function (l) {
            return "• " + l.qty + " × " + l.p.name;
          }).join("\n") +
          "\nGünlük tüketim: " + (c.dailyWh / 1000).toFixed(1) + " kWh" +
          (anyPrice ? "\nTahmini toplam: " + fmt0(total) : "") +
          "\nKesin teklif rica ediyorum.";
        waBtn.setAttribute("href", waLink(msg));
      }
    }

    drawScen(); drawApps(); drawAll(); save();
  }

  /* ================= Sayfa: Kategori / Arama ================= */
  function pageCategory() {
    var slug = param("k"), q = param("q"), preTag = param("t");
    var c = slug ? catOf(slug) : null;
    var base;
    var title, desc;
    // Şimdilik gizli kategori (ör. solar-paketler): liste yerine Sistem
    // Kurucu'ya yönlendiren bilgi kartı gösterilir.
    if (c && isHiddenCat(c.slug)) {
      document.title = "Kendi Projenizi Oluşturun | " + cfg.company.brand;
      $("#catTitle").textContent = "Hazır paketlerin yerini Sistem Kurucu aldı";
      $("#catDesc").textContent = "Cihazlarınızı seçin; paneli, aküyü ve inverteri size göre boyutlandıralım.";
      $("#crumbs").innerHTML = '<a href="index.html">Ana Sayfa</a> › Sistem Kurucu';
      var wrap = $("#catGrid");
      if (wrap) wrap.innerHTML =
        '<div class="bld-redirect"><p>Hazır solar paketleri yeniliyoruz. Bu sürede ihtiyacınıza birebir uyan sistemi ' +
        "<b>Sistem Kurucu</b> ile kendiniz oluşturabilir, tek tıkla sepete ekleyebilirsiniz.</p>" +
        '<a class="btn btn-primary" href="sistem-kur.html">🛠️ Kendi Sistemini Kur</a></div>';
      var f = $("#filters"); if (f) f.innerHTML = "";
      var tb = $(".toolbar"); if (tb) tb.style.display = "none";
      return;
    }
    if (q) {
      base = searchProducts(q);
      title = '"' + q + '" için sonuçlar'; desc = base.length + " ürün bulundu";
    } else if (c) {
      base = ALL.filter(function (p) { return p.cat === c.slug; });
      title = c.name; desc = c.desc;
    } else {
      base = VISIBLE.slice(); title = "Tüm Ürünler"; desc = "Kataloğumuzdaki tüm solar ürünler";
    }
    if (preTag && c) title = title + " — " + preTag;
    document.title = title + " | " + cfg.company.brand;
    $("#catTitle").textContent = title;
    $("#catDesc").textContent = desc;
    $("#crumbs").innerHTML = '<a href="index.html">Ana Sayfa</a> › ' + (c ? esc(c.name) : "Arama");
    if (c) {
      jsonLd({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: cfg.company.domain + "/" },
        { "@type": "ListItem", position: 2, name: c.name, item: cfg.company.domain + "/" + catUrl(c) }] });
      var st = $("#seoText");
      if (st && c.seo) st.innerHTML = "<h2>" + esc(c.name) + " Seçim Rehberi</h2><p>" + esc(c.seo) + "</p>";
    }
    // Filtre durumu — ?t= parametresi özellik filtresini önceden seçer (menüden gelir)
    var state = { brands: [], tags: preTag ? [preTag] : [], min: null, max: null, sort: "featured", page: 1, per: 24 };
    var brands = {}; var tags = {};
    base.forEach(function (p) { brands[p.brand] = 1; (p.tags || []).forEach(function (t) { tags[t] = 1; }); });
    var fEl = $("#filters");
    fEl.innerHTML = "<h3>Filtrele</h3>" +
      '<div class="filter-group"><b>Fiyat (₺)</b><div class="price-inputs">' +
      '<input type="number" id="fMin" placeholder="Min" min="0"><input type="number" id="fMax" placeholder="Max" min="0"></div></div>' +
      (Object.keys(brands).length > 1 ? '<div class="filter-group"><b>Marka</b>' +
        Object.keys(brands).sort().map(function (b) { return '<label><input type="checkbox" data-brand="' + esc(b) + '"> ' + esc(b) + "</label>"; }).join("") + "</div>" : "") +
      (Object.keys(tags).length > 1 ? '<div class="filter-group"><b>Özellik</b>' +
        Object.keys(tags).sort().map(function (t) { return '<label><input type="checkbox" data-tag="' + esc(t) + '"> ' + esc(t) + "</label>"; }).join("") + "</div>" : "") +
      '<div class="filter-group"><button class="btn btn-sm btn-block" id="fClear">Filtreleri Temizle</button></div>';
    // Menüden gelen ön filtrenin kutusunu işaretle
    if (preTag) $$("[data-tag]", fEl).forEach(function (i) { if (i.getAttribute("data-tag") === preTag) i.checked = true; });
    function apply() {
      var list = base.filter(function (p) {
        if (state.brands.length && state.brands.indexOf(p.brand) < 0) return false;
        if (state.tags.length) { var ok = state.tags.some(function (t) { return (p.tags || []).indexOf(t) >= 0; }); if (!ok) return false; }
        var pr = priceOf(p);
        if (state.min != null && (p.onRequest || pr.price < state.min)) return false;
        if (state.max != null && !p.onRequest && pr.price > state.max) return false;
        return true;
      });
      if (state.sort === "priceAsc" || state.sort === "priceDesc") {
        list.sort(function (a, b) {
          var pa = a.onRequest ? Infinity : priceOf(a).price, pb = b.onRequest ? Infinity : priceOf(b).price;
          return state.sort === "priceAsc" ? pa - pb : (pb === Infinity ? -1 : pb - pa);
        });
      } else if (state.sort === "name") {
        list.sort(function (a, b) { return a.name.localeCompare(b.name, "tr"); });
      } else {
        list.sort(function (a, b) { return (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0); });
      }
      $("#resCount").textContent = list.length + " ürün";
      var pages = Math.max(1, Math.ceil(list.length / state.per));
      if (state.page > pages) state.page = 1;
      var slice = list.slice((state.page - 1) * state.per, state.page * state.per);
      renderGrid($("#catGrid"), slice);
      var pager = $("#pager");
      if (pages > 1) {
        pager.innerHTML = Array.apply(null, Array(pages)).map(function (_, i) {
          return '<button class="' + (state.page === i + 1 ? "on" : "") + '" data-pg="' + (i + 1) + '">' + (i + 1) + "</button>";
        }).join("");
        $$("button", pager).forEach(function (b) {
          b.addEventListener("click", function () { state.page = +b.getAttribute("data-pg"); apply(); window.scrollTo({ top: 0, behavior: "smooth" }); });
        });
      } else pager.innerHTML = "";
    }
    fEl.addEventListener("change", function () {
      state.brands = $$("[data-brand]:checked", fEl).map(function (x) { return x.getAttribute("data-brand"); });
      state.tags = $$("[data-tag]:checked", fEl).map(function (x) { return x.getAttribute("data-tag"); });
      state.page = 1; apply();
    });
    ["fMin", "fMax"].forEach(function (id) {
      $("#" + id).addEventListener("input", function () {
        state.min = $("#fMin").value ? +$("#fMin").value : null;
        state.max = $("#fMax").value ? +$("#fMax").value : null;
        state.page = 1; apply();
      });
    });
    $("#fClear").addEventListener("click", function () {
      state.brands = []; state.tags = []; state.min = state.max = null; state.page = 1;
      $$("input", fEl).forEach(function (i) { if (i.type === "checkbox") i.checked = false; else i.value = ""; });
      apply();
    });
    $("#sortSel").addEventListener("change", function () { state.sort = this.value; apply(); });
    apply();
  }

  /* ================= Sayfa: Ürün detay ================= */
  function pageProduct() {
    var id = param("u");
    var p = byId(id);
    var root = $("#pdRoot");
    if (!p) {
      root.innerHTML = '<div class="section"><h1>Ürün bulunamadı</h1><p class="muted">Aradığınız ürün kaldırılmış olabilir.</p><a class="btn btn-primary" href="index.html">Ana sayfaya dön</a></div>';
      return;
    }
    var c = catOf(p.cat);
    var pr = priceOf(p);
    document.title = p.name + " Fiyatı ve Özellikleri | " + cfg.company.brand;
    var md = $('meta[name="description"]');
    if (md) md.setAttribute("content", p.name + " — KDV dahil güncel fiyat, teknik özellikler ve hızlı kargo. " + cfg.company.brand + " güvencesiyle.");
    var canon = $('link[rel="canonical"]');
    if (canon) canon.setAttribute("href", cfg.company.domain + "/" + prodUrl(p));

    var isFav = favs().indexOf(p.id) >= 0;
    var priceBox;
    if (p.onRequest) {
      priceBox =
        '<div class="pd-price-box"><p style="margin:0 0 10px"><b>Bu ürün için özel fiyat teklifi hazırlıyoruz.</b></p>' +
        '<p class="muted small" style="margin:0 0 14px">Adet ve kullanım yerinizi iletin, aynı gün içinde net fiyat dönelim.</p>' +
        '<div class="form-grid">' +
        '<label class="fld"><span>Ad Soyad</span><input type="text" id="qName"></label>' +
        '<label class="fld"><span>Telefon</span><input type="tel" id="qPhone" placeholder="05__ ___ __ __"></label>' +
        '<label class="fld full"><span>Adet / Not</span><input type="text" id="qNote" placeholder="Örn. 2 adet, Manavgat"></label>' +
        "</div>" +
        '<button class="btn btn-primary btn-block" id="qSend">📩 WhatsApp ile Teklif İste</button></div>';
    } else {
      priceBox =
        '<div class="pd-price-box">' +
        (pr.listPrice ? '<span class="pd-price-old">' + fmt0(pr.listPrice) + "</span>" : "") +
        '<span class="pd-price">' + fmt0(pr.price) + "</span>" +
        (pr.discountPct ? '<span class="discount-badge">%' + pr.discountPct + " İNDİRİM</span>" : "") +
        (pr.usd != null
          ? '<div class="muted small">≈ <b>' + fmtUsd2(pr.usd) + "</b> — KDV dahil ₺ fiyat, güncel USD/TL kuruyla (" +
            fmtKur(currentKur()) + " ₺) hesaplanır ve günlük güncellenir.</div>"
          : '<div class="muted small">KDV dahil fiyattır.</div>') +
        '<div class="havale-note">💰 Havale/EFT ile: <b>' + fmt0(havalePrice(pr.price)) + "</b> (%" + cfg.commerce.havaleDiscountPct + " indirimli)</div>" +
        '<div class="qty-row" style="margin-top:14px">' +
        '<div class="qty"><button type="button" id="qMinus">−</button><input id="qtyInp" type="number" value="1" min="1" max="99"><button type="button" id="qPlus">+</button></div>' +
        '<button class="btn btn-primary" id="pdAdd" style="flex:1">🛒 Sepete Ekle</button></div>' +
        '<div style="display:flex;gap:8px;margin-top:10px">' +
        '<button class="btn btn-sm" id="pdFav">' + (isFav ? "♥ Favorilerde" : "♡ Favorilere Ekle") + "</button>" +
        '<a class="btn btn-sm btn-wa" href="' + waLink("Merhaba, şu ürün hakkında bilgi almak istiyorum: " + p.name + " (" + p.code + ")") + '" target="_blank" rel="noopener">💬 WhatsApp\'tan Sor</a></div></div>';
    }

    var specRows = Object.keys(p.specs || {}).map(function (k) {
      return "<tr><td>" + esc(k) + "</td><td>" + esc(p.specs[k]) + "</td></tr>";
    }).join("");

    var isPkg = p.cat === "solar-paketler" && p.components;
    var tabs = ['<button class="active" data-tab="t-desc">Açıklama</button>', '<button data-tab="t-spec">Teknik Özellikler</button>'];
    if (isPkg) tabs.splice(1, 0, '<button data-tab="t-comp">Pakete Dahil Olanlar</button>');
    tabs.push('<button data-tab="t-ship">Kargo &amp; İade</button>');

    var compHtml = "";
    if (isPkg) {
      var sepSum = 0, allPriced = true;
      var rows = p.components.map(function (comp) {
        var refP = comp.ref ? byId(comp.ref) : null;
        var line = "";
        if (refP && !refP.onRequest) {
          var rp = priceOf(refP); sepSum += rp.price * comp.q;
          line = '<a href="' + prodUrl(refP) + '">' + esc(comp.name) + "</a>";
        } else { allPriced = false; line = esc(comp.name); }
        return "<tr><td>" + comp.q + " ×</td><td>" + line + "</td></tr>";
      }).join("");
      compHtml = '<table class="comp-table"><thead><tr><th>Adet</th><th>Bileşen</th></tr></thead><tbody>' + rows + "</tbody></table>" +
        '<p class="muted small" style="margin-top:10px">Örnek konfigürasyondur; stok durumuna göre eşdeğer/üstü bileşen kullanılabilir.</p>';
      if (!p.onRequest && sepSum > pr.price) {
        compHtml += '<div class="pkg-compare">Bileşenleri tek tek alsaydınız' + (allPriced ? "" : " (aksesuarlar hariç)") + ': <s>' + fmt0(sepSum) + "</s> — paket fiyatı <b>" + fmt0(pr.price) + "</b> ile <b>" + fmt0(sepSum - pr.price) + " tasarruf</b> ediyorsunuz.</div>";
      }
    }

    root.innerHTML =
      '<div class="crumbs container" id="crumbs"><a href="index.html">Ana Sayfa</a> › <a href="' + catUrl(c) + '">' + esc(c.name) + "</a> › " + esc(p.name) + "</div>" +
      '<div class="container section" style="padding-top:18px">' +
      '<div class="pd-grid">' +
      '<div class="pd-gallery">' +
      (p.img && p.img.length
        ? '<div class="pd-main"><img id="pdMainImg" src="' + esc(p.img[0]) + '" alt="' + esc(p.name) + '" fetchpriority="high" decoding="async"></div>' +
          (p.img.length > 1
            ? '<div class="pd-thumbs">' + p.img.map(function (f, i) {
                return '<img src="' + esc(f) + '" alt="' + esc(p.name) + ' görsel ' + (i + 1) + '" loading="lazy" decoding="async" data-full="' + esc(f) + '"' + (i === 0 ? ' class="on"' : "") + ">";
              }).join("") + "</div>"
            : "")
        : thumbSVG(p, true)) +
      "</div>" +
      '<div class="pd-buy">' +
      '<div><span class="prod-brand">' + esc(p.brand) + "</span><h1>" + esc(p.name) + "</h1>" +
      '<div class="pd-meta"><span>Ürün kodu: <b>' + esc(p.code) + '</b></span><span class="stock-ok">✔ Stokta / tedarikte</span>' + (p.unit ? "<span>Birim: <b>" + esc(p.unit) + "</b></span>" : "") + "</div></div>" +
      priceBox +
      '<div class="notice-strip">' +
      "<span>📞 Yüklü siparişlerde sipariş öncesi irtibata geçmenizi öneririz — stok ve kargo süresini birlikte netleştirelim.</span>" +
      "<span>🚚 " + fmt0(cfg.commerce.freeShippingLimit) + " üzeri siparişlerde kargo ücretsizdir.</span>" +
      "<span>↩️ 14 gün içinde koşulsuz iade hakkınız vardır.</span></div>" +
      "</div></div>" +
      '<div class="tabs" id="pdTabs">' + tabs.join("") + "</div>" +
      '<div class="tab-panel" id="t-desc"><p>' + esc(p.desc) + "</p></div>" +
      (isPkg ? '<div class="tab-panel hidden" id="t-comp">' + compHtml + "</div>" : "") +
      '<div class="tab-panel hidden" id="t-spec"><table class="spec-table">' + specRows + "</table></div>" +
      '<div class="tab-panel hidden" id="t-ship"><p>Siparişleriniz 1–3 iş günü içinde anlaşmalı kargo ile gönderilir. ' +
      esc(fmt0(cfg.commerce.freeShippingLimit)) + " üzeri siparişlerde kargo ücretsizdir. Teslimattan itibaren 14 gün içinde koşulsuz iade hakkınız vardır; detaylar <a href='iade-degisim.html'>İade &amp; Değişim</a> sayfasındadır.</p></div>" +
      '<div class="section"><div class="section-head"><h2>Benzer Ürünler</h2></div><div id="relGrid"></div></div>' +
      "</div>";

    // Galeri küçük görselleri
    $$(".pd-thumbs img").forEach(function (t) {
      t.addEventListener("click", function () {
        $("#pdMainImg").src = t.getAttribute("data-full");
        $$(".pd-thumbs img").forEach(function (x) { x.classList.remove("on"); });
        t.classList.add("on");
      });
    });
    // Sekmeler
    $$("#pdTabs button").forEach(function (b) {
      b.addEventListener("click", function () {
        $$("#pdTabs button").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        $$(".tab-panel").forEach(function (pn) { pn.classList.add("hidden"); });
        $("#" + b.getAttribute("data-tab")).classList.remove("hidden");
      });
    });
    // Satın alma etkileşimleri
    if (!p.onRequest) {
      var qi = $("#qtyInp");
      $("#qMinus").addEventListener("click", function () { qi.value = Math.max(1, +qi.value - 1); });
      $("#qPlus").addEventListener("click", function () { qi.value = Math.min(99, +qi.value + 1); });
      $("#pdAdd").addEventListener("click", function () { addToCart(p.id, Math.max(1, +qi.value || 1)); });
      $("#pdFav").addEventListener("click", function () {
        var on = toggleFav(p.id);
        this.textContent = on ? "♥ Favorilerde" : "♡ Favorilere Ekle";
      });
    } else {
      $("#qSend").addEventListener("click", function () {
        var msg = "TEKLİF TALEBİ — " + p.name + " (" + p.code + ")\nAd: " + ($("#qName").value || "-") +
          "\nTelefon: " + ($("#qPhone").value || "-") + "\nNot: " + ($("#qNote").value || "-");
        window.open(waLink(msg), "_blank");
      });
    }
    // Benzer ürünler
    var rel = ALL.filter(function (x) { return x.cat === p.cat && x.id !== p.id; }).slice(0, 4);
    if (rel.length < 4) rel = rel.concat(ALL.filter(function (x) { return x.cat !== p.cat && x.bestseller; }).slice(0, 4 - rel.length));
    renderGrid($("#relGrid"), rel);
    // JSON-LD Product
    var ld = {
      "@context": "https://schema.org", "@type": "Product",
      name: p.name, sku: p.code, brand: { "@type": "Brand", name: p.brand },
      description: p.desc, category: c.name,
      url: cfg.company.domain + "/" + prodUrl(p)
    };
    if (p.img && p.img.length) ld.image = p.img.map(function (f) { return cfg.company.domain + "/" + f; });
    if (!p.onRequest) {
      ld.offers = {
        "@type": "Offer",
        priceCurrency: pr.usd != null ? "USD" : "TRY",
        price: String(pr.usd != null ? pr.usd : pr.price),
        availability: "https://schema.org/InStock",
        url: cfg.company.domain + "/" + prodUrl(p),
        seller: { "@type": "Organization", name: cfg.company.brand }
      };
    }
    jsonLd(ld);
    jsonLd({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: cfg.company.domain + "/" },
      { "@type": "ListItem", position: 2, name: c.name, item: cfg.company.domain + "/" + catUrl(c) },
      { "@type": "ListItem", position: 3, name: p.name, item: cfg.company.domain + "/" + prodUrl(p) }] });
  }

  /* ================= Sayfa: Sepet ================= */
  function pageCart() {
    var root = $("#cartRoot");
    function draw() {
      var c = cart(), ids = Object.keys(c).filter(function (id) { return byId(id); });
      if (!ids.length) {
        root.innerHTML = '<div class="section" style="text-align:center"><div style="font-size:52px">🛒</div><h1>Sepetiniz boş</h1>' +
          '<p class="muted">Solar paketlerimize göz atarak başlayabilirsiniz.</p>' +
          '<a class="btn btn-primary" href="kategori.html?k=solar-paketler">Solar Paketleri İncele</a></div>';
        return;
      }
      var subtotal = 0;
      var items = ids.map(function (id) {
        var p = byId(id), pr = priceOf(p), line = pr.price * c[id];
        subtotal += line;
        return '<div class="cart-item">' +
          '<a class="thumb" href="' + prodUrl(p) + '">' + thumbMedia(p) + "</a>" +
          "<div><a class='prod-name' href='" + prodUrl(p) + "' style='min-height:0'>" + esc(p.name) + "</a>" +
          '<div class="muted small">' + fmt0(pr.price) + " × " + c[id] + (p.unit ? " " + esc(p.unit) : " adet") + "</div>" +
          '<div class="qty" style="margin-top:6px;display:inline-flex"><button data-dec="' + id + '">−</button><input value="' + c[id] + '" readonly><button data-inc="' + id + '">+</button></div></div>' +
          '<div style="text-align:right"><b>' + fmt0(line) + "</b><br><button class='btn btn-sm btn-ghost' data-del='" + id + "' style='margin-top:8px;color:var(--red)'>Kaldır</button></div></div>";
      }).join("");
      var shipping = subtotal >= cfg.commerce.freeShippingLimit ? 0 : cfg.commerce.shippingFlat;
      var havaleTotal = havalePrice(subtotal) + shipping;
      root.innerHTML =
        '<div class="cart-layout">' +
        "<div><h1>Sepetim</h1>" + items + "</div>" +
        '<div class="summary"><h2 style="font-size:1.15rem">Sipariş Özeti</h2>' +
        '<div class="row"><span>Ara toplam</span><b>' + fmt0(subtotal) + "</b></div>" +
        '<div class="row"><span>Kargo</span><b>' + (shipping ? fmt0(shipping) : "Ücretsiz 🎉") + "</b></div>" +
        '<div class="row" style="color:var(--green)"><span>Havale/EFT ile (%' + cfg.commerce.havaleDiscountPct + ' indirimli)</span><b>' + fmt0(havaleTotal) + "</b></div>" +
        '<div class="row total"><span>Toplam (kart/kapıda)</span><span>' + fmt0(subtotal + shipping) + "</span></div>" +
        '<h3 style="font-size:.95rem;margin-top:18px">Teslimat Bilgileri</h3>' +
        '<div class="form-grid">' +
        '<label class="fld"><span>Ad Soyad *</span><input type="text" id="oName"></label>' +
        '<label class="fld"><span>Telefon *</span><input type="tel" id="oPhone" placeholder="05__ ___ __ __"></label>' +
        '<label class="fld full"><span>Adres *</span><textarea id="oAddr" rows="2"></textarea></label>' +
        '<label class="fld full"><span>Sipariş notu</span><input type="text" id="oNote"></label>' +
        "</div>" +
        '<div class="radio-cards">' +
        '<label><input type="radio" name="pay" value="havale" checked><span><b>Havale / EFT</b> — %' + cfg.commerce.havaleDiscountPct + " indirim. IBAN bilgisi onay mesajıyla iletilir.</span></label>" +
        '<label><input type="radio" name="pay" value="kart"><span><b>Kredi kartı</b> — güvenli ödeme linki WhatsApp\'tan gönderilir.</span></label>' +
        "</div>" +
        '<label class="fld" style="margin-top:12px"><input type="checkbox" id="oKvkk"> <a href="mesafeli-satis.html" target="_blank">Mesafeli satış sözleşmesini</a> ve <a href="gizlilik.html" target="_blank">KVKK metnini</a> okudum, onaylıyorum.</label>' +
        '<button class="btn btn-primary btn-block" id="oSend" style="margin-top:6px">📲 Siparişi WhatsApp ile Gönder</button>' +
        '<p class="muted small" style="margin-top:10px">Siparişiniz WhatsApp üzerinden ekibimize iletilir; stok teyidi ve ödeme adımı için sizi arıyoruz. Bu, dropshipping modelimizde en hızlı ve en güvenli yoldur.</p>' +
        "</div></div>";
      $$("[data-inc]").forEach(function (b) { b.addEventListener("click", function () { var c2 = cart(); c2[b.getAttribute("data-inc")]++; setCart(c2); draw(); }); });
      $$("[data-dec]").forEach(function (b) { b.addEventListener("click", function () { var id = b.getAttribute("data-dec"), c2 = cart(); c2[id] = Math.max(1, c2[id] - 1); setCart(c2); draw(); }); });
      $$("[data-del]").forEach(function (b) { b.addEventListener("click", function () { var c2 = cart(); delete c2[b.getAttribute("data-del")]; setCart(c2); draw(); }); });
      $("#oSend").addEventListener("click", function () {
        var name = $("#oName").value.trim(), phone = $("#oPhone").value.trim(), addr = $("#oAddr").value.trim();
        if (!name || !phone || !addr) { toast("Lütfen ad, telefon ve adres alanlarını doldurun."); return; }
        if (!$("#oKvkk").checked) { toast("Lütfen sözleşme onay kutusunu işaretleyin."); return; }
        var pay = ($('input[name="pay"]:checked') || {}).value || "havale";
        var no = "GM" + String(Date.now()).slice(-8);
        var lines = ids.map(function (id) {
          var p = byId(id), pr = priceOf(p);
          return "• " + c[id] + " × " + p.name + " (" + p.code + ") — " + fmt0(pr.price * c[id]);
        }).join("\n");
        var total = pay === "havale" ? havaleTotal : subtotal + shipping;
        var msg = "🛒 YENİ SİPARİŞ — " + no + "\n\n" + lines +
          "\n\nAra toplam: " + fmt0(subtotal) +
          "\nKargo: " + (shipping ? fmt0(shipping) : "Ücretsiz") +
          "\nÖdeme: " + (pay === "havale" ? "Havale/EFT (%" + cfg.commerce.havaleDiscountPct + " indirimli)" : "Kredi kartı") +
          "\nTOPLAM: " + fmt0(total) +
          "\n\n👤 " + name + "\n📞 " + phone + "\n📍 " + addr +
          (($("#oNote").value || "").trim() ? "\n📝 " + $("#oNote").value.trim() : "");
        window.open(waLink(msg), "_blank");
        toast("Siparişiniz WhatsApp'a aktarıldı. Onay için mesajı göndermeyi unutmayın!");
      });
    }
    draw();
  }

  /* ================= Sayfa: Favoriler ================= */
  function pageFavs() {
    var list = favs().map(byId).filter(Boolean);
    var el = $("#favGrid");
    if (!list.length) {
      el.innerHTML = '<div style="text-align:center;padding:40px 0"><div style="font-size:52px">🤍</div><h2>Henüz favoriniz yok</h2><p class="muted">Beğendiğiniz ürünlerin kalbine dokunarak buraya ekleyin.</p><a class="btn btn-primary" href="index.html">Alışverişe Başla</a></div>';
      return;
    }
    renderGrid(el, list);
  }

  /* ================= Sayfa: İletişim ================= */
  function pageContact() {
    var el = $("#cSend");
    if (el) el.addEventListener("click", function () {
      var msg = "İLETİŞİM FORMU\nAd: " + ($("#cName").value || "-") + "\nTelefon: " + ($("#cPhone").value || "-") + "\nKonu: " + ($("#cTopic").value || "-") + "\nMesaj: " + ($("#cMsg").value || "-");
      window.open(waLink(msg), "_blank");
    });
    $$("[data-c]").forEach(function (n) {
      var k = n.getAttribute("data-c");
      if (k === "tel") { n.textContent = cfg.company.phone.display; n.setAttribute("href", "tel:" + cfg.company.phone.tel); }
      if (k === "mail") { n.textContent = cfg.company.email; n.setAttribute("href", "mailto:" + cfg.company.email); }
      if (k === "addr") n.textContent = cfg.company.address;
      if (k === "hours") n.textContent = cfg.company.hours;
    });
  }

  /* ================= AI Asistan (kural tabanlı) ================= */
  var chatEl = null, chatCtx = { mode: null };
  function openChat() {
    if (chatEl) { chatEl.remove(); chatEl = null; return; }
    chatEl = document.createElement("div"); chatEl.className = "chat-panel";
    chatEl.innerHTML =
      '<div class="chat-head"><span>🤖 GESM Asistan</span><button id="chatX" aria-label="Kapat">✕</button></div>' +
      '<div class="chat-log" id="chatLog"></div>' +
      '<div class="chat-quick" id="chatQuick"></div>' +
      '<div class="chat-input"><input id="chatInp" placeholder="Sorunuzu yazın…"><button id="chatGo">➤</button></div>';
    document.body.appendChild(chatEl);
    $("#chatX").addEventListener("click", function () { chatEl.remove(); chatEl = null; });
    $("#chatGo").addEventListener("click", sendChat);
    $("#chatInp").addEventListener("keydown", function (e) { if (e.key === "Enter") sendChat(); });
    aiSay("Merhaba! 👋 Ben GESM Asistan. Size doğru solar ürünü bulmakta yardımcı olabilirim.");
    setQuick(["📦 Paket önerisi", "💧 Tarımsal sulama", "🔆 Kaç panel gerekir?", "👤 Canlı destek"]);
  }
  function aiSay(html) {
    var log = $("#chatLog"); if (!log) return;
    var m = document.createElement("div"); m.className = "msg ai"; m.innerHTML = html;
    log.appendChild(m); log.scrollTop = log.scrollHeight;
  }
  function meSay(text) {
    var log = $("#chatLog"); if (!log) return;
    var m = document.createElement("div"); m.className = "msg me"; m.textContent = text;
    log.appendChild(m); log.scrollTop = log.scrollHeight;
  }
  function setQuick(arr) {
    var q = $("#chatQuick"); if (!q) return;
    q.innerHTML = arr.map(function (t) { return "<button>" + esc(t) + "</button>"; }).join("");
    $$("button", q).forEach(function (b) { b.addEventListener("click", function () { handleChat(b.textContent); }); });
  }
  function sendChat() {
    var inp = $("#chatInp"), v = inp.value.trim();
    if (!v) return; inp.value = ""; handleChat(v);
  }
  function prodLink(p) {
    var pr = priceOf(p);
    return '<a href="' + prodUrl(p) + '">' + esc(p.name) + "</a>" + (p.onRequest ? " <i>(teklif)</i>" : " — <b>" + fmt0(pr.price) + "</b>");
  }
  function handleChat(text) {
    meSay(text);
    var t = norm(text);
    if (chatCtx.mode === "pkg-scenario") {
      var map = { karavan: "Karavan", "bağ": "Bağ Evi", bag: "Bağ Evi", yayla: "Bağ Evi", ev: "Ev", ticari: "Ticari", "iş": "Ticari" };
      var sc = null;
      Object.keys(map).forEach(function (k) { if (t.indexOf(k) >= 0) sc = map[k]; });
      chatCtx.mode = null;
      var list = ALL.filter(function (p) { return p.cat === "solar-paketler" && (!sc || p.scenario === sc); })
        .sort(function (a, b) { return priceOf(a).price - priceOf(b).price; }).slice(0, 3);
      aiSay((sc ? sc + " için önerilerim:" : "Önerilerim:") + "<br>" + list.map(function (p) { return "• " + prodLink(p); }).join("<br>") +
        '<br><br>Tümü için: <a href="kategori.html?k=solar-paketler">Solar Paketler</a>');
      setQuick(["📦 Paket önerisi", "🔆 Kaç panel gerekir?", "👤 Canlı destek"]);
      return;
    }
    if (chatCtx.mode === "panel-calc") {
      var kwh = parseFloat(t.replace(",", "."));
      chatCtx.mode = null;
      if (kwh > 0) {
        var yearly = kwh * 12;
        var kwp = yearly / 1650; // Akdeniz ort. özgül üretim varsayımı
        var panels = Math.ceil((kwp * 1000) / 550);
        aiSay("Aylık <b>" + kwh + " kWh</b> tüketim için yaklaşık <b>" + kwp.toFixed(1) + " kWp</b> kurulu güç, yani <b>" + panels + " adet 550 W panel</b> gerekir. <i>(Antalya/Akdeniz ortalaması varsayıldı; kesin boyutlandırma keşifle yapılır.)</i><br><br>" +
          "Uygun paneller: <a href='kategori.html?k=gunes-panelleri'>Güneş Panelleri</a>");
      } else {
        aiSay("Sayı okuyamadım. Örn: <b>300</b> yazın (aylık kWh).");
        chatCtx.mode = "panel-calc";
      }
      return;
    }
    if (t.indexOf("paket") >= 0) {
      chatCtx.mode = "pkg-scenario";
      aiSay("Harika! Sistemi nerede kullanacaksınız?");
      setQuick(["Karavan", "Bağ evi", "Ev", "Ticari"]);
      return;
    }
    if (t.indexOf("sulama") >= 0 || t.indexOf("pompa") >= 0 || t.indexOf("kuyu") >= 0) {
      var pumps = ALL.filter(function (p) { return p.cat === "tarimsal-sulama"; }).slice(0, 3);
      aiSay("Solar sulamada sürücü gücü, pompanızın Hp değerine göre seçilir. Örnek ürünler:<br>" +
        pumps.map(function (p) { return "• " + prodLink(p); }).join("<br>") +
        '<br><br>Tüm sürücüler: <a href="kategori.html?k=tarimsal-sulama">Tarımsal Sulama</a><br>Kuyu derinliği + günlük su ihtiyacınızı <a href="' + waLink("Tarımsal sulama sistemi boyutlandırması istiyorum.") + '" target="_blank">WhatsApp\'tan</a> iletin, ücretsiz boyutlandıralım.');
      return;
    }
    if (t.indexOf("panel") >= 0 && (t.indexOf("kaç") >= 0 || t.indexOf("gerek") >= 0 || t.indexOf("hesap") >= 0)) {
      chatCtx.mode = "panel-calc";
      aiSay("Aylık elektrik tüketiminiz kaç kWh? (Faturanızda yazar — örn. <b>300</b>)");
      return;
    }
    if (t.indexOf("destek") >= 0 || t.indexOf("canlı") >= 0 || t.indexOf("insan") >= 0 || t.indexOf("telefon") >= 0) {
      aiSay('Elbette! 📞 <a href="tel:' + cfg.company.phone.tel + '">' + cfg.company.phone.display + '</a> numarasından arayabilir veya <a href="' + waLink("Merhaba, canlı destek almak istiyorum.") + '" target="_blank">WhatsApp\'tan</a> yazabilirsiniz. ' + cfg.company.hours + ".");
      return;
    }
    if (t.indexOf("kargo") >= 0 || t.indexOf("teslimat") >= 0) {
      aiSay("Siparişler 1–3 iş günü içinde kargolanır; " + fmt0(cfg.commerce.freeShippingLimit) + " üzeri <b>kargo ücretsiz</b>. Detay: <a href='kargo-teslimat.html'>Kargo &amp; Teslimat</a>");
      return;
    }
    if (t.indexOf("iade") >= 0) {
      aiSay("14 gün içinde koşulsuz iade hakkınız var. Detay: <a href='iade-degisim.html'>İade &amp; Değişim</a>");
      return;
    }
    // Serbest arama
    var found = searchProducts(text).slice(0, 3);
    if (found.length) {
      aiSay("Şunları buldum:<br>" + found.map(function (p) { return "• " + prodLink(p); }).join("<br>") +
        '<br><br><a href="kategori.html?q=' + encodeURIComponent(text) + '">Tüm sonuçları gör →</a>');
    } else {
      aiSay('Tam eşleşme bulamadım. 🤔 Dilerseniz <a href="' + waLink("Merhaba, şunu arıyorum: " + text) + '" target="_blank">WhatsApp\'tan ekibimize</a> sorabilirsiniz — tedarik ağımızla bulup fiyatlandıralım.');
    }
  }

  /* ================= Sayfa: Admin (K1/K3) ================= */
  function pageAdmin() {
    var root = $("#adminRoot");
    if (sessionStorage.getItem("gesm.admin.ok") !== "1") {
      root.innerHTML = '<div class="section container" style="max-width:420px"><div class="admin-card"><h1 style="font-size:1.3rem">🔐 Yönetim Paneli</h1>' +
        '<label class="fld"><span>Şifre</span><input type="password" id="aPass"></label>' +
        '<button class="btn btn-primary btn-block" id="aLogin">Giriş</button>' +
        '<p class="muted small" style="margin-top:10px">Bu panel yalnızca fiyat/duyuru yönetimi içindir; değişiklikler bu cihazın tarayıcısında saklanır.</p></div></div>';
      $("#aLogin").addEventListener("click", function () {
        if ($("#aPass").value === cfg.admin.pass) { sessionStorage.setItem("gesm.admin.ok", "1"); pageAdmin(); }
        else toast("Hatalı şifre");
      });
      return;
    }
    var st = adminState();
    function save() { store(ADMIN_KEY, st); toast("Kaydedildi ✔"); drawTable(); }
    var supOpts = Object.keys(cfg.suppliers).map(function (s) { return '<option value="' + s + '">' + esc(cfg.suppliers[s].label) + "</option>"; }).join("");
    var catOpts = cfg.categories.map(function (c) { return '<option value="' + c.slug + '">' + esc(c.name) + "</option>"; }).join("");
    root.innerHTML =
      '<div class="container section">' +
      '<div class="section-head"><h1>🔧 Yönetim Paneli</h1><span class="pill">Değişiklikler yalnız bu cihazda saklanır — kalıcı yayın için config/data dosyasına işleyip commit edin.</span></div>' +
      '<div class="admin-grid">' +
      '<div class="admin-card"><h3>📢 Duyuru Bandı</h3>' +
      '<label class="fld"><span>Metin (boş = varsayılan)</span><input type="text" id="adAnn" value="' + esc(st.announcement || "") + '"></label>' +
      '<button class="btn btn-sm btn-primary" id="adAnnSave">Kaydet</button></div>' +
      '<div class="admin-card"><h3>💹 Toplu Fiyat Ayarı (%)</h3>' +
      '<label class="fld"><span>Kapsam</span><select id="adjScope"><option value="global">Tüm ürünler</option><optgroup label="Kategori">' + catOpts + '</optgroup><optgroup label="Tedarikçi">' + supOpts + "</optgroup></select></label>" +
      '<label class="fld"><span>Değişim yüzdesi (örn. 5 = %5 zam, -3 = %3 indirim)</span><input type="number" id="adjVal" step="0.5" value="0"></label>' +
      '<button class="btn btn-sm btn-primary" id="adjApply">Uygula</button> <button class="btn btn-sm" id="adjReset">Sıfırla</button>' +
      '<p class="muted small" id="adjNow" style="margin-top:8px"></p></div>' +
      '<div class="admin-card"><h3>🏷️ Tedarikçi Marjları (%)</h3>' +
      Object.keys(cfg.suppliers).map(function (s) {
        var cur = st.margins.sup[s] != null ? st.margins.sup[s] : (cfg.pricing.marginBySupplier[s] != null ? cfg.pricing.marginBySupplier[s] : cfg.pricing.defaultMarginPct);
        return '<label class="fld"><span>' + esc(cfg.suppliers[s].label) + '</span><input type="number" step="1" data-msup="' + s + '" value="' + cur + '"></label>';
      }).join("") +
      '<button class="btn btn-sm btn-primary" id="mSave">Kaydet</button>' +
      '<p class="muted small" style="margin-top:8px">Marj, açık fiyatı olmayan ürünlerde maliyetten satış fiyatı türetmek için kullanılır (K2).</p></div>' +
      '<div class="admin-card"><h3>💱 USD/TL Kuru</h3>' +
      '<label class="fld"><span>1 USD = ₺ (USD fiyatlı ürünlerin ₺ karşılığı bu kurla hesaplanır)</span>' +
      '<input type="number" id="adUsd" step="0.01" min="1" value="' + (st.usdTry || currentKur()) + '"></label>' +
      '<button class="btn btn-sm btn-primary" id="adUsdPublish">🌐 Kuru Yayınla (tüm ziyaretçiler)</button> ' +
      '<button class="btn btn-sm" id="adUsdSave">Yalnız Bu Cihazda Dene</button> ' +
      '<button class="btn btn-sm" id="adUsdReset">Denemeyi Sıfırla</button>' +
      '<p class="muted small" style="margin-top:8px">Yayındaki kur: <b>' + fmtKur(currentKur()) + " ₺</b> · Varsayılan (config.js): " +
      cfg.commerce.usdTry + " ₺<br>Tüm fiyatlar USD tabanlıdır; ₺ = USD × kur × " + fxMult().toFixed(2).replace(".", ",") +
      " (kur tamponu). \"Kuru Yayınla\" sunucuya yazar ve TÜM ziyaretçilerde geçerli olur (Railway'de kalıcılık için DATA_DIR/Volume önerilir).</p></div>" +
      '<div class="admin-card"><h3>💾 Yedekle / Sıfırla</h3>' +
      '<button class="btn btn-sm" id="expBtn">JSON Dışa Aktar</button> ' +
      '<button class="btn btn-sm" id="impBtn">İçe Aktar</button> ' +
      '<button class="btn btn-sm" id="rstBtn" style="color:var(--red)">Tümünü Sıfırla</button>' +
      '<textarea id="ioArea" rows="3" style="margin-top:10px" placeholder="JSON burada görünür / buraya yapıştırın"></textarea></div>' +
      "</div>" +
      '<div class="admin-card"><h3>📋 Ürün &amp; Fiyat Listesi (' + ALL.length + " ürün)</h3>" +
      '<input type="search" id="tblSearch" placeholder="Ürün ara…" style="max-width:320px;margin-bottom:10px">' +
      '<div class="table-wrap"><table class="admin-table" id="prodTable"></table></div></div></div>';

    function adjLabel() {
      var parts = [];
      if (st.adj.global) parts.push("Global: %" + st.adj.global);
      Object.keys(st.adj.cat).forEach(function (k) { if (st.adj.cat[k]) parts.push((catOf(k) || { name: k }).name + ": %" + st.adj.cat[k]); });
      Object.keys(st.adj.sup).forEach(function (k) { if (st.adj.sup[k]) parts.push((cfg.suppliers[k] || { label: k }).label + ": %" + st.adj.sup[k]); });
      $("#adjNow").textContent = parts.length ? "Aktif ayarlamalar → " + parts.join(" · ") : "Aktif toplu ayarlama yok.";
    }
    function drawTable() {
      var q = norm($("#tblSearch").value || "");
      var rows = ALL.filter(function (p) { return !q || norm(p.name + " " + p.code).indexOf(q) >= 0; }).map(function (p) {
        var pr = priceOf(p);
        var ov = st.products[p.id] || {};
        var supLabel = (cfg.suppliers[p.supplier] || { label: "-" }).label;
        return "<tr><td>" + esc(p.code) + "</td><td title='" + esc(p.name) + "'>" + esc(p.name.slice(0, 44)) + (p.name.length > 44 ? "…" : "") + "</td>" +
          "<td>" + esc((catOf(p.cat) || {}).name || "") + "</td><td><span class='pill'>" + esc(supLabel) + "</span></td>" +
          "<td>" + (p.cost ? fmt0(p.cost) : "—") + "</td>" +
          "<td><b>" + (p.onRequest && ov.price == null ? "Teklif" : (pr.usd != null ? fmtUsd(pr.usd) + " ≈ " : "") + fmt0(pr.price || ov.price || 0)) + "</b></td>" +
          '<td><input type="number" data-op="' + p.id + '" placeholder="Manuel ₺" value="' + (ov.price != null ? ov.price : "") + '"></td>' +
          '<td><input type="number" data-ol="' + p.id + '" placeholder="Eski fiyat ₺" value="' + (ov.listPrice != null ? ov.listPrice : (p.listPrice || "")) + '"></td>' +
          '<td><button class="btn btn-sm" data-orow="' + p.id + '">Kaydet</button> <button class="btn btn-sm btn-ghost" data-oclr="' + p.id + '">↺</button></td></tr>';
      }).join("");
      $("#prodTable").innerHTML =
        "<thead><tr><th>Kod</th><th>Ürün</th><th>Kategori</th><th>Tedarikçi</th><th>Maliyet</th><th>Satış</th><th>Manuel Fiyat</th><th>Kampanya (eski)</th><th></th></tr></thead><tbody>" + rows + "</tbody>";
      $$("[data-orow]").forEach(function (b) {
        b.addEventListener("click", function () {
          var id = b.getAttribute("data-orow");
          var pv = $('[data-op="' + id + '"]').value, lv = $('[data-ol="' + id + '"]').value;
          var o = {};
          if (pv !== "") o.price = +pv;
          if (lv !== "") o.listPrice = +lv;
          if (Object.keys(o).length) st.products[id] = o; else delete st.products[id];
          save();
        });
      });
      $$("[data-oclr]").forEach(function (b) {
        b.addEventListener("click", function () { delete st.products[b.getAttribute("data-oclr")]; save(); });
      });
      adjLabel();
    }
    $("#adAnnSave").addEventListener("click", function () { st.announcement = $("#adAnn").value.trim(); save(); });
    $("#adUsdSave").addEventListener("click", function () {
      var v = parseFloat($("#adUsd").value);
      if (v > 0) { st.usdTry = v; save(); } else toast("Geçersiz kur");
    });
    $("#adUsdPublish").addEventListener("click", function () {
      var v = parseFloat($("#adUsd").value);
      if (!(v > 0)) { toast("Geçersiz kur"); return; }
      fetch("/api/kur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usdTry: v, pass: cfg.admin.pass })
      }).then(function (r) { return r.json(); }).then(function (j) {
        if (j && j.ok) {
          delete st.usdTry; save(); // cihaz-yerel denemeyi kaldır, yayın kuru geçerli
          store(KUR_KEY, { usdTry: j.usdTry, updatedAt: j.updatedAt, at: Date.now() });
          toast("Kur yayınlandı: " + fmtKur(j.usdTry) + " ₺ — tüm ziyaretçilere uygulandı");
          setTimeout(function () { location.reload(); }, 900);
        } else toast("Yayınlanamadı" + (j && j.error ? " (" + j.error + ")" : ""));
      }).catch(function () {
        toast("Sunucu API'si yok (statik yayın) — kur yalnız bu cihazda denenebilir");
      });
    });
    $("#adUsdReset").addEventListener("click", function () {
      delete st.usdTry; $("#adUsd").value = cfg.commerce.usdTry; save();
    });
    $("#adjApply").addEventListener("click", function () {
      var scope = $("#adjScope").value, v = parseFloat($("#adjVal").value) || 0;
      if (scope === "global") st.adj.global = v;
      else if (catOf(scope)) st.adj.cat[scope] = v;
      else st.adj.sup[scope] = v;
      save();
    });
    $("#adjReset").addEventListener("click", function () { st.adj = { global: 0, cat: {}, sup: {} }; save(); });
    $("#mSave").addEventListener("click", function () {
      $$("[data-msup]").forEach(function (i) { st.margins.sup[i.getAttribute("data-msup")] = parseFloat(i.value) || 0; });
      save();
    });
    $("#expBtn").addEventListener("click", function () { $("#ioArea").value = JSON.stringify(st, null, 2); toast("JSON hazırlandı — kopyalayın."); });
    $("#impBtn").addEventListener("click", function () {
      try { var o = JSON.parse($("#ioArea").value); st = Object.assign({ products: {}, adj: { global: 0, cat: {}, sup: {} }, margins: { sup: {}, cat: {} }, announcement: "" }, o); save(); }
      catch (e) { toast("Geçersiz JSON"); }
    });
    $("#rstBtn").addEventListener("click", function () {
      if (confirm("Tüm yerel fiyat/duyuru değişiklikleri silinsin mi?")) { localStorage.removeItem(ADMIN_KEY); st = adminState(); save(); }
    });
    $("#tblSearch").addEventListener("input", drawTable);
    drawTable();
  }

  /* ================= Başlat ================= */
  document.addEventListener("DOMContentLoaded", function () {
    // Önce günlük kur (sunucudan, önbellekli) — sonra sayfa çizimi; böylece
    // tüm ₺ fiyatlar güncel kurla basılır.
    initKur(function () {
      renderChrome();
      var page = pageActive();
      if (page === "home") pageHome();
      else if (page === "sistem-kur") pageBuilder();
      else if (page === "kategori") pageCategory();
      else if (page === "urun") pageProduct();
      else if (page === "sepet") pageCart();
      else if (page === "favoriler") pageFavs();
      else if (page === "iletisim") pageContact();
      else if (page === "admin") pageAdmin();
      else pageContact(); // statik sayfalardaki data-c alanları için
    });
  });
})();

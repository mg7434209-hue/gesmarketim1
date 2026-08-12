/* sitemap.xml üreticisi — kaynak: assets/config.js + data/catalog.json
   Çalıştır: node build-seo.js  (npm run build önce build-catalog.js koşar) */
"use strict";
const fs = require("fs");
const path = require("path");

global.window = global; // tarayıcı globali şimi
require("./assets/config.js");

const cfg = global.GESM.config;
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "catalog.json"), "utf8"));
const BASE = cfg.company.domain;
const today = new Date().toISOString().slice(0, 10);

const staticPages = [
  { u: "/", p: "1.0" },
  { u: "/kategori.html", p: "0.8" },
  { u: "/sistem-kur.html", p: "0.9" },
  { u: "/hakkimizda.html", p: "0.5" },
  { u: "/sss.html", p: "0.6" },
  { u: "/iletisim.html", p: "0.5" },
  { u: "/kargo-teslimat.html", p: "0.4" },
  { u: "/iade-degisim.html", p: "0.4" }
];

let urls = staticPages.map(s => ({ loc: BASE + s.u, pri: s.p }));
(catalog.categories || []).forEach(c => urls.push({ loc: BASE + "/kategori.html?k=" + c.slug, pri: "0.8" }));
(catalog.products || []).forEach(p => urls.push({ loc: BASE + "/urun.html?u=" + p.id, pri: "0.7" }));

const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(u =>
    "  <url><loc>" + u.loc.replace(/&/g, "&amp;") + "</loc><lastmod>" + today + "</lastmod><priority>" + u.pri + "</priority></url>"
  ).join("\n") + "\n</urlset>\n";

fs.writeFileSync(path.join(__dirname, "sitemap.xml"), xml);
console.log("sitemap.xml üretildi — " + urls.length + " URL");

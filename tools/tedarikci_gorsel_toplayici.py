#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tedarikçi Görsel Toplayıcı — GES MARKETİM
==========================================
Mexxsun ve Enerji Pazarı sitelerinin sitemap.xml'inden ürün URL'lerini bulur,
her ürün sayfasının og:image + galeri görsellerini indirir ve
ürün ⇄ görsel eşleme tablosunu CSV olarak yazar.

Çıktılar:
  public/images/products/{tedarikci}/{urun-slug}.jpg        (ana görsel)
  public/images/products/{tedarikci}/{urun-slug}-2.jpg ...  (galeri)
  data/urun_gorsel_eslesme.csv   (tedarikci;urun_adi;url;fiyat;gorsel_dosyalari)

Kullanım:
  python3 tools/tedarikci_gorsel_toplayici.py                # tümü
  python3 tools/tedarikci_gorsel_toplayici.py --supplier mexxsun
  python3 tools/tedarikci_gorsel_toplayici.py --limit 20     # deneme
  python3 tools/tedarikci_gorsel_toplayici.py --force        # var olanı yeniden indir

Gereksinimler:  pip install requests beautifulsoup4

NOT: Bu script buluttaki Claude Code ortamında ÇALIŞMAZ (egress izin listesi
tedarikçi sitelerine 403 verir). Kendi bilgisayarınızda, repo kökünden çalıştırın.
Görseller tedarikçi kaynaklıdır ve yalnızca bayisi olduğunuz ürünlerin
listelenmesi amacıyla kullanılmalıdır (K5).
"""
import argparse
import csv
import json
import re
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    sys.exit("Eksik paket: önce şunu çalıştırın →  pip install requests beautifulsoup4")

# ---------------------------------------------------------------- ayarlar
ROOT = Path(__file__).resolve().parent.parent
IMG_ROOT = ROOT / "public" / "images" / "products"
CSV_PATH = ROOT / "data" / "urun_gorsel_eslesme.csv"

SUPPLIERS = {
    "mexxsun": {
        "base": "https://www.mexxsun.com",
        "start": "https://www.mexxsun.com/tr",
        "fallback": "mexxsun",   # Comwize altyapısı — standart sitemap.xml yok
    },
    "enerjipazari": {
        "base": "https://www.enerjipazari.com.tr",
        "start": "https://www.enerjipazari.com.tr",
    },
}

# Mexxsun (Comwize) kategori sayfaları — sitemap yoksa buradan gezilir
MEXXSUN_CATEGORIES = [
    "tam-sinus-inverterler", "tam-sinus-ups-inverterler",
    "tam-sinus-akilli-inverterler", "modifiye-sinus-inverterler-756",
    "string-inverterler", "deye-hibrit-inverterler",
    "pwm-sarj-regulatorleri", "mppt-sarj-regulatorleri",
    "ac-dc-aku-sarj-cihazlari", "lityum-akuler", "jel-akuler-3037",
    "solar-sulama-suruculeri", "dc-pompalar", "monokristal-gunes-panelleri",
    "solar-kablolar-520", "solar-konnektorler-521",
    "on-grid-paketler", "off-grid-paketler", "solar-montaj-ekipmanlari",
]

# Gerçek tarayıcı başlıkları — bazı altyapılar bot imzalı istekleri engelliyor
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,"
              "image/webp,*/*;q=0.8",
    "Accept-Language": "tr,tr-TR;q=0.9,en;q=0.7",
}

# Ürün OLMADIĞI belli olan yol parçaları (sitemap gürültüsünü eler)
SKIP_PATH_WORDS = (
    "blog", "haber", "kategori", "category", "hakkimizda", "about", "iletisim",
    "contact", "kvkk", "gizlilik", "privacy", "iade", "mesafeli", "sss", "faq",
    "sepet", "cart", "uye", "login", "register", "account", "search", "etiket",
    "tag", "marka", "brand", "sayfa", "page",
)
# Görsel adında geçiyorsa atla (logo/ikon/banner gürültüsü)
SKIP_IMG_WORDS = ("logo", "favicon", "icon", "banner", "whatsapp", "payment",
                  "odeme", "kargo", "placeholder", "loading", "sprite")
MIN_IMG_BYTES = 5 * 1024          # 5 KB altı = ikon çöpü
MAX_GALLERY = 6                    # ürün başına en fazla görsel

EXT_BY_TYPE = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp",
               "image/gif": ".gif", "image/avif": ".avif"}


# ---------------------------------------------------------------- yardımcılar
def log(msg):
    print(msg, flush=True)


def fetch(session, url, binary=False, tries=3, timeout=25):
    """GET + basit yeniden deneme. Başarısızsa None döner."""
    for i in range(tries):
        try:
            r = session.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
            if r.status_code == 200:
                return r.content if binary else r.text
            if r.status_code in (301, 302, 404, 410):
                return None
            log(f"    ! HTTP {r.status_code}: {url} (deneme {i + 1}/{tries})")
        except requests.RequestException as e:
            log(f"    ! {type(e).__name__}: {url} (deneme {i + 1}/{tries})")
        time.sleep(1.5 * (i + 1))
    return None


def slugify(text):
    tr = str.maketrans("çğıöşüÇĞİÖŞÜ", "cgiosucgiosu")
    text = unquote(text).translate(tr).lower()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text[:80] or "urun"


def discover_sitemaps(session, base):
    """robots.txt + bilinen konumlardan sitemap URL'lerini bul."""
    found = []
    robots = fetch(session, base + "/robots.txt")
    if robots:
        found += re.findall(r"(?im)^sitemap:\s*(\S+)", robots)
    for guess in ("/sitemap.xml", "/sitemap_index.xml", "/sitemap-index.xml"):
        found.append(base + guess)
    seen, result = set(), []
    for u in found:
        if u not in seen:
            seen.add(u)
            result.append(u)
    return result


def parse_sitemap(session, url, depth=0):
    """sitemap veya sitemapindex'i çözüp sayfa URL listesi döndür."""
    if depth > 2:
        return []
    xml = fetch(session, url)
    if not xml:
        return []
    xml = re.sub(r'xmlns="[^"]+"', "", xml, count=1)  # ns'siz kolay parse
    try:
        root = ET.fromstring(xml.encode("utf-8"))
    except ET.ParseError:
        return []
    urls = []
    if root.tag.endswith("sitemapindex"):
        for loc in root.iter("loc"):
            urls += parse_sitemap(session, loc.text.strip(), depth + 1)
    else:
        urls = [loc.text.strip() for loc in root.iter("loc") if loc.text]
    return urls


def page_links(html, page_url, path_prefix):
    """Sayfadaki, yolu path_prefix ile başlayan mutlak linkleri döndür."""
    soup = BeautifulSoup(html, "html.parser")
    out = []
    for a in soup.find_all("a", href=True):
        u = urljoin(page_url, a["href"]).split("#")[0]
        clean = u.split("?")[0]
        if urlparse(clean).path.startswith(path_prefix):
            out.append(clean)
    return list(dict.fromkeys(out))


def crawl_mexxsun_category(session, base, cat_url, delay):
    """Bir kategori sayfasını sayfalama linklerini izleyerek gez, ürün linklerini topla."""
    products, todo, seen = [], [cat_url], set()
    cat_path = urlparse(cat_url).path
    while todo and len(seen) < 20:  # kategori başına en çok 20 sayfa
        u = todo.pop(0)
        if u in seen:
            continue
        seen.add(u)
        html = fetch(session, u)
        time.sleep(delay)
        if not html:
            continue
        products += [p for p in page_links(html, u, "/tr/urun/") if p not in products]
        # sayfalama: aynı kategori yoluna işaret eden page/sayfa parametreli linkler
        soup = BeautifulSoup(html, "html.parser")
        for a in soup.find_all("a", href=True):
            href = urljoin(u, a["href"])
            if cat_path in urlparse(href).path and re.search(r"(?:[?&](?:page|sayfa|p)=\d+|/(?:page|sayfa)/\d+)", href):
                if href not in seen and href not in todo:
                    todo.append(href)
    return products


def mexxsun_fallback(session, base, delay):
    """Mexxsun (Comwize) için sitemap yedeği:
    1) /tr/site-haritasi sayfasındaki /tr/urun/ linkleri
    2) olmazsa bilinen kategori sayfalarını (sayfalama dahil) gez"""
    log("  → Yedek 1: /tr/site-haritasi sayfası taranıyor…")
    html = fetch(session, base + "/tr/site-haritasi")
    if html:
        urls = page_links(html, base + "/tr/site-haritasi", "/tr/urun/")
        if urls:
            log(f"    site-haritasi'ndan {len(urls)} ürün linki bulundu.")
            return urls
        log("    site-haritasi ürün linki vermedi.")
    else:
        log("    site-haritasi sayfasına ulaşılamadı.")
    log(f"  → Yedek 2: {len(MEXXSUN_CATEGORIES)} kategori sayfası geziliyor…")
    found = []
    for slug in MEXXSUN_CATEGORIES:
        cat_url = f"{base}/tr/urunler/{slug}"
        got = [u for u in crawl_mexxsun_category(session, base, cat_url, delay) if u not in found]
        found += got
        log(f"    {slug}: {len(got)} ürün")
    return found


def looks_like_product(url):
    path = urlparse(url).path.lower()
    if not path or path == "/":
        return False
    return not any(w in path for w in SKIP_PATH_WORDS)


def extract_price(soup, html):
    # 1) JSON-LD Product
    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(tag.string or "")
        except (json.JSONDecodeError, TypeError):
            continue
        for obj in (data if isinstance(data, list) else [data]):
            if isinstance(obj, dict) and obj.get("@type") in ("Product", "product"):
                offers = obj.get("offers") or {}
                if isinstance(offers, list):
                    offers = offers[0] if offers else {}
                price = offers.get("price") or obj.get("price")
                if price:
                    return str(price)
    # 2) meta etiketleri
    for sel, attr in ((("meta", {"property": "product:price:amount"}), "content"),
                      (("meta", {"itemprop": "price"}), "content")):
        el = soup.find(*sel)
        if el and el.get(attr):
            return el[attr]
    # 3) kaba regex (₺ / TL)
    m = re.search(r"(\d{1,3}(?:[.\s]\d{3})*(?:,\d{2})?)\s*(?:₺|TL)", html)
    return m.group(1) if m else ""


def extract_images(soup, page_url):
    """og:image + galeri görsellerini (mutlak URL) sırayla döndür."""
    urls, seen = [], set()

    def push(u):
        if not u:
            return
        u = urljoin(page_url, u.split("?")[0])
        low = u.lower()
        if not low.startswith("http"):
            return
        if any(w in low for w in SKIP_IMG_WORDS):
            return
        if not re.search(r"\.(jpe?g|png|webp|gif|avif)$", low):
            return
        if u not in seen:
            seen.add(u)
            urls.append(u)

    og = soup.find("meta", property="og:image")
    if og:
        push(og.get("content"))
    gallery_sel = (".product-gallery img, .product-images img, .product-detail img, "
                   ".swiper-slide img, .owl-carousel img, .thumbnails img, "
                   "a[data-fancybox], a[data-lightbox], [itemprop=image], figure img")
    for el in soup.select(gallery_sel):
        push(el.get("href") or el.get("data-src") or el.get("data-large") or el.get("src"))
    return urls[:MAX_GALLERY]


def download_images(session, img_urls, out_dir, slug, force):
    """Görselleri indir; kaydedilen dosya adlarını döndür."""
    saved = []
    n = 0
    for img_url in img_urls:
        n_suffix = "" if n == 0 else f"-{n + 1}"
        # önce mevcut uzantılarla var mı bak (resume)
        if not force:
            existing = list(out_dir.glob(f"{slug}{n_suffix}.*"))
            if existing:
                saved.append(existing[0].name)
                n += 1
                continue
        data = fetch(session, img_url, binary=True)
        if not data or len(data) < MIN_IMG_BYTES:
            continue
        # uzantı: content sniff yerine URL'den, default .jpg
        m = re.search(r"\.(jpe?g|png|webp|gif|avif)$", img_url.lower())
        ext = "." + m.group(1).replace("jpeg", "jpg") if m else ".jpg"
        fname = f"{slug}{n_suffix}{ext}"
        (out_dir / fname).write_bytes(data)
        saved.append(fname)
        n += 1
    return saved


# ---------------------------------------------------------------- ana akış
def run(supplier_filter, limit, delay, force):
    session = requests.Session()
    CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    rows, stats = [], {}

    for sup, conf in SUPPLIERS.items():
        if supplier_filter and sup != supplier_filter:
            continue
        log(f"\n══════ {sup.upper()} ({conf['base']}) ══════")
        out_dir = IMG_ROOT / sup
        out_dir.mkdir(parents=True, exist_ok=True)
        st = stats[sup] = {"sitemap_url": 0, "urun": 0, "gorsel": 0, "hata": 0}

        # 1) sitemap → URL listesi
        all_urls = []
        for sm in discover_sitemaps(session, conf["base"]):
            got = parse_sitemap(session, sm)
            if got:
                log(f"  sitemap OK: {sm} → {len(got)} URL")
                all_urls += got
        if not all_urls and conf.get("fallback") == "mexxsun":
            log("  XML sitemap bulunamadı — yedek yönteme geçiliyor.")
            all_urls = mexxsun_fallback(session, conf["base"], delay)
        if not all_urls:
            log("  !! Ürün URL'si bulunamadı — site erişilemiyor olabilir (egress/403?).")
            st["hata"] += 1
            continue

        prod_urls = [u for u in dict.fromkeys(all_urls) if looks_like_product(u)]
        st["sitemap_url"] = len(prod_urls)
        if limit:
            prod_urls = prod_urls[:limit]
        log(f"  {len(prod_urls)} aday ürün URL'si işlenecek…")

        # 2) her ürün sayfası
        for i, url in enumerate(prod_urls, 1):
            html = fetch(session, url)
            time.sleep(delay)
            if not html:
                st["hata"] += 1
                continue
            soup = BeautifulSoup(html, "html.parser")

            imgs = extract_images(soup, url)
            if not imgs:
                continue  # görselsiz sayfa = büyük ihtimalle ürün değil

            name_el = soup.find("meta", property="og:title") or soup.find("h1")
            name = (name_el.get("content") if name_el and name_el.has_attr("content")
                    else name_el.get_text(strip=True) if name_el else "") or ""
            name = name.strip() or urlparse(url).path.rsplit("/", 1)[-1]
            slug = slugify(urlparse(url).path.rstrip("/").rsplit("/", 1)[-1] or name)
            price = extract_price(soup, html)

            saved = download_images(session, imgs, out_dir, slug, force)
            if saved:
                st["urun"] += 1
                st["gorsel"] += len(saved)
                rel = [f"public/images/products/{sup}/{f}" for f in saved]
                rows.append([sup, name, url, price, "|".join(rel)])
                log(f"  [{i}/{len(prod_urls)}] ✔ {name[:60]}  ({len(saved)} görsel)")
            else:
                st["hata"] += 1

    # 3) CSV yaz — bu çalıştırmada taranmayan tedarikçilerin satırlarını KORU
    if rows:
        ran = {r[0] for r in rows}
        keep = []
        if CSV_PATH.exists():
            with open(CSV_PATH, encoding="utf-8-sig") as f:
                rd = csv.reader(f, delimiter=";")
                next(rd, None)
                keep = [r for r in rd if r and r[0] not in ran]
        with open(CSV_PATH, "w", newline="", encoding="utf-8-sig") as f:
            w = csv.writer(f, delimiter=";")
            w.writerow(["tedarikci", "urun_adi", "url", "fiyat", "gorsel_dosyalari"])
            w.writerows(keep + rows)
        log(f"\nCSV yazıldı → {CSV_PATH.relative_to(ROOT)} ({len(rows)} satır)")

    # 4) özet
    log("\n──────── ÖZET ────────")
    toplam = 0
    for sup, st in stats.items():
        log(f"  {sup:14s} sitemap ürün URL: {st['sitemap_url']:4d} | "
            f"indirilen ürün: {st['urun']:4d} | görsel: {st['gorsel']:4d} | hata: {st['hata']}")
        toplam += st["gorsel"]
    log(f"  TOPLAM indirilen görsel: {toplam}")
    return toplam


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Tedarikçi ürün görsellerini topla")
    ap.add_argument("--supplier", choices=list(SUPPLIERS), help="tek tedarikçi çalıştır")
    ap.add_argument("--limit", type=int, default=0, help="tedarikçi başına en çok N ürün")
    ap.add_argument("--delay", type=float, default=0.6, help="istekler arası bekleme (sn)")
    ap.add_argument("--force", action="store_true", help="var olan görselleri yeniden indir")
    args = ap.parse_args()
    total = run(args.supplier, args.limit, args.delay, args.force)
    sys.exit(0 if total > 0 else 2)

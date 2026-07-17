#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Görsel işleme + katalog eşleştirme — GES MARKETİM
==================================================
1) public/images/products/{tedarikci}/ altındaki jpg/png görselleri
   1200px'e küçültüp WebP'ye çevirir, TEK düz klasörde toplar
   (public/images/products/ — K1: tedarikçi adı müşteri yolunda görünmez),
   orijinalleri siler.
2) data/urun_gorsel_eslesme.csv'deki tedarikçi ürünlerini assets/data.js
   kataloğuyla slug/ad + sayısal özellik (W/Ah/V/kW/Hp/A) benzerliğiyle
   eşleştirir, assets/img-map.js dosyasını üretir (GESM.imgmap).
3) CSV'deki yolları yeni WebP yollarıyla günceller.
4) Eşleşmeyen CSV ürünlerini ve görselsiz kalan katalog ürünlerini raporlar.

Kullanım: python3 tools/gorselleri_isle.py [--dry-run]
Gereksinim: pip install pillow  · katalog dökümü için node PATH'te olmalı.
"""
import csv
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMG_ROOT = ROOT / "public" / "images" / "products"
CSV_PATH = ROOT / "data" / "urun_gorsel_eslesme.csv"
MAP_PATH = ROOT / "assets" / "img-map.js"
MAX_PX = 1200
WEBP_Q = 82

# ---------------------------------------------------------------- 0) katalog
def load_catalog():
    js = ("global.window=global;"
          f"require('{ROOT}/assets/config.js');require('{ROOT}/assets/data.js');"
          "console.log(JSON.stringify(global.GESM.data.products.map(p=>("
          "{id:p.id,name:p.name,brand:p.brand,cat:p.cat,supplier:p.supplier,"
          "hasImg:!!p.img,specs:p.specs||{}}))))")
    out = subprocess.check_output(["node", "-e", js], text=True)
    return json.loads(out)

# ---------------------------------------------------------------- 1) webp
def to_webp_flat(dry=False):
    """Alt klasörlerdeki görselleri 1200px WebP olarak düz klasöre taşı."""
    mapping = {}  # eski göreli yol -> yeni göreli yol
    files = sorted(p for p in IMG_ROOT.rglob("*")
                   if p.is_file() and p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp"))
    for src in files:
        rel_old = src.relative_to(ROOT).as_posix()
        stem = src.stem
        dst = IMG_ROOT / f"{stem}.webp"
        n = 2
        while dst.exists() and dst.resolve() != src.resolve():
            dst = IMG_ROOT / f"{stem}-x{n}.webp"   # tedarikçiler arası ad çakışması
            n += 1
        if not dry:
            try:
                im = Image.open(src)
                im = im.convert("RGB") if im.mode not in ("RGB", "RGBA") else im
                im.thumbnail((MAX_PX, MAX_PX), Image.LANCZOS)
                im.save(dst, "WEBP", quality=WEBP_Q, method=6)
            except Exception as e:
                print(f"  ! dönüştürülemedi: {rel_old} ({e})")
                continue
            if src.resolve() != dst.resolve():
                src.unlink()
        mapping[rel_old] = dst.relative_to(ROOT).as_posix()
    if not dry:
        for d in IMG_ROOT.iterdir():          # boşalan tedarikçi klasörlerini sil
            if d.is_dir():
                shutil.rmtree(d) if not any(d.iterdir()) else None
    return mapping

# ---------------------------------------------------------------- 2) eşleştirme
TR = str.maketrans("çğıöşüÇĞİÖŞÜ", "cgiosucgiosu")
STOP = {"gunes", "paneli", "panel", "solar", "aku", "akü", "lityum", "inverter",
        "invertor", "sarj", "kontrol", "cihazi", "regulator", "half", "cut",
        "monokristal", "sinif", "the", "ve", "ile", "w", "watt", "v", "volt",
        "ah", "kw", "hp", "a"}

def norm(s):
    return re.sub(r"[^a-z0-9 ]+", " ", str(s).translate(TR).lower()).strip()

def numfeat(s):
    """Metindeki sayı+birim özelliklerini {(değer,birim)} kümesi olarak çıkar."""
    s = norm(s).replace(",", ".")
    feats = set()
    for val, unit in re.findall(r"(\d+(?:\.\d+)?)\s*(wp|watt|w|kw|ah|amper|hp|volt|v|a)\b", s):
        u = {"wp": "w", "watt": "w", "volt": "v", "amper": "a"}.get(unit, unit)
        feats.add((float(val), u))
    return feats

def tokens(s):
    return {t for t in norm(s).split() if len(t) > 2 and t not in STOP and not t.isdigit()}

# El ile doğrulanmış eşleşmeler: katalog id -> CSV url slug'ı (tam ad).
# Otomatik eşleştiricinin hatalı/eksik bıraktığı, gözle kontrol edilmiş atamalar.
FORCE = {
    # --- Enerji Pazarı (gözle doğrulandı) ---
    "eq-mc4": "mc4-konnektor-1500v",
    "eq-kablo6": "6mm-solar-kablo",
    "inv-1kw": "1kw-mppt-akilli-inverter-12v",            # Lexron
    "inv-1-6kw": "1-6kw-mppt-12v-akilli-inverter",        # Lexron
    "inv-3kw": "3kw-hv-mppt-akilli-inverter-sorotec",     # Sorotec 3,5kW
    "inv-6-2kw": "6-2kw-mppt-paralel-90-500v-pv-input-100a-mppt-inverter-parallenebilir",  # Lexron
    "reg-pwm20": "20a-pwm-sarj-kontrol-cihazi",
    "reg-pwm30": "30a-pwm-sarj-kontrol-cihazi",
    "reg-mppt20": "20a-mppt-sarj-kontrol-cihazi",
    "reg-mppt30": "30a-mppt-sarj-kontrol-cihazi",         # Lexron
    "pkt1": "monokristalli-mini-buzdolabi-paketi-paket-1",
    "pkt2": "monokristalli-kucuk-ev-paketi-paket-2-kopya",
    "pkt3": "monokristalli-bag-evi-paketi-paket-3",
    "pkt4": "monokristalli-bag-evi-paketi-paket-4",
    "pkt5": "monokristalli-bag-evi-paketi-paket-5",
    "pkt6": "monokristalli-bag-evi-paketi-paket-6",
    "pkt10": "klimali-buyuk-ev-paketi-paket-10",
    "pkt11": "trifaze-enerji-depolamali-on-grid-sistem-2",
    "pkt12": "trifaze-enerji-depolamali-on-grid-sistem-3",
    "pkt13": "trifaze-enerji-depolamali-on-grid-sistem-4",
    "pkt14": "trifaze-enerji-depolamali-on-grid-sistem-5",
    # --- Mexxsun (gözle doğrulandı: mexxSUN/Sako markalı gerçek ürünler) ---
    "pnl-245": "gse245-gazioglu-halfcut-monopower-fotovoltaik-gunes-paneli-a-class",
    "aku-100-12": "mexxsun-lityum-aku-12-8v-100ah-lifepo4-1280wh-3120",
    "aku-100-24": "mexxsun-lityum-aku-25-6v-100ah-lifepo4-2560wh-3154",
    "aku-51-wpu": "mexxsun-lityum-aku-48v-100ah-lifepo4-3074",
    "inv-4-2kw": "sunon-eco-4-2kw-tam-sinus-akilli-24v-4200w-2003",  # Sako
    "inv-max8": "sunon-iv-8kw-48v-450vdc",                            # Sako
    "inv-11kw": "mexx-p12kw-premium-48v-12kw-paralel-wi-fi-dual-output",
    "inv-deye-10m": "deye-10kw-monofaze-910",
    "inv-deye-12": "deye-12-kw-hibrit-trifaze-lv-48v-05",
    "inv-deye-100": "deye-100kw-trifaze-sun-100k-g",
    "inv-ongrid-25": "deye-25kw-trifaze",
    "reg-pwm10": "pwm-12-24v-at10-604",
    "reg-mpk8-60": "mpk8-60a-mppt-12-24-48v",
    "reg-pc18f-80": "mpk8-80a-mppt-12-24-48v",
    "reg-mpk8-100": "mpk8-100a-mppt-12-24-48v-3110",
    "pmp-2-3hp": "2hp-3hp-1-5kw-2-2-kw-solar-pompa-surucusu-3x220",
    "pmp-3hp": "3hp-2-2-kw-solar-pompa-surucusu-trifaze-893",
    "pmp-10hp": "10hp-7-5-kw-solar-pompa-surucusu-1000vdc",
    "pmp-15hp": "15hp-11-kw-1000vdc-solar-pompa-surucusu",
    "pmp-20hp": "20hp-15-kw-solar-pompa-surucusu-trifaze-899",
    "pmp-25hp": "25hp-18-5-kw-1000vdc-solar-pompa-surucusu",
    "pmp-30hp": "30hp-22-kw-solar-pompa-surucusu-trifaze-901",
    "pmp-40hp": "40hp-30-kw-solar-pompa-surucusu-trifaze-3156",
    "pmp-100hp": "100hp-75-kw-solar-pompa-surucusu-trifaze-905",
    "pmp-120hp": "120hp-90-kw-solar-pompa-surucusu-trifaze-906",
}
# Otomatik eşleştiricinin yanlış eşlediği, doğru adayı olmayan ürünler.
BLOCK = {"inv-deye-10t", "reg-pc18f-100", "pkt7", "pkt8", "pkt9"}


def match(catalog, csv_rows):
    """katalog ürünü -> en iyi CSV satırı (FORCE/BLOCK + skor eşiği)."""
    result, used = {}, {}
    slug_of = [r["url"].rstrip("/").rsplit("/", 1)[-1] for r in csv_rows]
    for pid, slug in FORCE.items():
        for i, s in enumerate(slug_of):
            if s == slug:
                result[pid] = i
                used[i] = (pid, 99.0)
                break
        else:
            print(f"   ! FORCE bulunamadı: {pid} -> {slug}")
    for p in catalog:
        if p["id"] in FORCE or p["id"] in BLOCK:
            continue
        if p.get("hasImg"):
            continue  # data.js'te açık img alanı var — otomatik eşleşme onu ezmesin
        ptext = p["name"] + " " + " ".join(f"{k} {v}" for k, v in p["specs"].items())
        pf, pt = numfeat(ptext), tokens(p["name"] + " " + p["brand"])
        best, best_score = None, 0.0
        for i, row in enumerate(csv_rows):
            if i in used and used[i][1] >= 99.0:
                continue  # FORCE ile rezerve edilmiş satır
            rtext = row["urun_adi"] + " " + row["url"].rsplit("/", 1)[-1]
            rf, rt = numfeat(rtext), tokens(rtext)
            shared_nums = pf & rf
            # kilit sayı koşulu: katalogda W/Ah/kW/Hp varsa adayda da aynı sayı olmalı
            key_units = {u for _, u in pf if u in ("w", "ah", "kw", "hp")}
            if key_units and not any(u in ("w", "ah", "kw", "hp") for _, u in shared_nums):
                continue
            score = len(shared_nums) * 3.0 + len(pt & rt) * 1.0
            if norm(p["brand"]) in norm(rtext):
                score += 2.0
            if row.get("tedarikci") == p.get("supplier"):
                score += 2.0  # kendi tedarikçisinin görseli tercih edilir
            if score > best_score:
                best, best_score = i, score
        if best is not None and best_score >= 4.0:
            # aynı CSV satırını daha yüksek skorlu ürün kazanır
            if best in used and used[best][1] >= best_score:
                continue
            if best in used:
                result.pop(used[best][0], None)
            used[best] = (p["id"], best_score)
            result[p["id"]] = best
    return result

# ---------------------------------------------------------------- ana akış
def main(dry=False):
    catalog = load_catalog()
    with open(CSV_PATH, encoding="utf-8-sig") as f:
        csv_rows = list(csv.DictReader(f, delimiter=";"))
    print(f"katalog: {len(catalog)} ürün · CSV: {len(csv_rows)} tedarikçi ürünü")

    print("1) Görseller WebP'ye çevriliyor (1200px, düz klasör)…")
    path_map = to_webp_flat(dry)
    print(f"   {len(path_map)} görsel işlendi → public/images/products/*.webp")

    # CSV yollarını güncelle
    for row in csv_rows:
        files = [f for f in (row["gorsel_dosyalari"] or "").split("|") if f]
        row["gorsel_dosyalari"] = "|".join(path_map.get(f, f) for f in files)
    if not dry:
        with open(CSV_PATH, "w", newline="", encoding="utf-8-sig") as f:
            w = csv.DictWriter(f, fieldnames=list(csv_rows[0].keys()), delimiter=";")
            w.writeheader()
            w.writerows(csv_rows)

    print("2) Katalog ⇄ CSV eşleştirmesi…")
    m = match(catalog, csv_rows)

    imgmap = {}
    for pid, ri in sorted(m.items()):
        files = [f for f in csv_rows[ri]["gorsel_dosyalari"].split("|") if f]
        if files:
            imgmap[pid] = files
    if not dry:
        MAP_PATH.write_text(
            "/* ÜRETİLMİŞ DOSYA — tools/gorselleri_isle.py yazar; elle düzenleme.\n"
            "   Katalog ürünü id → gerçek ürün görselleri (public/images/products/). */\n"
            "window.GESM = window.GESM || {};\n"
            "GESM.imgmap = " + json.dumps(imgmap, ensure_ascii=False, indent=1) + ";\n",
            encoding="utf-8")
        print(f"   assets/img-map.js yazıldı ({len(imgmap)} ürün eşleşti)")

    # ---- rapor
    by_id = {p["id"]: p for p in catalog}
    matched_rows = set(m.values())
    print("\n──────── RAPOR ────────")
    nomatch_cat = [p for p in catalog if p["id"] not in imgmap and not p.get("hasImg")]
    print(f"\nA) Görselsiz kalan katalog ürünleri ({len(nomatch_cat)}) — data.js'te açık img'si olanlar hariç:")
    for p in nomatch_cat:
        print(f"   - [{p['id']}] {p['name']}")
    nomatch_csv = [r for i, r in enumerate(csv_rows) if i not in matched_rows]
    print(f"\nB) Katalogla eşleşmeyen tedarikçi ürünleri ({len(nomatch_csv)}):")
    for r in nomatch_csv:
        print(f"   - ({r['tedarikci']}) {r['urun_adi'][:70]}")
    print(f"\nC) Eşleşen: {len(imgmap)} katalog ürünü")
    for pid, ri in sorted(m.items()):
        print(f"   ✔ [{pid}] {by_id[pid]['name'][:48]:50s} ⇐ {csv_rows[ri]['urun_adi'][:50]}")

if __name__ == "__main__":
    main(dry="--dry-run" in sys.argv)

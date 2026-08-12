#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Lexron ürün görsellerini yer tutucudaki ürünlere yerleştirir.

Kullanım:
    python3 tools/gorsel_yerlestir.py <görsel-klasörü> [--uygula]

Akış (K7 kuralına uygun — görsel eşleştirme yalnız AYNI MARKA içinde;
bu araç yalnız Lexron kataloğu + Lexron görsel seti ile çalışır):
  1. data/catalog.json'dan YER TUTUCUDA kalan ürünler (img boş) listelenir.
  2. Klasördeki her dosya ürün adlarıyla BULANIK eşleştirilir:
     sayı+birim çiftleri (AH/V/W/KW/HP/A) birebir örtüşmeli, tip anahtar
     kelimeleri (jel/agm/lityum, pwm/mppt, panel/inverter/pompa...)
     çelişmemeli. Skor eşiğin altındaysa dosya ATLANIR — yanlış görsel
     bağlanmaz, ürün yer tutucuda kalır.
  3. Eşleşen görsel optimize edilir: WebP, maks 800px genişlik, ~150KB altı;
     dosya adı = ürün slug'ı; public/images/products/ altına yazılır.
  4. ZORUNLU RAPOR: eşleşen dosya→ürün, eşleşmeyen dosyalar, hâlâ yer
     tutucuda kalan ürünler.

--uygula verilmezse DRY-RUN: hiçbir dosya yazılmaz, yalnız rapor basılır.
Sonrasında: npm run build && commit (catalog.json görselleri otomatik bağlar).
"""
import json, os, re, sys, io

TR = str.maketrans("ÇĞIİÖŞÜçğıiöşü", "cgiiosucgiiosu")

def fold(s):
    s = s.translate(TR).lower().replace("²", "2").replace("×", "x").replace("–", "-").replace("~", "-")
    s = re.sub(r"(\d)(kw)(?=[a-gi-z])", r"\1\2 ", s)
    return s

def slugify(s):
    s = fold(s)
    return re.sub(r"-{2,}", "-", re.sub(r"[^a-z0-9]+", "-", s).strip("-"))

def nums(s):
    s = fold(s).replace(",", ".")
    out = set()
    for m in re.finditer(r"(\d+(?:\.\d+)?)\s*(kwh|kva|kw|w|ah|hp|v|a|mm2)(?![a-z0-9])", s):
        v = m.group(1)
        v = v.rstrip("0").rstrip(".") if "." in v else v
        out.add(v + m.group(2))
    return out

ANTA = [("pwm", "mppt"), ("monofaze", "trifaze"), ("jel", "agm"), ("jel", "lityum"),
        ("agm", "lityum"), ("polikristal", "monokristal"), ("modifiye", "tam"),
        ("hv", "lv"), ("aydinlatma", "projektor"), ("panel", "inverter"),
        ("panel", "batarya"), ("inverter", "batarya"), ("kablo", "konnektor")]

def toks(s):
    return set(re.findall(r"[a-z0-9]+", fold(s)
        .replace("polykristal", "polikristal").replace("lifepo4", "lityum")
        .replace("inverteri", "inverter").replace("aku", "batarya")))

def conflict(a, b):
    return any((x in a and y in b) or (y in a and x in b) for x, y in ANTA)

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    apply_mode = "--uygula" in sys.argv
    if not args:
        print(__doc__); sys.exit(1)
    src_dir = args[0]
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    catalog = json.load(open(os.path.join(root, "data", "catalog.json"), encoding="utf-8"))
    out_dir = os.path.join(root, "public", "images", "products")

    placeholders = [p for p in catalog["products"] if not p["img"]]
    print("=== 1) YER TUTUCUDAKİ ÜRÜNLER (%d) ===" % len(placeholders))
    for p in placeholders:
        print("  %-62s %s" % (p["id"], p["name"][:48]))

    exts = (".jpg", ".jpeg", ".png", ".webp", ".jfif", ".bmp")
    files = sorted(f for f in os.listdir(src_dir) if f.lower().endswith(exts))
    print("\n=== 2) EŞLEŞTİRME (%d dosya) ===" % len(files))

    # aday skorları: sayı-birim örtüşmesi ZORUNLU (iki taraf da sayı içeriyorsa)
    cands = []
    for f in files:
        base = os.path.splitext(f)[0]
        fn, ft = nums(base), toks(base)
        for p in placeholders:
            pn, pt = nums(p["name"]), toks(p["name"])
            if fn or pn:
                if not fn or not pn:  # tek tarafta sayı yoksa güvensiz
                    continue
                if not (fn <= pn or pn <= fn) or not (fn & pn):
                    continue
            if conflict(ft, pt):
                continue
            score = len(ft & pt) / max(len(ft | pt), 1) + (0.15 if fn == pn else 0)
            cands.append((score, f, p["id"], p["name"]))
    cands.sort(key=lambda c: -c[0])

    MIN_SCORE = 0.30  # altı = emin değiliz → atla (yanlış görsel bağlama)
    usedF, usedP, matches = set(), set(), []
    for score, f, pid, name in cands:
        if f in usedF or pid in usedP:
            continue
        if score < MIN_SCORE:
            continue
        usedF.add(f); usedP.add(pid)
        matches.append((score, f, pid, name))

    for score, f, pid, name in sorted(matches, key=lambda m: -m[0]):
        print("  %.2f  %-40s → %s" % (score, f[:40], name[:50]))

    if apply_mode and matches:
        from PIL import Image
        os.makedirs(out_dir, exist_ok=True)
        print("\n=== 3) OPTİMİZASYON (WebP, maks 800px, ~150KB) ===")
        for score, f, pid, name in matches:
            im = Image.open(os.path.join(src_dir, f))
            if im.mode in ("RGBA", "P", "LA"):
                bg = Image.new("RGB", im.size, (255, 255, 255))
                bg.paste(im.convert("RGBA"), mask=im.convert("RGBA").split()[-1])
                im = bg
            else:
                im = im.convert("RGB")
            if im.width > 800:
                im = im.resize((800, round(im.height * 800 / im.width)), Image.LANCZOS)
            out_path = os.path.join(out_dir, pid + ".webp")
            for q in (82, 72, 62, 50, 40):  # 150KB altına inene dek kaliteyi düşür
                buf = io.BytesIO()
                im.save(buf, "WEBP", quality=q, method=6)
                if buf.tell() <= 150 * 1024 or q == 40:
                    open(out_path, "wb").write(buf.getvalue())
                    print("  %-62s %3dKB (q%d)" % (pid + ".webp", buf.tell() // 1024, q))
                    break

    print("\n=== 4) RAPOR ===")
    print("Eşleşen: %d / %d dosya%s" % (len(matches), len(files), "" if apply_mode else " (DRY-RUN — --uygula ile yaz)"))
    unmatched = [f for f in files if f not in usedF]
    print("\nEşleşmeyen zip dosyaları (%d):" % len(unmatched))
    for f in unmatched:
        print("  ?", f)
    left = [p for p in placeholders if p["id"] not in usedP]
    print("\nHâlâ yer tutucuda kalacak ürünler (%d):" % len(left))
    for p in left:
        print("  -", p["name"])
    if apply_mode:
        print("\nSon adım: npm run build  (catalog.json görselleri slug'dan otomatik bağlar) + commit")

if __name__ == "__main__":
    main()

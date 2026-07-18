#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tam envanter genişletme — CSV'deki kullanılmayan tedarikçi ürünlerini
sınıflandırıp assets/data.js'e EXTRA bloğu olarak ekler.
Kurallar: kategori sınıflandırma slug'dan; mükerrer imza (kategori+tip+
güç/kapasite/faz) katalogla ve kendi içinde elenir; EP satırları fiyatlı
(×1,2 marj), Mexxsun satırları fiyatsız (Teklif Al / onRequest).
Kullanım: python3 tools/envanter_genislet.py [--emit]
"""
import csv, json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EMIT = "--emit" in sys.argv

# ---------- yardımcılar ----------
W = {  # slug kelimesi -> Türkçe başlık kelimesi
 "gunes":"Güneş","paneli":"Paneli","panel":"Panel","solar":"Solar","aku":"Akü",
 "sarj":"Şarj","cihazi":"Cihazı","kontrol":"Kontrol","surucusu":"Sürücüsü",
 "surucu":"Sürücü","dalgic":"Dalgıç","pompa":"Pompa","yuzey":"Yüzey",
 "sinus":"Sinüs","tam":"Tam","modifiye":"Modifiye","akilli":"Akıllı",
 "inverter":"İnverter","inverteri":"İnverteri","monofaze":"Monofaze","monofaz":"Monofaze",
 "trifaze":"Trifaze","trifaz":"Trifaze","hibrit":"Hibrit","on":"On","grid":"Grid",
 "off":"Off","kirmizi":"Kırmızı","siyah":"Siyah","sigorta":"Sigorta","yuvasi":"Yuvası",
 "tutucu":"Tutucu","sonlandirici":"Sonlandırıcı","kancasi":"Kancası","kiremit":"Kiremit",
 "hareketli":"Hareketli","vidasi":"Vidası","cati":"Çatı","uclu":"Uçlu","sivri":"Sivri",
 "profil":"Profil","asik":"Aşık","tipi":"Tipi","takimi":"Takımı","kose":"Köşe",
 "orta":"Orta","buat":"Buat","karavan":"Karavan","montaj":"Montaj","kablo":"Kablo",
 "twin":"Twin","konnektor":"Konnektör","paralel":"Paralel","kablolu":"Kablolu",
 "set":"Set","adet":"Adet","enerji":"Enerji","depolamali":"Depolamalı","sistem":"Sistem",
 "sistemi":"Sistemi","tarimsal":"Tarımsal","sulama":"Sulama","lityum":"Lityum",
 "batarya":"Batarya","premium":"Premium","serisi":"Serisi","duvar":"Duvar",
 "yuksek":"Yüksek","voltaj":"Voltaj","monokristal":"Monokristal","polikristal":"Polikristal",
 "polykristal":"Polikristal","esnek":"Esnek","topcon":"TopCon","half":"Half","cut":"Cut",
 "bifacial":"Bifacial","cell":"Cell","aydinlatma":"Aydınlatma","projektor":"Projektör",
 "tasinabilir":"Taşınabilir","guc":"Güç","istasyonu":"İstasyonu","monoblok":"Monoblok",
 "isi":"Isı","pompasi":"Pompası","jel":"Jel","nano":"Nano","karbon":"Karbon",
 "uzaktan":"Uzaktan","remote":"Remote","ekran":"Ekran","logger":"Logger",
 "optimizer":"Optimizer","concentrator":"Concentrator","meter":"Meter","kit":"Kit",
 "wifi":"Wi-Fi","gprs":"GPRS","impeller":"Impeller","ss":"SS","hv":"HV","lv":"LV",
 "mppt":"MPPT","pwm":"PWM","ups":"UPS","dc":"DC","ac":"AC","input":"Input","pv":"PV",
 "yeni":"Yeni","nesil":"Nesil","klimali":"Klimalı","paket":"Paket","mini":"Mini",
 "buzdolabi":"Buzdolabı","agm":"AGM",
}
BRANDS = {"deye":"Deye","auxsol":"Auxsol","lexron":"Lexron","mexxsun":"Mexxun",
          "mexx":"Mexxun","sunon":"Sako","sorotec":"Sorotec","orbus":"Orbus",
          "pantec":"Pantec","ecosol":"Ecosol","lg":"LG","eastron":"Eastron",
          "tsm210":"GESM Power","gazioglu":"Gazioğlu"}
JUNK = re.compile(r"^(kopya|p|ts|n|ad|adt|g\d+|bm\d+|eu|ip\d+|sun|\d{3,4}|_+|1)$")

def tokens(slug):
    return [t for t in slug.replace("_", "-").split("-") if t]

def titleize(slug):
    ts = tokens(slug)
    while ts and JUNK.match(ts[-1]):
        ts.pop()
    # ondalık birleşimi: "5","5hp" -> "5.5hp" · "51","2v" -> "51.2v"
    merged = []
    i = 0
    while i < len(ts):
        nxt = ts[i + 1] if i + 1 < len(ts) else ""
        mfrac = re.fullmatch(r"(\d+)(w|kw|v|a|ah|mm|va|kva|hp|kwh|m)", nxt)
        if ts[i].isdigit() and mfrac and len(mfrac.group(1)) <= 2:
            merged.append(ts[i] + "." + nxt); i += 2
        elif ts[i].isdigit() and nxt in ("w","kw","v","a","ah","mm","va","kva","hp","kwh","m"):
            merged.append(ts[i] + nxt); i += 2
        else:
            merged.append(ts[i]); i += 1
    ts = merged
    out = []
    for t in ts:
        if t in BRANDS: out.append(BRANDS[t]); continue
        if t in W: out.append(W[t]); continue
        m = re.fullmatch(r"(\d+(?:[.,]\d+)?)(w|kw|v|a|ah|mm|va|kva|hp|kwh|m)", t)
        if m:
            n = m.group(1).replace(".", ",")
            u = {"w":" W","kw":" kW","v":"V","a":"A","ah":" Ah","mm":" mm",
                 "va":" VA","kva":" kVA","hp":" Hp","kwh":" kWh","m":" m"}[m.group(2)]
            out.append(n + u); continue
        out.append(t.upper() if len(t) <= 4 and not t.isdigit() else t.capitalize())
    name = re.sub(r"\s+", " ", " ".join(out)).strip()
    name = name.replace("On Grid", "On-Grid").replace("Off Grid", "Off-Grid").replace("AC DC", "AC-DC")
    name = re.sub(r"^(Tam|Modifiye) Sinüs (\d+V) ([\d,]+ W)$", r"\1 Sinüs İnverter \2 \3", name)
    name = re.sub(r"(\d+(?:,\d+)? Hp) (\d+(?:,\d+)? kW)", r"\1 (\2)", name)
    # markayı başa taşı
    for b in ("Lexron", "Sorotec", "Deye", "Sako", "Pantec", "Orbus", "Mexxun", "LG"):
        if (" " + b) in name and not name.startswith(b):
            name = b + " " + name.replace(" " + b, "", 1).strip()
    return name

def num(slug, unit):
    s = slug.replace("-", " ")
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*" + unit + r"\b", s)
    return m.group(1).replace(",", ".") if m else None

def classify(slug):
    s = slug
    if "isi-pompasi" in s: return "aksesuar"
    if any(k in s for k in ("aydinlatma","projektor","guc-istasyonu")): return "aksesuar"
    if any(k in s for k in ("logger","optimizer","eastron","gprs-kit","uzaktan-kontrol")): return "solar-ekipmanlar"
    if any(k in s for k in ("kablo","konnektor","sigorta","branch","tutucu","sonlandirici","profil","kanca","vida","montaj","buat")): return "solar-ekipmanlar"
    if "jel-aku" in s or "agm-aku" in s: return "jel-akuler"
    if any(k in s for k in ("lityum","lifepo4","batarya")): return "lityum-akuler"
    if any(k in s for k in ("pompa","sulama")): return "tarimsal-sulama"
    if "panel" in s: return "gunes-panelleri"
    if any(k in s for k in ("pwm","mppt-sarj","ac-dc-aku-sarj","mpj","mpk")): return "sarj-regulatorleri"
    if "hibrit-sistem" in s or "depolamali" in s or "paket-sistem" in s or "paketi-paket" in s: return "solar-paketler"
    if "hibrit" in s: return "hibrit-inverterler"
    if "on-grid" in s or re.search(r"(deye|auxsol)-[\d.]+-?kw-(monofaze|trifaz)", s) or "string" in s: return "sebeke-inverterleri"
    if any(k in s for k in ("sinus","akilli","sunon","mexx-p","kva")): return "akilli-inverterler"
    return None

def signature(cat, slug):
    """mükerrer eleme imzası"""
    kw = num(slug, "kw"); w = num(slug, "w"); ah = num(slug, "ah"); hp = num(slug, "hp")
    a = num(slug, "a"); v = num(slug, "v"); mm = num(slug, "mm"); kwh = num(slug, "kwh")
    faz = "tri" if ("trifaz" in slug) else ("mono" if "monofaz" in slug else "")
    if cat in ("hibrit-inverterler", "sebeke-inverterleri"):
        return f"{cat}|{kw}|{faz}"
    if cat == "akilli-inverterler":
        tip = "ups" if "ups" in slug else ("mod" if "modifiye" in slug else ("akl" if ("akilli" in slug or "mppt" in slug or "sunon" in slug or "mexx-p" in slug or "kva" in slug) else "tam"))
        return f"{cat}|{tip}|{kw or w}|{v}"
    if cat == "sarj-regulatorleri":
        tip = "acdc" if "ac-dc" in slug else ("pwm" if ("pwm" in slug or "cm3" in slug) else "mppt")
        aa = a or re.search(r"(?:mpj|mpk\d*-)(\d+)", slug) and re.search(r"(?:mpj|mpk\d*-?)(\d+)", slug).group(1)
        hv = "hv" if "hv" in slug else ""
        return f"{cat}|{tip}|{aa}|{v}|{hv}"
    if cat == "lityum-akuler":
        return f"{cat}|{ah}|{v or kwh}"
    if cat == "jel-akuler":
        tip = "agm" if "agm" in slug else "jel"
        return f"{cat}|{tip}|{ah}"
    if cat == "tarimsal-sulama":
        tip = "dcpompa" if "dc-pompa" in slug or "yuzey-pompa" in slug else ("sistem" if "sistemi" in slug else ("kumanda" if "uzaktan" in slug else "surucu"))
        var = ("yuzey" if "yuzey" in slug else "") + ("ss" if "-ss-" in slug else "")
        return f"{cat}|{tip}|{hp}|{w if tip=='dcpompa' else ''}|{var}"
    if cat == "gunes-panelleri":
        tip = "esnek" if "esnek" in slug else "std"
        return f"{cat}|{tip}|{w}"
    if cat == "solar-ekipmanlar":
        return f"{cat}|{slug}"  # ekipman çeşitliliği yüksek — slug bazlı
    return f"{cat}|{slug}"

def parse_price(row):
    if row["tedarikci"] != "enerjipazari": return None  # mexxsun fiyatları hatalı çekildi
    try: v = float(row["fiyat"].replace(",", "."))
    except ValueError: return None
    if v < 100: return None
    return round(v * 1.2 / 10) * 10

def brand_of(slug, sup):
    for k, b in BRANDS.items():
        if k in tokens(slug): return b
    if "sunon" in slug: return "Sako"
    if "sorotec" in slug: return "Sorotec"
    return "Mexxun" if sup == "mexxsun" else "GESM Power"

# elle atlananlar: bariz mükerrer / bozuk satırlar
SKIP = {
 "450w-bifacial-78-cell-16bb-half-cut-topcon-gunes-paneli-kopya",  # yarı fiyatlı şüpheli kopya
 "mexxsun-lityum-aku-25-6v-100ah-rk2560",     # 25,6V 100Ah zaten katalogda
 "100ah-12-8v-lifepo4-batarya", "100ah-25-6v-lifepo4-batarya",
 "100ah-48v-lifepo4-batarya", "100ah-51-2v-lifepo4-batarya",
 "100ah-51-2v-premium-serisi-duvar-tipi-lityum-batarya",  # aynı kapasite sınıfı katalogda
 "314ah-51-2v-premium-serisi-lityum-batarya-1",           # -1 kopyası
 "50kw-hibrit-trifaze-inverter-hv-kopya",
 "205w-monokristal-pantec-panel-3158",
 "panel-sonlandirici-35mm-50-ad-3137",
 "solar-konnektor-set-30a-1000v-50-adt-3052",
 "200w-solar-projektor-1",
 "295w-polikristal-gunes-paneli",  # görsel dosyası 285W satırıyla karışık
 "25w-solar-panel",                 # 25W panel katalogda
 "solar-kablo-6mm-siyah", "solar-kablo-6mm-kirmizi",      # 6mm kablo katalogda
 "solar-kablo-4mm-siyah-100m", "solar-kablo-4mm-kirmizi-50m",  # 4mm katalogda
 "solar-konnektor-2-in-1-paralel-10-adet-779",  # T-Branch katalogda
 "solar-konnektor-3-in-1-kablolu-paralel",      # 3'lü Branch katalogda
 "1000va-mppt-12v-akilli-inverter",             # 1 kW akıllı katalogda
 "4-2kw-mppt-90-500v-pv-input-inverter",        # 4,2 kW akıllı katalogda
 "8kw-hv-mppt-akilli-inverter-48v",             # 8 kW akıllı katalogda
 "10a-pwm-sarj-kontrol-cihazi",                 # AT10 10A katalogda
 "80a-mppt-sarj-kontrol-cihazi",                # MPK8 80A katalogda
 "mpj30-12-24v",                                # 30A MPPT katalogda
 "10kw-hibrit-monofaze-inverter-lv",            # katalogda (Deye 10 kW mono)
 "12kw-hibrit-trifaze-inverter",                # katalogda (Deye 12 kW tri)
 "100kw-on-grid-trifaze-inverter",              # katalogda
 "25kw-on-grid-trifaze-inverter-1",             # katalogda
 "eve-61-44kwh-lifepo4-hv-yuksek-voltaj-batarya-sistemi-kopya",  # kopya etiketi ama tek — yine de üst segment; ekle? -> atla değil
}
SKIP.discard("eve-61-44kwh-lifepo4-hv-yuksek-voltaj-batarya-sistemi-kopya")

# özel ad düzeltmeleri
NAME_FIX = {
 "tsm210-210w-12v-monokristal-solar-panel": "TSM210 210 W 12V Monokristal Güneş Paneli",
 "sunon-e-tam-sinus-akilli-24v-2-4kw-450-500vdc": "Sako Sunon-E 2,4 kW Tam Sinüs Akıllı İnverter 24V (450–500 VDC)",
 "deye-6kw-tam-sinus-akilli-off-grid-48v-ip651": "Deye 6 kW Tam Sinüs Akıllı Off-Grid İnverter 48V (IP65)",
 "mexx-p4kw-premium-24v-4kw": "Mexxun P4KW Premium 4 kW Akıllı İnverter 24V",
 "mexx-p6kw-premium-48v-6kw": "Mexxun P6KW Premium 6 kW Akıllı İnverter 48V",
 "pwm-12-24v-cm3": "Mexxun CM3 PWM Şarj Kontrol Cihazı (12/24V)",
 "solar-surucu-uzaktan-kontrol-cihazi-mx600-serisi": "MX600 Serisi Sürücü Uzaktan Kumanda Cihazı",
 "deye-optimizer-sun-xl02-b": "Deye Optimizer SUN-XL02-B",
 "deye-optimizer-concentrator-sun-xl20-b": "Deye Optimizer Concentrator SUN-XL20-B",
 "40x40-sigma-profil": "40×40 Sigma Montaj Profili",
 "a-tipi-h55-asik-profil-55cm": "A Tipi H55 Aşık Profil (55 cm)",
 "trapez-profil-3-5m": "Trapez Montaj Profili (3,5 m)",
 "sivri-uclu-cati-vidasi-m5-5x27": "Sivri Uçlu Çatı Vidası M5,5×27",
 "hareketli-kiremit-kancasi-20-ad": "Hareketli Kiremit Kancası (20'li Paket)",
 "karavan-montaj-takimi-4-kose-2-orta-buat": "Karavan Montaj Takımı (4 Köşe + 2 Orta + Buat)",
 "panel-sonlandirici-35mm-50-ad": "Panel Sonlandırıcı 35 mm (50'li Paket)",
 "panel-sonlandirici-50-ad": "Panel Sonlandırıcı (50'li Paket)",
 "solar-konnektor-set-30a-1000v-50-adet": "MC4 Konnektör Seti 30A/1000V (50'li Paket)",
 "20-48kwh-lifepo4-hv-yuksek-voltaj-batarya-sistemi": "20–48 kWh LiFePO4 HV Yüksek Voltaj Batarya Sistemi",
 "40-96kwh-lifepo4-hv-yuksek-voltaj-batarya-sistemi": "40–96 kWh LiFePO4 HV Yüksek Voltaj Batarya Sistemi",
 "eve-61-44kwh-lifepo4-hv-yuksek-voltaj-batarya-sistemi-kopya": "EVE 61,44 kWh LiFePO4 HV Yüksek Voltaj Batarya Sistemi",
 "2000w-2kw-tasinabilir-guc-istasyonu": "2000 W Taşınabilir Güç İstasyonu",
 "4-2kw-topcon-paket-sistem-1-paket-4-kopya": "4,2 kW TopCon Paket Sistem",
 "20kw-trifaze-hibrit-sistem-3": "20 kW Trifaze Hibrit Paket Sistem",
 "11-kw-2x100a-mppt-akilli-inverter-paralellenebilir-1": "11 kW 2×100A MPPT Akıllı İnverter (Paralellenebilir)",
 "80a-hv-15-230v-mppt-sarj-kontrol-cihazi": "80A HV MPPT Şarj Kontrol Cihazı (15–230V PV)",
 "gprs-kit": "GPRS Uzaktan İzleme Kiti",
 "deye-wifi-logger": "Deye Wi-Fi Logger (İzleme Modülü)",
 "off-grid-inverter-logger": "Off-Grid İnverter Wi-Fi Logger",
 "eastron-meter": "Eastron Akıllı Sayaç (Meter)",
 "5hp-4kw-3x220v-solar-pompa-inverteri": "5 Hp (4 kW) Solar Pompa Sürücüsü (3×220V)",
}

NAME_FIX.update({
 "tam-sinus-24v-3000wts": "Tam Sinüs İnverter 24V 3000 W",
 "dc-pompa-0-4-hp-300w-24v-3rdc3-35-24-300": "DC Dalgıç Pompa 0,4 Hp 300 W 24V (3RDC3-35)",
 "dc-pompa-0-8hp-600w-4ss600-48n": "DC Dalgıç Pompa 0,8 Hp 600 W 48V (4SS600)",
 "dc-pompa-0-8-hp-600w-48v-3rdc3-5-80-48-600": "DC Dalgıç Pompa 0,8 Hp 600 W 48V (3RDC3-5-80)",
 "dc-pompa-1-hp-750w-72v-4dc6-56-72-750pm": "DC Dalgıç Pompa 1 Hp 750 W 72V (4DC6-56)",
 "dc-pompa-1-5hp-1100w-72v-4dc6-84-72-1100-826": "DC Dalgıç Pompa 1,5 Hp 1100 W 72V (4DC6-84)",
 "dc-pompa-1-6hp-1300w-110v-4dc6-112-110-1300": "DC Dalgıç Pompa 1,6 Hp 1300 W 110V (4DC6-112)",
 "dc-pompa-2hp-1500w-110v-3rdc3-8-180-110-1500": "DC Dalgıç Pompa 2 Hp 1500 W 110V (3RDC3-8-180)",
 "dc-pompa-2hp-1500w-110v-ss-impeller-4rdss4-8-203-110-1500": "DC Dalgıç Pompa 2 Hp 1500 W 110V Paslanmaz Impeller (4RDSS4)",
 "dc-yuzey-pompa-2hp-750w-sfp6-20-750w-72v": "DC Yüzey Pompası 2 Hp 750 W 72V (SFP6-20)",
 "dc-yuzey-pompa-1-5hp-1100w-sfp20-17-1100w-96v": "DC Yüzey Pompası 1,5 Hp 1100 W 96V (SFP20-17)",
 "tam-sinus-ups-remote-ekran-12v-600w": "Tam Sinüs UPS İnverter 12V 600 W (Uzaktan Ekranlı)",
 "tam-sinus-ups-remote-ekran-12v-1000w": "Tam Sinüs UPS İnverter 12V 1000 W (Uzaktan Ekranlı)",
 "tam-sinus-ups-remote-ekran-12v-2000w": "Tam Sinüs UPS İnverter 12V 2000 W (Uzaktan Ekranlı)",
 "tam-sinus-ups-remote-ekran-12v-3000w": "Tam Sinüs UPS İnverter 12V 3000 W (Uzaktan Ekranlı)",
 "205w-monokristal-pantec-panel": "Pantec 205 W Monokristal Güneş Paneli",
 "50w-monokristal-gunes-paneli": "50 W Monokristal Güneş Paneli",
 "jel-aku-12v-100ah-orbus": "Orbus 100 Ah 12V Jel Akü",
 "jel-aku-12v-150ah-orbus": "Orbus 150 Ah 12V Jel Akü",
 "jel-aku-12v-200ah-orbus": "Orbus 200 Ah 12V Jel Akü",
 "9ah-lexron-agm-aku": "Lexron 9 Ah 12V AGM Akü",
 "7-2ah-lexron-agm-aku": "Lexron 7,2 Ah 12V AGM Akü",
 "7ah-lexron-agm-aku": "Lexron 7 Ah 12V AGM Akü",
 "12ah-12v-lexron-agm-aku": "Lexron 12 Ah 12V AGM Akü",
 "314ah-51-2v-premium-serisi-lityum-batarya": "314 Ah 51,2V Premium Serisi Lityum Batarya (16 kWh)",
 "200ah-25-6v-lityum-batarya": "200 Ah 25,6V Lityum Batarya (5,12 kWh)",
})

NAME_FIX.update({
 "deye-33kw-trifaze11": "Deye 33 kW Trifaze On-Grid İnverter",
 "deye-50kw-trifazeg04": "Deye 50 kW Trifaze On-Grid İnverter",
 "deye-5kw-monofaze05": "Deye 5 kW Monofaze On-Grid İnverter",
 "dc-sigorta-sigorta-yuvasi-16a-1000v-12-adet": "DC Sigorta + Yuva Seti 16A/1000V (12'li)",
 "dc-sigorta-sigorta-yuvasi-20a-1000v-12-adet": "DC Sigorta + Yuva Seti 20A/1000V (12'li)",
 "dc-sigorta-sigorta-yuvasi-32-1000v-12-adet": "DC Sigorta + Yuva Seti 32A/1000V (12'li)",
 "mexxsun-lityum-aku-51-2v-300ah-lifepo4": "Mexxun 300 Ah 51,2V LiFePO4 Lityum Akü (15,36 kWh)",
 "mexxsun-lityum-aku-12-8v-300ah-lifepo4-3840wh-3121": "Mexxun 300 Ah 12,8V LiFePO4 Lityum Akü (3,84 kWh)",
 "mexxsun-lityum-aku-25-6v-200ah-lifepo4-5120wh": "Mexxun 200 Ah 25,6V LiFePO4 Lityum Akü (5,12 kWh)",
})

for i in (1, 2, 3, 4):
    NAME_FIX[f"enerji-depolamali-on-grid-sistem-{i}"] = f"Enerji Depolamalı On-Grid Paket Sistem — Konfigürasyon {i}"
NAME_FIX["trifaze-enerji-depolamali-on-grid-sistem-5-1"] = "Trifaze Enerji Depolamalı On-Grid Paket Sistem — Konfigürasyon 5"
NAME_FIX["trifaze-enerji-depolamali-on-grid-sistem-6"] = "Trifaze Enerji Depolamalı On-Grid Paket Sistem — Konfigürasyon 6"

def tags_for(cat, slug):
    kw = num(slug, "kw"); w = num(slug, "w"); ah = num(slug, "ah"); hp = num(slug, "hp"); v = num(slug, "v")
    t = []
    if cat in ("hibrit-inverterler", "sebeke-inverterleri"):
        t.append("Trifaze" if "trifaz" in slug else "Monofaze")
        if kw: k = float(kw); t.append("≤10 kW" if k <= 10 else ("10–30 kW" if k <= 30 else "30+ kW"))
    elif cat == "akilli-inverterler":
        t.append("UPS" if "ups" in slug else ("Modifiye Sinüs" if "modifiye" in slug else "Tam Sinüs"))
        if v and float(v) in (12, 24, 48): t.append(f"{int(float(v))}V")
    elif cat == "sarj-regulatorleri":
        t.append("AC-DC Şarj" if "ac-dc" in slug else ("PWM" if ("pwm" in slug or "cm3" in slug) else "MPPT"))
    elif cat == "lityum-akuler":
        t.append("HV Sistem" if "kwh" in slug else (f"{ah} Ah" if ah else "Lityum"))
    elif cat == "jel-akuler":
        t.append("AGM" if "agm" in slug else "Jel")
        if ah: t.append(f"{ah.rstrip('.0') if ah.endswith('.0') else ah} Ah".replace(".", ","))
    elif cat == "tarimsal-sulama":
        t.append("DC Pompa" if ("dc-pompa" in slug or "yuzey" in slug) else ("Komple Sistem" if "sistemi" in slug else ("Aksesuar" if "uzaktan" in slug else "Sürücü")))
    elif cat == "gunes-panelleri":
        if "esnek" in slug: t.append("Esnek")
        elif w:
            wf = float(w)
            t.append("≤100 W" if wf <= 100 else ("100–300 W" if wf <= 300 else ("300–500 W" if wf <= 500 else "500 W+")))
    elif cat == "solar-ekipmanlar":
        t.append("İzleme" if any(k in slug for k in ("logger","gprs","eastron","optimizer","uzaktan")) else
                 ("Kablo" if "kablo" in slug else ("Konnektör" if ("konnektor" in slug or "branch" in slug) else
                 ("Sigorta" if "sigorta" in slug else "Montaj"))))
    elif cat == "aksesuar":
        t.append("Isı Pompası" if "isi-pompasi" in slug else ("Aydınlatma" if ("aydinlatma" in slug or "projektor" in slug) else "Güç İstasyonu"))
    elif cat == "solar-paketler":
        pass
    return t

# ---------- veri yükle ----------
used = set(json.load(open("/tmp/claude-0/-home-user/db33d4e3-a8c2-5164-966c-2a969b487d27/scratchpad/used.json")))
rows = list(csv.DictReader(open(ROOT / "data/urun_gorsel_eslesme.csv", encoding="utf-8-sig"), delimiter=";"))
cat_dump = subprocess.check_output(["node", "-e",
    "global.window=global;require('" + str(ROOT) + "/assets/config.js');require('" + str(ROOT) + "/assets/data.js');"
    "console.log(JSON.stringify(global.GESM.data.products.map(p=>({id:p.id,cat:p.cat,name:p.name}))))"], text=True)
catalog = json.loads(cat_dump)
existing_ids = {p["id"] for p in catalog}

# katalog imzaları (mükerrer engelleme)
cat_sigs = set()
for p in catalog:
    fake_slug = re.sub(r"[^a-z0-9]+", "-", p["name"].lower().translate(str.maketrans("çğıöşü", "cgiosu")))
    cat_sigs.add(signature(p["cat"], fake_slug))

# EP önce (fiyatlı), sonra mexxsun
rows.sort(key=lambda r: 0 if r["tedarikci"] == "enerjipazari" else 1)

out, seen_sigs, skipped = [], set(), []
for r in rows:
    slug = r["url"].rstrip("/").rsplit("/", 1)[-1]
    files = [f for f in r["gorsel_dosyalari"].split("|") if f]
    if not files or any(f in used for f in files): continue
    if slug in SKIP: skipped.append((slug, "elle atlandı")); continue
    cat = classify(slug)
    if not cat: skipped.append((slug, "sınıflandırılamadı")); continue
    sig = signature(cat, slug)
    if sig in cat_sigs or sig in seen_sigs:
        skipped.append((slug, "mükerrer: " + sig)); continue
    seen_sigs.add(sig)
    price = parse_price(r)
    name = NAME_FIX.get(slug) or titleize(slug)
    name = name.replace(" KW", " kW").replace("Lifepo4", "LiFePO4")
    if cat == "sebeke-inverterleri" and "İnverter" not in name:
        name = re.sub(r"(Monofaze|Trifaze)", r"\1 On-Grid İnverter", name, 1) if re.search(r"Monofaze|Trifaze", name) else name + " On-Grid İnverter"
    if cat == "hibrit-inverterler":
        name = re.sub(r"Hibrit (Monofaze|Trifaze)(?! İnverter)", r"Hibrit \1 İnverter", name)
    if cat == "solar-ekipmanlar" and "Kablo" in name:
        name = re.sub(r"([\d,]+) mm\b", r"\1 mm²", name)
    pid = "x-" + re.sub(r"-(kopya|\d{3,4})$", "", slug)[:60]
    if pid in existing_ids: pid += "-2"
    item = {"id": pid, "cat": cat, "brand": brand_of(slug, r["tedarikci"]), "name": name,
            "sup": r["tedarikci"], "img": files, "tags": tags_for(cat, slug)}
    if price: item["price"] = price
    else: item["onRequest"] = True
    if cat == "solar-paketler":
        item["scenario"] = "Ticari" if "trifaze" in slug or "20kw" in slug else "Ev"
    out.append(item)

# ---------- çıktı ----------
from collections import Counter
print("EKLENECEK:", len(out), dict(Counter(i["cat"] for i in out)))
print("Atlanan:", len(skipped))
for i in out:
    pr = f"{i['price']}₺" if "price" in i else "TEKLİF"
    print(f"  {i['cat'][:14]:14s} | {pr:>9s} | {i['brand']:10s} | {i['name']}")

if EMIT:
    lines = []
    for i in out:
        o = {k: i[k] for k in ("id", "cat", "brand", "name") }
        o["supplier"] = i["sup"]
        if "price" in i: o["price"] = i["price"]
        else: o["onRequest"] = True
        o["tags"] = i["tags"]
        if "scenario" in i: o["scenario"] = i["scenario"]
        o["specs"] = {}
        o["img"] = i["img"]
        lines.append("  " + json.dumps(o, ensure_ascii=False))
    block = ("\n  /* ---------- EK: Tedarikçi tam envanteri (tools/envanter_genislet.py üretti) ----------\n"
             "     Fiyatlılar EP maliyet × 1,2; fiyatsızlar Teklif Al (onRequest). */\n"
             "  var EXTRA = [\n" + ",\n".join(lines) + "\n  ];\n"
             "  EXTRA.forEach(function (o) { add(o); });\n")
    p = ROOT / "assets/data.js"
    s = p.read_text(encoding="utf-8")
    anchor = "  /* ---------- Açıklama üretici"
    assert anchor in s
    s = s.replace(anchor, block + "\n" + anchor)
    p.write_text(s, encoding="utf-8")
    print("\ndata.js'e EXTRA bloğu eklendi.")

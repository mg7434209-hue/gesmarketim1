// Statik içerik sayfaları — eski HTML sayfalarındaki metinler React'e taşındı.
// İletişim/kargo sayıları config'ten gelir; sayfaya sayı gömülmez.
import { Link } from "react-router-dom";
import { useStore, fmtTL } from "../api.js";
import { useSeo } from "../hooks.js";

export default function Static({ page }) {
  const store = useStore();
  const P = PAGES[page];
  const meta = P.meta(store);
  useSeo(meta);
  return (
    <div className="wrap py-10 prose-static max-w-3xl">
      <h1 className="text-2xl md:text-3xl mb-4">{meta.h1}</h1>
      <P.Body store={store} />
    </div>
  );
}

/* ---------------- Hakkımızda ---------------- */
function Hakkimizda({ store }) {
  const { company } = store.config;
  return (
    <>
      <p><b>GES MARKETİM</b>, Antalya/Manavgat merkezli bir solar enerji marketidir. Güneş panellerinden LiFePO4 lityum akülere, akıllı inverterlerden solar pompa ve aydınlatma çözümlerine kadar, şebekeden bağımsız ya da şebeke destekli her ölçekte sistemin ürünlerini tek çatı altında sunarız.</p>
      <h2>Neden biz?</h2>
      <ul>
        <li><b>Şeffaf fiyat:</b> Tüm fiyatlarımız KDV dahildir ve günlük döviz kuruyla güncellenir; havale/EFT ödemelerinde ekstra indirim uygularız.</li>
        <li><b>Doğru boyutlandırma:</b> Satmadan önce sorarız. Tüketiminize ve kullanım senaryonuza uygun sistemi birlikte belirleriz — <Link to="/hesaplayici">Sistem Kurucu</Link> bu hesabı sizin için saniyeler içinde yapar.</li>
        <li><b>Gerçek destek:</b> Telefon ve WhatsApp ile satış öncesi ve sonrası yanınızdayız.</li>
        <li><b>Tek marka, tam uyum:</b> Bu aşamada kataloğumuz Lexron ürünlerinden oluşur — panel, akü, inverter ve ekipman birbiriyle tam uyumlu çalışır.</li>
      </ul>
      <h2>Ne satıyoruz?</h2>
      <p>Half-cut TopCon monokristal güneş panelleri (12 W'tan 750 W'a), LiFePO4 lityum bataryalar ve nano karbon jel aküler, HV MPPT akıllı inverterler, PWM/MPPT şarj regülatörleri, solar dalgıç pompalar, solar aydınlatma ürünleri ile kablo-konnektör ve montaj ekipmanları.</p>
      <h2>Künye</h2>
      <p>Unvan: <b>{company.legal}</b><br />
        Adres: {company.address}<br />
        Telefon: <a href={"tel:" + company.phone.tel}>{company.phone.display}</a> · E-posta: <a href={"mailto:" + company.email}>{company.email}</a></p>
    </>
  );
}

/* ---------------- SSS ---------------- */
function faqs(store) {
  const { commerce } = store.config;
  return [
    ["Evim için kaç panel gerekir?",
      "Aylık tüketiminizi (kWh) 12 ile çarpıp bölgenizin yıllık özgül üretimine (Akdeniz için ~1650 kWh/kWp) bölün; çıkan kWp değerini panel gücüne bölerek adet bulunur. Örnek: aylık 300 kWh için ~2,2 kWp → 4 adet 550 W panel. Sitedeki Sistem Kurucu bu hesabı cihaz listenizden otomatik yapar."],
    ["Lityum akü mü jel akü mü almalıyım?",
      "Her gün kullanılan sistemlerde lityum (LiFePO4) aküler 3000–6000 çevrim ömrü ve %90 kullanılabilir kapasiteyle uzun vadede daha ekonomiktir. Hafta sonu kullanılan bağ evi gibi düşük döngülü senaryolarda jel akü yeterli olur."],
    ["PWM ile MPPT regülatör arasındaki fark nedir?",
      "MPPT regülatörler panelden %20–30 daha fazla enerji hasadı yapar ve yüksek voltajlı panel dizilerine izin verir; PWM ise küçük ve ekonomik sistemler içindir. 200 W üzeri sistemlerde MPPT öneririz."],
    ["Fiyatlar neden dolar bazlı, ₺ fiyat değişir mi?",
      "Solar ürünlerin tedariki döviz bazlıdır. Fiyatlarımız USD üzerinden belirlenir ve sitedeki güncel kurla ₺'ye çevrilir — üstteki kur rozeti o gün geçerli kuru gösterir. Sipariş anındaki ₺ fiyat sipariş onayınızda sabitlenir."],
    ["Kargo ücreti ne kadar, ne zaman gönderilir?",
      commerce.kargoModu === "alici"
        ? "Siparişler 1–3 iş günü içinde kargoya verilir. Gönderiler karşı (alıcı) ödemelidir: kargo ücreti sipariş tutarına eklenmez, teslimatta kargo firmasına ödenir. Panel gibi hacimli ürünler ambar/nakliye ile gönderilir; teslimat öncesi telefonla koordine edilir."
        : `Siparişler 1–3 iş günü içinde kargoya verilir. ${fmtTL(commerce.freeShippingLimit)} üzeri siparişlerde kargo ücretsizdir; altında ${fmtTL(commerce.shippingFlat)} sabit gönderim bedeli uygulanır. Panel gibi hacimli ürünler ambar/nakliye ile gönderilir; teslimat öncesi telefonla koordine edilir.`],
    ["Ödemeyi nasıl yapabilirim?",
      `Havale/EFT (%${commerce.havaleDiscountPct} indirimli) veya kredi kartı ile ödeyebilirsiniz. Sipariş sepetten WhatsApp ile iletilir; stok teyidinden sonra ödeme bilgileri veya güvenli ödeme linki gönderilir.`],
    ["İade koşullarınız nedir?",
      "Mesafeli satış mevzuatı gereği teslimattan itibaren 14 gün içinde koşulsuz iade hakkınız vardır. Ürün kullanılmamış ve orijinal ambalajında olmalıdır."],
    ["Montaj hizmeti veriyor musunuz?",
      "Antalya ve çevresinde anahtar teslim kurulum desteği sunuyoruz; diğer illerde anlaşmalı ekiplerle veya uzaktan devreye alma desteğiyle yardımcı oluyoruz. Sistemler bağlantı şemasıyla gönderilir."],
  ];
}

function Sss({ store }) {
  return (
    <>
      {faqs(store).map(([q, a]) => (
        <details key={q} className="card p-4 mb-2 cursor-pointer">
          <summary className="font-semibold">{q}</summary>
          <p className="mt-2 mb-0">{a}</p>
        </details>
      ))}
      <p className="mt-6">Sorunuz burada yok mu? <Link to="/iletisim">İletişim</Link> sayfasından bize ulaşın.</p>
    </>
  );
}

/* ---------------- Kargo & Teslimat ---------------- */
function Kargo({ store }) {
  const { commerce } = store.config;
  return (
    <>
      <h2>Gönderim süresi</h2>
      <p>Stoktan gönderilen ürünler siparişin onaylanmasını takiben <b>1–3 iş günü</b> içinde kargoya teslim edilir. Tedarikli ürünlerde süre sipariş onayında ayrıca bildirilir.</p>
      <h2>Kargo ücreti</h2>
      {commerce.kargoModu === "alici" ? (
        <ul>
          <li>Gönderiler <b>karşı (alıcı) ödemeli</b> yapılır — kargo ücreti sipariş tutarına <b>eklenmez</b>.</li>
          <li>Kargo bedelini teslimat sırasında doğrudan kargo firmasına ödersiniz; tutar desi/bölgeye göre kargo firmasınca belirlenir.</li>
        </ul>
      ) : (
        <ul>
          <li><b>{fmtTL(commerce.freeShippingLimit)} ve üzeri</b> siparişlerde kargo <b>ücretsizdir</b>.</li>
          <li>Bu tutarın altındaki siparişlerde sabit <b>{fmtTL(commerce.shippingFlat)}</b> gönderim bedeli uygulanır.</li>
        </ul>
      )}
      <h2>Hacimli ürünler (panel, akü grubu)</h2>
      <p>Güneş panelleri ve akü grupları boyutları gereği <b>ambar / nakliye</b> ile gönderilir. Sevkiyat öncesi telefonla teslimat günü koordine edilir. Yüklü siparişlerde adrese teslim aracı organize edilir — sipariş öncesi bizimle irtibata geçmenizi öneririz.</p>
      <h2>Teslimatta kontrol</h2>
      <p>Paketinizi teslim alırken hasar kontrolü yapınız; hasarlı üründe kargo görevlisine tutanak tutturup aynı gün bize bildiriniz. Bu durumda ürün ücretsiz yenisiyle değiştirilir.</p>
    </>
  );
}

/* ---------------- İade & Değişim ---------------- */
function Iade() {
  return (
    <>
      <h2>Cayma hakkı — 14 gün koşulsuz iade</h2>
      <p>6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca, ürünü teslim aldığınız tarihten itibaren <b>14 gün içinde</b> hiçbir gerekçe göstermeksizin cayma hakkınızı kullanabilirsiniz.</p>
      <h2>İade koşulları</h2>
      <ul>
        <li>Ürün kullanılmamış, kurulmamış ve yeniden satılabilir durumda olmalıdır.</li>
        <li>Orijinal ambalaj, aksesuar ve faturayla birlikte gönderilmelidir.</li>
        <li>İade kargo bedeli, ayıplı ürün durumunda tarafımıza; cayma hakkında alıcıya aittir.</li>
      </ul>
      <h2>İade süreci</h2>
      <ol className="list-decimal pl-6 mb-4">
        <li>WhatsApp veya telefonla iade talebinizi iletin; sipariş numaranızı belirtin.</li>
        <li>Size ileteceğimiz anlaşmalı kargo koduyla ürünü gönderin.</li>
        <li>Ürün depomuza ulaştıktan sonra <b>14 gün içinde</b> ödeme iadeniz yapılır.</li>
      </ol>
      <h2>Hasarlı / ayıplı ürün</h2>
      <p>Teslimatta hasar tespit ederseniz kargo görevlisine tutanak tutturun ve aynı gün bize bildirin — ürün ücretsiz olarak yenisiyle değiştirilir.</p>
    </>
  );
}

/* ---------------- Mesafeli Satış ---------------- */
function Mesafeli({ store }) {
  const { company } = store.config;
  return (
    <>
      <h2>1. Taraflar</h2>
      <p><b>Satıcı:</b> {company.legal} — {company.address} · Tel: <a href={"tel:" + company.phone.tel}>{company.phone.display}</a> · E-posta: <a href={"mailto:" + company.email}>{company.email}</a><br />
        <b>Alıcı:</b> Sipariş formunda bilgileri yer alan gerçek/tüzel kişi.</p>
      <h2>2. Konu</h2>
      <p>İşbu sözleşme, Alıcı'nın gesmarketim.com üzerinden elektronik ortamda siparişini verdiği, nitelikleri ve satış fiyatı sipariş özetinde belirtilen ürünün satışı ve teslimi ile ilgili olarak 6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerini kapsar.</p>
      <h2>3. Ürün ve ödeme bilgileri</h2>
      <p>Ürünün cinsi, miktarı, satış bedeli (KDV dahil), ödeme şekli ve teslimat bilgileri sipariş özetinde belirtildiği gibidir. Havale/EFT ödemelerinde sepette belirtilen indirim uygulanır. Kargo bedeli Alıcı'ya aittir; gönderim karşı (alıcı) ödemeli yapılıyorsa bedel teslimatta kargo firmasına ödenir, aksi halde sipariş özetinde gösterilir.</p>
      <h2>4. Teslimat</h2>
      <p>Ürün, sipariş onayını takiben yasal 30 günlük süreyi aşmamak koşuluyla, stok durumuna göre 1–3 iş günü içinde kargoya verilir. Hacimli ürünlerde teslimat, Alıcı ile telefonla koordine edilerek ambar/nakliye ile yapılır.</p>
      <h2>5. Cayma hakkı</h2>
      <p>Alıcı, ürünü teslim aldığı tarihten itibaren 14 (on dört) gün içinde hiçbir gerekçe göstermeksizin cayma hakkını kullanabilir. Cayma bildirimini takiben ürün, kullanılmamış ve yeniden satılabilir durumda, orijinal ambalajı ve faturasıyla iade edilir. Ödeme, ürünün Satıcı'ya ulaşmasından itibaren 14 gün içinde iade edilir. Ayrıntılar için <Link to="/iade-degisim">İade &amp; Değişim</Link> sayfasına bakınız.</p>
      <h2>6. Genel hükümler</h2>
      <p>Alıcı, sipariş vermeden önce ürünün temel nitelikleri, satış fiyatı, ödeme ve teslimat bilgilerini okuyup bilgi sahibi olduğunu ve elektronik ortamda gerekli teyidi verdiğini kabul eder. Uyuşmazlıklarda Alıcı'nın yerleşim yerindeki Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.</p>
    </>
  );
}

/* ---------------- KVKK ---------------- */
function Kvkk({ store }) {
  const { company } = store.config;
  return (
    <>
      <p>{company.legal} olarak kişisel verilerinizin güvenliğine önem veriyoruz. Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla hazırlanmıştır.</p>
      <h2>Hangi verileri işliyoruz?</h2>
      <ul>
        <li><b>Sipariş verileri:</b> Ad-soyad, telefon, teslimat adresi — siparişin kurulması ve teslimatı için.</li>
        <li><b>İletişim verileri:</b> Form ve WhatsApp üzerinden ilettiğiniz bilgiler — talebinize dönüş için.</li>
      </ul>
      <h2>Verileriniz nasıl saklanır?</h2>
      <p>Sepetiniz ve tercihlerinizle ilgili bilgiler yalnızca <b>kendi cihazınızın tarayıcısında</b> (localStorage) tutulur, sunucularımıza otomatik olarak aktarılmaz. Sipariş bilgileriniz, sizin onayınızla WhatsApp üzerinden tarafımıza iletilir ve yalnızca siparişin ifası için kullanılır.</p>
      <h2>Verilerin paylaşımı</h2>
      <p>Sipariş bilgileri; teslimatın gerçekleştirilmesi amacıyla kargo/nakliye firmaları ve yasal zorunluluk hâlinde yetkili merciler dışında üçüncü kişilerle paylaşılmaz, pazarlama amacıyla satılmaz.</p>
      <h2>Haklarınız</h2>
      <p>KVKK'nın 11. maddesi kapsamındaki taleplerinizi (bilgi, düzeltme, silme vb.) <a href={"mailto:" + company.email}>{company.email}</a> adresine iletebilirsiniz; başvurunuz 30 gün içinde yanıtlanır.</p>
    </>
  );
}

/* ---------------- kayıt ---------------- */
const PAGES = {
  hakkimizda: {
    Body: Hakkimizda,
    meta: (s) => ({
      h1: "Hakkımızda",
      title: "Hakkımızda | " + s.config.company.brand,
      description: "GES MARKETİM: Antalya/Manavgat merkezli solar enerji marketi — panel, akü, inverter ve pompa sistemleri.",
    }),
  },
  sss: {
    Body: Sss,
    meta: (s) => ({
      h1: "Sık Sorulan Sorular",
      title: "Sık Sorulan Sorular | " + s.config.company.brand,
      description: "Panel sayısı hesabı, lityum-jel akü seçimi, kargo, ödeme ve iade hakkında sık sorulan sorular.",
      jsonLd: {
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: faqs(s).map(([q, a]) => ({
          "@type": "Question", name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    }),
  },
  kargo: {
    Body: Kargo,
    meta: (s) => ({
      h1: "Kargo & Teslimat",
      title: "Kargo & Teslimat | " + s.config.company.brand,
      description: "Gönderim süreleri, ücretsiz kargo limiti ve hacimli ürün teslimatı hakkında bilgiler.",
    }),
  },
  iade: {
    Body: Iade,
    meta: (s) => ({
      h1: "İptal, İade & Değişim",
      title: "İptal, İade & Değişim | " + s.config.company.brand,
      description: "14 gün koşulsuz cayma hakkı, iade koşulları ve süreç adımları.",
    }),
  },
  mesafeli: {
    Body: Mesafeli,
    meta: (s) => ({
      h1: "Mesafeli Satış Sözleşmesi",
      title: "Mesafeli Satış Sözleşmesi | " + s.config.company.brand,
      description: "gesmarketim.com mesafeli satış sözleşmesi — taraflar, teslimat, cayma hakkı ve genel hükümler.",
    }),
  },
  kvkk: {
    Body: Kvkk,
    meta: (s) => ({
      h1: "Gizlilik & Kişisel Verilerin Korunması (KVKK)",
      title: "Gizlilik & KVKK | " + s.config.company.brand,
      description: "Kişisel verilerin işlenmesi, saklanması ve KVKK kapsamındaki haklarınız.",
    }),
  },
};

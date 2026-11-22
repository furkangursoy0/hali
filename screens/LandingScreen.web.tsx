import React, { useId, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent } from 'react';
import ContactForm from '../components/landing/ContactForm.web';
import CATALOG from '../data/catalog-stats.json';
import '../components/landing/web-landing.css';

const WHATSAPP_URL = 'https://wa.me/905300947756?text='
  + encodeURIComponent('Merhaba, fiziksel halı mağazam için Halı Dene hakkında bilgi almak istiyorum.');
const CARPET_COUNT = `${Math.floor(CATALOG.totalCarpets / 100) * 100}+`;
const ROOM_BEFORE = '/landing/room-before.webp';
const ROOM_AFTER = '/landing/room-after.webp';

const BRANDS = [
  ['Artemis', 'artemis'], ['Atlas', 'atlas'], ['Bahariye', 'bahariye'],
  ['Diora', 'diora'], ['Dolce Vita', 'dolce-vita'], ['Elexus', 'elexus'],
  ['Empera', 'empera'], ['İpek', 'ipek'], ['Jusco', 'jusco'],
  ['Karmen', 'karmen'], ['Kreasyon', 'kreasyon'], ['Merinos', 'merinos'],
  ['Padişah', 'padisah'], ['Pierre Cardin', 'pierre-cardin'], ['Royal Halı', 'royal'],
  ['Sanat', 'sanat'], ['Seyran', 'seyran'],
];

const TESTIMONIAL = {
  author: 'Halıcı Gürsoylar',
  quote: '',
};

const QUESTIONS = [
  ['Halı Dene mağazamda nasıl çalışır?', 'Müşterinizin oda fotoğrafını ekleyin, katalogdan bir halı seçin ve yapay zekânın hazırladığı oda önizlemesini mağazada birlikte inceleyin.'],
  ['Oda fotoğrafı nasıl eklenir?', 'Odanın mevcut bir fotoğrafını galeriden seçebilir veya cihazınızın kamerasıyla yeni bir fotoğraf çekebilirsiniz.'],
  ['Katalogda hangi markalar var?', `Katalogda ${CATALOG.totalBrands} markadan ${CARPET_COUNT} halı modeli bulunur. Sayfadaki marka şeridinde katalogdaki markaları görebilirsiniz.`],
  ['Önizleme ne kadar gerçeğe yakın?', 'Halı, oda fotoğrafının perspektifine ve ışığına göre yerleştirilir. Odanın açısı ve fotoğrafın kalitesi sonucu etkileyebilir. Kesin renk ve ölçüyü ürün bilgileriyle birlikte değerlendirin.'],
  ['Demo ve kurulum için kiminle görüşebilirim?', 'Demo formunu doldurun. Mağazanızda Halı Dene’yi nasıl kullanabileceğinizi, kurulum ve fiyatlandırmayı birlikte konuşalım.'],
];

function BrandMark() {
  return <span className="hd-wordmark"><span className="hd-brand-mark" aria-hidden="true">H</span>Halı Dene</span>;
}

function HeroComparison() {
  const [split, setSplit] = useState(50);
  const slider = useRef<HTMLInputElement>(null);

  function updateSplit(event: PointerEvent<HTMLDivElement>) {
    const { left, width } = event.currentTarget.getBoundingClientRect();
    if (!width) return;
    const fraction = Math.max(0, Math.min(1, (event.clientX - left) / width));
    setSplit(Math.round(fraction * 1000) / 10);
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    slider.current?.focus({ preventScroll: true });
    updateSplit(event);
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) updateSplit(event);
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    updateSplit(event);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <figure className="hd-hero-comparison" aria-label="Oda karşılaştırması">
      <div className="hd-comparison-images" style={{ '--hd-split': `${split}%` } as CSSProperties}
        onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag}>
        <img src={ROOM_AFTER} alt="Örnek salonda yapay zekâyla yerleştirilmiş halı" width={852} height={1002} decoding="async" draggable={false} />
        <div className="hd-comparison-before" aria-hidden="true">
          <img src={ROOM_BEFORE} alt="" width={852} height={1002} decoding="async" draggable={false} />
        </div>
        <span className="hd-comparison-divider" aria-hidden="true" />
        <span className="hd-comparison-handle" aria-hidden="true">↔</span>
        <input
          ref={slider}
          type="range"
          min={0}
          max={100}
          step="any"
          value={split}
          onChange={event => setSplit(event.currentTarget.valueAsNumber)}
          aria-label="Halı eklenmeden önceki ve sonraki oda görüntüsünü karşılaştır"
          aria-valuetext={`Önce yüzde ${Math.round(split)}, sonra yüzde ${100 - Math.round(split)}`}
        />
      </div>
    </figure>
  );
}

function HeroVisual() {
  return (
    <div className="hd-hero-media">
      <figure className="hd-hero-visual">
        <img src="/landing/store-kiosk-selection.webp" alt="Halı Dene halı seçimi ekranını gösteren kiosk"
          width={1024} height={1536} fetchPriority="high" decoding="async" />
      </figure>
      <HeroComparison />
    </div>
  );
}

function CatalogMarquee() {
  return (
    <section id="markalar" className="hd-catalog" aria-labelledby="hd-catalog-title">
      <div className="hd-container hd-section-heading">
        <h2 id="hd-catalog-title">{CARPET_COUNT} Halı Kataloğu</h2>
        <p>Mağazada müşterinize gösterebileceğiniz koleksiyonlar.</p>
      </div>
      <div className="hd-marquee" tabIndex={0} aria-label="Katalog markaları">
        <div className="hd-marquee-track">
          {[false, true].map(duplicate => (
            <ul key={String(duplicate)} className="hd-logo-set" aria-hidden={duplicate ? true : undefined}>
              {BRANDS.map(([name, slug]) => (
                <li key={slug}>
                  <img src={`/landing/brands/${slug}.webp`} alt={duplicate ? '' : name} width={180} height={72} loading="lazy" decoding="async" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}

function StoreTestimonial() {
  if (!TESTIMONIAL.quote) return null;

  return (
    <section className="hd-testimonial" aria-labelledby="hd-testimonial-title">
      <div className="hd-container hd-testimonial-inner">
        <h2 id="hd-testimonial-title">Mağazalardan görüşler</h2>
        <figure>
          <blockquote>{TESTIMONIAL.quote}</blockquote>
          <figcaption>{TESTIMONIAL.author}</figcaption>
        </figure>
      </div>
    </section>
  );
}

function FaqSection() {
  const regionId = useId();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="hd-faq hd-container" id="sss" aria-labelledby="hd-faq-title">
      <div className="hd-section-heading"><h2 id="hd-faq-title">Sık Sorulan Sorular</h2></div>
      <div className="hd-faq-list">
        {QUESTIONS.map(([question, answer], index) => {
          const expanded = open === index;
          const answerId = `${regionId}-${index}`;
          return (
            <div className="hd-faq-item" key={question}>
              <h3>
                <button type="button" aria-expanded={expanded} aria-controls={answerId}
                  onClick={() => setOpen(expanded ? null : index)}>
                  {question}<span className="hd-chevron" aria-hidden="true" />
                </button>
              </h3>
              <p id={answerId} hidden={!expanded}>{answer}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: 'QR kodu okutun',
      text: 'Müşteriniz, mağazadaki QR kodu telefonuyla okutarak halı deneme akışını başlatır.',
      image: 'qr',
      alt: 'Halı denemeyi başlatan QR kod ekranı',
    },
    {
      title: 'Oda fotoğrafını yükleyin',
      text: 'Halının deneneceği odanın fotoğrafını ekleyin.',
      image: 'room-upload',
      alt: 'Oda fotoğrafı yüklemek için dosya seçme ekranı',
    },
    {
      title: 'Halıyı seçin',
      text: 'Katalogdan müşterinizin odasında görmek istediği halıyı seçin.',
      image: 'rug-selection',
      alt: 'Krem klasik halının seçili olduğu halı kataloğu',
    },
    {
      title: 'Halıyı odada görün',
      text: 'Yapay zekânın seçilen halıyı odada nasıl gösterdiğini müşterinizle inceleyin.',
      image: 'room-result',
      alt: 'Krem klasik halının örnek salona yerleştirildiği sonuç ekranı',
    },
  ];

  return (
    <section className="hd-flow" id="nasil-calisir" aria-labelledby="hd-flow-title">
      <div className="hd-container">
        <div className="hd-section-heading">
          <h2 id="hd-flow-title">Nasıl Çalışır?</h2>
          <p>Oda fotoğrafından mağaza içi sunuma, dört adımda.</p>
        </div>
        <ol className="hd-step-grid">
          {steps.map(({ title, text, image, alt }, index) => (
            <li key={title}>
              <div className="hd-step-visual">
                <img src={`/landing/steps/${image}.webp`} alt={alt} width={660} height={880} loading="lazy" decoding="async" />
              </div>
              <div className="hd-step-copy">
                <span className="hd-step-number" aria-hidden="true">{index + 1}</span>
                <div><h3>{title}</h3><p>{text}</p></div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    ['▧', 'Oda fotoğrafıyla önizleme', 'Halıyı müşterinizin kendi odasında gösterin.'],
    ['▤', 'Marka ve koleksiyon kataloğu', 'Katalogda marka veya koleksiyona göre halı bulun.'],
    ['✦', 'Yapay zekâ ile görselleştirme', 'Seçtiğiniz halıyı oda fotoğrafının perspektifine uygun yerleştirin.'],
    ['◫', 'Önce ve sonra karşılaştırması', 'Farkı mağazada gösterin ve sonucu müşterinizle paylaşın.'],
  ];

  return (
    <section className="hd-container hd-features" id="ozellikler" aria-labelledby="hd-feature-title">
      <div className="hd-features-heading">
        <h2 id="hd-feature-title">Mağaza içi halı sunumu</h2>
        <p>Müşteriniz halının kendi odasında nasıl durduğunu mağazada görsün.</p>
      </div>
      <ul className="hd-feature-grid">
        {items.map(([icon, title, description]) => (
          <li key={title}>
            <span className="hd-feature-icon" aria-hidden="true">{icon}</span>
            <div><h3>{title}</h3><p>{description}</p></div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function LandingScreen() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [email, setEmail] = useState('');
  const [requestEmail, setRequestEmail] = useState<string | null>(null);

  function openRequest(initialEmail = '') {
    setRequestEmail(initialEmail);
    dialog.current?.showModal();
  }

  function handleInterest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    openRequest(email.trim());
  }

  return (
    <div className="hd-landing">
      <header className="hd-navbar">
        <div className="hd-container hd-navbar-inner">
          <a href="/" aria-label="Halı Dene ana sayfa"><BrandMark /></a>
          <nav aria-label="Ana menü">
            <div className="hd-navbar-links">
              <a href="#nasil-calisir">Nasıl Çalışır?</a>
              <a href="#ozellikler">Özellikler</a>
              <a href="#markalar">Markalar</a>
              <a href="#sss">SSS</a>
            </div>
            <a className="hd-nav-blog" href="/blog">Blog</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hd-container hd-hero" aria-labelledby="hd-hero-title">
          <div className="hd-hero-copy">
            <p className="hd-eyebrow">Fiziksel halı mağazaları için</p>
            <h1 id="hd-hero-title">Müşterilerinize <span>Halıları Evlerinde Gösterin</span></h1>
            <p className="hd-hero-description">Müşteriniz mağazanızdayken seçtiği halıyı yapay zekâyla kendi odasında görsün.</p>
            <form className="hd-interest" onSubmit={handleInterest}>
              <label className="hd-interest-field">
                <span className="hd-mail-icon" aria-hidden="true" />
                <input type="email" value={email} onChange={event => setEmail(event.currentTarget.value)}
                  placeholder="E-posta adresiniz" aria-label="Demo için e-posta adresiniz" autoComplete="email" required />
              </label>
              <button className="hd-button hd-button-primary" type="submit">Demo Talep Et</button>
            </form>
          </div>
          <HeroVisual />
        </section>

        <HowItWorks />
        <Features />
        <CatalogMarquee />
        <StoreTestimonial />
        <FaqSection />

        <section className="hd-contact hd-container" id="iletisim" aria-labelledby="hd-contact-title">
          <div className="hd-contact-picture"><img src={ROOM_AFTER} alt="" width={852} height={1002} loading="lazy" /></div>
          <div className="hd-contact-copy">
            <h2 id="hd-contact-title">Halı Dene’yi mağazanızda görün.</h2>
            <p>Mağazanızda nasıl kullanabileceğinizi, kurulum ve fiyat seçeneklerini birlikte konuşalım.</p>
            <button className="hd-button hd-button-primary" type="button" onClick={() => openRequest(email.trim())}>Demo Talep Et</button>
          </div>
        </section>
      </main>

      <footer className="hd-footer">
        <div className="hd-container hd-footer-inner">
          <div><a href="/" aria-label="Halı Dene ana sayfa"><BrandMark /></a><p>Fiziksel halı mağazaları için görselleştirme.</p></div>
          <nav aria-label="Alt menü"><a href="/blog">Blog</a><a href="/contact">İletişim</a><a href={WHATSAPP_URL}>WhatsApp</a></nav>
        </div>
        <div className="hd-container hd-copyright">© {new Date().getFullYear()} halidene.com · Tüm hakları saklıdır.</div>
      </footer>

      <dialog className="hd-demo-dialog" ref={dialog} aria-labelledby="hd-demo-title" onClose={() => setRequestEmail(null)}>
        <div className="hd-dialog-heading">
          <div><h2 id="hd-demo-title">Demo Talep Et</h2><p>Bilgilerinizi paylaşın, mağazanız için bir görüşme planlayalım.</p></div>
          <button className="hd-dialog-close" type="button" aria-label="Formu kapat" onClick={() => dialog.current?.close()}>×</button>
        </div>
        {requestEmail !== null && <ContactForm initialEmail={requestEmail} />}
      </dialog>
    </div>
  );
}

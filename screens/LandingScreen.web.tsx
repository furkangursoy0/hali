import React, { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent, type MouseEvent, type PointerEvent } from 'react';
import BrandMark from '../components/landing/BrandMark.web';
import ContactForm, { DEMO_WHATSAPP_URL, DemoFormHeading, demoEmailError } from '../components/landing/ContactForm.web';
import CATALOG from '../data/catalog-stats.json';

const CARPET_COUNT = `${Math.floor(CATALOG.totalCarpets / 100) * 100}+`;
const ROOM_BEFORE = '/landing/room-before.webp';
const ROOM_AFTER = '/landing/room-after.webp';

const SECTION_LINKS = [
  ['nasil-calisir', 'Nasıl Çalışır?'],
  ['ozellikler', 'Özellikler'],
  ['markalar', 'Markalar'],
  ['sss', 'SSS'],
];

const BRANDS = [
  ['Artemis', 'artemis'], ['Atlas', 'atlas'], ['Bahariye', 'bahariye'],
  ['Diora', 'diora'], ['Dolce Vita', 'dolce-vita'], ['Elexus', 'elexus'],
  ['Empera', 'empera'], ['İpek', 'ipek'], ['Jusco', 'jusco'],
  ['Karmen', 'karmen'], ['Kreasyon', 'kreasyon'], ['Merinos', 'merinos'],
  ['Padişah', 'padisah'], ['Pierre Cardin', 'pierre-cardin'], ['Royal Halı', 'royal'],
  ['Sanat', 'sanat'], ['Seyran', 'seyran'],
];

const YENISAFAK_MAP_URL = 'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent('Yenişafak Mahallesi, Alpaslan Türkeş Bulvarı 62/A, Merkezefendi, Denizli');

const STORE_FEATURES = [
  ['▤', 'Mağazanıza özel katalog', 'Farklı markaları ve kendi ürünlerinizi tek katalogda toplayın.'],
  ['▧', 'Ürün fotoğrafı yükleme', 'Kendi halı fotoğraflarınızı oda önizlemelerinde kullanın.'],
  ['✦', 'Yapay zekâyla halı deneme', 'Seçtiğiniz halıyı müşterinizin oda fotoğrafında gösterin.'],
  ['▣', 'Tablet ve kiosk desteği', 'Mağazada web sitesi entegrasyonu gerektirmeden kullanın.'],
];

export const landingFeatureList = STORE_FEATURES.map(([, title, description]) => `${title}. ${description}`);

const QUESTIONS = [
  ['Halı Dene mağazamda nasıl çalışır?', 'Müşterinizin oda fotoğrafını ekleyin, katalogdan bir halı seçin ve yapay zekânın hazırladığı oda önizlemesini mağazada birlikte inceleyin.'],
  ['Farklı markaların halılarını ve kendi ürünlerimi ekleyebilir miyim?', 'Evet. Farklı markaların ürün fotoğraflarını ve kendi çektiğiniz halı fotoğraflarını mağazanıza özel bir kataloğa ekleyebilir, her ürünü oda önizlemesinde kullanabilirsiniz.'],
  ['Geniş ürün katalogları destekleniyor mu?', 'Evet. Çok sayıda modeli mağazanıza özel tek bir katalogda, marka ve koleksiyona göre düzenleyebilirsiniz.'],
  ['Müşterimin oda fotoğrafında kendi halımı deneyebilir miyim?', 'Evet. Oda fotoğrafını yükleyin ve kataloğunuzdan bir halı seçin. Yapay zekâ halıyı fotoğraftaki zemine yerleştirir.'],
  ['Mağaza tabletinde kullanmak için web sitesi entegrasyonu gerekiyor mu?', 'Halı Dene fiziksel mağazada tablet veya kiosk üzerinden kullanılabilir. Mağazanızın internet sitesine entegrasyon gerekmez.'],
  ['Oda fotoğrafı nasıl eklenir?', 'Odanın mevcut bir fotoğrafını galeriden seçebilir veya cihazınızın kamerasıyla yeni bir fotoğraf çekebilirsiniz.'],
  ['Katalogda hangi markalar var?', `Katalogda ${CATALOG.totalBrands} markadan ${CARPET_COUNT} halı modeli bulunur. Sayfadaki marka şeridinde katalogdaki markaları görebilirsiniz.`],
  ['Önizleme ne kadar gerçeğe yakın?', 'Halı, oda fotoğrafının perspektifine ve ışığına göre yerleştirilir. Odanın açısı ve fotoğrafın kalitesi sonucu etkileyebilir. Kesin renk ve ölçüyü ürün bilgileriyle birlikte değerlendirin.'],
  ['Demo ve kurulum için kiminle görüşebilirim?', 'Demo formunu doldurun. Mağazanızda Halı Dene’yi nasıl kullanabileceğinizi, kurulum ve fiyatlandırmayı birlikte konuşalım.'],
];

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
        <img src={ROOM_AFTER} alt="Örnek odada yapay zekâyla yerleştirilmiş halı" width={852} height={1002} decoding="async" draggable={false} />
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
          width={1086} height={1448} fetchPriority="high" decoding="async" />
      </figure>
      <HeroComparison />
    </div>
  );
}

function HeroBenefits() {
  const items = [
    {
      title: 'QR ile fotoğraf aktarımı',
      description: 'Müşteriniz QR kodu okutup oda fotoğrafını telefonundan yükler.',
      icon: 'M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3M7 7h3v3H7zm7 0h3v3h-3zm-7 7h3v3H7zm7 0h3v3h-3z',
    },
    {
      title: 'Yapay Zeka Destekli',
      description: 'Halıyı odanın ışığına ve açısına göre gerçekçi biçimde gösterir.',
      icon: 'M10 3c.8 4.4 2.6 6.2 7 7-4.4.8-6.2 2.6-7 7-.8-4.4-2.6-6.2-7-7 4.4-.8 6.2-2.6 7-7Zm9 11v6m-3-3h6M19 3v4m-2-2h4',
    },
    {
      title: `${CARPET_COUNT} halı modeli`,
      description: 'Farklı marka ve koleksiyonları tek katalogda inceleyin.',
      icon: 'm12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5',
    },
  ];

  return (
    <ul className="hd-container hd-hero-benefits" aria-label="Mağazalar için Halı Dene özellikleri">
      {items.map(({ title, description, icon }) => (
        <li key={title}>
          <span className="hd-benefit-icon" aria-hidden="true">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" focusable="false">
              <path d={icon} />
            </svg>
          </span>
          <div>
            <strong>{title}</strong>
            <p>{description}</p>
          </div>
        </li>
      ))}
    </ul>
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
  return (
    <section className="hd-container hd-testimonial" aria-labelledby="hd-testimonial-title">
      <div className="hd-testimonial-photo">
        <img
          src="/landing/halici-gursoylar-storefront.webp"
          alt="Halıcı Gürsoylar mağazasının dış cephesi"
          width={1280}
          height={655}
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="hd-testimonial-copy">
        <p className="hd-testimonial-kicker">MAĞAZADAN GERÇEK BİR DENEYİM</p>
        <h2 id="hd-testimonial-title">Halı mağazalarının ihtiyaçlarından doğdu.</h2>
        <figure>
          <div className="hd-testimonial-quote">
            <span className="hd-testimonial-quote-mark" aria-hidden="true">“</span>
            <blockquote>
              Müşterilerimizin en çok zorlandığı konu, beğendikleri halının kendi evlerinde nasıl duracağını hayal etmekti. Halı Dene ile artık bunu mağazamızda birkaç saniye içinde gösterebiliyoruz.
            </blockquote>
          </div>
          <figcaption>
            <div className="hd-testimonial-author">
              <span className="hd-testimonial-initials" aria-hidden="true">EG</span>
              <div>
                <strong>Engin Gürsoy</strong>
                <p>Halıcı Gürsoylar · Denizli</p>
              </div>
            </div>
            <a className="hd-testimonial-link" href={YENISAFAK_MAP_URL} target="_blank" rel="noopener noreferrer"
              aria-label="Mağazayı İncele – Halıcı Gürsoylar Yenişafak Şubesi">
              Mağazayı İncele <span aria-hidden="true">↗</span>
            </a>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

function FaqSection() {
  const regionId = useId();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="hd-faq hd-container" id="sss" tabIndex={-1} aria-labelledby="hd-faq-title">
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
      alt: 'Mağazada QR kod okutma adımının temsili görseli',
    },
    {
      title: 'Oda fotoğrafını yükleyin',
      text: 'Halının deneneceği odanın fotoğrafını ekleyin.',
      image: 'room-upload',
      alt: 'Yükleme simgesiyle halısız bir oda fotoğrafı',
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
      alt: 'Krem klasik halının odaya yerleştirildiği sonuç ekranı',
    },
  ];

  return (
    <section className="hd-flow" id="nasil-calisir" tabIndex={-1} aria-labelledby="hd-flow-title">
      <div className="hd-container">
        <div className="hd-section-heading">
          <h2 id="hd-flow-title">Nasıl Çalışır?</h2>
          <p>Oda fotoğrafından mağaza içi sunuma, dört adımda.</p>
        </div>
        <ol className="hd-step-grid">
          {steps.map(({ title, text, image, alt }, index) => (
            <li key={title}>
              <div className="hd-step-visual">
                <img src={`/landing/steps/${image}.webp`} alt={alt} width={720} height={720} loading="lazy" decoding="async" />
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
  return (
    <section className="hd-container hd-features" id="ozellikler" tabIndex={-1} aria-labelledby="hd-feature-title">
      <div className="hd-features-heading">
        <h2 id="hd-feature-title">Mağazalar için halı deneme uygulaması</h2>
        <p>Koleksiyonunuzu mağazada dijital olarak sunun. Müşteriniz seçtiği halıyı kendi odasında görsün.</p>
      </div>
      <ul className="hd-feature-grid">
        {STORE_FEATURES.map(([icon, title, description]) => (
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
  const emailInput = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [requestEmail, setRequestEmail] = useState<string | null>(null);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    const scrollToHash = () => {
      const id = window.location.hash.slice(1);
      if (SECTION_LINKS.some(([section]) => section === id)) {
        document.getElementById(id)?.scrollIntoView({ block: 'start' });
      }
    };

    scrollToHash();
    window.addEventListener('hashchange', scrollToHash);
    return () => window.removeEventListener('hashchange', scrollToHash);
  }, []);

  function handleSectionLink(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const hash = event.currentTarget.hash;
    const section = document.getElementById(hash.slice(1));
    if (!section) return;

    event.preventDefault();
    window.history.replaceState(window.history.state, '', hash);
    section.focus({ preventScroll: true });
    section.scrollIntoView({ block: 'start' });
  }

  function openRequest(initialEmail = '') {
    setRequestEmail(initialEmail);
    dialog.current?.showModal();
  }

  function handleInterest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const field = emailInput.current;
    if (!field) return;

    const error = demoEmailError(field);
    setEmailError(error);
    if (error) {
      field.focus();
      return;
    }
    openRequest(field.value.trim());
  }

  return (
    <div className="hd-landing hd-home">
      <header className="hd-navbar">
        <div className="hd-container hd-navbar-inner">
          <a href="/" aria-label="Halı Dene ana sayfa"><BrandMark /></a>
          <nav aria-label="Ana menü">
            <div className="hd-navbar-links">
              {SECTION_LINKS.map(([id, title]) => (
                <a key={id} href={`#${id}`} onClick={handleSectionLink}>{title}</a>
              ))}
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
            <form className="hd-interest" onSubmit={handleInterest} noValidate>
              <label className="hd-interest-field">
                <span className="hd-mail-icon" aria-hidden="true" />
                <input ref={emailInput} type="email" value={email} onChange={event => {
                  setEmail(event.currentTarget.value);
                  setEmailError('');
                }} placeholder="E-posta adresiniz" aria-label="Demo için e-posta adresiniz" autoComplete="email"
                  aria-invalid={emailError ? true : undefined} aria-describedby={emailError ? 'hd-interest-error' : undefined} required />
              </label>
              <button className="hd-button hd-button-primary" type="submit">Demo Talep Et</button>
              {emailError && <p id="hd-interest-error" className="hd-form-error" role="alert">{emailError}</p>}
            </form>
          </div>
          <HeroVisual />
        </section>
        <HeroBenefits />
        <StoreTestimonial />
        <HowItWorks />
        <Features />
        <CatalogMarquee />
        <FaqSection />

        <section className="hd-contact hd-container" id="iletisim" aria-labelledby="hd-contact-title">
          <div className="hd-contact-picture">
            <img src="/landing/store-tablet-demo.webp" alt="Tablette Halı Dene kataloğu ve odada halı önizlemesi"
              width={1152} height={768} loading="lazy" decoding="async" />
          </div>
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
          <nav aria-label="Alt menü"><a href="/blog">Blog</a><a href="/iletisim">İletişim</a><a href={DEMO_WHATSAPP_URL}>WhatsApp</a></nav>
        </div>
        <div className="hd-container hd-copyright">© {new Date().getFullYear()} halidene.com · Tüm hakları saklıdır.</div>
      </footer>

      <dialog className="hd-demo-dialog" ref={dialog} aria-labelledby="hd-demo-title" onClose={() => setRequestEmail(null)}>
        <DemoFormHeading id="hd-demo-title" />
        <button className="hd-dialog-close" type="button" aria-label="Formu kapat" onClick={() => dialog.current?.close()}>×</button>
        {requestEmail !== null && <ContactForm initialEmail={requestEmail} />}
      </dialog>
    </div>
  );
}

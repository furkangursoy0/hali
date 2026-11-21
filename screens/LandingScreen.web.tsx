import React, { useId, useRef, useState, type FormEvent } from 'react';
import ContactForm from '../components/landing/ContactForm.web';
import CATALOG from '../data/catalog-stats.json';
import '../components/landing/web-landing.css';

const WHATSAPP_URL = 'https://wa.me/905300947756?text='
  + encodeURIComponent('Merhaba, fiziksel halı mağazam için Halı Dene hakkında bilgi almak istiyorum.');
const CARPET_COUNT = `${Math.floor(CATALOG.totalCarpets / 100) * 100}+`;
const ROOM_BEFORE = '/landing/room-before.webp';
const ROOM_AFTER = '/landing/room-after.webp';
const RUG = '/landing/rug.webp';

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

const DEFAULT_COMPARISON_SPLIT = 50;

function HeroComparison() {
  const [split, setSplit] = useState(DEFAULT_COMPARISON_SPLIT);

  return (
    <figure className="hd-hero-comparison" id="oda-onizleme">
      <figcaption className="hd-preview-heading">
        <img src={RUG} alt="" width={30} height={30} decoding="async" />
        <span><small>Önce / Sonra</small><strong>Oda Önizlemesi</strong></span>
      </figcaption>
      <div className="hd-comparison-images">
        <img src={ROOM_AFTER} alt="Örnek salonda yapay zekâyla yerleştirilmiş halı" width={852} height={1002} decoding="async" />
        <img className="hd-comparison-before" src={ROOM_BEFORE} alt="" width={852} height={1002} decoding="async"
          style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }} />
        <span className="hd-comparison-divider" style={{ left: `${split}%` }} aria-hidden="true"><span>↔</span></span>
        <input
          type="range"
          min={0}
          max={100}
          value={split}
          onChange={event => setSplit(event.currentTarget.valueAsNumber)}
          aria-label="Halı eklenmeden önceki ve sonraki oda görüntüsünü karşılaştır"
          aria-valuetext={`Önce yüzde ${split}, sonra yüzde ${100 - split}`}
        />
      </div>
      <div className="hd-preview-actions">
        <button className="hd-compare-reset" type="button" aria-label="Karşılaştırmayı ortala" onClick={() => setSplit(DEFAULT_COMPARISON_SPLIT)}><span aria-hidden="true">↻</span></button>
        <button type="button" aria-pressed={split === 100} onClick={() => setSplit(100)}>Önce</button>
        <button type="button" aria-pressed={split === 0} onClick={() => setSplit(0)}>Sonra</button>
      </div>
    </figure>
  );
}

function StorePreview() {
  return (
    <div className="hd-hero-media">
      <section className="hd-showroom" aria-label="Halı Dene mağaza ekranı önizlemesi">
        <div className="hd-showroom-chrome" aria-hidden="true"><i /><i /><i /><span /></div>
        <div className="hd-showroom-header"><strong>Halı Dene</strong><span>Mağaza ekranı</span></div>
        <div className="hd-showroom-panel">
          <div className="hd-showroom-image">
            <img src="/landing/store-kiosk.webp"
              alt="Halı mağazasında oda önizlemesini gösteren Halı Dene ekranı"
              width={1160} height={1160} fetchPriority="high" decoding="async" />
          </div>
          <div className="hd-showroom-selection">
            <div className="hd-showroom-rug">
              <img src={RUG} alt="" width={68} height={96} decoding="async" />
              <div><small>Seçili halı</small><strong>Klasik desenli halı</strong></div>
            </div>
            <a href="#oda-onizleme" className="hd-showroom-action"><span aria-hidden="true">✦</span>Odada Gör</a>
          </div>
        </div>
      </section>
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
      title: 'Oda fotoğrafını ekleyin',
      text: 'Müşterinizin oda fotoğrafını galeriden seçin veya kamerayla çekin.',
      visual: <div className="hd-upload-mock"><span aria-hidden="true">⇧</span>Oda fotoğrafı</div>,
    },
    {
      title: 'Halıyı seçin',
      text: 'Marka ve koleksiyondan müşterinizin beğendiği halıyı bulun.',
      visual: <div className="hd-catalog-mock"><img src={RUG} alt="" loading="lazy" /><span>Klasik desenli halı<small>Katalog</small></span></div>,
    },
    {
      title: 'Halıyı odada görün',
      text: 'Yapay zekâ seçtiğiniz halıyı oda fotoğrafına yerleştirir.',
      visual: <img className="hd-step-photo" src={ROOM_AFTER} alt="Örnek salonda halı önizlemesi" loading="lazy" />,
    },
    {
      title: 'Sonucu paylaşın',
      text: 'Önce ve sonrayı müşterinize gösterin, sonucu kaydedin veya paylaşın.',
      visual: <div className="hd-compare-mock">
        <div><img src={ROOM_BEFORE} alt="" loading="lazy" /><small>Önce</small></div>
        <div><img src={ROOM_AFTER} alt="" loading="lazy" /><small>Sonra</small></div>
      </div>,
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
          {steps.map(({ title, text, visual }, index) => (
            <li key={title}>
              <div className="hd-step-visual">{visual}</div>
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
          <StorePreview />
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

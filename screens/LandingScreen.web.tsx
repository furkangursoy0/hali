import React, { useRef, useState } from 'react';
import { AppPreview, ExampleDemo, FlowShowcase, type StoreMode } from '../components/landing/AppPreview.web';
import CATALOG from '../data/catalog-stats.json';
import '../components/landing/web-landing.css';

const WHATSAPP_URL = 'https://wa.me/905300947756?text='
  + encodeURIComponent('Merhaba, Halı Dene hakkında bilgi almak istiyorum.');
const CARPET_COUNT = `${Math.floor(CATALOG.totalCarpets / 100) * 100}+`;

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
  {
    question: 'Halı Dene fiziksel mağazada nasıl kullanılır?',
    answer: 'Müşterinizin oda fotoğrafını ekleyin ve denemek istediği halıyı seçin. Yapay zeka ile oluşturulan önizlemeyi mağazada birlikte karşılaştırabilir, sonucu müşterinize gösterebilirsiniz.',
  },
  {
    question: 'Online mağazamda nasıl kullanabilirim?',
    answer: 'Halı deneme deneyimi, müşterinin beğendiği ürünü kendi oda fotoğrafıyla görmesine yardımcı olur. Sitenize uygun kurulum ve ürün görselleri için bizimle iletişime geçin.',
  },
  {
    question: 'Demoyu denemek için hesap açmam gerekir mi?',
    answer: 'Örnek oda demosu hesap gerektirmez. Hazır bir oda fotoğrafı ve halıyla önizleme deneyimini keşfedebilirsiniz.',
  },
  {
    question: 'Katalogda kaç halı ve marka var?',
    answer: `Katalogda ${CATALOG.totalBrands} markadan ${CARPET_COUNT} halı modeli bulunuyor.`,
  },
  {
    question: 'Halı gerçek renkte ve ölçüde görünür mü?',
    answer: 'Önizleme, halının odada nasıl durabileceğini gösterir. Fotoğrafın ışığı, açısı ve çözünürlüğü sonucu etkileyebilir. Kesin renk ve ölçü için ürün bilgilerini kontrol edin.',
  },
  {
    question: 'Fiyat ve kurulum bilgisine nasıl ulaşırım?',
    answer: 'Mağaza türünüzü ve ihtiyacınızı iletişim formundan ya da WhatsApp üzerinden bize bildirin.',
  },
];

function BrandMark() {
  return <span className="hd-wordmark">Halı <span>Dene</span></span>;
}

function CatalogMarquee() {
  const [paused, setPaused] = useState(false);

  return (
    <section id="markalar" className="hd-catalog" aria-labelledby="hd-catalog-title">
      <div className="hd-container hd-section-heading">
        <h2 id="hd-catalog-title">{CARPET_COUNT} Halı Kataloğu</h2>
        <p>Markaları keşfedin</p>
      </div>
      <div className="hd-marquee" data-paused={paused}>
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
      <button
        className="hd-marquee-toggle"
        type="button"
        onClick={() => setPaused(!paused)}
      >
        {paused ? 'Logoları oynat' : 'Logoları duraklat'}
      </button>
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
  return (
    <section className="hd-faq hd-container" id="sss" aria-labelledby="hd-faq-title">
      <div className="hd-section-heading"><h2 id="hd-faq-title">Sık Sorulan Sorular</h2></div>
      <div className="hd-faq-list">
        {QUESTIONS.map(({ question, answer }) => (
          <details name="hd-faq" key={question}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export default function LandingScreen() {
  const [store, setStore] = useState<StoreMode>('physical');
  const demoDialog = useRef<HTMLDialogElement>(null);
  const openDemo = () => demoDialog.current?.showModal();

  return (
    <div className="hd-landing">
      <header className="hd-navbar">
        <div className="hd-container hd-navbar-inner">
          <a href="/" aria-label="Halı Dene ana sayfa"><BrandMark /></a>
          <nav aria-label="Ana menü">
            <a href="#nasil-calisir">Nasıl Çalışır?</a>
            <a href="#markalar">Markalar</a>
            <a href="#sss">SSS</a>
            <a href="/blog">Blog</a>
          </nav>
          <a className="hd-button hd-button-secondary" href="/contact">İletişim</a>
        </div>
      </header>

      <main>
        <section className="hd-container hd-hero" aria-labelledby="hd-hero-title">
          <div className="hd-hero-copy">
            <h1 id="hd-hero-title">Müşterilerinize Halıları Evlerinde Gösterin</h1>
            <p>Yapay zeka ile halılarınızı müşterinizin odasına yerleştirin. Satışlarınızı artırın, iadeleri azaltın.</p>
            <div className="hd-store-switch" role="group" aria-label="Mağaza türü">
              <button type="button" aria-pressed={store === 'physical'} onClick={() => setStore('physical')}>Fiziksel mağaza</button>
              <button type="button" aria-pressed={store === 'online'} onClick={() => setStore('online')}>Online mağaza</button>
            </div>
            <div className="hd-hero-actions">
              <button type="button" className="hd-button hd-button-primary" onClick={openDemo}>Demoyu dene</button>
              <a className="hd-button hd-button-secondary" href="#iletisim">Mağazanız için bilgi alın</a>
            </div>
          </div>
          <AppPreview mode={store} onDemo={openDemo} />
        </section>

        <dl className="hd-container hd-proof">
          <div><dt>Halı Çeşidi</dt><dd>{CARPET_COUNT}</dd></div>
          <div><dt>Marka</dt><dd>{CATALOG.totalBrands}</dd></div>
          <div><dt>Sonuç Süresi</dt><dd>~30 sn</dd></div>
        </dl>

        <FlowShowcase onDemo={openDemo} />
        <CatalogMarquee />
        <StoreTestimonial />
        <FaqSection />

        <section className="hd-contact hd-container" id="iletisim" aria-labelledby="hd-contact-title">
          <div>
            <h2 id="hd-contact-title">Bilgi Almak İster Misiniz?</h2>
            <p>Halı Dene’yi mağazanızda kullanmak, demo almak veya fiyat bilgisi için bize ulaşın.</p>
          </div>
          <div className="hd-contact-actions">
            <a className="hd-button hd-button-primary" href={WHATSAPP_URL}>WhatsApp ile Ulaşın</a>
            <a className="hd-button hd-button-secondary" href="/contact">İletişim Formu</a>
          </div>
        </section>
      </main>

      <footer className="hd-footer">
        <div className="hd-container hd-footer-inner">
          <div><a href="/" aria-label="Halı Dene ana sayfa"><BrandMark /></a><p>Yapay zeka destekli halı deneme platformu. Halıları odalarda canlandırın.</p></div>
          <nav aria-label="Alt menü"><a href="/blog">Blog</a><a href="/contact">İletişim Formu</a><a href="tel:+905300947756">0530 094 77 56</a></nav>
        </div>
        <div className="hd-container hd-copyright">© {new Date().getFullYear()} halidene.com · Tüm hakları saklıdır.</div>
      </footer>
      <ExampleDemo dialogRef={demoDialog} />
    </div>
  );
}

import React from 'react';
import ContactForm from '../components/landing/ContactForm.web';
import '../components/landing/web-landing.css';

export default function ContactScreen() {
  return (
    <main className="hd-landing hd-contact-page">
      <a className="hd-wordmark" href="/" aria-label="Halı Dene ana sayfa">
        <span className="hd-brand-mark" aria-hidden="true">H</span>Halı Dene
      </a>
      <section className="hd-contact-panel" aria-labelledby="contact-title">
        <h1 id="contact-title">Demo Talep Et</h1>
        <p>Bilgilerinizi paylaşın, mağazanız için bir demo görüşmesi planlayalım.</p>
        <ContactForm />
      </section>
    </main>
  );
}

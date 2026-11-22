import React from 'react';
import BrandMark from '../components/landing/BrandMark.web';
import ContactForm, { DemoFormHeading } from '../components/landing/ContactForm.web';

export const contactMetadata = {
  title: 'İletişim | Halı Dene',
  description: 'Halı Dene’yi fiziksel mağazanızda görmek için demo talep edin.',
};

export default function ContactScreen() {
  return (
    <main className="hd-landing hd-contact-page">
      <header className="hd-container">
        <a href="/" aria-label="Halı Dene ana sayfa"><BrandMark /></a>
      </header>
      <section className="hd-contact-panel" aria-labelledby="contact-title">
        <DemoFormHeading id="contact-title" as="h1" />
        <ContactForm />
      </section>
    </main>
  );
}

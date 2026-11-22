import React, { useId, useRef, useState, type FormEvent } from 'react';
import axios from 'axios';

const FORM_CODE = 'eaa76ad89c4c9094c3bbd234fc808a43';
const FORM_URL = 'https://formsubmit.co';
const FORM_DETAILS = {
  _subject: 'Halı Dene demo talebi',
  _template: 'table',
  _url: 'https://halidene.com/contact',
};
const SUBMISSION_ERROR = 'Talebiniz formdan iletilemedi. WhatsApp üzerinden demo talep edebilirsiniz.';

export const DEMO_WHATSAPP_URL = 'https://wa.me/905300947756?text='
  + encodeURIComponent('Merhaba, fiziksel halı mağazam için Halı Dene hakkında bilgi almak istiyorum.');

interface ContactFormProps {
  initialEmail?: string;
}

export function DemoFormHeading({ id, as: Heading = 'h2' }: { id: string; as?: 'h1' | 'h2' }) {
  return (
    <header className="hd-demo-intro">
      <span className="hd-demo-icon" aria-hidden="true">
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M16 3v4M8 3v4M3 10h18m-12 5 2 2 4-4" />
        </svg>
      </span>
      <Heading id={id}>Demo Talep Et</Heading>
      <p>Mağazanız için bir demo görüşmesi planlayalım.</p>
    </header>
  );
}

export function demoEmailError(field: HTMLInputElement) {
  if (!field.value.trim()) return 'Lütfen e-posta adresinizi girin.';
  if (field.validity.typeMismatch) return 'Lütfen geçerli bir e-posta adresi girin.';
  return '';
}

export default function ContactForm({ initialEmail = '' }: ContactFormProps) {
  const fieldId = useId();
  const submitting = useRef(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;

    const form = event.currentTarget;
    const invalidInput = Array.from(form.querySelectorAll('input')).find(input => !input.validity.valid);
    const fields = new FormData(form);
    const field = (name: string) => String(fields.get(name) ?? '').trim();
    const payload = { name: field('name'), surname: field('surname'), email: field('email'), phone: field('phone') };

    setError('');
    if (invalidInput || Object.values(payload).some(value => !value)) {
      setError(invalidInput?.type === 'email' ? demoEmailError(invalidInput) : 'Lütfen tüm alanları doldurun.');
      invalidInput?.focus();
      return;
    }
    if (payload.phone.replace(/\D/g, '').length < 10) {
      setError('Telefon numaranız en az 10 rakam içermeli.');
      return;
    }

    submitting.current = true;
    setStatus('sending');
    try {
      const body = new URLSearchParams({
        name: `${payload.name} ${payload.surname}`,
        email: payload.email,
        Telefon: payload.phone,
        _honey: field('_honey'),
        ...FORM_DETAILS,
      });
      const { data } = await axios.post(`${FORM_URL}/ajax/${FORM_CODE}`, body, {
        headers: { Accept: 'application/json' },
        timeout: 11000,
      });
      if (data?.success !== true && data?.success !== 'true') {
        throw new Error('FormSubmit did not accept the submission.');
      }
      setStatus('sent');
    } catch {
      setError(SUBMISSION_ERROR);
      setStatus('idle');
    } finally {
      submitting.current = false;
    }
  }

  if (status === 'sent') {
    return (
      <div className="hd-contact-success" role="status">
        <strong>Talebiniz alındı.</strong>
        <p>Mağazanız için demo görüşmesini planlamak üzere sizinle iletişime geçeceğiz.</p>
      </div>
    );
  }

  return (
    <form className="hd-contact-form" action={`${FORM_URL}/${FORM_CODE}`} method="post"
      onSubmit={submit} noValidate aria-busy={status === 'sending'}>
      {Object.entries(FORM_DETAILS).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <input type="text" name="_honey" hidden tabIndex={-1} autoComplete="off" />
      <div className="hd-contact-fields">
        <label htmlFor={`${fieldId}-name`}>Ad
          <input className="hd-input" id={`${fieldId}-name`} name="name" autoComplete="given-name" placeholder="Adınız" maxLength={80} required />
        </label>
        <label htmlFor={`${fieldId}-surname`}>Soyad
          <input className="hd-input" id={`${fieldId}-surname`} name="surname" autoComplete="family-name" placeholder="Soyadınız" maxLength={80} required />
        </label>
      </div>
      <label htmlFor={`${fieldId}-email`}>E-posta
        <input className="hd-input" id={`${fieldId}-email`} name="email" type="email" autoComplete="email" placeholder="ornek@magaza.com" defaultValue={initialEmail} maxLength={254} required />
      </label>
      <label htmlFor={`${fieldId}-phone`}>Telefon
        <input className="hd-input" id={`${fieldId}-phone`} name="phone" type="tel" autoComplete="tel" placeholder="05XX XXX XX XX" maxLength={35} required />
      </label>
      {error && <p className="hd-form-error" role="alert">{error}</p>}
      <div className="hd-demo-actions">
        <button type="submit" className="hd-button hd-button-primary" disabled={status === 'sending'}>
          {status === 'sending' ? 'Gönderiliyor…' : 'Talebi Gönder'}
          <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12h15m-6-6 6 6-6 6" />
          </svg>
        </button>
        <a className="hd-button hd-contact-whatsapp" href={DEMO_WHATSAPP_URL}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          WhatsApp
        </a>
      </div>
    </form>
  );
}

import React, { useId, useRef, useState, type FormEvent } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../constants/env';

export const DEMO_WHATSAPP_URL = 'https://wa.me/905300947756?text='
  + encodeURIComponent('Merhaba, fiziksel halı mağazam için Halı Dene hakkında bilgi almak istiyorum.');

interface ContactFormProps {
  initialEmail?: string;
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
      await axios.post(`${API_BASE_URL}/contact`, payload, { timeout: 8000 });
      setStatus('sent');
    } catch (failure) {
      const message = axios.isAxiosError(failure) ? failure.response?.data?.error : undefined;
      setError(typeof message === 'string' && message ? message : 'Talebiniz formdan iletilemedi. WhatsApp üzerinden demo talep edebilirsiniz.');
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
    <form className="hd-contact-form" onSubmit={submit} noValidate aria-busy={status === 'sending'}>
      <div className="hd-contact-fields">
        <label htmlFor={`${fieldId}-name`}>Ad
          <input className="hd-input" id={`${fieldId}-name`} name="name" autoComplete="given-name" required />
        </label>
        <label htmlFor={`${fieldId}-surname`}>Soyad
          <input className="hd-input" id={`${fieldId}-surname`} name="surname" autoComplete="family-name" required />
        </label>
      </div>
      <label htmlFor={`${fieldId}-email`}>E-posta
        <input className="hd-input" id={`${fieldId}-email`} name="email" type="email" autoComplete="email" defaultValue={initialEmail} required />
      </label>
      <label htmlFor={`${fieldId}-phone`}>Telefon
        <input className="hd-input" id={`${fieldId}-phone`} name="phone" type="tel" autoComplete="tel" required />
      </label>
      {error && <p className="hd-form-error" role="alert">{error}</p>}
      <button type="submit" className="hd-button hd-button-primary" disabled={status === 'sending'}>
        {status === 'sending' ? 'Gönderiliyor…' : 'Talebi Gönder'}
      </button>
      <a className="hd-contact-whatsapp" href={DEMO_WHATSAPP_URL}>WhatsApp’tan demo talep et</a>
    </form>
  );
}

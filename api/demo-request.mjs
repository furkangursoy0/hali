const SITE_ORIGIN = 'https://halidene.com';
const FORM_RELAY = 'https://formsubmit.co/ajax/furkangpgd@gmail.com';
const DELIVERY_ERROR = 'Talebiniz e-postayla iletilemedi. WhatsApp üzerinden demo talep edebilirsiniz.';

function error(status, message) {
  return Response.json({ error: message }, { status });
}

function deliveryError(code) {
  return Response.json({ error: DELIVERY_ERROR, code }, { status: 503 });
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return Response.json({ error: 'Bu adres yalnızca form gönderimi içindir.' }, {
        status: 405,
        headers: { Allow: 'POST' },
      });
    }

    const origin = request.headers.get('origin');
    if (origin !== SITE_ORIGIN && origin !== new URL(request.url).origin) {
      return error(403, 'Lütfen demo formunu Halı Dene üzerinden gönderin.');
    }

    if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') {
      return error(415, 'Form verisi okunamadı.');
    }

    let fields;
    try {
      const body = await request.text();
      if (body.length > 4096) return error(413, 'Form bilgileri çok uzun.');
      fields = JSON.parse(body);
    } catch {
      return error(400, 'Form verisi okunamadı.');
    }

    if (fields?.website) return error(400, 'Form doğrulanamadı.');

    const field = (key) => typeof fields?.[key] === 'string' ? fields[key].trim().replace(/\s+/g, ' ') : '';
    const name = field('name');
    const surname = field('surname');
    const email = field('email');
    const phone = field('phone');
    if (!name || name.length > 80 || !surname || surname.length > 80) {
      return error(400, 'Lütfen adınızı ve soyadınızı girin.');
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return error(400, 'Lütfen geçerli bir e-posta adresi girin.');
    }
    if (phone.length > 35 || phone.replace(/\D/g, '').length < 10) {
      return error(400, 'Lütfen geçerli bir telefon numarası girin.');
    }

    try {
      const relay = await fetch(FORM_RELAY, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Origin: SITE_ORIGIN,
          Referer: `${SITE_ORIGIN}/contact`,
        },
        body: JSON.stringify({
          name: `${name} ${surname}`,
          email,
          Telefon: phone,
          _subject: 'Halı Dene demo talebi',
          _template: 'table',
          _url: `${SITE_ORIGIN}/contact`,
        }),
        redirect: 'error',
        signal: AbortSignal.timeout(8000),
      });
      if (!relay.ok) return deliveryError(`relay_http_${relay.status}`);
      const result = await relay.json().catch(() => null);
      if (!result) return deliveryError('relay_invalid_response');
      if (result.success !== true && result.success !== 'true') {
        return deliveryError(/activation/i.test(String(result.message)) ? 'relay_needs_activation' : 'relay_rejected');
      }
      return Response.json({ ok: true });
    } catch (cause) {
      if (cause?.name === 'TimeoutError') return deliveryError('relay_timeout');
      return deliveryError('relay_unavailable');
    }
  },
};

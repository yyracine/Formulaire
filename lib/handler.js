/**
 * Envoi du questionnaire par e-mail (Resend).
 * Code indépendant de la plateforme : Vercel, Netlify et Cloudflare Pages
 * l'appellent avec leurs propres variables d'environnement.
 *
 * Variables attendues :
 *   RESEND_API_KEY  (obligatoire)
 *   MAIL_TO         (obligatoire)  destinataire des questionnaires
 *   MAIL_FROM       (optionnel)    "Nom <adresse@domaine>" ; defaut onboarding@resend.dev
 *   MAIL_SUBJECT_PREFIX (optionnel)
 *   MAIL_ATTACHMENT_NAME (optionnel)
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const MAX_MARKDOWN = 200_000; // ~200 Ko de texte
const MIN_MARKDOWN = 40;

const encoder = new TextEncoder();

function toBase64(text) {
  const bytes = encoder.encode(text);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readEnv(platformEnv) {
  const base = typeof process !== 'undefined' && process.env ? process.env : {};
  const merged = { ...base, ...(platformEnv || {}) };
  return {
    apiKey: (merged.RESEND_API_KEY || '').trim(),
    to: (merged.MAIL_TO || '').trim(),
    from: (merged.MAIL_FROM || 'Questionnaire Site <onboarding@resend.dev>').trim(),
    prefix: (merged.MAIL_SUBJECT_PREFIX || '').trim(),
    attachmentName: (merged.MAIL_ATTACHMENT_NAME || 'questionnaire.md').trim(),
  };
}

function safeFileName(name, fallback) {
  const cleaned = String(name || '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
  return cleaned && cleaned.includes('.') ? cleaned : fallback;
}

function replyTo(email) {
  const value = String(email || '').trim();
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value) ? value : undefined;
}

function json(status, body) {
  return { status, body };
}

/** Construit l'e-mail (texte + HTML) a partir du document Markdown. */
function buildEmail({ markdown, client, filename }) {
  const name = (client?.name || '').trim();
  const company = (client?.company || '').trim();
  const email = (client?.email || '').trim();
  const phone = (client?.phone || '').trim();

  const who = company || name || 'Client';
  const fullSubject = `Nouveau questionnaire site web — ${who}`;

  const text = [
    `Nouveau questionnaire de création de site web`,
    ``,
    `Client    : ${name || '-'}`,
    `Entreprise: ${company || '-'}`,
    `E-mail    : ${email || '-'}`,
    `Téléphone : ${phone || '-'}`,
    ``,
    `Le document Markdown complet est joint à cet e-mail.`,
    ``,
    `---------------------------------------------`,
    ``,
    markdown,
  ].join('\n');

  const rows = [
    ['Client', name],
    ['Entreprise', company],
    ['E-mail', email],
    ['Téléphone', phone],
  ]
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#6b7691;font-size:13px">${escapeHtml(k)}</td><td style="padding:4px 0;font-weight:600;font-size:13px;color:#0f172e">${escapeHtml(v)}</td></tr>`,
    )
    .join('');

  const html = `<!doctype html>
<html lang="fr"><body style="margin:0;background:#f6f5f2;padding:24px;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif">
  <div style="max-width:760px;margin:0 auto;background:#fff;border-radius:14px;border:1px solid #e2e1dc;overflow:hidden">
    <div style="padding:20px 24px;background:#0f172e;color:#fff">
      <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#c9a66b">Questionnaire site web</div>
      <div style="font-size:20px;font-weight:700;margin-top:6px">${escapeHtml(who)}</div>
    </div>
    <div style="padding:20px 24px">
      <table style="border-collapse:collapse">${rows}</table>
      <p style="font-size:13px;color:#6b7691;margin:18px 0 10px">Le questionnaire complet est joint au format Markdown (${escapeHtml(filename)}). Copie ci-dessous pour lecture rapide :</p>
      <pre style="white-space:pre-wrap;word-break:break-word;font-family:ui-monospace,Consolas,Menlo,monospace;font-size:12px;line-height:1.55;background:#f7f6f2;border:1px solid #e2e1dc;border-radius:10px;padding:14px;margin:0;color:#1b2438">${escapeHtml(markdown)}</pre>
    </div>
    <div style="padding:14px 24px;border-top:1px solid #e2e1dc;color:#8a92a6;font-size:11px">
      Message généré automatiquement par le formulaire client.
    </div>
  </div>
</body></html>`;

  return { subject: fullSubject, text, html };
}

/**
 * @param {object} payload { markdown, filename, client?: {name, company, email, phone} }
 * @param {object} platformEnv variables d'environnement de la plateforme
 * @returns {Promise<{status:number, body:object}>}
 */
export async function sendQuestionnaire(payload, platformEnv) {
  const env = readEnv(platformEnv);

  if (!env.apiKey || !env.to) {
    return json(501, {
      ok: false,
      error: 'email_not_configured',
      message:
        "L'envoi d'e-mail n'est pas configuré (RESEND_API_KEY et MAIL_TO manquants). Le document reste téléchargeable.",
    });
  }

  const markdown = typeof payload?.markdown === 'string' ? payload.markdown : '';
  if (markdown.trim().length < MIN_MARKDOWN) {
    return json(400, { ok: false, error: 'empty_document' });
  }
  if (markdown.length > MAX_MARKDOWN) {
    return json(413, { ok: false, error: 'document_too_large' });
  }

  const filename = safeFileName(payload?.filename, env.attachmentName);
  const { subject, text, html } = buildEmail({
    markdown,
    client: payload?.client,
    filename,
  });

  const mail = {
    from: env.from,
    to: [env.to],
    subject: env.prefix ? `${env.prefix} ${subject}` : subject,
    text,
    html,
    attachments: [
      {
        filename,
        content: toBase64(markdown),
        content_type: 'text/markdown; charset=utf-8',
      },
    ],
  };

  const reply = replyTo(payload?.client?.email);
  if (reply) mail.reply_to = reply;

  let response;
  try {
    response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(mail),
    });
  } catch {
    return json(502, { ok: false, error: 'provider_unreachable' });
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return json(502, {
      ok: false,
      error: 'provider_error',
      status: response.status,
      message: data?.message || data?.error || 'Envoi refusé par le fournisseur d’e-mail.',
    });
  }

  return json(200, { ok: true, id: data?.id || null });
}

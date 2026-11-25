/**
 * Génération du document Markdown à partir des réponses.
 * Module pur (aucune API navigateur) : utilisable dans le navigateur et sous Node.
 */

import { SCHEMA, detailId, isVisible } from './schema.js';

export const EMPTY = '_(non renseigné)_';

const BOX = { on: '☑', off: '☐' };

/* ------------------------------- utilitaires ------------------------------ */

export function slug(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export function formatDateFr(date = new Date()) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} à ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Nom du fichier .md proposé au client. */
export function buildFileName(data, date = new Date()) {
  const d = new Date(date);
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const who = slug(data?.entreprise) || slug(data?.nomPrenom) || 'client';
  return `questionnaire-site-${who}-${stamp}.md`;
}

const clean = (v) => String(v ?? '').replace(/\r\n/g, '\n').trim();

const oneLine = (v) => clean(v).replace(/\s*\n\s*/g, ' ');

/** Valeur libre multiligne -> bloc Markdown lisible. */
function block(text) {
  const lines = clean(text).split('\n');
  return ['', ...lines.map((l) => `  ${l || ' '}`), ''];
}

/* --------------------------- rendu d'un champ ----------------------------- */

function detailOf(data, field, option) {
  return clean(data[detailId(field.id, option.value)]);
}

function renderField(field, data, out) {
  const raw = data[field.id];

  switch (field.type) {
    case 'confirm': {
      const checked = raw === true || raw === 'true' || raw === 'on';
      out.push(`- ${checked ? BOX.on : BOX.off} **${field.label}**`);
      out.push('');
      return;
    }

    case 'radio': {
      const value = clean(raw);
      if (!value) {
        out.push(`- **${field.label}** : ${EMPTY}`);
        return;
      }
      const option = (field.options || []).find((o) => o.value === value);
      const detail = option?.text ? detailOf(data, field, option) : '';
      out.push(`- **${field.label}** : ${value}${detail ? ` — ${detail}` : ''}`);
      return;
    }

    case 'checks': {
      const selected = Array.isArray(raw) ? raw : raw ? [raw] : [];
      out.push(`- **${field.label}** :`);
      for (const option of field.options || []) {
        const on = selected.includes(option.value);
        const detail = on && option.text ? detailOf(data, field, option) : '';
        out.push(`  - ${on ? BOX.on : BOX.off} ${option.value}${detail ? ` — ${detail}` : ''}`);
      }
      if (field.other) {
        const detail = clean(data[detailId(field.id, 'Autre')]);
        const on = selected.includes('Autre') || detail !== '';
        out.push(`  - ${on ? BOX.on : BOX.off} Autre${detail ? ` — ${detail}` : ''}`);
      }
      if (!selected.length) out.push(`  - ${EMPTY}`);
      return;
    }

    case 'textarea': {
      const value = clean(raw);
      if (!value) {
        out.push(`- **${field.label}** : ${EMPTY}`);
        return;
      }
      if (!value.includes('\n')) {
        out.push(`- **${field.label}** : ${value}`);
        return;
      }
      out.push(`- **${field.label}** :`);
      out.push(...block(value));
      return;
    }

    default: {
      const value = oneLine(raw);
      out.push(`- **${field.label}** : ${value || EMPTY}`);
    }
  }
}

/* ------------------------------ document ---------------------------------- */

/**
 * @param {object} data   réponses ({ champId: valeur, champId__detail: valeur })
 * @param {object} meta   { submittedAt?: Date, sourceUrl?: string, reference?: string }
 * @returns {string} le document Markdown complet
 */
export function buildMarkdown(data = {}, meta = {}) {
  const now = meta.submittedAt ? new Date(meta.submittedAt) : new Date();
  const out = [];

  out.push('# Questionnaire de création de site web', '');
  out.push(`- **Client** : ${oneLine(data.nomPrenom) || EMPTY}`);
  out.push(`- **Entreprise / structure** : ${oneLine(data.entreprise) || EMPTY}`);
  out.push(`- **Date de soumission** : ${formatDateFr(now)}`);
  if (meta.reference) out.push(`- **Référence** : ${meta.reference}`);
  if (meta.sourceUrl) out.push(`- **Source** : ${meta.sourceUrl}`);
  out.push('', '---', '');

  for (const section of SCHEMA) {
    out.push(`## ${section.number}. ${section.title}`, '');
    for (const field of section.fields) {
      if (!isVisible(field, data)) continue;
      renderField(field, data, out);
    }
    out.push('');
  }

  out.push(
    '---',
    '',
    `_Document généré automatiquement le ${formatDateFr(now)} à partir du questionnaire en ligne._`,
    '',
  );

  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

/** Version texte brut (utile pour le corps d'e-mail de secours). */
export function buildPlainSummary(data = {}) {
  return [
    `Nouveau questionnaire site web`,
    `Client : ${oneLine(data.nomPrenom) || '-'}`,
    `Entreprise : ${oneLine(data.entreprise) || '-'}`,
    `E-mail : ${oneLine(data.email) || '-'}`,
    `Téléphone : ${oneLine(data.telephone) || '-'}`,
    `Budget : ${oneLine(data.budget) || '-'}`,
    `Délai : ${oneLine(data.delaiSouhaite) || '-'}`,
  ].join('\n');
}

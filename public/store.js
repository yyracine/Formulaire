/**
 * État du formulaire : lecture du DOM, validation, brouillon local.
 */

import { SCHEMA, detailId, isVisible, requiredFields, completionRatio } from './schema.js';

export const STORAGE_KEY = 'questionnaire-site-client:draft:v1';

/* --------------------------- lecture du DOM ------------------------------- */

export function readFieldValue(field) {
  const wrap = document.querySelector(`[data-field="${field.id}"]`);
  if (!wrap) return '';

  switch (field.type) {
    case 'radio': {
      const checked = wrap.querySelector('input[type="radio"]:checked');
      return checked ? checked.value : '';
    }
    case 'checks': {
      return Array.from(wrap.querySelectorAll('input[type="checkbox"]:checked')).map((i) => i.value);
    }
    case 'confirm': {
      const box = wrap.querySelector('input[type="checkbox"]');
      return Boolean(box && box.checked);
    }
    default: {
      const input = wrap.querySelector('input, textarea');
      return input ? input.value : '';
    }
  }
}

/** Lit tout le formulaire et renvoie l'objet de réponses. */
export function collect() {
  const data = {};
  for (const section of SCHEMA) {
    for (const field of section.fields) {
      data[field.id] = readFieldValue(field);
    }
  }
  for (const detail of document.querySelectorAll('[data-detail-id], [data-detail-for]')) {
    data[detail.dataset.detailId || detail.name] = detail.value;
  }
  return data;
}

/** Applique des réponses au DOM (restauration du brouillon). */
export function restoreValues(data = {}) {
  for (const section of SCHEMA) {
    for (const field of section.fields) {
      const wrap = document.querySelector(`[data-field="${field.id}"]`);
      if (!wrap) continue;
      const value = data[field.id];

      if (field.type === 'radio') {
        for (const input of wrap.querySelectorAll('input[type="radio"]')) {
          input.checked = value === input.value;
        }
      } else if (field.type === 'checks') {
        const list = Array.isArray(value) ? value : [];
        for (const input of wrap.querySelectorAll('input[type="checkbox"]')) {
          input.checked = list.includes(input.value);
        }
      } else if (field.type === 'confirm') {
        const box = wrap.querySelector('input[type="checkbox"]');
        if (box) box.checked = Boolean(value);
      } else {
        const input = wrap.querySelector('input, textarea');
        if (input) {
          input.value = value ?? '';
          if (input.tagName === 'TEXTAREA') {
            input.style.height = 'auto';
            input.style.height = `${Math.min(input.scrollHeight, 420)}px`;
          }
        }
      }
    }
  }

  for (const detail of document.querySelectorAll('[data-detail-for]')) {
    const key = detailId(detail.dataset.detailFor, detail.dataset.detailOption);
    detail.value = data[key] ?? '';
  }
}

/* ------------------------------ validation -------------------------------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

const isEmpty = (v) => (Array.isArray(v) ? v.length === 0 : String(v ?? '').trim() === '');

/** @returns {{id:string, message:string, section:number}[]} */
export function validate(data) {
  const errors = [];

  for (const field of requiredFields()) {
    if (!isVisible(field, data)) continue;
    const value = data[field.id];

    if (isEmpty(value)) {
      const message =
        field.type === 'checks' ? 'Cochez au moins une réponse.' : 'Ce champ est obligatoire.';
      errors.push({ id: field.id, message, section: field.section });
      continue;
    }

    if (field.type === 'email' && !EMAIL_RE.test(String(value).trim())) {
      errors.push({ id: field.id, message: 'Adresse e-mail invalide.', section: field.section });
    }
  }

  // E-mail de contact obligatoire même s'il est ailleurs dans le schéma
  const email = String(data.email ?? '').trim();
  if (email && !EMAIL_RE.test(email) && !errors.some((e) => e.id === 'email')) {
    errors.push({ id: 'email', message: 'Adresse e-mail invalide.', section: 1 });
  }

  return errors;
}

export function showFieldError(fieldId, message) {
  const wrap = document.querySelector(`[data-field="${fieldId}"]`);
  if (!wrap) return;
  wrap.classList.add('has-error');
  const err = wrap.querySelector('.err');
  if (err) {
    err.textContent = message;
    err.hidden = false;
  }
}

export function clearFieldErrors() {
  for (const wrap of document.querySelectorAll('.field.has-error')) {
    wrap.classList.remove('has-error');
    const err = wrap.querySelector('.err');
    if (err) {
      err.hidden = true;
      err.textContent = '';
    }
  }
}

/* ---------------------------- visibilité / états -------------------------- */

export function refreshVisibility(data) {
  for (const section of SCHEMA) {
    for (const field of section.fields) {
      const wrap = document.querySelector(`[data-field="${field.id}"]`);
      if (!wrap) continue;
      wrap.hidden = !isVisible(field, data);
    }
  }
  // Ouvrir les précisions des options cochées
  for (const detail of document.querySelectorAll('.opt-detail')) {
    const wrap = detail.closest('.opt');
    if (!wrap) continue;
    const selected = wrap.querySelector('input[type="radio"], input[type="checkbox"]');
    wrap.classList.toggle('is-open', Boolean(selected?.checked) || detail.value.trim() !== '');
  }
}

/** Une section est "terminée" quand tous ses champs obligatoires visibles sont remplis.
 *  Les sections sans champ obligatoire sont terminées quand tous leurs champs visibles sont remplis. */
export function sectionCompletion(data) {
  const done = {};
  for (const section of SCHEMA) {
    const fields = section.fields.filter((f) => isVisible(f, data));
    const required = fields.filter((f) => f.required || f.type === 'confirm');
    done[section.number] = required.length
      ? required.every((f) => !isEmpty(data[f.id]))
      : fields.length > 0 && fields.every((f) => !isEmpty(data[f.id]));
  }
  return done;
}

export { completionRatio };

/* ------------------------------- brouillon -------------------------------- */

export function saveDraft(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
    /* quota / mode privé : on ignore */
  }
}

export function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.data) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

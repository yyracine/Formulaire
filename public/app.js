/**
 * Contrôleur de l'application : rendu, interactions, aperçu, envoi.
 */

import { SCHEMA, detailId, allFields, completionRatio } from './schema.js';
import { renderSections, renderToc, el } from './render.js';
import { buildMarkdown, buildFileName, formatDateFr, buildPlainSummary } from './markdown.js';
import {
  collect,
  restoreValues,
  validate,
  showFieldError,
  clearFieldErrors,
  refreshVisibility,
  sectionCompletion,
  saveDraft,
  loadDraft,
  clearDraft,
} from './store.js';

const $ = (sel) => document.querySelector(sel);

const dom = {
  sections: $('#sections'),
  toc: $('#toc'),
  form: $('#form'),
  progressFill: $('#progressFill'),
  progressLabel: $('#progressLabel'),
  formError: $('#formError'),
  submitBtn: $('#submitBtn'),
  previewBtn: $('#previewBtn'),
  draftNotice: $('#draftNotice'),
  clearDraft: $('#clearDraft'),
  dialog: $('#previewDialog'),
  previewContent: $('#previewContent'),
  success: $('#success'),
  downloadBtn: $('#downloadBtn'),
  copyBtn: $('#copyBtn'),
  toast: $('#toast'),
};

let data = {};
let sending = false;
let saveTimer = null;
let toastTimer = null;

/* -------------------------------- helpers -------------------------------- */

function toast(message, ms = 2600) {
  dom.toast.textContent = message;
  dom.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    dom.toast.hidden = true;
  }, ms);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Copié dans le presse-papiers.');
  } catch {
    toast('Impossible de copier automatiquement.');
  }
}

function download(text, filename) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function applyAndSave() {
  data = collect();
  refreshVisibility(data);
  updateProgress();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveDraft(data), 350);
}

/* ------------------------------- progression ------------------------------ */

function updateProgress() {
  const ratio = completionRatio(data);
  dom.progressFill.style.width = `${ratio}%`;
  dom.progressLabel.textContent = `${ratio} %`;

  const done = sectionCompletion(data);
  for (const link of dom.toc.querySelectorAll('.toc-link')) {
    link.classList.toggle('is-done', Boolean(done[Number(link.dataset.toc)]));
  }
}

/* -------------------------------- actions -------------------------------- */

function onMaxReached(field, input) {
  if (!field.max) return false;
  const wrap = document.querySelector(`[data-field="${field.id}"]`);
  const checked = wrap.querySelectorAll('input[type="checkbox"]:checked');
  if (checked.length > field.max) {
    input.checked = false;
    toast(`Maximum ${field.max} choix pour cette question.`);
    return true;
  }
  return false;
}

function wireEvents() {
  const fieldById = new Map(allFields().map((f) => [f.id, f]));

  dom.form.addEventListener('input', (event) => {
    const target = event.target;

    // Précisions d'une option : coche automatiquement l'option si besoin
    if (target.matches('[data-detail-for]')) {
      const parent = target.closest('.opt');
      const parentInput = parent?.querySelector('input[type="radio"], input[type="checkbox"]');
      if (parentInput && target.value.trim() !== '') parentInput.checked = true;
      if (parent) parent.classList.toggle('is-open', parentInput?.checked || target.value.trim() !== '');
      applyAndSave();
      return;
    }

    if (target.matches('[type="radio"], [type="checkbox"]')) return; // géré sur "change"

    if (target.matches('input, textarea')) applyAndSave();
  });

  dom.form.addEventListener('change', (event) => {
    const target = event.target;
    if (!target.matches('[type="radio"], [type="checkbox"]')) return;

    const fieldWrap = target.closest('[data-field]');
    const field = fieldWrap ? fieldById.get(fieldWrap.dataset.field) : null;

    if (target.type === 'checkbox' && field) {
      if (onMaxReached(field, target)) {
        applyAndSave();
        return;
      }
    }
    if (target.type === 'radio' && field) {
      // décocher les précisions des autres options
      const wrap = target.closest('[data-field]');
      if (wrap) {
        for (const opt of wrap.querySelectorAll('.opt')) {
          const input = opt.querySelector('input[type="radio"]');
          const detail = opt.querySelector('.opt-detail');
          opt.classList.toggle('is-open', Boolean(input?.checked));
          if (!input?.checked && detail) detail.value = '';
        }
      }
    }
    applyAndSave();
  });

  dom.clearDraft.addEventListener('click', () => {
    clearDraft();
    dom.form.reset();
    data = {};
    clearFieldErrors();
    applyAndSave();
    dom.draftNotice.hidden = true;
    toast('Brouillon effacé.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  dom.previewBtn.addEventListener('click', () => openPreview());
  $('#closePreview').addEventListener('click', () => dom.dialog.close());
  $('#previewCopy').addEventListener('click', () => copyText(currentMarkdown()));
  $('#previewDownload').addEventListener('click', () => download(currentMarkdown(), buildFileName(data)));
  $('#confirmSend').addEventListener('click', async () => {
    dom.dialog.close();
    await submit();
  });

  dom.downloadBtn.addEventListener('click', () => download(lastDocument.text, lastDocument.filename));
  dom.copyBtn.addEventListener('click', () => copyText(lastDocument.text));
  $('#restartBtn').addEventListener('click', () => {
    clearDraft();
    window.location.reload();
  });

  dom.form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await submit();
  });
}

/* -------------------------------- aperçu --------------------------------- */

let lastDocument = { text: '', filename: 'questionnaire.md' };

function currentMarkdown() {
  data = collect();
  return buildMarkdown(data, { submittedAt: new Date(), sourceUrl: location.href });
}

function openPreview() {
  data = collect();
  const errors = validate(data);
  if (errors.length) {
    showErrors(errors);
    return;
  }
  const text = buildMarkdown(data, { submittedAt: new Date(), sourceUrl: location.href });
  dom.previewContent.textContent = text;
  dom.dialog.showModal();
}

/* ------------------------------ validation -------------------------------- */

function showErrors(errors) {
  clearFieldErrors();
  for (const error of errors) showFieldError(error.id, error.message);

  dom.formError.hidden = false;
  dom.formError.textContent =
    errors.length === 1
      ? 'Une réponse obligatoire est manquante ou invalide (champ signalé en rouge).'
      : `${errors.length} réponses obligatoires sont manquantes ou invalides (champs signalés en rouge).`;

  const first = document.querySelector(`[data-field="${errors[0].id}"]`);
  first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const input = first?.querySelector('input, textarea');
  if (input) setTimeout(() => input.focus({ preventScroll: true }), 350);
}

/* --------------------------------- envoi ---------------------------------- */

async function submit() {
  if (sending) return;

  data = collect();
  const errors = validate(data);
  if (errors.length) {
    showErrors(errors);
    return;
  }

  dom.formError.hidden = true;
  clearFieldErrors();

  const text = buildMarkdown(data, { submittedAt: new Date(), sourceUrl: location.href });
  const filename = buildFileName(data);
  lastDocument = { text, filename };

  sending = true;
  setBusy(true);

  let result;
  try {
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        markdown: text,
        filename,
        reference: `QM-${new Date().toISOString().slice(0, 10)}`,
        client: {
          name: String(data.nomPrenom || '').trim(),
          company: String(data.entreprise || '').trim(),
          email: String(data.email || '').trim(),
          phone: String(data.telephone || '').trim(),
        },
      }),
    });

    const body = await response.json().catch(() => ({}));
    result = { status: response.status, ok: response.ok && body.ok !== false, ...body };
  } catch {
    result = { ok: false, error: 'network_error' };
  }

  sending = false;
  setBusy(false);

  if (result.ok) {
    clearDraft();
    showSuccess('sent');
    return;
  }

  if (result.error === 'email_not_configured' || result.error === 'network_error' || result.status === 404) {
    showSuccess('manual');
    return;
  }

  dom.formError.hidden = false;
  dom.formError.textContent = `L’envoi a échoué (${result.error || result.status}). Le document n’a pas été transmis — vous pouvez le télécharger ci-dessous et me l’envoyer par e-mail.`;
  showSuccess('failed');
}

function setBusy(busy) {
  dom.submitBtn.disabled = busy;
  dom.submitBtn.querySelector('.btn-label').textContent = busy
    ? 'Envoi en cours…'
    : 'Envoyer le questionnaire';
}

function showSuccess(mode) {
  dom.form.hidden = true;
  dom.success.hidden = false;

  const title = $('#successTitle');
  const text = $('#successText');

  if (mode === 'sent') {
    title.textContent = 'Questionnaire envoyé, merci !';
    text.textContent =
      'Votre document Markdown a été généré et envoyé. Je reviens vers vous rapidement ; vous pouvez conserver une copie ci-dessous.';
  } else if (mode === 'manual') {
    title.textContent = 'Document généré';
    text.textContent =
      'Votre récapitulatif est prêt. L’envoi automatique n’est pas encore activé sur cette installation : téléchargez le fichier ou envoyez-le par e-mail en un clic.';
  } else {
    title.textContent = 'Le document est prêt';
    text.textContent =
      'L’envoi automatique a échoué. Votre récapitulatif n’est pas perdu : téléchargez-le ou envoyez-le par e-mail ci-dessous.';
  }

  // Bouton mailto de secours
  const actions = document.querySelector('.success-actions');
  const existing = actions.querySelector('[data-mailto]');
  if (existing) existing.remove();
  if (mode !== 'sent') {
    const subject = encodeURIComponent(`Questionnaire site web — ${data.entreprise || data.nomPrenom || 'client'}`);
    const body = encodeURIComponent(
      `${buildPlainSummary(data)}\n\n---\n\nLe questionnaire complet est joint au format Markdown (téléchargez-le ci-dessous).\n\n${lastDocument.text.slice(0, 600)}\n\n[… document complet en pièce jointe]`,
    );
    actions.append(
      el('a', {
        class: 'btn btn-primary',
        'data-mailto': 'true',
        href: `mailto:?subject=${subject}&body=${body}`,
        text: 'Envoyer par e-mail',
      }),
    );
  }

  $('#successPreview').textContent = lastDocument.text;
  dom.success.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* --------------------------------- init ---------------------------------- */

function init() {
  renderSections(SCHEMA, dom.sections);
  renderToc(SCHEMA, dom.toc);

  const draft = loadDraft();
  if (draft) {
    restoreValues(draft.data);
    const when = draft.savedAt ? formatDateFr(draft.savedAt) : '';
    dom.draftNotice.hidden = false;
    if (when) dom.draftNotice.querySelector('span').textContent = `Un brouillon du ${when} a été restauré.`;
  }

  data = collect();
  refreshVisibility(data);
  updateProgress();
  wireEvents();

  // Le brouillon est enregistré à la sortie de page également
  window.addEventListener('beforeunload', () => saveDraft(collect()));
}

init();

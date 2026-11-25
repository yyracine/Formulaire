/**
 * Rendu DOM du formulaire à partir du schéma.
 * Aucune logique métier ici : seulement la construction des champs.
 */

import { detailId } from './schema.js';

/** Petit helper de création d'éléments. */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

const slugify = (v) => String(v).replace(/[^a-z0-9]+/gi, '-').toLowerCase();

function labelBlock(field, tag = 'label') {
  return el(
    tag,
    { class: 'field-label-text' },
    field.label,
    field.required ? el('span', { class: 'req', text: ' *' }) : null,
  );
}

function hintBlock(field) {
  return field.hint ? el('p', { class: 'hint', text: field.hint }) : null;
}

function errorBlock() {
  return el('p', { class: 'err', hidden: true });
}

/* ------------------------------ champs simples ---------------------------- */

function renderInput(field) {
  const id = `f-${field.id}`;
  const input = el(field.type === 'textarea' ? 'textarea' : 'input', {
    id,
    name: field.id,
    type: field.type === 'textarea' ? null : field.type,
    placeholder: field.placeholder,
    autocomplete: field.autocomplete,
    rows: field.type === 'textarea' ? 3 : null,
    spellcheck: field.spellcheck === false ? 'false' : null,
    inputmode: field.type === 'tel' ? 'tel' : field.type === 'email' ? 'email' : null,
  });

  if (field.type === 'textarea') {
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = `${Math.min(input.scrollHeight, 420)}px`;
    });
  }

  return el(
    'div',
    { class: 'field', dataset: { field: field.id } },
    el('label', { for: id }, labelBlock(field)),
    hintBlock(field),
    input,
    errorBlock(),
  );
}

/* -------------------------------- options --------------------------------- */

function renderOption(field, option, kind) {
  const inputType = kind === 'radio' ? 'radio' : 'checkbox';
  const input = el('input', {
    type: inputType,
    name: `fld-${field.id}`,
    value: option.value,
    id: `f-${field.id}-${slugify(option.value)}`,
    'data-option': option.value,
  });

  const body = el(
    'div',
    { class: 'opt-body' },
    el('label', { for: input.id, text: option.value }),
  );

  const wrap = el('div', { class: 'opt' }, input, body);

  if (option.text) {
    const detail = el('input', {
      type: field.id === 'dateImportante' ? 'date' : 'text',
      class: 'opt-detail',
      id: `f-${detailId(field.id, option.value)}`,
      name: detailId(field.id, option.value),
      'data-detail-for': field.id,
      'data-detail-option': option.value,
      placeholder: option.textLabel || 'Précisez…',
      'aria-label': `${field.label} — ${option.textLabel || 'précisions'}`,
    });
    body.append(detail);
  }

  return wrap;
}

function renderChoices(field) {
  const kind = field.type === 'radio' ? 'radio' : 'checkbox';
  const options = [...(field.options || [])];

  if (field.other) {
    options.push({ value: 'Autre', text: true, textLabel: 'Précisez' });
  }

  const opts = el(
    'div',
    { class: 'opts' },
    options.map((option) => renderOption(field, option, kind)),
  );

  const attrs = {
    class: 'field',
    dataset: { field: field.id, max: field.max ? String(field.max) : '' },
  };

  const head = el('legend', {}, labelBlock(field));

  return el('fieldset', attrs, head, hintBlock(field), opts, errorBlock());
}

function renderConfirm(field) {
  const input = el('input', {
    type: 'checkbox',
    name: field.id,
    id: `f-${field.id}`,
    value: 'on',
  });

  return el(
    'fieldset',
    { class: 'field confirm', dataset: { field: field.id } },
    el('div', { class: 'opts' }, el('div', { class: 'opt' }, input, el('label', { for: input.id, text: field.label }))),
    errorBlock(),
  );
}

/* ------------------------------- sections --------------------------------- */

export function renderField(field) {
  if (field.type === 'radio' || field.type === 'checks') return renderChoices(field);
  if (field.type === 'confirm') return renderConfirm(field);
  return renderInput(field);
}

export function renderSections(schema, host) {
  host.textContent = '';
  const sections = [];

  for (const section of schema) {
    const body = el('div', { class: 'section-body' });
    for (const field of section.fields) body.append(renderField(field));

    const node = el(
      'section',
      { class: 'section', id: section.id, dataset: { section: String(section.number) } },
      el(
        'div',
        { class: 'section-head' },
        el('span', { class: 'section-num', text: String(section.number) }),
        el('h2', { text: section.title }),
      ),
      body,
    );

    host.append(node);
    sections.push({ section, node, body });
  }

  return sections;
}

export function renderToc(schema, host) {
  host.textContent = '';
  for (const section of schema) {
    host.append(
      el(
        'a',
        { class: 'toc-link', href: `#${section.id}`, dataset: { toc: String(section.number) } },
        el('span', { class: 'num', text: String(section.number).padStart(2, '0') }),
        el('span', { text: section.title }),
      ),
    );
  }
}

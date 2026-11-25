/**
 * Test d'intégration de l'interface (jsdom).
 *   npm install jsdom --no-save   puis   node tools/test-ui.mjs
 *
 * Vérifie : rendu des 12 sections, tiroir de brouillon, validation,
 * génération du Markdown et appel de /api/submit.
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = await readFile(join(root, 'public', 'index.html'), 'utf8');

const dom = new JSDOM(html, { url: 'https://exemple.test/', pretendToBeVisual: true });
const { window } = dom;

/* ------------------------- ponts navigateur -> Node ----------------------- */
const setGlobal = (name, value) =>
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });

setGlobal('window', window);
setGlobal('document', window.document);
setGlobal('navigator', window.navigator);
setGlobal('localStorage', window.localStorage);
setGlobal('HTMLElement', window.HTMLElement);
setGlobal('HTMLDialogElement', window.HTMLDialogElement);
setGlobal('Element', window.Element);
setGlobal('Event', window.Event);
setGlobal('CustomEvent', window.CustomEvent);
setGlobal('FormData', window.FormData);
setGlobal('Blob', window.Blob);
setGlobal('URL', window.URL);
setGlobal('location', window.location);

window.Element.prototype.scrollIntoView = function () {};
window.Element.prototype.scrollTo = function () {};
window.scrollTo = () => {};
window.HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
window.HTMLDialogElement.prototype.close = function () {
  this.open = false;
};
Object.defineProperty(window.navigator, 'clipboard', {
  value: { writeText: async () => {} },
  configurable: true,
});
window.URL.createObjectURL = () => 'blob:test';
window.URL.revokeObjectURL = () => {};

const calls = [];
globalThis.fetch = async (url, options = {}) => {
  calls.push({ url: String(url), body: options.body ? JSON.parse(options.body) : null });
  return {
    ok: true,
    status: 200,
    json: async () => ({ ok: true, id: 'email_test_123' }),
  };
};
window.fetch = globalThis.fetch;

/* ------------------------------- chargement ------------------------------- */
const { SCHEMA } = await import('../public/schema.js');
await import('../public/app.js');

const failures = [];
const expect = (cond, msg) => {
  if (!cond) failures.push(msg);
};
const $ = (sel) => window.document.querySelector(sel);
const $$ = (sel) => Array.from(window.document.querySelectorAll(sel));

/* --------------------------------- rendu --------------------------------- */
expect($$('.section').length === SCHEMA.length, `Sections rendues : ${$$('.section').length}/${SCHEMA.length}`);
expect($$('.toc-link').length === SCHEMA.length, 'Sommaire incomplet');
expect($$('[data-field]').length >= 55, `Trop peu de champs rendus (${$$('[data-field]').length})`);
expect($('#f-nomPrenom'), 'Champ nomPrenom absent');
expect($$('[data-field="reseaux"] .opt').length === 6, 'Options réseaux incorrectes');
expect($('#f-reseaux__instagram'), 'Précision du réseau Instagram absente');
expect($('[data-field="nbProduits"]').hidden, 'Champ conditionnel "nbProduits" visible par défaut');
expect($('[data-field="langues"]').hidden, 'Champ conditionnel "langues" visible par défaut');

/* --------------------------- validation à vide --------------------------- */
const form = $('#form');
form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
await new Promise((r) => setTimeout(r, 30));

expect(!$('#formError').hidden, "Le message d'erreur global ne s'affiche pas");
expect($$('.field.has-error').length >= 15, `Champs en erreur : ${$$('.field.has-error').length}`);
expect(calls.length === 0, 'Un envoi a eu lieu alors que le formulaire est vide');

/* --------------------------- remplissage auto ---------------------------- */
function setText(id, value) {
  const input = window.document.getElementById(`f-${id}`);
  if (!input) throw new Error(`champ introuvable : ${id}`);
  input.value = value;
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
}

function chooseRadio(fieldId, optionValue) {
  const wrap = $(`[data-field="${fieldId}"]`);
  const input = Array.from(wrap.querySelectorAll('input[type="radio"]')).find((i) => i.value === optionValue);
  if (!input) throw new Error(`option introuvable : ${fieldId}=${optionValue}`);
  input.checked = true;
  input.dispatchEvent(new window.Event('change', { bubbles: true }));
}

function chooseCheck(fieldId, optionValue) {
  const wrap = $(`[data-field="${fieldId}"]`);
  const input = Array.from(wrap.querySelectorAll('input[type="checkbox"]')).find((i) => i.value === optionValue);
  if (!input) throw new Error(`case introuvable : ${fieldId}=${optionValue}`);
  input.checked = true;
  input.dispatchEvent(new window.Event('change', { bubbles: true }));
}

const answers = {
  nomPrenom: 'Camille Marchand',
  entreprise: 'Atelier Bois & Lumière',
  secteur: 'Menuiserie sur mesure',
  presentation: 'Atelier familial depuis 1998.\nNous fabriquons du mobilier sur mesure.',
  telephone: '+33 6 12 34 56 78',
  email: 'camille@bois-et-lumiere.fr',
  siteActuel: 'https://bois-et-lumiere.fr',
  adresse: '12 rue des Artisans, 69006 Lyon',
  raison: 'Mon site est daté et ne génère aucun contact.',
  clientType: 'Particuliers 35-60 ans à Lyon',
  besoins: 'Demander un devis en 2 minutes',
  couleurs: '#1B2A4A, #C9A66B',
  sitesAimes: 'ligne-roset.com',
  contenuSpecifique: 'Portfolio : 12 réalisations',
  langues: 'Français, Anglais',
  nbProduits: '25',
  zonesGoogle: 'Lyon, Villeurbanne',
  servicesGoogle: 'menuiserie sur mesure lyon',
  delaiSouhaite: 'avant fin mars 2027',
  concurrents: 'Menuiserie Dupont',
  difference: 'Fabrication française, garantie 10 ans',
  messagePrincipal: 'Expertise et proximité',
  autresIdees: 'Un lien vers ma chaîne YouTube',
  remarquesFinales: 'Merci !',
  signature: 'Camille Marchand',
};
for (const [id, value] of Object.entries(answers)) setText(id, value);

chooseRadio('anciennete', 'Plus de 5 ans');
chooseRadio('dejaSite', 'Oui');
chooseRadio('cible', 'Les deux');
chooseRadio('zone', 'Ville / agglomération');
chooseRadio('logo', 'Oui (je l’enverrai)');
chooseRadio('charte', 'Partiellement');
chooseRadio('textes', 'Oui, partiellement');
chooseRadio('photos', 'Oui, de bonne qualité');
chooseRadio('videos', 'Peut-être plus tard');
chooseRadio('visibiliteGoogle', 'Oui, c’est important');
chooseRadio('domaine', 'Oui');
chooseRadio('hebergement', 'Non');
chooseRadio('budget', '2 000 € – 4 000 €');
chooseRadio('urgence', 'Moyennement');

chooseCheck('reseaux', 'Instagram');
chooseCheck('typeSite', 'Site vitrine (présenter mon activité)');
chooseCheck('objectifs', 'Recevoir des demandes de contact / devis');
chooseCheck('style', 'Élégant / premium');
chooseCheck('pages', 'Accueil');
chooseCheck('pages', 'Contact');
chooseCheck('fonctionnalites', 'Boutique en ligne (e-commerce)');

// précisions d'options
const instaDetail = window.document.getElementById('f-reseaux__instagram');
instaDetail.value = 'https://instagram.com/boisetlumiere';
instaDetail.dispatchEvent(new window.Event('input', { bubbles: true }));

const domaineDetail = window.document.getElementById('f-domaine__oui');
domaineDetail.value = 'bois-et-lumiere.fr';
domaineDetail.dispatchEvent(new window.Event('input', { bubbles: true }));

// confirmation finale
const confirmBox = window.document.getElementById('f-confirmation');
confirmBox.checked = true;
confirmBox.dispatchEvent(new window.Event('change', { bubbles: true }));

await new Promise((r) => setTimeout(r, 30));

/* --------------------- champs conditionnels & progression ---------------- */
expect(!$('[data-field="nbProduits"]').hidden, 'Le champ conditionnel "nbProduits" reste masqué alors que la boutique est cochée');
expect($('#progressLabel').textContent === '100 %', `Progression affichée : ${$('#progressLabel').textContent}`);
expect($$('.toc-link.is-done').length >= 8, `Sections terminées : ${$$('.toc-link.is-done').length}/12`);
expect($('.toc-link[data-toc="1"]').classList.contains('is-done'), 'Section 1 devrait être terminée');
expect(!$('.toc-link[data-toc="9"]').classList.contains('is-done'), 'Section 9 incomplète ne devrait pas être terminée');

/* --------------------------------- aperçu -------------------------------- */
$('#previewBtn').click();
expect($('#previewDialog').open, "La fenêtre d'aperçu ne s'ouvre pas");
const preview = $('#previewContent').textContent;
expect(preview.includes('Atelier Bois & Lumière'), 'Aperçu : entreprise absente');
expect(preview.includes('## 6. Les fonctionnalités souhaitées'), 'Aperçu : section 6 absente');
expect(preview.includes('☑ Instagram — https://instagram.com/boisetlumiere'), 'Aperçu : précision réseau absente');
expect(preview.includes('Oui — bois-et-lumiere.fr'), 'Aperçu : précision domaine absente');
$('#previewDialog').close();

/* --------------------------------- envoi --------------------------------- */
form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
await new Promise((r) => setTimeout(r, 60));

expect(calls.length === 1, `Appels API : ${calls.length} (attendu 1)`);
expect(calls[0]?.url === '/api/submit', `URL appelée : ${calls[0]?.url}`);
const sent = calls[0]?.body;
expect(sent && typeof sent.markdown === 'string' && sent.markdown.length > 2000, 'Markdown envoyé trop court');
expect(sent.markdown.includes('Camille Marchand'), 'Markdown envoyé : nom absent');
expect(/^questionnaire-site-atelier-bois-lumiere-\d{4}-\d{2}-\d{2}\.md$/.test(sent.filename || ''), `Nom de fichier : ${sent.filename}`);
expect(sent.client?.email === 'camille@bois-et-lumiere.fr', 'E-mail du client non transmis');
expect(!$('#success').hidden, "L'écran de confirmation ne s'affiche pas");
expect($('#form').hidden, 'Le formulaire reste visible après envoi');
expect($('#successPreview').textContent.includes('## 12. Validation finale'), 'Aperçu final incomplet');

if (failures.length) {
  console.error('ÉCHEC :');
  for (const f of failures) console.error(' - ' + f);
  process.exit(1);
}

console.log('OK — interface : rendu, validation, aperçu et envoi vérifiés');
console.log(`Champs rendus : ${$$('[data-field]').length}`);
console.log(`Document envoyé : ${sent.markdown.length} caractères, fichier ${sent.filename}`);

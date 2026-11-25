/**
 * Test de la génération Markdown (aucune dépendance).
 *   node tools/test-markdown.mjs
 * Écrit un exemple complet dans tools/out/exemple.md
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SCHEMA, requiredFields, isVisible, completionRatio, detailId } from '../public/schema.js';
import { buildMarkdown, buildFileName, slug } from '../public/markdown.js';

const here = dirname(fileURLToPath(import.meta.url));

const data = {
  nomPrenom: 'Camille Marchand',
  entreprise: 'Atelier Bois & Lumière',
  secteur: 'Artisan du bâtiment — menuiserie sur mesure',
  presentation:
    "Atelier familial depuis 1998, nous concevons et fabriquons du mobilier sur mesure pour les particuliers exigeants.\nNous travaillons le chêne et le noyer, du dessin à la pose.",
  telephone: '+33 6 12 34 56 78',
  email: 'camille@bois-et-lumiere.fr',
  siteActuel: 'https://bois-et-lumiere.fr',
  adresse: '12 rue des Artisans, 69006 Lyon',
  reseaux: ['Instagram', 'Facebook'],
  [detailId('reseaux', 'Instagram')]: 'https://instagram.com/boisetlumiere',
  [detailId('reseaux', 'Facebook')]: 'https://facebook.com/boisetlumiere',
  anciennete: 'Plus de 5 ans',

  raison: 'Mon site actuel est daté et ne me ramène aucun client. Je veux recevoir des demandes de devis.',
  dejaSite: 'Oui',
  [detailId('dejaSite', 'Oui')]: 'bois-et-lumiere.fr',
  typeSite: ['Site vitrine (présenter mon activité)', 'Portfolio (montrer mes réalisations)'],
  [detailId('typeSite', 'Autre')]: 'Une page dédiée aux essences de bois',
  objectifs: ['Recevoir des demandes de contact / devis', 'Renforcer ma crédibilité', 'Être trouvé sur Google'],
  problemes: 'Les clients ne me trouvent pas et je perds du temps au téléphone.',

  cible: 'Les deux',
  clientType: 'Architectes d’intérieur et particuliers 35-60 ans, propriétaires à Lyon.',
  zone: 'Ville / agglomération',
  [detailId('zone', 'Ville / agglomération')]: 'Lyon + 30 km',
  besoins: 'Voir rapidement des réalisations et demander un devis en 2 minutes.',

  logo: 'Oui (je l’enverrai)',
  charte: 'Partiellement',
  couleurs: '#1B2A4A, #C9A66B',
  style: ['Élégant / premium', 'Chaleureux / naturel'],
  sitesAimes: 'https://www.ligne-roset.com\nhttps://www.hermes.com',
  elementsVisuels: ['Photos de qualité professionnelles', 'Vidéos'],

  pages: [
    'Accueil',
    'À propos / Qui suis-je / Notre histoire',
    'Réalisations / Portfolio',
    'Contact',
    'Mentions légales + Politique de confidentialité (obligatoire)',
  ],
  contenuSpecifique: 'Portfolio : 12 réalisations avec date, essence et lieu.',

  fonctionnalites: ['Formulaire de demande de devis', 'Boutique en ligne (e-commerce)', 'Newsletter / inscription e-mail'],
  nbProduits: '25',
  gestionStock: 'Non',

  textes: 'Oui, partiellement',
  photos: 'Oui, de bonne qualité',
  videos: 'Peut-être plus tard',
  aideRedaction: 'Oui, pour certaines pages',
  temoignages: 'Je peux en demander',
  accompagnementContenus: 'Oui',

  visibiliteGoogle: 'Oui, c’est important',
  zonesGoogle: 'Lyon, Villeurbanne, Écully',
  servicesGoogle: 'menuiserie sur mesure lyon, dressing sur mesure lyon',
  googleBusiness: 'Oui',

  domaine: 'Oui',
  [detailId('domaine', 'Oui')]: 'bois-et-lumiere.fr',
  hebergement: 'Non',
  emailsPro: 'Oui',
  modifContenu: 'Oui, c’est important',
  accompagnement: 'Oui',

  budget: '2 000 € – 4 000 €',
  delaiSouhaite: 'avant fin mars 2027',
  dateImportante: 'Oui',
  [detailId('dateImportante', 'Oui')]: '2027-04-15',
  urgence: 'Moyennement',

  concurrents: 'Menuiserie Dupont, Atelier Nord',
  difference: 'Fabrication 100 % française, délais courts, garantie 10 ans.',
  messagePrincipal: 'Expertise et proximité',
  autresIdees: 'Un lien vers ma chaîne YouTube.',

  confirmation: true,
  remarquesFinales: 'Merci !',
  signature: 'Camille Marchand',
  dateValidation: '2026-11-25',
};

const md = buildMarkdown(data, {
  submittedAt: new Date('2026-11-25T18:12:00'),
  sourceUrl: 'https://questionnaire.atelier-marchand.fr/',
  reference: 'QM-2026-0042',
});

await mkdir(join(here, 'out'), { recursive: true });
await writeFile(join(here, 'out', 'exemple.md'), md, 'utf8');

/* ------------------------------- assertions ------------------------------- */
const failures = [];
const expect = (cond, msg) => { if (!cond) failures.push(msg); };

expect(md.startsWith('# Questionnaire de création de site web'), 'Le titre H1 est absent');
expect(md.includes('## 1. Présentation du client et de l’entreprise'.replace('’', "'")) || md.includes('## 1. Présentation'), 'Section 1 absente');
for (const s of SCHEMA) expect(md.includes(`## ${s.number}. ${s.title}`), `Section manquante : ${s.number}`);
expect(md.includes('☑ **Instagram**') === false, 'Les sous-options ne doivent pas être des champs');
expect(md.includes('  - ☑ Instagram — https://instagram.com/boisetlumiere'), 'Détail réseau non rendu');
expect(md.includes('  - ☐ TikTok'), 'Option non cochée non rendue');
expect(md.includes('**Possédez-vous déjà un site internet ?** : Oui — bois-et-lumiere.fr'), 'Détail radio non rendu');
expect(md.includes('  - ☑ Autre — Une page dédiée aux essences de bois'), 'Détail "Autre" non rendu');
expect(md.includes('**Couleurs souhaitées** : #1B2A4A'), 'Champ texte non rendu');
expect(md.includes('☑ **Je confirme'), 'Confirmation non rendue');
expect(!md.includes('_(non renseigné)_'), 'Un champ vide dans un jeu complet de réponses');

// champs vides
const emptyMd = buildMarkdown({ nomPrenom: 'Test' }, { submittedAt: new Date('2026-01-01T10:00:00') });
expect(emptyMd.includes('_(non renseigné)_'), 'Les champs vides ne sont pas marqués');
// champs conditionnels masqués
expect(!emptyMd.includes('Combien de produits'), 'Champ conditionnel affiché à tort');

// slug / nom de fichier
expect(slug('Atelier Bois & Lumière') === 'atelier-bois-lumiere', 'slug() incorrect');
expect(buildFileName(data, new Date('2026-11-25T10:00:00')) === 'questionnaire-site-atelier-bois-lumiere-2026-11-25.md', 'buildFileName() incorrect');

// progression
const ratio = completionRatio(data);
expect(ratio === 100, `completionRatio attendu 100, obtenu ${ratio}`);
const requiredVisible = requiredFields().filter((f) => isVisible(f, data)).length;
expect(requiredVisible > 10, `Trop peu de champs obligatoires détectés (${requiredVisible})`);

// champs conditionnels quand la boutique est choisie
const shopMd = buildMarkdown({ ...data, fonctionnalites: ['Boutique en ligne (e-commerce)'] }, { submittedAt: new Date() });
expect(shopMd.includes('Combien de produits'), 'Champ conditionnel "nbProduits" absent quand la boutique est cochée');

if (failures.length) {
  console.error('ÉCHEC :');
  for (const f of failures) console.error(' - ' + f);
  process.exit(1);
}

console.log(`OK — ${md.length} caractères, ${md.split('\n').length} lignes`);
console.log(`Champs obligatoires visibles : ${requiredVisible}`);
console.log(`Exemple écrit : tools/out/exemple.md`);

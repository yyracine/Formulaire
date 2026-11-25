/**
 * Schema du questionnaire client (12 sections).
 * Source : Questionnaire_Site.md
 *
 * Types de champ :
 *   text, email, tel, url, date, textarea, radio, checks, confirm
 *
 * Options d'un champ radio / checks :
 *   { value, text?: true }  -> si `text`, un champ libre est affiche a cote
 *
 * Options de champ :
 *   required  -> champ obligatoire (marque d'un *)
 *   hint      -> texte d'aide sous le label
 *   max       -> nombre maximum de cases a cocher
 *   other     -> ajoute une option "Autre" avec champ libre
 *   showIf    -> (data) => boolean, affichage conditionnel
 *   placeholder
 */

export const DETAIL_SUFFIX = '_detail';
export const detailId = (fieldId, optionValue) =>
  `${fieldId}__${String(optionValue).replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`;

export const SCHEMA = [
  {
    id: 'section-1',
    number: 1,
    title: "Présentation du client et de l'entreprise",
    fields: [
      { id: 'nomPrenom', label: 'Nom et prénom', type: 'text', required: true, autocomplete: 'name' },
      { id: 'entreprise', label: "Nom de l'entreprise / structure", type: 'text', required: true, autocomplete: 'organization' },
      {
        id: 'secteur',
        label: "Secteur d'activité",
        type: 'text',
        required: true,
        hint: 'Exemples : coiffure, plomberie, restaurant, coach sportif, avocat, artisan du bâtiment, boutique de mode…',
      },
      {
        id: 'presentation',
        label: "Présentation courte de l'entreprise",
        type: 'textarea',
        required: true,
        hint: 'Décrivez en quelques phrases ce que vous faites, pour qui, et ce qui vous différencie.',
      },
      { id: 'telephone', label: 'Téléphone', type: 'tel', required: true, autocomplete: 'tel' },
      { id: 'email', label: 'E-mail', type: 'email', required: true, autocomplete: 'email' },
      { id: 'siteActuel', label: 'Site internet actuel (s’il existe)', type: 'url', placeholder: 'https://…' },
      { id: 'adresse', label: 'Adresse complète', type: 'text', required: true, autocomplete: 'street-address' },
      {
        id: 'reseaux',
        label: 'Réseaux sociaux',
        type: 'checks',
        hint: 'Cochez les réseaux utilisés et indiquez les liens.',
        options: [
          { value: 'Facebook', text: true },
          { value: 'Instagram', text: true },
          { value: 'LinkedIn', text: true },
          { value: 'TikTok', text: true },
          { value: 'YouTube', text: true },
          { value: 'Autre', text: true },
        ],
      },
      {
        id: 'anciennete',
        label: "Ancienneté de l'entreprise",
        type: 'radio',
        options: [
          { value: "Moins d'1 an" },
          { value: '1 à 3 ans' },
          { value: '3 à 5 ans' },
          { value: 'Plus de 5 ans' },
        ],
      },
    ],
  },

  {
    id: 'section-2',
    number: 2,
    title: 'Présentation du projet',
    fields: [
      {
        id: 'raison',
        label: 'Pourquoi souhaitez-vous créer (ou refaire) un site internet ?',
        type: 'textarea',
        required: true,
        hint: 'Exemples : être visible sur Google, recevoir des demandes de devis, vendre en ligne, moderniser mon image…',
      },
      {
        id: 'dejaSite',
        label: 'Possédez-vous déjà un site internet ?',
        type: 'radio',
        required: true,
        options: [
          { value: 'Non' },
          { value: 'Oui', text: true, textLabel: 'Indiquez l’adresse' },
          { value: 'Oui, mais je souhaite le refaire complètement' },
        ],
      },
      {
        id: 'typeSite',
        label: 'Quel type de site souhaitez-vous ?',
        type: 'checks',
        required: true,
        hint: 'Plusieurs réponses possibles.',
        options: [
          { value: 'Site vitrine (présenter mon activité)' },
          { value: 'Site e-commerce (vendre des produits en ligne)' },
          { value: 'Site avec réservation / prise de rendez-vous en ligne' },
          { value: 'Portfolio (montrer mes réalisations)' },
          { value: 'Site de blog / contenu' },
        ],
        other: true,
      },
      {
        id: 'objectifs',
        label: 'Quels sont vos principaux objectifs avec ce site ?',
        type: 'checks',
        required: true,
        options: [
          { value: 'Être trouvé sur Google' },
          { value: 'Recevoir des demandes de contact / devis' },
          { value: 'Prendre des rendez-vous' },
          { value: 'Vendre des produits ou services en ligne' },
          { value: 'Renforcer ma crédibilité' },
          { value: 'Présenter mon équipe et mon histoire' },
        ],
        other: true,
      },
      {
        id: 'problemes',
        label: 'Quels problèmes souhaitez-vous résoudre grâce à votre site ?',
        type: 'textarea',
        hint: 'Exemples : « les clients ne me trouvent pas », « je perds du temps au téléphone », « mon concurrent a un plus beau site »…',
      },
    ],
  },

  {
    id: 'section-3',
    number: 3,
    title: 'Votre clientèle cible',
    fields: [
      {
        id: 'cible',
        label: 'Qui sont vos clients principaux ?',
        type: 'radio',
        required: true,
        options: [{ value: 'Particuliers' }, { value: 'Professionnels (B2B)' }, { value: 'Les deux' }],
      },
      {
        id: 'clientType',
        label: 'Décrivez brièvement votre client type',
        type: 'textarea',
        hint: 'Exemples : femmes 30-50 ans, artisans locaux, entreprises de 10 à 50 salariés, touristes…',
      },
      {
        id: 'zone',
        label: 'Zone géographique à cibler',
        type: 'radio',
        required: true,
        options: [
          { value: 'Ville / agglomération', text: true, textLabel: 'Laquelle ?' },
          { value: 'Département / région', text: true, textLabel: 'Lequel ?' },
          { value: 'France entière' },
          { value: 'International' },
          { value: 'Autre', text: true },
        ],
      },
      {
        id: 'besoins',
        label: 'Quels besoins ou problèmes de vos clients votre site doit-il résoudre ?',
        type: 'textarea',
      },
    ],
  },

  {
    id: 'section-4',
    number: 4,
    title: 'Design et identité visuelle',
    fields: [
      {
        id: 'logo',
        label: 'Possédez-vous un logo ?',
        type: 'radio',
        required: true,
        options: [
          { value: 'Oui (je l’enverrai)' },
          { value: 'Non' },
          { value: 'Oui, mais je souhaite le faire évoluer' },
        ],
      },
      {
        id: 'charte',
        label: 'Avez-vous une charte graphique (couleurs, polices) ?',
        type: 'radio',
        options: [{ value: 'Oui' }, { value: 'Non' }, { value: 'Partiellement' }],
      },
      {
        id: 'couleurs',
        label: 'Couleurs souhaitées',
        type: 'text',
        hint: 'Vous pouvez indiquer des codes couleur, ex. #1B2A4A, #E8B04B.',
      },
      {
        id: 'style',
        label: 'Quel style de site préférez-vous ?',
        type: 'checks',
        hint: 'Cochez 1 à 3 styles maximum.',
        max: 3,
        options: [
          { value: 'Moderne et épuré' },
          { value: 'Minimaliste' },
          { value: 'Élégant / premium' },
          { value: 'Chaleureux / naturel' },
          { value: 'Dynamique / coloré' },
          { value: 'Classique et professionnel' },
          { value: 'Luxueux' },
        ],
        other: true,
      },
      {
        id: 'sitesAimes',
        label: 'Citez 2 à 4 sites internet que vous aimez',
        type: 'textarea',
        hint: 'Même s’ils ne sont pas dans votre secteur.',
      },
      {
        id: 'elementsVisuels',
        label: 'Éléments visuels importants pour vous',
        type: 'checks',
        options: [
          { value: 'Photos de qualité professionnelles' },
          { value: 'Vidéos' },
          { value: 'Illustrations / icônes' },
          { value: 'Animations légères' },
        ],
        other: true,
      },
    ],
  },

  {
    id: 'section-5',
    number: 5,
    title: 'Les pages du site',
    fields: [
      {
        id: 'pages',
        label: 'Cochez les pages que vous souhaitez sur votre site',
        type: 'checks',
        required: true,
        options: [
          { value: 'Accueil' },
          { value: 'À propos / Qui suis-je / Notre histoire' },
          { value: 'Services / Prestations' },
          { value: 'Prestations & tarifs' },
          { value: 'Produits / Catalogue' },
          { value: 'Réalisations / Portfolio' },
          { value: 'Galerie photos' },
          { value: 'Avis clients / Témoignages' },
          { value: 'Blog / Actualités' },
          { value: 'FAQ (questions fréquentes)' },
          { value: 'Contact' },
          { value: 'Mentions légales + Politique de confidentialité (obligatoire)' },
        ],
        other: true,
      },
      {
        id: 'contenuSpecifique',
        label: 'Souhaitez-vous un contenu spécifique pour certaines pages ?',
        type: 'textarea',
        hint: 'Précisez page par page si besoin.',
      },
    ],
  },

  {
    id: 'section-6',
    number: 6,
    title: 'Les fonctionnalités souhaitées',
    fields: [
      {
        id: 'fonctionnalites',
        label: 'Cochez toutes les fonctionnalités qui vous intéressent',
        type: 'checks',
        options: [
          { value: 'Formulaire de contact' },
          { value: 'Formulaire de demande de devis' },
          { value: 'Prise de rendez-vous en ligne' },
          { value: 'Réservation en ligne (chambres, tables, créneaux…)' },
          { value: 'Paiement en ligne' },
          { value: 'Boutique en ligne (e-commerce)' },
          { value: 'Galerie photos / portfolio filtrable' },
          { value: 'Carte Google Maps' },
          { value: 'Affichage d’avis clients (Google, Trustpilot…)' },
          { value: 'Newsletter / inscription e-mail' },
          { value: 'Espace client / compte utilisateur' },
          { value: 'Chat en ligne' },
        ],
        other: true,
      },
      {
        id: 'langues',
        label: 'Site multilingue : quelles langues ?',
        type: 'text',
        showIf: (d) => includes(d, 'fonctionnalites', 'multilingue'),
        placeholder: 'Français, Anglais…',
      },
      {
        id: 'nbProduits',
        label: 'Combien de produits approximativement ?',
        type: 'text',
        showIf: (d) => wantsShop(d),
        placeholder: 'Ex. 25',
      },
      {
        id: 'gestionStock',
        label: 'Avez-vous déjà un système de gestion des stocks ou de commandes ?',
        type: 'radio',
        showIf: (d) => wantsShop(d),
        options: [{ value: 'Oui' }, { value: 'Non' }],
      },
    ],
  },

  {
    id: 'section-7',
    number: 7,
    title: 'Les contenus',
    fields: [
      {
        id: 'textes',
        label: 'Possédez-vous déjà les textes pour le site ?',
        type: 'radio',
        required: true,
        options: [
          { value: 'Oui, presque tout est prêt' },
          { value: 'Oui, partiellement' },
          { value: 'Non, j’aurai besoin d’aide pour les rédiger' },
        ],
      },
      {
        id: 'photos',
        label: 'Possédez-vous des photos ?',
        type: 'radio',
        required: true,
        options: [
          { value: 'Oui, de bonne qualité' },
          { value: 'Oui, mais de qualité moyenne' },
          { value: 'Non / très peu' },
        ],
      },
      {
        id: 'videos',
        label: 'Avez-vous des vidéos ?',
        type: 'radio',
        options: [{ value: 'Oui' }, { value: 'Non' }, { value: 'Peut-être plus tard' }],
      },
      {
        id: 'aideRedaction',
        label: 'Souhaitez-vous mon aide pour la rédaction des textes ?',
        type: 'radio',
        options: [
          { value: 'Oui, complètement' },
          { value: 'Oui, pour certaines pages' },
          { value: 'Non, je m’en occupe' },
        ],
      },
      {
        id: 'temoignages',
        label: 'Avez-vous des témoignages / avis clients à mettre en avant ?',
        type: 'radio',
        options: [{ value: 'Oui' }, { value: 'Non' }, { value: 'Je peux en demander' }],
      },
      {
        id: 'accompagnementContenus',
        label: 'Souhaitez-vous un accompagnement pour la création des contenus (textes + photos) ?',
        type: 'radio',
        options: [{ value: 'Oui' }, { value: 'Non' }, { value: 'On en discutera' }],
      },
    ],
  },

  {
    id: 'section-8',
    number: 8,
    title: 'Référencement et visibilité (Google)',
    fields: [
      {
        id: 'visibiliteGoogle',
        label: 'Souhaitez-vous que votre site soit bien visible sur Google ?',
        type: 'radio',
        required: true,
        options: [
          { value: 'Oui, c’est important' },
          { value: 'Oui, mais ce n’est pas la priorité n°1' },
          { value: 'Je ne sais pas encore' },
        ],
      },
      {
        id: 'zonesGoogle',
        label: 'Quelles villes ou zones géographiques cibler en priorité ?',
        type: 'text',
      },
      {
        id: 'servicesGoogle',
        label: 'Quels services ou produits mettre en avant sur Google ?',
        type: 'textarea',
        hint: 'Exemples : « coiffeur homme Lyon 6 », « plombier urgence Nantes », « coach sportif à domicile »…',
      },
      {
        id: 'googleBusiness',
        label: 'Avez-vous déjà une fiche Google Business Profile (ex-Google My Business) ?',
        type: 'radio',
        options: [{ value: 'Oui' }, { value: 'Non' }, { value: 'Je ne sais pas' }],
      },
    ],
  },

  {
    id: 'section-9',
    number: 9,
    title: 'Informations techniques (expliquées simplement)',
    fields: [
      {
        id: 'domaine',
        label: 'Possédez-vous déjà un nom de domaine ?',
        type: 'radio',
        hint: 'Ex. : www.votre-entreprise.fr',
        options: [
          { value: 'Oui', text: true, textLabel: 'Indiquez-le' },
          { value: 'Non' },
          { value: 'Je ne sais pas' },
        ],
      },
      {
        id: 'hebergement',
        label: 'Possédez-vous déjà un hébergement ?',
        type: 'radio',
        hint: 'L’endroit où sont stockés les fichiers de votre site.',
        options: [{ value: 'Oui' }, { value: 'Non' }, { value: 'Je ne sais pas' }],
      },
      {
        id: 'emailsPro',
        label: 'Disposez-vous d’adresses e-mail professionnelles ?',
        type: 'radio',
        hint: 'Ex. : contact@votre-entreprise.fr',
        options: [{ value: 'Oui' }, { value: 'Non' }, { value: 'Je souhaite en créer' }],
      },
      {
        id: 'modifContenu',
        label: 'Souhaitez-vous pouvoir modifier vous-même certains contenus plus tard ?',
        type: 'radio',
        hint: 'Ajouter une photo, changer un texte, publier un article…',
        options: [
          { value: 'Oui, c’est important' },
          { value: 'Un peu' },
          { value: 'Non, je préfère que vous vous en occupiez' },
        ],
      },
      {
        id: 'accompagnement',
        label: 'Souhaitez-vous un accompagnement après la mise en ligne ?',
        type: 'radio',
        hint: 'Formation, maintenance, mises à jour, conseils.',
        options: [{ value: 'Oui' }, { value: 'Non' }, { value: 'On en discutera' }],
      },
    ],
  },

  {
    id: 'section-10',
    number: 10,
    title: 'Budget et délais',
    fields: [
      {
        id: 'budget',
        label: 'Quel budget avez-vous envisagé pour la création du site ?',
        type: 'radio',
        required: true,
        hint: 'Fourchette indicative – cela m’aide à vous proposer la solution la plus adaptée.',
        options: [
          { value: 'Moins de 1 000 €' },
          { value: '1 000 € – 2 000 €' },
          { value: '2 000 € – 4 000 €' },
          { value: '4 000 € – 7 000 €' },
          { value: 'Plus de 7 000 €' },
          { value: 'Je ne sais pas encore / à définir ensemble' },
        ],
      },
      {
        id: 'delaiSouhaite',
        label: 'Quand souhaitez-vous idéalement que le site soit terminé ?',
        type: 'text',
        required: true,
        placeholder: 'Ex. avant fin mars 2027',
      },
      {
        id: 'dateImportante',
        label: 'Avez-vous une date importante à respecter ?',
        type: 'radio',
        hint: 'Ouverture d’un commerce, lancement d’un produit, événement…',
        options: [{ value: 'Oui', text: true, textLabel: 'Date' }, { value: 'Non' }],
      },
      {
        id: 'urgence',
        label: 'Le projet est-il urgent ?',
        type: 'radio',
        options: [{ value: 'Oui' }, { value: 'Non' }, { value: 'Moyennement' }],
      },
    ],
  },

  {
    id: 'section-11',
    number: 11,
    title: 'Questions supplémentaires',
    fields: [
      {
        id: 'concurrents',
        label: 'Qui sont vos principaux concurrents ?',
        type: 'textarea',
        hint: 'Sites ou entreprises que vos clients consultent aussi.',
      },
      {
        id: 'difference',
        label: 'Qu’est-ce qui vous différencie vraiment de vos concurrents ?',
        type: 'textarea',
      },
      {
        id: 'messagePrincipal',
        label: 'Quel message principal souhaitez-vous transmettre à vos visiteurs ?',
        type: 'textarea',
        hint: 'Exemples : « Expertise et proximité », « Qualité artisanale », « Rapidité et fiabilité »…',
      },
      {
        id: 'autresIdees',
        label: 'Avez-vous d’autres idées, inspirations ou remarques importantes ?',
        type: 'textarea',
      },
    ],
  },

  {
    id: 'section-12',
    number: 12,
    title: 'Validation finale',
    fields: [
      {
        id: 'confirmation',
        label:
          'Je confirme avoir lu et rempli ce questionnaire avec le plus d’informations possibles.',
        type: 'confirm',
        required: true,
      },
      { id: 'remarquesFinales', label: 'Remarques supplémentaires', type: 'textarea' },
      { id: 'signature', label: 'Signature / Nom', type: 'text' },
      { id: 'dateValidation', label: 'Date', type: 'date' },
    ],
  },
];

/* --------------------------- helpers partages --------------------------- */

function includes(data, fieldId, needle) {
  const v = data[fieldId];
  if (!Array.isArray(v)) return false;
  return v.some((x) => String(x).toLowerCase().includes(needle.toLowerCase()));
}

function wantsShop(data) {
  return (
    includes(data, 'fonctionnalites', 'boutique en ligne') ||
    includes(data, 'fonctionnalites', 'paiement en ligne') ||
    includes(data, 'typeSite', 'e-commerce')
  );
}

export const allFields = () => SCHEMA.flatMap((s) => s.fields.map((f) => ({ ...f, section: s.number })));

export const requiredFields = () =>
  allFields().filter((f) => f.required && f.type !== 'confirm');

export const findField = (id) => allFields().find((f) => f.id === id);

export const isVisible = (field, data) => (typeof field.showIf === 'function' ? field.showIf(data) : true);

/** Champs "confirm" et champs caches ne comptent pas dans la progression. */
export function completionRatio(data) {
  const fields = requiredFields().filter((f) => isVisible(f, data));
  if (!fields.length) return 0;
  const done = fields.filter((f) => String(data[f.id] ?? '').trim() !== '').length;
  return Math.round((done / fields.length) * 100);
}

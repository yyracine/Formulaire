# Questionnaire client → document Markdown → e-mail

Application web (statique + une fonction serverless) qui permet à un client de remplir le
questionnaire de création de site web (12 sections), puis :

1. **génère un document Markdown** avec toutes ses réponses,
2. **l'envoie par e-mail** à l'adresse que vous paramétrez (pièce jointe `.md` + copie dans le corps),
3. affiche une confirmation au client, avec **téléchargement** et **copie** du document.

Le formulaire fonctionne aussi **sans configuration e-mail** : le client peut alors télécharger
son document ou vous l'envoyer via un lien `mailto:` prérempli. Rien n'est jamais perdu.

Aucune dépendance à l'exécution, aucun build : trois fichiers HTML/CSS/JS et une fonction
d'envoi compatible **Vercel**, **Netlify** et **Cloudflare Pages**.

---

## 1. Démarrage local

```powershell
# à la racine du projet
Copy-Item .env.example .env    # puis renseignez vos valeurs (facultatif pour tester)
npm run dev                    # http://localhost:3000
```

Sans `.env`, le site affiche le formulaire et, à l'envoi, propose le téléchargement du `.md`
message « envoi automatique non activé ».

Tests :

```powershell
npm test                       # génération Markdown (sans dépendance)
npm install jsdom --no-save
node tools/test-ui.mjs         # rendu, validation, aperçu, envoi (jsdom)
```

---

## 2. Paramétrer la boîte mail (Resend — gratuit jusqu'à 3 000 e-mails/mois)

1. Créez un compte sur [resend.com](https://resend.com) et une **clé API** (`re_…`) :
   *API Keys → Create API Key → permission « Sending access »*.
2. Renseignez les 2 variables minimum :

| Variable | Exemple | Rôle |
| --- | --- | --- |
| `RESEND_API_KEY` | `re_abc123…` | Clé API Resend |
| `MAIL_TO` | `vous@votre-domaine.fr` | **Boîte qui reçoit les questionnaires** |
| `MAIL_FROM` | `Questionnaire Site <questionnaire@votre-domaine.fr>` | Expéditeur (facultatif) |
| `MAIL_SUBJECT_PREFIX` | `[Questionnaire site]` | Préfixe du sujet (facultatif) |
| `MAIL_ATTACHMENT_NAME` | `questionnaire.md` | Nom de pièce jointe par défaut (facultatif) |

> **Pour tester tout de suite** : laissez `MAIL_FROM` sur `onboarding@resend.dev` et mettez dans
> `MAIL_TO` l'adresse e-mail de votre compte Resend. Resend n'autorise l'envoi vers d'autres
> destinataires qu'après **vérification d'un domaine** (Domains → Add Domain → DNS).

Le client reçoit l'e-mail en `reply-to` : vous pouvez lui répondre directement.

---

## 3. Déploiement (choisissez une plateforme)

### Vercel

```powershell
npm i -g vercel
vercel            # première fois : lie le projet
vercel --prod
```

* `vercel.json` déclare déjà `outputDirectory: public` et `api/submit.js`.
* Variables : *Project → Settings → Environment Variables* → `RESEND_API_KEY`, `MAIL_TO`, `MAIL_FROM`.
* URL publique de la forme `https://questionnaire-site-client.vercel.app`.

### Netlify

1. Poussez le dossier sur GitHub/GitLab, puis *Add new site → Import an existing project*.
2. `netlify.toml` est déjà prêt (`publish = "public"`, `functions = "netlify/functions"`,
   redirection `/api/submit`).
3. *Site configuration → Environment variables* → mêmes 3 variables.
4. `https://<nom-du-site>.netlify.app`.

### Cloudflare Pages

1. *Workers & Pages → Create → Pages → Connect to Git*, dossier racine du projet.
2. Build command : **(aucune)** — Build output directory : **`public`**
   (`wrangler.toml` le précise déjà, les `functions/` sont détectées automatiquement).
3. *Settings → Variables and Secrets* → `RESEND_API_KEY` (secret), `MAIL_TO`, `MAIL_FROM`.
4. `https://<nom-du-site>.pages.dev`.

Test local Cloudflare : `npx wrangler pages dev public`.

> Le lien à envoyer à votre client est simplement l'URL publique ci-dessus
> (éventuellement personnalisée avec un domaine à vous).

---

## 4. Structure du projet

```
public/
  index.html        page unique (hero, formulaire, succès, dialogue d'aperçu)
  styles.css        design (encre / or, responsive, mobile-first)
  schema.js         ← les 12 sections et toutes les questions/réponses
  render.js         construction des champs à partir du schéma
  store.js          lecture du DOM, validation, brouillon localStorage
  markdown.js       génération du document Markdown + nom de fichier
  app.js            interactions, aperçu, envoi
lib/handler.js      envoi Resend (partagé par les 3 plateformes)
api/submit.js       entrée Vercel
netlify/functions/submit.js   entrée Netlify
functions/api/submit.js       entrée Cloudflare Pages
dev-server.mjs      serveur local (statique + /api/submit)
tools/              tests + exemple de document généré
```

## 5. Personnaliser le questionnaire

Tout se modifie dans **`public/schema.js`** : libellés, options, aides, champs obligatoires.
Le document Markdown et le formulaire suivent automatiquement.

```js
{ id: 'secteur', label: "Secteur d'activité", type: 'text', required: true,
  hint: 'Exemples : coiffure, plomberie…' }
```

Types disponibles : `text`, `email`, `tel`, `url`, `date`, `textarea`, `radio`, `checks`, `confirm`.
Options d'un champ : `required`, `hint`, `placeholder`, `max` (nombre de cases maximum),
`other` (ajoute « Autre » + précision), `showIf: (data) => …` (affichage conditionnel).
Pour une réponse avec précision, mettez `{ value: 'Oui', text: true, textLabel: 'Indiquez-le' }`.

> Si vous changez beaucoup de choses, relancez `npm test` : il vérifie que chaque section
> du schéma est bien rendue dans le document.

## 6. Comment fonctionne l'envoi

1. Le client clique sur **Envoyer le questionnaire**.
2. Le navigateur valide les champs obligatoires, génère le Markdown
   (`buildMarkdown`) et appelle `POST /api/submit` avec `{ markdown, filename, client }`.
3. La fonction serverless envoie l'e-mail via Resend : sujet
   `Nouveau questionnaire site web — <entreprise>`, corps lisible + **pièce jointe `.md`**.
4. Réponses possibles : `200 ok`, `501 email_not_configured` (le client bascule sur le
   téléchargement + `mailto:`), `502 provider_error` (problème Resend), `400/413` (document vide/trop gros).

## 7. Points de vigilance

- **RGPD** : les réponses peuvent contenir des données personnelles. Resend reçoit le document
  pour l'acheminer ; hébergez la fonction dans l'UE si nécessaire. Aucun contenu n'est stocké
  côté serveur par cette application.
- **Anti-spam** : il n'y a pas de CAPTCHA (le lien est privé, `noindex`). Si l'URL fuite, ajoutez
  Cloudflare Turnstile ou une limitation de débit côté fonction.
- **Taille** : document limité à 200 000 caractères ; limite Resend ~10 Mo par e-mail.
- **Brouillon** : sauvegardé dans le `localStorage` du navigateur du client, effacé après envoi.
  Sur ordinateur partagé, le client peut cliquer sur « Effacer le brouillon ».

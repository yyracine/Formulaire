# RESUME — état du projet « Formulaire »

> **Fichier de reprise.** À lire au début de chaque session ; à mettre à jour à la fin
> de chaque session (section « Journal des sessions » + état des tâches).
> Dernière mise à jour : **2026-11-25 (fin de session 1)**.

## 0. Reprendre ici (prochaine action exacte)

1. `resend.com/profile` → carte « Votre courriel » → `yaokenny@outlook.com` → « Sauvegarder »,
   puis **confirmer dans Gmail ET dans Outlook**. (Bloquant pour recevoir sur Outlook.)
2. `node tools/send-test.mjs` → doit répondre `200 ok` (destinataire `yaokenny@outlook.com`).
3. Vercel (import GitHub en cours) : nom `formulaire`, preset `Other`, output `public`,
   variables `RESEND_API_KEY` / `MAIL_TO=yaokenny@outlook.com` / `MAIL_FROM=onboarding@resend.dev`
   en environnement **Production and Preview** → **Deploy**.
4. Tester le formulaire depuis l'URL Vercel et vérifier la réception de l'e-mail + pièce jointe.

---

## 1. Objectif

Le client reçoit un **lien web** (Vercel / Netlify / Cloudflare) vers une page qui contient le
questionnaire de création de site web (12 sections, source `D:\Téléchargements\Questionnaire_Site.md`).

Flux attendu :

1. le client remplit le formulaire (validation, brouillon automatique, aperçu) ;
2. à l'envoi, l'application **génère un document Markdown** avec toutes ses réponses ;
3. ce document est **expédié par e-mail** vers la boîte paramétrée, en pièce jointe `.md` ;
4. le client voit une confirmation avec téléchargement / copie du document.

## 2. Où est le projet

| | |
| --- | --- |
| Dossier local | `D:\Projets\questionnaire-site-client` |
| Dépôt GitHub | https://github.com/yyracine/Formulaire (branche `main`) |
| Serveur local | `http://localhost:3000` (`npm run dev`) |
| Hébergement cible | Vercel — projet `formulaire` (import GitHub), **en cours de configuration** |

## 3. État d'avancement

### Fait ✅

- Application complète et testée (voir §6) : formulaire 12 sections, validation, brouillon
  `localStorage`, aperçu du Markdown, écran de confirmation.
- Génération du document Markdown (`public/markdown.js`), nom de fichier
  `questionnaire-site-<entreprise>-<AAAA-MM-JJ>.md`.
- Envoi e-mail via **Resend** (`lib/handler.js`) avec pièce jointe, `reply_to` du client,
  corps texte + HTML.
- Trois points d'entrée serverless **identiques** : Vercel (`api/submit.js`),
  Netlify (`netlify/functions/submit.js`), Cloudflare Pages (`functions/api/submit.js`).
- Repli automatique sans configuration e-mail : téléchargement du `.md` + lien `mailto:`.
- Config de déploiement prête : `vercel.json`, `netlify.toml`, `wrangler.toml`, `.env.example`, `README.md`.
- Clé Resend testée : envoi réel accepté (ID `01a21453…`, `01a21456…` vers `racine.yao@gmail.com`).
- Dépôt GitHub créé, code poussé (commit `540740c`), `.env` exclu du versionnement.

### En cours / à faire ⏳

1. **Changer l'e-mail du compte Resend** → `yaokenny@outlook.com`
   (`resend.com/profile` → carte « Votre courriel » → champ « Adresse email » → « Sauvegarder »,
   puis confirmer dans **les deux** boîtes). Sans nom de domaine, Resend en mode test n'autorise
   l'envoi que vers l'adresse du titulaire : c'est la seule façon de recevoir sur Outlook.
   *Repli si le champ est verrouillé (compte Google) : Team → Invite → `yaokenny@outlook.com` (Admin),
   accepter, se reconnecter avec, puis quitter l'équipe avec l'ancienne adresse.*
2. **Finaliser le déploiement Vercel** : nom de projet `formulaire`, preset `Other`,
   output `public`, variables `RESEND_API_KEY`, `MAIL_TO=yaokenny@outlook.com`,
   `MAIL_FROM=onboarding@resend.dev` (environnement **Production and Preview**), puis **Deploy**.
3. **Test de bout en bout depuis l'URL Vercel** (remplir le formulaire → vérifier la réception).
4. Optionnel / plus tard :
   - domaine propre (8–12 €/an) pour un expéditeur pro (`questionnaire@domaine.fr`) et la livraison
     vers n'importe quelle adresse ;
   - anti-spam (Cloudflare Turnstile) si l'URL fuite ;
   - variante Gmail SMTP (`nodemailer` + mot de passe d'application) si Resend pose problème.

## 4. Structure

```
public/            application statique (aucune dépendance, aucun build)
  index.html       page unique : hero, formulaire, écran de succès, dialogue d'aperçu
  styles.css       design encre/or, responsive mobile-first
  schema.js        ← LES 12 SECTIONS ET TOUTES LES QUESTIONS (tout se personnalise ici)
  render.js        construction des champs à partir du schéma
  store.js         lecture du DOM, validation, brouillon localStorage
  markdown.js      génération du Markdown + nom de fichier (module pur, testé sous Node)
  app.js           interactions, aperçu, envoi
lib/handler.js     envoi Resend (commun aux 3 plateformes)
api/submit.js                  entrée Vercel
netlify/functions/submit.js    entrée Netlify
functions/api/submit.js        entrée Cloudflare Pages
dev-server.mjs     serveur local (statique + /api/submit, lit .env)
tools/             test-markdown.mjs, test-ui.mjs, send-test.mjs, out/exemple.md
```

## 5. Configuration actuelle

`.env` local (jamais versionné) :

```ini
RESEND_API_KEY=re_…                       # clé valide du compte Resend
MAIL_TO=yaokenny@outlook.com              # destinataire souhaité (échange Resend en attente)
MAIL_FROM=Questionnaire Site <onboarding@resend.dev>
MAIL_SUBJECT_PREFIX=[Questionnaire site]
MAIL_ATTACHMENT_NAME=questionnaire.md
```

Variables **non encore saisies dans Vercel** (§3.2).

## 6. Tests et vérifications

```powershell
npm test                                  # génération Markdown : OK (6 970 car., 174 lignes)
npm install jsdom --no-save
node tools/test-ui.mjs                    # rendu, validation, aperçu, envoi : OK (58 champs)
node tools/send-test.mjs                  # envoi réel via .env : 200 OK vers racine.yao@gmail.com
```

Routes vérifiées en local : `GET /` → 200, `POST /api/submit` → 501 `email_not_configured`
sans clé, 200 avec clé et destinataire autorisé, 502 + message Resend sinon.

**Non vérifié à ce jour** : rendu visuel réel (aucun navigateur installé sur la machine — tests via jsdom),
et envoi vers `yaokenny@outlook.com` (bloqué par le mode test Resend).

## 7. Points de vigilance

- Ne **jamais** commiter `.env` ni afficher la clé API. `.gitignore` couvre `.env`,
  `node_modules/`, les logs et `tools/out/`.
- Le document est limité à 200 000 caractères côté fonction ; Resend ~10 Mo par e-mail.
- Données personnelles (RGPD) : rien n'est stocké côté serveur, Resend achemine le document.
- `MAIL_FROM` sur `onboarding@resend.dev` = mode test : un seul destinataire possible (le titulaire).

## 8. Journal des sessions

### 2026-11-25 — session 1
- Analyse du questionnaire source et création complète de l'application.
- Écriture du schéma (12 sections), du générateur Markdown, de l'UI, des 3 entrées serverless.
- Tests : `test-markdown` (OK), `test-ui` via jsdom (OK), envoi réel Resend (OK vers Gmail).
- `git init`, commit `540740c`, poussé sur `yyracine/Formulaire` (main).
- Bascule de `MAIL_TO` vers `yaokenny@outlook.com` → blocage identifié (mode test Resend).
- Déploiement Vercel entamé (écran d'import), variables d'environnement en cours de saisie.
- Documentation de reprise : `RESUME.md` + `AGENTS.md` (commit `7d801c2`), renvoi depuis
  `README.md` (commit `379fafb`) — tout est poussé sur `main`.
- **Fin de session** : rien en cours d'exécution côté machine (serveur local arrêté avec la session).
  Prochaine action = §0 ci-dessus (changement d'e-mail Resend, puis envoi de contrôle, puis Vercel).

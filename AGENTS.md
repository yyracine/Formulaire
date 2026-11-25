# AGENTS.md — consignes pour l'agent (pi / Particle-1)

Ce dépôt contient le formulaire client « Formulaire » : questionnaire web → document Markdown → e-mail.

## À faire à chaque ouverture de session

1. **Lire `RESUME.md` en entier avant toute action.** Il contient l'objectif, l'état d'avancement,
   la configuration courante, les blocages et le journal des sessions.
2. Vérifier rapidement l'état du dépôt : `git status -sb`, `git log --oneline -5`.
3. Ne pas relire les fichiers déjà décrits dans `RESUME.md` sans raison : lire ciblé.

## À faire à la fin de chaque session

1. **Mettre à jour `RESUME.md`** :
   - `Dernière mise à jour` (date),
   - §3 « État d'avancement » (ce qui est fait ✅ / ce qui reste ⏳),
   - §5 « Configuration actuelle » si `.env` ou les variables d'hébergement changent,
   - §6 si les tests changent,
   - ajouter une entrée horodatée dans §8 « Journal des sessions » (ce qui a été fait, ce qui a échoué).
2. Commiter et pousser (voir « Git » ci-dessous).
3. Terminer par un résumé court : fait / bloqué / prochaine étape.

## Règles du projet

- **Environnement** : Windows, PowerShell (`Get-ChildItem`, `$env:VAR`, `;`), chemins `D:\...`.
  Le dossier de travail du projet est `D:\Projets\questionnaire-site-client`.
- **Langue** : tout en français (code, commentaires, UI, messages de commit, réponses).
- **Zéro dépendance à l'exécution et zéro build** : le site est statique (`public/`), l'envoi
  passe par une fonction serverless. Ne pas introduire de framework ni d'étape de compilation.
- **Secrets** : `.env` n'est **jamais** commité, jamais affiché, jamais recopié dans un fichier
  versionné. Ne jamais imprimer une clé API dans la sortie d'une commande.
- **Personnalisation du questionnaire** : tout se passe dans `public/schema.js`
  (types : `text`, `email`, `tel`, `url`, `date`, `textarea`, `radio`, `checks`, `confirm` ;
  options : `required`, `hint`, `placeholder`, `max`, `other`, `showIf: (data) => …`).
  Le formulaire **et** le document Markdown suivent automatiquement le schéma.

## Avant de dire qu'une tâche est terminée

```powershell
npm test                        # génération Markdown
npm install jsdom --no-save     # une seule fois
node tools/test-ui.mjs          # rendu, validation, aperçu, envoi (jsdom)
node tools/send-test.mjs        # envoi réel (nécessite .env valide)
```

Lancer au minimum `npm test` et `node tools/test-ui.mjs` après toute modification de
`public/` ou `lib/`. Si l'envoi échoue avec un 403 Resend, c'est la limite du mode test
(seul le titulaire du compte reçoit) — voir `RESUME.md` §3.

## Git

- Dépôt : `https://github.com/yyracine/Formulaire`, branche `main`, identité locale
  `yyracine <yyracine@users.noreply.github.com>`.
- Commits en français, à l'impératif, une ligne de titre + corps si utile.
- Vérifier `git status --short` et l'absence de `.env` / `node_modules` dans l'index avant de commiter.
- Pousser avec `git push` (identifiants GitHub déjà en cache sur cette machine).

## Déploiement (mémo)

| Plateforme | Réglages | Entrée |
| --- | --- | --- |
| Vercel | preset `Other`, output `public`, aucun build | `api/submit.js` |
| Netlify | `netlify.toml` déjà prêt | `netlify/functions/submit.js` |
| Cloudflare Pages | output `public`, `wrangler.toml` | `functions/api/submit.js` |

Variables à définir dans l'hébergeur : `RESEND_API_KEY`, `MAIL_TO`, `MAIL_FROM`
(environnement « Production and Preview » sur Vercel). Détails dans `README.md` §3.

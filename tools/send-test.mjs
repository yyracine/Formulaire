/**
 * Envoi réel de test : utilise le document d'exemple (tools/out/exemple.md)
 * et la configuration du fichier .env. N'affiche jamais la clé API.
 *   node tools/send-test.mjs
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// lecture de .env (même logique que dev-server.mjs)
try {
  const envFile = await readFile(join(root, '.env'), 'utf8');
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!match) continue;
    let value = match[2].trim();
    if (/^["'].*["']$/.test(value)) value = value.slice(1, -1);
    if (!(match[1] in process.env)) process.env[match[1]] = value;
  }
} catch {
  console.error('Pas de fichier .env à la racine.');
  process.exit(1);
}

const { sendQuestionnaire } = await import('../lib/handler.js');

const markdown = await readFile(join(root, 'tools', 'out', 'exemple.md'), 'utf8').catch(() => null);
if (!markdown) {
  console.error('Document d’exemple absent : lancez d’abord npm test.');
  process.exit(1);
}

console.log(`Destinataire : ${process.env.MAIL_TO}`);
console.log(`Expéditeur   : ${process.env.MAIL_FROM}`);
console.log(`Document     : ${markdown.length} caractères`);
console.log('Envoi en cours…\n');

const result = await sendQuestionnaire(
  {
    markdown,
    filename: 'questionnaire-site-test-envoi.md',
    client: {
      name: 'Camille Marchand (test)',
      company: 'Atelier Bois & Lumière (test)',
      email: 'camille@bois-et-lumiere.fr',
      phone: '+33 6 12 34 56 78',
    },
  },
  process.env,
);

console.log('Réponse serveur :', JSON.stringify(result, null, 2));

if (!result.body.ok) {
  // diagnostic : domaines vérifiés sur le compte Resend
  try {
    const response = await fetch('https://api.resend.com/domains', {
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    });
    const data = await response.json().catch(() => ({}));
    const list = Array.isArray(data?.data) ? data.data : [];
    console.log('\nDomaines du compte Resend :');
    if (!list.length) console.log('  (aucun domaine — mode test uniquement)');
    for (const d of list) console.log(`  - ${d.name} — statut : ${d.status}`);
  } catch {
    console.log('\nDiagnostic des domaines indisponible.');
  }
  process.exit(1);
}

console.log('\nE-mail accepté par Resend. Vérifiez la boîte :', process.env.MAIL_TO);

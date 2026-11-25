/**
 * Serveur de développement local (aucune dépendance).
 *   node dev-server.mjs        puis http://localhost:3000
 *
 * Sert le dossier public/ et expose POST /api/submit comme le feront
 * Vercel, Netlify ou Cloudflare Pages.
 * Lit les variables depuis .env (si présent) puis depuis l'environnement.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const publicDir = join(root, 'public');
const port = Number(process.env.PORT || 3000);

/* ------------------------------- .env ------------------------------------- */
try {
  const envFile = await readFile(join(root, '.env'), 'utf8');
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if (/^["'].*["']$/.test(value)) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
} catch {
  /* pas de .env : on continuera avec l'environnement */
}

const { sendQuestionnaire } = await import('./lib/handler.js');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 1_000_000) {
        reject(new Error('body_too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });

const sendJson = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);

  if (url.pathname === '/api/submit') {
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.method !== 'POST') {
      sendJson(res, 405, { ok: false, error: 'method_not_allowed' });
      return;
    }
    try {
      const raw = await readBody(req);
      const payload = JSON.parse(raw || '{}');
      const { status, body } = await sendQuestionnaire(payload, process.env);
      sendJson(res, status, body);
    } catch {
      sendJson(res, 400, { ok: false, error: 'invalid_json' });
    }
    return;
  }

  // fichiers statiques
  const relative = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
  let filePath = join(publicDir, relative || 'index.html');
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const info = await stat(filePath);
    if (info.isDirectory()) filePath = join(filePath, 'index.html');
    const content = await readFile(filePath);
    res.writeHead(200, {
      'content-type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(content);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('404 — page introuvable');
  }
});

server.listen(port, () => {
  const configured = Boolean(process.env.RESEND_API_KEY && process.env.MAIL_TO);
  console.log(`\n  Formulaire client sur http://localhost:${port}`);
  console.log(`  Envoi d'e-mail : ${configured ? 'configuré' : 'NON configuré (mode téléchargement)'}`);
  console.log(`  Ctrl+C pour arrêter\n`);
});

/**
 * Point d'entrée Cloudflare Pages Functions : POST /api/submit
 * Les variables d'environnement arrivent via `context.env`.
 */
import { sendQuestionnaire } from '../../lib/handler.js';

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

const reply = (status, body) => new Response(JSON.stringify(body), { status, headers });

export async function onRequestPost(context) {
  let payload;
  try {
    payload = await context.request.json();
  } catch {
    return reply(400, { ok: false, error: 'invalid_json' });
  }

  const { status, body } = await sendQuestionnaire(payload, context.env);
  return reply(status, body);
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers });
}

export async function onRequestGet() {
  return reply(405, { ok: false, error: 'method_not_allowed' });
}

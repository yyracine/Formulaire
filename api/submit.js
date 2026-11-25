/**
 * Point d'entrée Vercel (Node) : POST /api/submit
 */
import { sendQuestionnaire } from '../lib/handler.js';

function parseBody(body) {
  if (!body) return null;
  if (typeof body === 'object') return body;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  const payload = parseBody(req.body);
  if (!payload) {
    res.status(400).json({ ok: false, error: 'invalid_json' });
    return;
  }

  const { status, body } = await sendQuestionnaire(payload, process.env);
  res.status(status).json(body);
}

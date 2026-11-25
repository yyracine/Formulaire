/**
 * Point d'entrée Netlify Functions : POST /api/submit (via redirect netlify.toml)
 */
import { sendQuestionnaire } from '../../lib/handler.js';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: JSON_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: JSON_HEADERS,
      body: JSON.stringify({ ok: false, error: 'method_not_allowed' }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({ ok: false, error: 'invalid_json' }),
    };
  }

  const { status, body } = await sendQuestionnaire(payload, process.env);
  return { statusCode: status, headers: JSON_HEADERS, body: JSON.stringify(body) };
};

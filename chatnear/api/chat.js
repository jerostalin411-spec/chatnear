// api/chat.js — Vercel Serverless Function
// Proxies requests to Anthropic, keeping the API key secret on the server.
// Rate limiting: max 20 requests per IP per minute.

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX    = 20;         // requests per window
const ipMap = new Map();              // in-memory (resets on cold start)

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = ipMap.get(ip) || { count: 0, start: now };
  // Reset window if expired
  if (now - entry.start > RATE_LIMIT_WINDOW) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count++;
  ipMap.set(ip, entry);
  return entry.count <= RATE_LIMIT_MAX;
}

export default async function handler(req, res) {
  // ── CORS ──
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── RATE LIMIT ──
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }

  // ── VALIDATE BODY ──
  const { model, max_tokens, system, messages } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  // ── SAFETY: only allow specific models & cap tokens ──
  const allowedModels = ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001'];
  const safeModel = allowedModels.includes(model) ? model : 'claude-haiku-4-5-20251001';
  const safeTokens = Math.min(max_tokens || 150, 300); // cap at 300

  // ── CALL ANTHROPIC ──
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: safeModel,
        max_tokens: safeTokens,
        system,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Anthropic API error' });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

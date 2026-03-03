# ChatNear 🌐
> Find and chat with people nearby — like AirDrop, but for friendships.

## Deploy to Vercel (5 minutes)

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy
```bash
cd chatnear
vercel
```
Follow the prompts — choose defaults for everything.

### 4. Add your Anthropic API key
After deploy, go to:
**Vercel Dashboard → Your Project → Settings → Environment Variables**

Add:
| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-xxxxxxxxxxxx` |

Then redeploy:
```bash
vercel --prod
```

Your app is live at `https://chatnear-xxx.vercel.app` 🎉

---

## Alternative: Netlify

### 1. Install Netlify CLI
```bash
npm install -g netlify-cli
```

### 2. Create `netlify/functions/chat.js`
Rename `api/chat.js` → `netlify/functions/chat.js`  
Change the export from `export default` to `exports.handler = async (event) => {...}`

### 3. Deploy
```bash
netlify deploy --prod
```

### 4. Add API key
Netlify Dashboard → Site → Environment Variables → add `ANTHROPIC_API_KEY`

---

## Local Development

```bash
npm install -g vercel
cp .env.example .env.local
# Edit .env.local with your real API key
vercel dev
```
Visit `http://localhost:3000`

---

## Project Structure

```
chatnear/
├── index.html        ← Frontend (all UI, radar, chat)
├── api/
│   └── chat.js       ← Serverless proxy (keeps API key secret)
├── vercel.json       ← Vercel routing config
├── .env.example      ← Copy to .env.local for local dev
└── README.md
```

## Security Features
- ✅ API key never exposed to browser
- ✅ Rate limiting: 20 requests/IP/minute
- ✅ Token cap: max 300 tokens per request
- ✅ Model allowlist: only approved Claude models

## How It Works
- Users broadcast their presence to shared storage every 10s
- Nearby users appear on the radar within ~10 seconds
- Messages are stored in shared storage with a canonical chat key
- Frontend polls every 3s for new messages — fully real-time
- Demo users reply via Claude AI (through the secure proxy)

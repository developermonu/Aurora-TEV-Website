# Aurora Scents TEV Executive Portal — Deployment Guide

## Hostinger Node.js Deployment

### Step 1 — Prepare files for upload

Upload your **entire project folder** to Hostinger. The structure should be:

```
aurora-tev-portal/
├── server.js           ← Express server (entry point)
├── package.json        ← Dependencies
├── .env                ← API key (DO NOT commit to Git)
├── .gitignore
├── index.html
├── css/
│   └── main.css
├── js/
│   ├── app.js
│   ├── modules/
│   ├── engines/
│   └── data/
├── TEV Report.pdf
└── Recommended Products/
```

---

### Step 2 — Set up Node.js on Hostinger

1. Log into **Hostinger hPanel**
2. Go to **Hosting → Manage → Node.js**
3. Click **Create Application**
4. Set:
   - **Node.js version:** 20.x LTS
   - **Application root:** `/public_html` (or your upload path)
   - **Application startup file:** `server.js`
   - **Application URL:** your domain

---

### Step 3 — Add Environment Variables in Hostinger

> **Never** upload the `.env` file to Hostinger. Use their Environment Variables panel instead.

1. In hPanel → **Node.js → Environment Variables**
2. Add:

| Key | Value |
|-----|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` (your full key) |
| `PORT` | `3000` (or Hostinger's default) |
| `ALLOWED_ORIGIN` | `https://yourdomain.com` |

---

### Step 4 — Install dependencies on Hostinger

Via Hostinger's **Terminal** or **SSH**:

```bash
cd /path/to/your/app
npm install --production
```

---

### Step 5 — Start the application

```bash
node server.js
```

Or via hPanel → Node.js → **Restart Application**

---

### Step 6 — Verify it's working

- Open `https://yourdomain.com` — you should see the Passport Shield
- Enter token `AURORA_INDIA_2026` to authenticate
- Navigate to **AI Strategy Advisor** and ask a question
- The green dot should show **Claude Sonnet — Live TEV Intelligence**

---

## Architecture Overview

```
Browser ──→ Express Server (server.js)
               │
               ├── GET / → serves index.html + static files
               │
               └── POST /api/chat
                      │
                      └── Anthropic Claude API
                          (API key stored in .env / Hostinger env vars)
```

**Security features:**
- API key **never** sent to browser
- `helmet` for security headers
- Rate limiting: 30 requests / IP / minute
- Input sanitisation (message length capped, role validated)
- CORS locked to your domain (set `ALLOWED_ORIGIN`)

---

## Local Development

```bash
# Install dependencies
npm install

# Run development server (with auto-reload)
npm run dev

# Open in browser
open http://localhost:3000
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ANTHROPIC_API_KEY is not set` | Check `.env` file or Hostinger env vars panel |
| Chat returns 401 error | API key is invalid or expired |
| Chat returns 429 error | Rate limited — wait 1 minute |
| `Cannot GET /api/chat` | server.js not running |
| PDF not loading | Ensure `TEV Report.pdf` is in project root |

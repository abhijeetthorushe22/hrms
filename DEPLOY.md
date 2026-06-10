# AuraHR Deployment Guide

Deploy **backend** on Render and **frontend** on Vercel. Database stays on MongoDB Atlas.

## Prerequisites

- GitHub account with this repo pushed
- [MongoDB Atlas](https://www.mongodb.com/atlas) free cluster
- [Google AI Studio](https://aistudio.google.com/apikey) API key for Gemini
- [Render](https://render.com) account (backend)
- [Vercel](https://vercel.com) account (frontend)

---

## Step 1: MongoDB Atlas

1. Create a free M0 cluster.
2. Database Access → add a user with password.
3. Network Access → allow `0.0.0.0/0` (or Render IPs).
4. Connect → copy connection string:
   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?appName=Cluster0
   ```

---

## Step 2: Deploy Backend (Render)

1. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
2. Connect your GitHub repo.
3. Render reads `backend/render.yaml` automatically.
4. Set these environment variables when prompted:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your MongoDB Atlas connection string |
| `GOOGLE_API_KEY` | Your Gemini API key |
| `FRONTEND_URL` | Leave empty for now; set after Step 3 |

> **Note:** `SECRET_KEY`, `ALGORITHM`, `GEMINI_MODEL_NAME`, and all AI feature flags are pre-configured in `render.yaml` and will be set automatically.

5. Click **Apply** and wait for deploy (~10–20 min first time due to PyTorch download).
6. Note your backend URL, e.g. `https://aurahr-backend.onrender.com`
7. Test the **Render backend URL** (not Vercel): `https://aurahr-backend.onrender.com/health` — you should see `{"status":"healthy",...}`.

### Seed demo data (optional)

In Render Shell or locally with production `DATABASE_URL`:

```bash
cd backend
python scripts/seed_demo_users.py
```

---

## Step 3: Deploy Frontend (Vercel)

1. Go to [Vercel](https://vercel.com) → **Add New Project**.
2. Import your GitHub repo.
3. Set **Root Directory** to `frontend`.
4. Framework: **Vite** (auto-detected).
5. Add Environment Variable:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://YOUR-BACKEND.onrender.com/api` |

6. Click **Deploy**.
7. Note your frontend URL, e.g. `https://aurahr.vercel.app`

---

## Step 4: Connect Frontend ↔ Backend

1. In **Render** → your backend service → **Environment**:
   - Set `FRONTEND_URL` = `https://your-app.vercel.app` (no trailing slash)
2. Save → Render redeploys automatically.
3. In **Vercel** → redeploy if you changed `VITE_API_URL`.

---

## Step 5: Verify

1. Open your Vercel URL → login page loads.
2. Login with demo account:
   - **Admin:** `admin@aurahr.com` / `admin123`
3. Check Recruitment → upload resume → AI score appears.
4. Start screening → candidate link is generated.

---

## Environment Reference

### Backend (`backend/.env` or Render env vars)

```env
DATABASE_URL=mongodb+srv://...
GOOGLE_API_KEY=your-key
GEMINI_MODEL_NAME=gemini-2.0-flash
FRONTEND_URL=https://your-app.vercel.app
SECRET_KEY=auto-generated-by-render
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENABLE_GEMINI_FALLBACK=true
INIT_AI_ON_STARTUP=false
ENABLE_SPACY_PROCESSING=false
ENABLE_ML_CLASSIFIER=false
ENVIRONMENT=production
```

### Frontend (Vercel env vars)

```env
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## Gemini API Notes

- Key from [Google AI Studio](https://aistudio.google.com/apikey).
- Model `gemini-2.0-flash` is used with automatic fallbacks.
- If you see **429 quota exceeded**, enable billing or wait for quota reset in Google AI Studio.
- HuggingFace resume scoring works even if Gemini is unavailable.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Login fails / CORS error | Set `FRONTEND_URL` in Render to exact Vercel URL (no trailing slash) |
| API 404 on frontend | Check `VITE_API_URL` ends with `/api` |
| Backend slow first request | Normal on free/starter tier; models load lazily |
| Render build times out / OOM | Render uses `requirements-render.txt` (no spaCy) with `ENABLE_SPACY_PROCESSING=false` and `ENABLE_ML_CLASSIFIER=false` pre-set in `render.yaml` for the 512MB plan |
| JWT / auth errors after deploy | Ensure `ALGORITHM=HS256` and `ACCESS_TOKEN_EXPIRE_MINUTES=30` are set in Render env vars |
| Gemini uses template replies | Check API key and quota in Google AI Studio |
| `DATABASE_URL` not connecting | Use `sync: false` and manually paste MongoDB Atlas URI in Render dashboard |

---

## Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cp .env.example .env   # fill in values
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

# Deploy CareSync (Render + Vercel)

## 1) Deploy Backend to Render

1. Push this repository to GitHub.
2. In Render, click **New +** -> **Blueprint**.
3. Connect your GitHub repo and select it.
4. Render will detect `render.yaml` and create service `caresync-backend`.
5. Add environment variables in Render dashboard:
   - `SUPABASE_URL` = your Supabase project URL
   - `SUPABASE_KEY` = your Supabase anon key
   - `SUPABASE_SECRET` = your Supabase service role key
   - `MAPMYINDIA_API_KEY` = your MapMyIndia REST API key
   - `CORS_ORIGINS` = comma-separated allowed frontend origins (for example: `https://your-frontend.vercel.app`)

Backend start command is already configured:

- `uvicorn main:app --host 0.0.0.0 --port $PORT`

After deploy, note backend URL, for example:

- `https://caresync-backend.onrender.com`

## 2) Deploy Frontend to Vercel

1. In Vercel, click **Add New...** -> **Project**.
2. Import the same GitHub repository.
3. Set **Root Directory** to `frontend`.
4. Framework preset: **Vite** (auto-detected).
5. Add environment variable:
   - `VITE_API_URL` = your Render backend URL (for example `https://caresync-backend.onrender.com`)
   - `VITE_MAPMYINDIA_API_KEY` = your MapMyIndia JavaScript map key
6. Deploy.

`frontend/vercel.json` is included to rewrite routes to `index.html` for React Router.

## 3) Final Wiring

1. Copy your Vercel production URL.
2. Update Render env var `CORS_ORIGINS` with that exact URL.
3. Redeploy backend once.

## 4) Smoke Test

1. Open frontend URL.
2. Try login/signup flow.
3. Verify API docs open at `<backend-url>/docs`.
4. Check browser network calls use `VITE_API_URL` and return 2xx.

## 5) Required Database Migration

Run SQL in `backend/tenant_migration.sql` once in Supabase SQL editor.

This migration adds:

- Hospital-level ownership columns (`hospital_email`, `hospital_name`) so each hospital sees only its own data.
- Coordinate columns (`latitude`, `longitude`) for ambulance and emergency map markers.

## Notes

- If you use Vercel preview deployments, include both production and preview domains in `CORS_ORIGINS` separated by commas.
- If backend is sleeping (free tier), first request may be slow.

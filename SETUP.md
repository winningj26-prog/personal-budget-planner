# Setup Guide — Personal Monthly Budget Planner

This app is yours to deploy on your own infrastructure. No external servers are required beyond a free Supabase project and a free Vercel (or similar) deployment.

## 1. Create your Supabase project
1. Go to https://supabase.com and create a free account/project.
2. In SQL Editor, run `sql/schema.sql`.
3. Copy your Project URL and anon public key from Project Settings → API.
4. Enable Email sign-in under Authentication → Providers.

## 2. Configure the app
Copy `.env.example` to `.env` and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.

## 3. Run locally
```bash
npm install
npm run dev
```

## 4. Add categories
Go to Settings and add Income and Expense categories.

## 5. Deploy
Push the project to GitHub, import it into Vercel, add the two environment variables, and deploy.

Financial figures are for personal tracking only and are not professional financial, tax, or accounting advice.
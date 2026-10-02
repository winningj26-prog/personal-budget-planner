# Deployment Readiness

## Current state

The React application is deployment-ready from source/CI perspective, but production verification requires a configured Supabase project and a hosting account.

### Verified
- GitHub Actions run #51 completed successfully.
- TypeScript build completed successfully.
- Vitest test command completed successfully.
- CI workflow installs dependencies without requiring a lockfile cache.
- Supabase schema contains per-user RLS policies.
- Budget view is configured as a security-invoker view.
- Auth flow uses Supabase passwordless email OTP.
- Supabase URL/redirect setup is documented in SETUP.md.

### Not verifiable from repository access alone
- Actual Supabase project URL/key configuration.
- Auth email delivery.
- Auth redirect behavior against the deployed domain.
- Cross-user RLS behavior with two real authenticated identities.
- Production hosting deployment and URL.
- End-to-end browser behavior against live Supabase data.

## Release sequence

1. Create/configure Supabase and run `sql/schema.sql`.
2. Enable Email authentication and configure Site URL + Redirect URLs.
3. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the hosting provider.
4. Deploy the repository.
5. Sign in with a dedicated test account.
6. Run the RLS verification in `docs/SUPABASE-RLS-TESTS.sql` using two test users.
7. Exercise settings, categories, income, expenses, budget, dashboard, and annual summary.
8. Only after those checks pass, treat the production deployment as verified.

No production URL or deployment is claimed until those environment-level steps are actually executed.

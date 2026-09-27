# QA Baseline — Personal Monthly Budget Planner

**Status:** Unverified until executable CI or local environment completes the checks.

## Test-result table

| Test ID | App | Scenario | Input Data | Steps | Expected Result | Actual Result | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| PMBP-001 | Web app | Monthly income total | Sample income totaling 5,600 | Load January 2026 Income | Total Income = 5,600 | Not executed | Not Executed | Requires Supabase data |
| PMBP-002 | Web app | Monthly expense total | Sample expenses totaling 2,460 | Load January 2026 Expenses | Total Expenses = 2,460 | Not executed | Not Executed | Requires Supabase data |
| PMBP-003 | Web app | Savings | Income 5,600; expenses 2,460 | Open Dashboard | Savings = 3,140 | Not executed | Not Executed | Must derive from transactions |
| PMBP-004 | Web app | Savings rate | Income 5,600; savings 3,140 | Open Dashboard | Savings Rate = 56.1% | Not executed | Not Executed | |
| PMBP-005 | Web app | Budget variance | Planned 800; actual 750 | Open Monthly Budget | Difference = +50 | Not executed | Not Executed | |
| PMBP-006 | Web app | Budget utilization | Planned 500; actual 450 | Open Monthly Budget | % Used = 90.0%; Status = Near Limit | Not executed | Not Executed | |
| PMBP-007 | Web app | Overspending | Planned 500; actual 600 | Open Monthly Budget | Difference = -100; Status = Over Budget | Not executed | Not Executed | |
| PMBP-008 | Web app | Zero planned budget | Planned 0; actual 50 | Open Monthly Budget | Status = Over Budget; no divide-by-zero error | Not executed | Not Executed | |
| PMBP-009 | Web app | Settings persistence | Currency/month/year changed | Change settings; refresh | Settings reload from Supabase | Not executed | Not Executed | Requires authenticated project |
| PMBP-010 | Web app | Budget persistence | Planned amount entered | Save; refresh | Planned amount remains for selected period | Not executed | Not Executed | |
| PMBP-011 | Security | Cross-user isolation | Two authenticated users | Query financial tables | Each user sees only own rows | Not executed | Not Executed | Requires Supabase test environment |
| PMBP-012 | Security | Budget view isolation | Two authenticated users | Query budget view | View respects underlying RLS | Not executed | Not Executed | security_invoker added |
| PMBP-013 | Build | TypeScript/build | Repository source | npm install; npm run build | Build exits successfully | Not executed | Not Executed | No executable run observed |
| PMBP-014 | Navigation | Protected route | Signed-out browser | Visit /dashboard | Redirect to /login | Not executed | Not Executed | |
| PMBP-015 | Authentication | Magic-link login | Valid email | Request sign-in link | Supabase sends link and session loads | Not executed | Not Executed | Requires configured Auth |
| PMBP-016 | Income CRUD | Edit transaction | Existing income row | Edit amount/category/date; save | Updated row and KPI total reflect change | Not executed | Not Executed | Requires Supabase |
| PMBP-017 | Income CRUD | Delete transaction | Existing income row | Delete and confirm | Row removed and KPI total decreases | Not executed | Not Executed | Requires Supabase |
| PMBP-018 | Expense CRUD | Edit transaction | Existing expense row | Edit amount/category/payment; save | Updated row and KPI total reflect change | Not executed | Not Executed | Requires Supabase |
| PMBP-019 | Expense CRUD | Delete transaction | Existing expense row | Delete and confirm | Row removed and KPI total decreases | Not executed | Not Executed | Requires Supabase |
| PMBP-020 | Categories | Rename/delete | Existing category | Rename; delete; inspect transaction references | Rename persists; deletion leaves existing rows uncategorized | Not executed | Not Executed | Requires Supabase |
| PMBP-021 | Unit tests | Calculation helpers | Core calculation cases | Run npm test | All calculation tests pass | Not executed | Not Executed | Vitest added |

## Requirement traceability baseline

| Requirement ID | Requirement | Implementation Location | Acceptance Criterion | Test ID | Status |
|---|---|---|---|---|---|
| PMBP-R001 | Seven application sections | App.tsx, AppShell.tsx | All seven routes are reachable | PMBP-014 | Implemented / Unverified |
| PMBP-R002 | Persistent navigation | AppShell.tsx | Navigation remains available across pages | PMBP-014 | Implemented / Unverified |
| PMBP-R003 | Monthly settings | SettingsContext.tsx, schema.sql | Currency/month/year persist per user | PMBP-009 | Implemented / Unverified |
| PMBP-R004 | Income entry | Income.tsx | User can add, edit, delete income and see monthly totals | PMBP-001, PMBP-016, PMBP-017 | Implemented / Unverified |
| PMBP-R005 | Expense entry | Expenses.tsx | User can add, edit, delete expenses and see monthly totals | PMBP-002, PMBP-018, PMBP-019 | Implemented / Unverified |
| PMBP-R006 | Planned vs actual budget | MonthlyBudget.tsx | User can edit planned amounts and see variance/status | PMBP-005, PMBP-006, PMBP-007 | Implemented / Unverified |
| PMBP-R007 | Dashboard KPIs | Dashboard.tsx | KPI values derive from stored transactions | PMBP-003, PMBP-004 | Implemented / Unverified |
| PMBP-R008 | Annual summary | AnnualSummary.tsx | Twelve monthly rows and annual totals render | Follow-up annual tests | Implemented / Unverified |
| PMBP-R009 | User isolation | schema.sql | Users cannot access other users rows | PMBP-011, PMBP-012 | Implemented / Unverified |
| PMBP-R010 | Authentication | AuthContext.tsx, Login.tsx, ProtectedRoute.tsx | Signed-out users redirect; signed-in users access app | PMBP-014, PMBP-015 | Implemented / Unverified |

## Open issues

1. Income transactions need edit/delete UX.
2. Expense transactions need edit/delete UX.
3. Category management needs edit/default-category handling and user-facing error states.
4. Automated unit/integration tests are not yet present.
5. CI workflow exists but no workflow run was returned by the GitHub connector for the tested commits; executable build status remains unverified.
6. Supabase Auth email/OTP and redirect configuration must be completed in deployment.
7. Dashboard and annual summary currently perform multiple period queries; optimize after correctness is verified.

## Verification rule

No item is marked Pass unless an executable test produces the expected result. Source inspection alone is recorded as Implemented / Unverified.

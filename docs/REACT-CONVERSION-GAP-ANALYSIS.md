# React Conversion Gap Analysis — Personal Monthly Budget Planner

**Status:** Decision required / implementation authorized by project owner to proceed  
**Baseline:** `main`  
**Target:** Full-stack React + Supabase application preserving the original spreadsheet product concept and UX.

## 1. Source product intent

The original product is a seven-page Personal Monthly Budget Planner with:
Start Here → Settings → Income → Expenses → Monthly Budget → Dashboard → Annual Summary.

The React application should preserve the business rules, calculations, workflow, visual language, sample-data logic, and acceptance criteria while translating spreadsheet mechanisms into web-native equivalents.

## 2. Current implementation assessment

| Area | Current state | Gap | Priority |
|---|---|---|---|
| Routing/navigation | Implemented | Needs auth-aware navigation and mobile polish | Medium |
| Visual design system | Partial | Needs closer reproduction of reference UI | Medium |
| Authentication | Missing UI | Supabase auth exists only as an implicit dependency | Critical |
| User isolation | Schema/RLS present | Must verify every query/write is user-scoped | Critical |
| Persistent settings | Context only | Currency/month/year are not persisted | Critical |
| Categories | Basic CRUD | Needs validation, defaults, edit state and better errors | High |
| Income CRUD | Create/read | Edit/delete, validation and error handling missing | High |
| Expense CRUD | Create/read | Edit/delete, validation and error handling missing | High |
| Monthly budget | Read-only | Planned amounts cannot be created/edited in UI | Critical |
| Dashboard | Implemented | Multiple sequential queries; recent transaction fields incomplete | High |
| Annual summary | Implemented | Average savings rate semantics need explicit definition | Medium |
| Database integrity | Basic | Need indexes, defaults/seed strategy and stronger validation | High |
| Testing | Missing | Need automated calculation/component/integration coverage | Critical |
| CI | Missing | Add build/typecheck/test workflow | High |
| Deployment | Not configured | Environment/deployment workflow required | High |
| Documentation | Basic | Needs architecture, QA, setup and product traceability docs | Medium |

## 3. Spreadsheet-to-web translation

- Worksheet → React route/page
- Workbook navigation → React Router/AppShell
- Structured table → Supabase/Postgres table
- Formula → typed calculation/query logic
- Data validation → controlled form fields + database constraints
- Conditional formatting → semantic status badges/styles
- KPI card → reusable React component
- Chart → Recharts
- Input cell → editable form control
- Calculated cell → read-only derived value
- Protected sheet → authentication + RLS
- Workbook settings → persistent user settings
- Test dataset → automated application tests

## 4. Functional acceptance baseline

For the reference sample dataset, the core monthly calculations must support:

- Income: $5,600
- Expenses: $2,460
- Savings: $3,140
- Savings rate: 56.1%

The application must calculate these from underlying transactions rather than hard-coded dashboard values.

## 5. Core architecture target

Authentication → persistent user settings → categories → income/expenses → budgets → monthly calculations → dashboard/annual aggregates.

Every financial record must be attributable to the authenticated user and protected by Supabase RLS.

## 6. First implementation milestone

1. Authentication UI and protected routes.
2. Persistent settings.
3. Category validation and error handling.
4. Full income CRUD.
5. Full expense CRUD.
6. Budget CRUD for planned amounts.
7. Shared calculation helpers.
8. Dashboard/annual query improvements.
9. Automated tests.
10. CI build/typecheck/test workflow.

## 7. Known verification limitation

The GitHub repository was inspected directly. A local clone/build could not be executed in this environment because outbound access to github.com is unavailable. Therefore build/runtime status remains **Unverified** until CI or another executable environment confirms it.

## 8. Non-goals for this milestone

- The other three spreadsheet products.
- Accounting/tax functionality.
- Investment advice.
- Multi-currency conversion engine.
- Excel/Google Sheets import/export.

Those can be designed after the Personal Monthly Budget Planner core is production-ready.

## 9. Approval / authorization record

The project owner explicitly instructed the assistant to proceed after the conversion gap-analysis recommendation. This is treated as authorization to begin the first implementation milestone without waiting for another conversational approval gate.

## 10. Traceability status

**Open:** detailed requirement IDs, test IDs, and formula IDs will be expanded as implementation is completed.

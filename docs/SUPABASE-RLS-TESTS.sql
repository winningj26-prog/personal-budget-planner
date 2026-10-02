-- Manual Supabase RLS verification for Personal Monthly Budget Planner
-- Run this in a test Supabase project with two authenticated users.
-- Do not run against production financial data.
--
-- Goal: verify that user A cannot read, insert, update, or delete user B's rows
-- and that v_budget_status only exposes the caller's budget rows.
--
-- 1. Sign in as user A and record auth.uid().
select auth.uid() as user_a;
select count(*) as own_income_rows from income where user_id = auth.uid();
select count(*) as own_expense_rows from expenses where user_id = auth.uid();
select count(*) as own_budget_rows from budgets where user_id = auth.uid();

-- 2. While authenticated as user A, query each table without a user_id filter.
-- Expected: only user A rows are returned because RLS is enabled.
select id, user_id, date, amount from income;
select id, user_id, transaction_date, amount from expenses;
select id, user_id, month, year, planned_amount from budgets;
select user_id, category_id, category_type, month, year, planned_amount, actual_amount
from v_budget_status;

-- 3. Attempt to insert a row claiming to belong to user B.
-- Expected: INSERT is rejected by the WITH CHECK policy.
-- Replace the UUID with user B's auth.users.id.
-- insert into income(user_id, date, amount) values ('USER_B_UUID', current_date, 1.00);

-- 4. Attempt to update/delete a known user B row while authenticated as user A.
-- Expected: UPDATE/DELETE affects zero rows because USING auth.uid() = user_id.
-- update income set amount = amount + 1 where user_id = 'USER_B_UUID';
-- delete from income where user_id = 'USER_B_UUID';

-- 5. Repeat steps 1–4 while authenticated as user B.
--
-- Acceptance criteria:
-- * Each user sees only their own rows.
-- * Cross-user INSERT is rejected.
-- * Cross-user UPDATE/DELETE cannot modify another user's rows.
-- * v_budget_status returns only the caller's budgets.
--
-- The application cannot execute these checks automatically without a configured
-- Supabase test project and authenticated test identities.

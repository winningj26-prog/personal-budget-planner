-- Personal Monthly Budget Planner — Supabase schema
-- Run this once in your Supabase project's SQL Editor after creating the project.
-- Safe to re-run: uses `create table if not exists` and `create or replace view`.

create table if not exists user_settings (
  user_id uuid primary key references auth.users on delete cascade,
  currency text not null default 'USD',
  date_format text not null default 'MM/DD/YYYY',
  default_month int not null default extract(month from current_date)::int check (default_month between 1 and 12),
  default_year int not null default extract(year from current_date)::int check (default_year between 2000 and 2100),
  updated_at timestamptz not null default now()
);

create table if not exists income_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists expense_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  category_id uuid references income_categories on delete set null,
  description text,
  amount numeric(12,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  transaction_date date not null,
  category_id uuid references expense_categories on delete set null,
  description text,
  payment_method text check (payment_method in ('Cash','Bank Transfer','Debit Card','Credit Card','Mobile Money','Other')),
  amount numeric(12,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  category_id uuid not null,
  category_type text not null check (category_type in ('income','expense')),
  month int not null check (month between 1 and 12),
  year int not null check (year between 2000 and 2100),
  planned_amount numeric(12,2) not null check (planned_amount >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, category_id, category_type, month, year)
);

alter table user_settings enable row level security;
alter table income_categories enable row level security;
alter table expense_categories enable row level security;
alter table income enable row level security;
alter table expenses enable row level security;
alter table budgets enable row level security;

create policy "own rows only" on user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on income_categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on expense_categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on income for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on budgets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace view v_budget_status as
select
  b.user_id,
  b.category_id,
  b.category_type,
  b.month,
  b.year,
  coalesce(ic.name, ec.name) as category_name,
  b.planned_amount,
  coalesce(
    case when b.category_type = 'income' then
      (select sum(i.amount) from income i where i.category_id = b.category_id and extract(month from i.date) = b.month and extract(year from i.date) = b.year)
    else
      (select sum(e.amount) from expenses e where e.category_id = b.category_id and extract(month from e.transaction_date) = b.month and extract(year from e.transaction_date) = b.year)
    end, 0
  ) as actual_amount
from budgets b
left join income_categories ic on ic.id = b.category_id and b.category_type = 'income'
left join expense_categories ec on ec.id = b.category_id and b.category_type = 'expense';

-- Helpful indexes for the application's month/year queries.
create index if not exists idx_income_user_date on income(user_id, date);
create index if not exists idx_expenses_user_date on expenses(user_id, transaction_date);
create index if not exists idx_budgets_user_period on budgets(user_id, year, month);
create index if not exists idx_income_category on income(category_id);
create index if not exists idx_expense_category on expenses(category_id);

-- Migration-safe additions for databases created from an earlier schema version.
alter table user_settings add column if not exists default_month int;
alter table user_settings add column if not exists default_year int;
update user_settings set default_month = coalesce(default_month, extract(month from current_date)::int), default_year = coalesce(default_year, extract(year from current_date)::int);

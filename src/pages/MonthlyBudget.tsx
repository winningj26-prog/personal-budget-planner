import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useSettings } from '../lib/SettingsContext'
import { formatCurrency, formatPercent } from '../lib/format'
import KpiCard from '../components/KpiCard'
import DataTable, { Column } from '../components/DataTable'
import { Wallet, Receipt, PiggyBank, Percent, Save } from 'lucide-react'

interface BudgetRow {
  category_id: string
  category_name: string
  category_type: 'income' | 'expense'
  planned_amount: number
  actual_amount: number
}
interface Category { id: string; name: string }
type Status = 'On Track' | 'Near Limit' | 'Over Budget'

function computeStatus(utilization: number): Status {
  if (utilization > 1) return 'Over Budget'
  if (utilization >= 0.81) return 'Near Limit'
  return 'On Track'
}

const statusTone: Record<Status, string> = {
  'On Track': 'bg-positive-bg text-positive',
  'Near Limit': 'bg-warning-bg text-warning',
  'Over Budget': 'bg-negative-bg text-negative'
}

export default function MonthlyBudget() {
  const { settings } = useSettings()
  const [rows, setRows] = useState<BudgetRow[]>([])
  const [planned, setPlanned] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setError('')
    const start = `${settings.year}-${String(settings.month).padStart(2, '0')}-01`
    const end = `${settings.year}-${String(settings.month).padStart(2, '0')}-31`
    const [{ data: ic }, { data: ec }, { data: budgets }, { data: income }, { data: expenses }] = await Promise.all([
      supabase.from('income_categories').select('id,name').order('name'),
      supabase.from('expense_categories').select('id,name').order('name'),
      supabase.from('budgets').select('category_id,category_type,planned_amount').eq('month', settings.month).eq('year', settings.year),
      supabase.from('income').select('category_id,amount').gte('date', start).lte('date', end),
      supabase.from('expenses').select('category_id,amount').gte('transaction_date', start).lte('transaction_date', end)
    ])

    const budgetMap = new Map<string, number>()
    for (const b of budgets ?? []) budgetMap.set(`${b.category_type}:${b.category_id}`, Number(b.planned_amount))

    const actualIncome = new Map<string, number>()
    for (const item of income ?? []) if (item.category_id) actualIncome.set(item.category_id, (actualIncome.get(item.category_id) ?? 0) + Number(item.amount))
    const actualExpenses = new Map<string, number>()
    for (const item of expenses ?? []) if (item.category_id) actualExpenses.set(item.category_id, (actualExpenses.get(item.category_id) ?? 0) + Number(item.amount))

    const nextRows: BudgetRow[] = [
      ...(ic ?? []).map(c => ({ category_id: c.id, category_name: c.name, category_type: 'income' as const, planned_amount: budgetMap.get(`income:${c.id}`) ?? 0, actual_amount: actualIncome.get(c.id) ?? 0 })),
      ...(ec ?? []).map(c => ({ category_id: c.id, category_name: c.name, category_type: 'expense' as const, planned_amount: budgetMap.get(`expense:${c.id}`) ?? 0, actual_amount: actualExpenses.get(c.id) ?? 0 }))
    ]
    setRows(nextRows)
    const nextPlanned: Record<string, string> = {}
    for (const row of nextRows) nextPlanned[`${row.category_type}:${row.category_id}`] = row.planned_amount ? String(row.planned_amount) : ''
    setPlanned(nextPlanned)
  }

  useEffect(() => { void load() }, [settings.month, settings.year])

  async function saveBudget(row: BudgetRow) {
    const key = `${row.category_type}:${row.category_id}`
    const amount = Number(planned[key] ?? 0)
    if (!Number.isFinite(amount) || amount < 0) {
      setError('Planned amount must be a non-negative number.')
      return
    }
    setSaving(key)
    setError('')
    setMessage('')
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      setError('A signed-in user is required to save a budget.')
      setSaving(null)
      return
    }
    const { error: saveError } = await supabase.from('budgets').upsert({
      user_id: userData.user.id,
      category_id: row.category_id,
      category_type: row.category_type,
      month: settings.month,
      year: settings.year,
      planned_amount: amount
    }, { onConflict: 'user_id,category_id,category_type,month,year' })
    if (saveError) setError(saveError.message)
    else {
      setMessage(`${row.category_name} budget saved.`)
      await load()
    }
    setSaving(null)
  }

  const incomeRows = rows.filter(r => r.category_type === 'income')
  const expenseRows = rows.filter(r => r.category_type === 'expense')
  const plannedIncome = incomeRows.reduce((s, r) => s + r.planned_amount, 0)
  const actualIncome = incomeRows.reduce((s, r) => s + r.actual_amount, 0)
  const plannedExpenses = expenseRows.reduce((s, r) => s + r.planned_amount, 0)
  const actualExpenses = expenseRows.reduce((s, r) => s + r.actual_amount, 0)
  const plannedSavings = plannedIncome - plannedExpenses
  const actualSavings = actualIncome - actualExpenses
  const remainingBudget = plannedExpenses - actualExpenses
  const savingsRate = actualIncome > 0 ? actualSavings / actualIncome : 0

  const columns: Column<BudgetRow>[] = useMemo(() => [
    { header: 'Category', accessor: r => <span>{r.category_name} <span className="text-xs text-slate-400">({r.category_type})</span></span> },
    {
      header: 'Planned Amount',
      accessor: r => {
        const key = `${r.category_type}:${r.category_id}`
        return <div className="flex items-center gap-2 justify-end">
          <input aria-label={`${Planned amount for ${r.category_name}}`} type="number" min="0" step="0.01" value={planned[key] ?? ''} onChange={e => setPlanned(current => ({ ...current, [key]: e.target.value }))} className="w-28 border border-slate-200 rounded-md px-2 py-1 text-right bg-info-bg" />
          <button onClick={() => void saveBudget(r)} disabled={saving === key} className="p-1.5 rounded-md bg-brand-navy text-white disabled:opacity-50" title="Save planned amount"><Save size={14} /></button>
        </div>
      },
      align: 'right'
    },
    { header: 'Actual Amount', accessor: r => formatCurrency(r.actual_amount, settings.currency), align: 'right', computed: true },
    { header: 'Difference', accessor: r => {
      const difference = r.planned_amount - r.actual_amount
      return <span className={difference < 0 ? 'text-negative' : difference > 0 ? 'text-positive' : 'text-slate-500'}>{formatCurrency(difference, settings.currency)}</span>
    }, align: 'right', computed: true },
    { header: '% Used', accessor: r => formatPercent(r.planned_amount > 0 ? r.actual_amount / r.planned_amount : 0), align: 'right', computed: true },
    { header: 'Status', accessor: r => {
      const utilization = r.planned_amount > 0 ? r.actual_amount / r.planned_amount : 0
      const status = computeStatus(utilization)
      return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusTone[status]}`}>{r.planned_amount === 0 && r.actual_amount > 0 ? 'Over Budget' : status}</span>
    }, computed: true }
  ], [planned, saving, settings.currency])

  return <div className="space-y-6">
    <div><h2 className="text-lg font-semibold text-brand-navy">Monthly Budget</h2><p className="text-sm text-slate-500">Set planned amounts for {new Date(2000, settings.month - 1, 1).toLocaleString('en-US', { month: 'long' })} {settings.year}, then compare them with actual transactions.</p></div>
    {error && <div className="rounded-md bg-negative-bg text-negative px-3 py-2 text-sm">{error}</div>}
    {message && <div className="rounded-md bg-positive-bg text-positive px-3 py-2 text-sm">{message}</div>}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <KpiCard label="Planned Income" value={formatCurrency(plannedIncome, settings.currency)} icon={Wallet} tone="info" />
      <KpiCard label="Actual Income" value={formatCurrency(actualIncome, settings.currency)} icon={Wallet} tone="info" />
      <KpiCard label="Planned Expenses" value={formatCurrency(plannedExpenses, settings.currency)} icon={Receipt} tone="warning" />
      <KpiCard label="Actual Expenses" value={formatCurrency(actualExpenses, settings.currency)} icon={Receipt} tone="negative" />
      <KpiCard label="Planned Savings" value={formatCurrency(plannedSavings, settings.currency)} icon={PiggyBank} tone="positive" />
      <KpiCard label="Actual Savings" value={formatCurrency(actualSavings, settings.currency)} icon={PiggyBank} tone="positive" />
      <KpiCard label="Remaining Budget" value={formatCurrency(remainingBudget, settings.currency)} icon={Receipt} tone={remainingBudget < 0 ? 'negative' : 'positive'} />
      <KpiCard label="Savings Rate" value={formatPercent(savingsRate)} icon={Percent} tone="analytic" />
    </div>
    <DataTable columns={columns} rows={rows} emptyLabel="No categories yet. Add income and expense categories in Settings." />
  </div>
}
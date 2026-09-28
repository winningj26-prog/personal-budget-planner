import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useSettings } from '../lib/SettingsContext'
import { formatCurrency, formatPercent, MONTH_NAMES, monthRange } from '../lib/format'
import KpiCard from '../components/KpiCard'
import { Wallet, Receipt, PiggyBank, Percent, TrendingDown } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface MonthlyPoint { month: string; income: number; expenses: number; savings: number; savingsRate: number }
interface Transaction { date: string; type: string; description: string; category: string; amount: number }

export default function Dashboard() {
  const { settings } = useSettings()
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [expenseByCategory, setExpenseByCategory] = useState<{ name: string; value: number }[]>([])
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyPoint[]>([])
  const [recent, setRecent] = useState<Transaction[]>([])
  const [remainingBudget, setRemainingBudget] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const current = monthRange(settings.year, settings.month)
      const yearStart = monthRange(settings.year, 1).start
      const yearEnd = monthRange(settings.year, 12).end

      const [incomeResult, expenseResult, budgetResult, yearIncomeResult, yearExpenseResult] = await Promise.all([
        supabase.from('income').select('amount,date,description').gte('date', current.start).lte('date', current.end).order('date', { ascending: false }),
        supabase.from('expenses').select('amount,transaction_date,description,expense_categories(name)').gte('transaction_date', current.start).lte('transaction_date', current.end).order('transaction_date', { ascending: false }),
        supabase.from('v_budget_status').select('planned_amount').eq('month', settings.month).eq('year', settings.year).eq('category_type', 'expense'),
        supabase.from('income').select('amount,date').gte('date', yearStart).lte('date', yearEnd),
        supabase.from('expenses').select('amount,transaction_date').gte('transaction_date', yearStart).lte('transaction_date', yearEnd)
      ])

      if (cancelled) return
      const incomeData = incomeResult.data ?? []
      const expenseData = expenseResult.data ?? []
      const income = incomeData.reduce((sum, row) => sum + Number(row.amount), 0)
      const expenses = expenseData.reduce((sum, row) => sum + Number(row.amount), 0)
      setTotalIncome(income)
      setTotalExpenses(expenses)
      setRemainingBudget((budgetResult.data ?? []).reduce((sum, row) => sum + Number(row.planned_amount), 0) - expenses)

      const byCategory: Record<string, number> = {}
      for (const row of expenseData as any[]) {
        const name = row.expense_categories?.name ?? 'Other'
        byCategory[name] = (byCategory[name] ?? 0) + Number(row.amount)
      }
      setExpenseByCategory(Object.entries(byCategory).map(([name, value]) => ({ name, value })))

      const incomeByMonth = Array.from({ length: 12 }, () => 0)
      const expenseByMonth = Array.from({ length: 12 }, () => 0)
      for (const row of yearIncomeResult.data ?? []) {
        const month = Number(String(row.date).slice(5, 7)) - 1
        if (month >= 0 && month < 12) incomeByMonth[month] += Number(row.amount)
      }
      for (const row of yearExpenseResult.data ?? []) {
        const month = Number(String(row.transaction_date).slice(5, 7)) - 1
        if (month >= 0 && month < 12) expenseByMonth[month] += Number(row.amount)
      }
      setMonthlyTrend(MONTH_NAMES.map((name, index) => {
        const inc = incomeByMonth[index], exp = expenseByMonth[index]
        return { month: name.slice(0, 3), income: inc, expenses: exp, savings: inc - exp, savingsRate: inc > 0 ? (inc - exp) / inc : 0 }
      }))

      setRecent([
        ...incomeData.slice(0, 5).map(row => ({ date: row.date, type: 'Income', description: row.description, category: '—', amount: Number(row.amount) })),
        ...(expenseData as any[]).slice(0, 5).map(row => ({ date: row.transaction_date, type: 'Expense', description: row.description, category: row.expense_categories?.name ?? '—', amount: Number(row.amount) }))
      ].sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 8))
    }
    void load()
    return () => { cancelled = true }
  }, [settings.month, settings.year])

  const savings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? savings / totalIncome : 0
  const top = expenseByCategory.reduce((max, category) => category.value > (max?.value ?? 0) ? category : max, expenseByCategory[0])

  return <div className="space-y-6">
    <div className="grid grid-cols-5 gap-3">
      <KpiCard label="Total Income" value={formatCurrency(totalIncome, settings.currency)} icon={Wallet} tone="info" />
      <KpiCard label="Total Expenses" value={formatCurrency(totalExpenses, settings.currency)} icon={Receipt} tone="negative" />
      <KpiCard label="Savings" value={formatCurrency(savings, settings.currency)} icon={PiggyBank} tone="positive" />
      <KpiCard label="Savings Rate" value={formatPercent(savingsRate)} icon={Percent} tone="analytic" />
      <KpiCard label="Remaining Budget" value={formatCurrency(remainingBudget, settings.currency)} icon={TrendingDown} tone={remainingBudget < 0 ? 'negative' : 'positive'} />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white rounded-card shadow-card p-4"><h3 className="text-sm font-semibold text-slate-700 mb-2">Income vs Expenses</h3><ResponsiveContainer width="100%" height={220}><BarChart data={[{ name: MONTH_NAMES[settings.month - 1], income: totalIncome, expenses: totalExpenses }]}><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="income" /><Bar dataKey="expenses" /></BarChart></ResponsiveContainer></div>
      <div className="bg-white rounded-card shadow-card p-4"><h3 className="text-sm font-semibold text-slate-700 mb-2">Expense Breakdown</h3><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={expenseByCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>{expenseByCategory.map((_, index) => <Cell key={index} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
      <div className="bg-white rounded-card shadow-card p-4"><h3 className="text-sm font-semibold text-slate-700 mb-2">Monthly Trend</h3><ResponsiveContainer width="100%" height={220}><BarChart data={monthlyTrend}><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend /><Bar dataKey="income" /><Bar dataKey="expenses" /><Bar dataKey="savings" /></BarChart></ResponsiveContainer></div>
      <div className="bg-white rounded-card shadow-card p-4"><h3 className="text-sm font-semibold text-slate-700 mb-2">Savings Rate Trend</h3><ResponsiveContainer width="100%" height={220}><LineChart data={monthlyTrend}><XAxis dataKey="month" /><YAxis tickFormatter={value => `${(value * 100).toFixed(0)}%`} /><Tooltip /><Line type="monotone" dataKey="savingsRate" /></LineChart></ResponsiveContainer></div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white rounded-card shadow-card p-4"><h3 className="text-sm font-semibold text-slate-700 mb-2">Recent Transactions</h3><ul className="divide-y divide-slate-100 text-sm">{recent.map((row, index) => <li key={index} className="flex justify-between py-1.5"><span>{row.description || row.category}</span><span className={row.type === 'Income' ? 'text-info font-medium' : 'text-negative font-medium'}>{row.type === 'Income' ? '+' : '-'}{formatCurrency(row.amount, settings.currency)}</span></li>)}</ul></div>
      <div className="bg-white rounded-card shadow-card p-4"><h3 className="text-sm font-semibold text-slate-700 mb-2">Key Insights</h3><ul className="space-y-2 text-sm text-slate-600"><li>💰 You {savings >= 0 ? 'saved' : 'overspent by'} {formatCurrency(Math.abs(savings), settings.currency)} this month ({formatPercent(Math.abs(savingsRate))} of income).</li>{top && <li>📊 Your largest expense category is {top.name}.</li>}<li>🎯 {remainingBudget >= 0 ? `You are ${formatCurrency(remainingBudget, settings.currency)} under your planned expenses.` : `You are ${formatCurrency(Math.abs(remainingBudget), settings.currency)} over your planned expenses.`}</li></ul></div>
    </div>
  </div>
}
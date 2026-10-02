import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useSettings } from '../lib/SettingsContext'
import { formatCurrency, formatPercent, MONTH_NAMES, monthRange } from '../lib/format'
import KpiCard from '../components/KpiCard'
import DataTable, { Column } from '../components/DataTable'
import { Wallet, Receipt, PiggyBank, Percent } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts'

interface MonthRow { month: string; income: number; expenses: number; savings: number; savingsRate: number }

export default function AnnualSummary() {
  const { settings } = useSettings()
  const [rows, setRows] = useState<MonthRow[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const range = monthRange(settings.year, 1)
      const yearEnd = monthRange(settings.year, 12).end
      const [incomeResult, expenseResult] = await Promise.all([
        supabase.from('income').select('amount,date').gte('date', range.start).lte('date', yearEnd),
        supabase.from('expenses').select('amount,transaction_date').gte('transaction_date', range.start).lte('transaction_date', yearEnd)
      ])

      if (cancelled) return

      const incomeByMonth = Array.from({ length: 12 }, () => 0)
      const expenseByMonth = Array.from({ length: 12 }, () => 0)

      for (const row of incomeResult.data ?? []) {
        const month = Number(String(row.date).slice(5, 7)) - 1
        if (month >= 0 && month < 12) incomeByMonth[month] += Number(row.amount)
      }

      for (const row of expenseResult.data ?? []) {
        const month = Number(String(row.transaction_date).slice(5, 7)) - 1
        if (month >= 0 && month < 12) expenseByMonth[month] += Number(row.amount)
      }

      setRows(MONTH_NAMES.map((name, index) => {
        const income = incomeByMonth[index]
        const expenses = expenseByMonth[index]
        const savings = income - expenses
        return {
          month: name,
          income,
          expenses,
          savings,
          savingsRate: income > 0 ? savings / income : 0
        }
      }))
    }

    void load()
    return () => { cancelled = true }
  }, [settings.year])

  const annualIncome = rows.reduce((sum, row) => sum + row.income, 0)
  const annualExpenses = rows.reduce((sum, row) => sum + row.expenses, 0)
  const annualSavings = annualIncome - annualExpenses
  const annualSavingsRate = annualIncome > 0 ? annualSavings / annualIncome : 0

  const columns: Column<MonthRow>[] = [
    { header: 'Month', accessor: row => row.month },
    { header: 'Income', accessor: row => formatCurrency(row.income, settings.currency), align: 'right' },
    { header: 'Expenses', accessor: row => formatCurrency(row.expenses, settings.currency), align: 'right' },
    { header: 'Savings', accessor: row => formatCurrency(row.savings, settings.currency), align: 'right', computed: true },
    { header: 'Savings Rate', accessor: row => formatPercent(row.savingsRate), align: 'right', computed: true }
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard label="Annual Income" value={formatCurrency(annualIncome, settings.currency)} icon={Wallet} tone="info" />
        <KpiCard label="Annual Expenses" value={formatCurrency(annualExpenses, settings.currency)} icon={Receipt} tone="negative" />
        <KpiCard label="Annual Savings" value={formatCurrency(annualSavings, settings.currency)} icon={PiggyBank} tone="positive" />
        <KpiCard label="Annual Savings Rate" value={formatPercent(annualSavingsRate)} icon={Percent} tone="analytic" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-card shadow-card p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Monthly Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rows}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" />
              <Bar dataKey="expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-card shadow-card p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Savings Rate Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={rows}>
              <XAxis dataKey="month" />
              <YAxis tickFormatter={value => `${(value * 100).toFixed(0)}%`} />
              <Tooltip formatter={value => formatPercent(Number(value))} />
              <Line type="monotone" dataKey="savingsRate" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        totalRow={[
          'Total',
          formatCurrency(annualIncome, settings.currency),
          formatCurrency(annualExpenses, settings.currency),
          formatCurrency(annualSavings, settings.currency),
          formatPercent(annualSavingsRate)
        ]}
      />
    </div>
  )
}

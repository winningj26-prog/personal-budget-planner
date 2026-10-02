import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useSettings } from '../lib/SettingsContext'
import { formatCurrency, formatDate } from '../lib/format'
import KpiCard from '../components/KpiCard'
import DataTable, { Column } from '../components/DataTable'
import { Receipt, Hash, TrendingUp, AlertTriangle, Plus, Pencil, Trash2, X, Save } from 'lucide-react'

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Debit Card', 'Credit Card', 'Mobile Money', 'Other']
interface ExpenseRow { id: string; transaction_date: string; category_id: string | null; category_name?: string; description: string; payment_method: string; amount: number }
interface Category { id: string; name: string }
type ExpenseForm = { transaction_date: string; category_id: string; description: string; payment_method: string; amount: string }
const emptyForm: ExpenseForm = { transaction_date: '', category_id: '', description: '', payment_method: 'Cash', amount: '' }

export default function Expenses() {
  const { settings } = useSettings()
  const [rows, setRows] = useState<ExpenseRow[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<ExpenseForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setError('')
    const start = `${settings.year}-${String(settings.month).padStart(2, '0')}-01`
    const end = `${settings.year}-${String(settings.month).padStart(2, '0')}-31`
    const [{ data: cats }, { data, error: loadError }] = await Promise.all([
      supabase.from('expense_categories').select('id,name').order('name'),
      supabase.from('expenses').select('id,transaction_date,category_id,description,payment_method,amount,expense_categories(name)').gte('transaction_date', start).lte('transaction_date', end).order('transaction_date', { ascending: false })
    ])
    if (loadError) setError(loadError.message)
    setCategories(cats ?? [])
    setRows((data ?? []).map((r: any) => ({ ...r, category_name: r.expense_categories?.name ?? '—' })))
  }

  useEffect(() => { void load() }, [settings.month, settings.year])

  function startEdit(row: ExpenseRow) {
    setEditingId(row.id)
    setForm({ transaction_date: row.transaction_date, category_id: row.category_id ?? '', description: row.description ?? '', payment_method: row.payment_method || 'Cash', amount: String(row.amount) })
    setError('')
  }

  function cancelEdit() { setEditingId(null); setForm(emptyForm) }

  async function saveExpense() {
    if (!form.transaction_date || !form.amount || Number(form.amount) <= 0) { setError('Date and a positive amount are required.'); return }
    setSaving(true); setError('')
    const payload = { transaction_date: form.transaction_date, category_id: form.category_id || null, description: form.description.trim(), payment_method: form.payment_method, amount: Number(form.amount) }
    const result = editingId
      ? await supabase.from('expenses').update(payload).eq('id', editingId)
      : await supabase.from('expenses').insert({ ...payload, user_id: (await supabase.auth.getUser()).data.user?.id })
    if (result.error) setError(result.error.message)
    else { cancelEdit(); await load() }
    setSaving(false)
  }

  async function removeExpense(id: string) {
    if (!window.confirm('Delete this expense transaction?')) return
    setError('')
    const { error: deleteError } = await supabase.from('expenses').delete().eq('id', id)
    if (deleteError) setError(deleteError.message)
    else await load()
  }

  const total = rows.reduce((s, r) => s + Number(r.amount), 0)
  const count = rows.length
  const average = count ? total / count : 0
  const largest = rows.reduce((m, r) => Math.max(m, Number(r.amount)), 0)

  const columns: Column<ExpenseRow>[] = [
    { header: 'Date', accessor: r => formatDate(r.transaction_date) },
    { header: 'Category', accessor: r => r.category_name },
    { header: 'Description', accessor: r => r.description },
    { header: 'Payment Method', accessor: r => r.payment_method },
    { header: 'Amount', accessor: r => formatCurrency(r.amount, settings.currency), align: 'right' },
    { header: 'Actions', accessor: r => <div className="flex justify-end gap-1">
      <button onClick={() => startEdit(r)} aria-label={`Edit expense ${r.description || r.id}`} className="p-1.5 rounded-md hover:bg-slate-100"><Pencil size={14} /></button>
      <button onClick={() => void removeExpense(r.id)} aria-label={`Delete expense ${r.description || r.id}`} className="p-1.5 rounded-md hover:bg-negative-bg text-negative"><Trash2 size={14} /></button>
    </div>, align: 'right' }
  ]

  return <div className="space-y-6">
    <div className="grid grid-cols-4 gap-3">
      <KpiCard label="Total Expenses" value={formatCurrency(total, settings.currency)} icon={Receipt} tone="negative" />
      <KpiCard label="Transactions" value={String(count)} icon={Hash} tone="neutral" />
      <KpiCard label="Average Expense" value={formatCurrency(average, settings.currency)} icon={TrendingUp} tone="info" />
      <KpiCard label="Largest Expense" value={formatCurrency(largest, settings.currency)} icon={AlertTriangle} tone="warning" />
    </div>
    {error && <div className="rounded-md bg-negative-bg text-negative px-3 py-2 text-sm">{error}</div>}
    <div className="bg-white rounded-card shadow-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">{editingId ? 'Edit Expense' : 'Add Expense'}</h3>
        {editingId && <button onClick={cancelEdit} className="text-xs text-slate-500 flex items-center gap-1"><X size={14} /> Cancel</button>}
      </div>
      <div className="grid grid-cols-6 gap-2 items-end">
        <label className="text-xs text-slate-500 flex flex-col gap-1">Date<input type="date" value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })} className="border border-slate-200 rounded-md px-2 py-1.5 text-sm" /></label>
        <label className="text-xs text-slate-500 flex flex-col gap-1">Category<select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className="border border-slate-200 rounded-md px-2 py-1.5 text-sm"><option value="">Select…</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="text-xs text-slate-500 flex flex-col gap-1">Description<input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="border border-slate-200 rounded-md px-2 py-1.5 text-sm" /></label>
        <label className="text-xs text-slate-500 flex flex-col gap-1">Payment<select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} className="border border-slate-200 rounded-md px-2 py-1.5 text-sm">{PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}</select></label>
        <label className="text-xs text-slate-500 flex flex-col gap-1">Amount<input type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="border border-slate-200 rounded-md px-2 py-1.5 text-sm" /></label>
        <button onClick={() => void saveExpense()} disabled={saving} className="px-3 py-2 rounded-md bg-brand-navy text-white text-sm flex items-center gap-1 justify-center disabled:opacity-50">{editingId ? <Save size={14} /> : <Plus size={14} />}{editingId ? 'Save' : 'Add'}</button>
      </div>
    </div>
    <DataTable columns={columns} rows={rows} totalRow={['', '', '', 'Total Expenses', formatCurrency(total, settings.currency), '']} emptyLabel="No expenses recorded for this month yet." />
  </div>
}
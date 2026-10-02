import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useSettings } from '../lib/SettingsContext'
import { formatCurrency, formatDate } from '../lib/format'
import KpiCard from '../components/KpiCard'
import DataTable, { Column } from '../components/DataTable'
import { Wallet, Hash, TrendingUp, Plus, Pencil, Trash2, X, Save } from 'lucide-react'

interface IncomeRow { id: string; date: string; category_id: string | null; category_name?: string; description: string; amount: number }
interface Category { id: string; name: string }
type IncomeForm = { date: string; category_id: string; description: string; amount: string }

const emptyForm: IncomeForm = { date: '', category_id: '', description: '', amount: '' }

export default function Income() {
  const { settings } = useSettings()
  const [rows, setRows] = useState<IncomeRow[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<IncomeForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setError('')
    const start = `${settings.year}-${String(settings.month).padStart(2, '0')}-01`
    const end = `${settings.year}-${String(settings.month).padStart(2, '0')}-31`
    const [{ data: cats }, { data, error: loadError }] = await Promise.all([
      supabase.from('income_categories').select('id,name').order('name'),
      supabase.from('income').select('id,date,category_id,description,amount,income_categories(name)').gte('date', start).lte('date', end).order('date', { ascending: false })
    ])
    if (loadError) setError(loadError.message)
    setCategories(cats ?? [])
    setRows((data ?? []).map((r: any) => ({ ...r, category_name: r.income_categories?.name ?? '—' })))
  }

  useEffect(() => { void load() }, [settings.month, settings.year])

  function startEdit(row: IncomeRow) {
    setEditingId(row.id)
    setForm({ date: row.date, category_id: row.category_id ?? '', description: row.description ?? '', amount: String(row.amount) })
    setError('')
  }

  function cancelEdit() { setEditingId(null); setForm(emptyForm) }

  async function saveIncome() {
    if (!form.date || !form.amount || Number(form.amount) <= 0) { setError('Date and a positive amount are required.'); return }
    setSaving(true); setError('')
    const payload = { date: form.date, category_id: form.category_id || null, description: form.description.trim(), amount: Number(form.amount) }
    const result = editingId
      ? await supabase.from('income').update(payload).eq('id', editingId)
      : await supabase.from('income').insert({ ...payload, user_id: (await supabase.auth.getUser()).data.user?.id })
    if (result.error) setError(result.error.message)
    else { cancelEdit(); await load() }
    setSaving(false)
  }

  async function removeIncome(id: string) {
    if (!window.confirm('Delete this income transaction?')) return
    setError('')
    const { error: deleteError } = await supabase.from('income').delete().eq('id', id)
    if (deleteError) setError(deleteError.message)
    else await load()
  }

  const total = rows.reduce((s, r) => s + Number(r.amount), 0)
  const count = rows.length
  const average = count ? total / count : 0

  const columns: Column<IncomeRow>[] = [
    { header: 'Date', accessor: r => formatDate(r.date) },
    { header: 'Category', accessor: r => r.category_name },
    { header: 'Description', accessor: r => r.description },
    { header: 'Amount', accessor: r => formatCurrency(r.amount, settings.currency), align: 'right' },
    { header: 'Actions', accessor: r => <div className="flex justify-end gap-1">
      <button onClick={() => startEdit(r)} aria-label={`Edit income ${r.description || r.id}`} className="p-1.5 rounded-md hover:bg-slate-100"><Pencil size={14} /></button>
      <button onClick={() => void removeIncome(r.id)} aria-label={`Delete income ${r.description || r.id}`} className="p-1.5 rounded-md hover:bg-negative-bg text-negative"><Trash2 size={14} /></button>
    </div>, align: 'right' }
  ]

  return <div className="space-y-6">
    <div className="grid grid-cols-3 gap-3">
      <KpiCard label="Total Income" value={formatCurrency(total, settings.currency)} icon={Wallet} tone="info" />
      <KpiCard label="Transactions" value={String(count)} icon={Hash} tone="neutral" />
      <KpiCard label="Average Income" value={formatCurrency(average, settings.currency)} icon={TrendingUp} tone="positive" />
    </div>
    {error && <div className="rounded-md bg-negative-bg text-negative px-3 py-2 text-sm">{error}</div>}
    <div className="bg-white rounded-card shadow-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">{editingId ? 'Edit Income' : 'Add Income'}</h3>
        {editingId && <button onClick={cancelEdit} className="text-xs text-slate-500 flex items-center gap-1"><X size={14} /> Cancel</button>}
      </div>
      <div className="grid grid-cols-5 gap-2 items-end">
        <label className="text-xs text-slate-500 flex flex-col gap-1">Date<input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="border border-slate-200 rounded-md px-2 py-1.5 text-sm" /></label>
        <label className="text-xs text-slate-500 flex flex-col gap-1">Category<select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className="border border-slate-200 rounded-md px-2 py-1.5 text-sm"><option value="">Select…</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="text-xs text-slate-500 flex flex-col gap-1">Description<input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="border border-slate-200 rounded-md px-2 py-1.5 text-sm" /></label>
        <label className="text-xs text-slate-500 flex flex-col gap-1">Amount<input type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="border border-slate-200 rounded-md px-2 py-1.5 text-sm" /></label>
        <button onClick={() => void saveIncome()} disabled={saving} className="px-3 py-2 rounded-md bg-brand-navy text-white text-sm flex items-center gap-1 justify-center disabled:opacity-50">{editingId ? <Save size={14} /> : <Plus size={14} />}{editingId ? 'Save' : 'Add'}</button>
      </div>
    </div>
    <DataTable columns={columns} rows={rows} totalRow={['', '', 'Total Income', formatCurrency(total, settings.currency), '']} emptyLabel="No income recorded for this month yet." />
  </div>
}
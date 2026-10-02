import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Plus, Trash2, Pencil, Save, X } from 'lucide-react'

interface Category { id: string; name: string }

function CategoryList({ table, title }: { table: 'income_categories' | 'expense_categories'; title: string }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const { data, error: loadError } = await supabase.from(table).select('id,name').order('name')
    setCategories(data ?? [])
    if (loadError) setError(loadError.message)
    setLoading(false)
  }

  useEffect(() => {
    async function loadOrSeed() {
      await load()
      const { data } = await supabase.from(table).select('id').limit(1)
      if (!data?.length) {
        const defaults = table === 'income_categories'
          ? ['Salary', 'Freelance', 'Other Income']
          : ['Housing', 'Food', 'Transportation', 'Utilities', 'Healthcare', 'Entertainment', 'Other']
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) {
          await supabase.from(table).insert(defaults.map(name => ({ name, user_id: userData.user!.id })))
          await load()
        }
      }
    }
    void loadOrSeed()
  }, [])

  async function addCategory() {
    if (!newName.trim()) return
    setError('')
    const { data: userData } = await supabase.auth.getUser()
    const { error: addError } = await supabase.from(table).insert({ name: newName.trim(), user_id: userData.user?.id })
    if (addError) setError(addError.message)
    else { setNewName(''); await load() }
  }

  function beginEdit(category: Category) { setEditing(category.id); setEditName(category.name); setError('') }

  async function saveEdit(id: string) {
    if (!editName.trim()) return
    setError('')
    const { error: updateError } = await supabase.from(table).update({ name: editName.trim() }).eq('id', id)
    if (updateError) setError(updateError.message)
    else { setEditing(null); setEditName(''); await load() }
  }

  async function removeCategory(id: string) {
    if (!window.confirm('Delete this category? Existing transactions will keep their records without a category.')) return
    setError('')
    const { error: deleteError } = await supabase.from(table).delete().eq('id', id)
    if (deleteError) setError(deleteError.message)
    else await load()
  }

  return <div className="bg-white rounded-card shadow-card p-4">
    <h3 className="text-sm font-semibold text-slate-700 mb-3">{title}</h3>
    {error && <div className="rounded-md bg-negative-bg text-negative px-3 py-2 text-xs mb-3">{error}</div>}
    {loading ? <p className="text-sm text-slate-400">Loading…</p> : <ul className="space-y-1.5 mb-3">
      {categories.map(c => <li key={c.id} className="flex items-center justify-between gap-2 text-sm bg-slate-50 rounded-md px-3 py-1.5">
        {editing === c.id
          ? <div className="flex flex-1 gap-2"><input autoFocus value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 border border-slate-200 rounded-md px-2 py-1 text-sm" /><button onClick={() => void saveEdit(c.id)} className="text-positive"><Save size={14} /></button><button onClick={() => setEditing(null)} className="text-slate-400"><X size={14} /></button></div>
          : <><span>{c.name}</span><div className="flex gap-1"><button onClick={() => beginEdit(c)} className="text-slate-400 hover:text-brand-navy" aria-label={`Edit ${c.name}`}><Pencil size={14} /></button><button onClick={() => void removeCategory(c.id)} className="text-slate-400 hover:text-negative" aria-label={`Delete ${c.name}`}><Trash2 size={14} /></button></div></>}
      </li>)}
    </ul>}
    <div className="flex gap-2"><input aria-label={`New ${title} category`} value={newName} onChange={e => setNewName(e.target.value)} placeholder="Add category…" className="flex-1 border border-slate-200 rounded-md px-3 py-1.5 text-sm" /><button type="button" onClick={() => void addCategory()} className="px-3 py-1.5 rounded-md bg-brand-navy text-white text-sm flex items-center gap-1"><Plus size={14} /> Add</button></div>
  </div>
}

export default function SettingsPage() {
  return <div className="space-y-6">
    <div className="bg-white rounded-card shadow-card p-5"><h2 className="text-lg font-semibold text-brand-navy mb-1">Settings</h2><p className="text-sm text-slate-500">Manage income and expense categories. Renaming a category keeps existing transactions linked to it; deleting a category leaves existing transactions uncategorized.</p></div>
    <div className="grid md:grid-cols-2 gap-4"><CategoryList table="income_categories" title="Income Categories" /><CategoryList table="expense_categories" title="Expense Categories" /></div>
  </div>
}
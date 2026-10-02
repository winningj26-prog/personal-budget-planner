import { FormEvent, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { Wallet } from 'lucide-react'

export default function Login() {
  const { requestMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    const result = await requestMagicLink(email)
    if (result) setError(result)
    else setMessage('Check your inbox for a secure sign-in link.')
    setBusy(false)
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-card shadow-card p-7">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-brand-navy text-white p-2.5 rounded-lg"><Wallet size={24} /></div>
          <div>
            <h1 className="text-xl font-semibold text-brand-navy">Personal Monthly Budget Planner</h1>
            <p className="text-xs text-slate-500">Plan Today • Track Spending • Save More • Reach Your Goals</p>
          </div>
        </div>
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Sign in</h2>
        <p className="text-sm text-slate-500 mb-5">Enter your email to receive a secure sign-in link.</p>
        {error && <div className="mb-4 rounded-md bg-negative-bg text-negative px-3 py-2 text-sm">{error}</div>}
        {message && <div className="mb-4 rounded-md bg-positive-bg text-positive px-3 py-2 text-sm">{message}</div>}
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm text-slate-600">
            Email
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2" />
          </label>
          <button disabled={busy} className="w-full rounded-md bg-brand-navy text-white py-2.5 font-medium disabled:opacity-50">
            {busy ? 'Sending…' : 'Email me a sign-in link'}
          </button>
        </form>
      </div>
    </div>
  )
}

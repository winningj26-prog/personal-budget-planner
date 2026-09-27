import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'

interface Settings {
  currency: string
  month: number
  year: number
  dateFormat: string
}
interface SettingsContextValue {
  settings: Settings
  setSettings: (s: Settings) => void
  loading: boolean
}

const defaultSettings: Settings = {
  currency: 'USD',
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  dateFormat: 'MM/DD/YYYY'
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [settings, setSettingsState] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!user) {
        setSettingsState(defaultSettings)
        setLoading(false)
        return
      }
      setLoading(true)
      const { data } = await supabase
        .from('user_settings')
        .select('currency,date_format,default_month,default_year')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!cancelled) {
        setSettingsState(data ? {
          currency: data.currency,
          month: data.default_month ?? defaultSettings.month,
          year: data.default_year ?? defaultSettings.year,
          dateFormat: data.date_format ?? defaultSettings.dateFormat
        } : defaultSettings)
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user])

  function setSettings(next: Settings) {
    setSettingsState(next)
    if (!user) return
    void supabase.from('user_settings').upsert({
      user_id: user.id,
      currency: next.currency,
      date_format: next.dateFormat,
      default_month: next.month,
      default_year: next.year
    }, { onConflict: 'user_id' })
  }

  return <SettingsContext.Provider value={{ settings, setSettings, loading }}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider')
  return ctx
}

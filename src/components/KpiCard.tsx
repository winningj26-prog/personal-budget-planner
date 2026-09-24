import { LucideIcon } from 'lucide-react'
type Tone = 'positive' | 'negative' | 'info' | 'warning' | 'analytic' | 'neutral'
interface KpiCardProps { label: string; value: string; icon?: LucideIcon; secondary?: string; tone?: Tone }
const toneClasses: Record<Tone, string> = { positive:'bg-positive-bg text-positive', negative:'bg-negative-bg text-negative', info:'bg-info-bg text-info', warning:'bg-warning-bg text-warning', analytic:'bg-analytic-bg text-analytic', neutral:'bg-slate-100 text-slate-600' }
export default function KpiCard({ label, value, icon: Icon, secondary, tone = 'neutral' }: KpiCardProps) {
  return <div className="bg-white rounded-card shadow-card p-4 flex flex-col gap-2 min-w-[160px]">
    <div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>{Icon && <span className={`p-1.5 rounded-full ${toneClasses[tone]}`}><Icon size={16}/></span>}</div>
    <div className="text-2xl font-semibold text-brand-navy">{value}</div>{secondary && <div className="text-xs text-slate-500">{secondary}</div>}
  </div>
}
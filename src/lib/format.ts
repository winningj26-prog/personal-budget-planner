export function formatCurrency(amount:number,currency:string='USD'):string{return new Intl.NumberFormat('en-US',{style:'currency',currency,maximumFractionDigits:2}).format(amount)}
export function formatPercent(fraction:number):string{return `${(fraction*100).toFixed(1)}%`}
export function formatDate(dateStr:string):string{const d=new Date(dateStr);return d.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})}
export const MONTH_NAMES=['January','February','March','April','May','June','July','August','September','October','November','December']
export function monthRange(year:number, month:number):{start:string;end:string}{const start=new Date(Date.UTC(year,month-1,1));const end=new Date(Date.UTC(year,month,0));const iso=(d:Date)=>d.toISOString().slice(0,10);return {start:iso(start),end:iso(end)}}

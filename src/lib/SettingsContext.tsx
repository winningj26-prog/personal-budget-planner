import { createContext, useContext, useState, ReactNode } from 'react'
interface Settings{currency:string;month:number;year:number}
interface SettingsContextValue{settings:Settings;setSettings:(s:Settings)=>void}
const defaultSettings:Settings={currency:'USD',month:new Date().getMonth()+1,year:new Date().getFullYear()}
const SettingsContext=createContext<SettingsContextValue|undefined>(undefined)
export function SettingsProvider({children}:{children:ReactNode}){const[settings,setSettings]=useState<Settings>(defaultSettings);return <SettingsContext.Provider value={{settings,setSettings}}>{children}</SettingsContext.Provider>}
export function useSettings(){const ctx=useContext(SettingsContext);if(!ctx)throw new Error('useSettings must be used within a SettingsProvider');return ctx}
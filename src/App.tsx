import { Routes, Route } from 'react-router-dom'
import AppShell from './components/AppShell'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './lib/AuthContext'
import { SettingsProvider } from './lib/SettingsContext'
import StartHere from './pages/StartHere'
import SettingsPage from './pages/SettingsPage'
import Income from './pages/Income'
import Expenses from './pages/Expenses'
import MonthlyBudget from './pages/MonthlyBudget'
import Dashboard from './pages/Dashboard'
import AnnualSummary from './pages/AnnualSummary'
import Login from './pages/Login'

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<StartHere />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="income" element={<Income />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="budget" element={<MonthlyBudget />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="annual-summary" element={<AnnualSummary />} />
            </Route>
          </Route>
        </Routes>
      </SettingsProvider>
    </AuthProvider>
  )
}

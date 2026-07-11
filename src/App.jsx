import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './state/AuthContext.jsx'
import AppShell from './app/AppShell.jsx'
import SignInPage from './features/auth/SignInPage.jsx'
import DashboardPage from './features/dashboard/DashboardPage.jsx'
import SpendingPage from './features/spending/SpendingPage.jsx'
import BillsPage from './features/bills/BillsPage.jsx'
import GoalsPage from './features/goals/GoalsPage.jsx'
import DebtPage from './features/debt/DebtPage.jsx'
import SettingsPage from './features/settings/SettingsPage.jsx'

// Full-screen quiet loader while Firebase figures out if we're signed in.
function BootScreen() {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className="spinner" />
    </div>
  )
}

export default function App() {
  const { user, initializing } = useAuth()

  if (initializing) return <BootScreen />

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<SignInPage />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="spending" element={<SpendingPage />} />
        <Route path="bills" element={<BillsPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="debt" element={<DebtPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './state/AuthContext.jsx'
import { SettingsProvider } from './state/SettingsContext.jsx'
import { MonthProvider } from './state/MonthContext.jsx'
import { AccountsProvider } from './state/AccountsContext.jsx'
import { CategoriesProvider } from './state/CategoriesContext.jsx'
import { TransactionsProvider } from './state/TransactionsContext.jsx'
import { BillsProvider } from './state/BillsContext.jsx'
import { GoalsProvider } from './state/GoalsContext.jsx'
import { DebtsProvider } from './state/DebtsContext.jsx'
import './styles/tokens.css'
import './styles/base.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <MonthProvider>
            <AccountsProvider>
              <CategoriesProvider>
                <TransactionsProvider>
                  <BillsProvider>
                    <GoalsProvider>
                      <DebtsProvider>
                        <App />
                      </DebtsProvider>
                    </GoalsProvider>
                  </BillsProvider>
                </TransactionsProvider>
              </CategoriesProvider>
            </AccountsProvider>
          </MonthProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

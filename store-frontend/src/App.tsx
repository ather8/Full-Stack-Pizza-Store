import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import RoleRoute from './components/auth/RoleRoute'
import { getDefaultRoute } from './lib/roles'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import TransactionsPage from './pages/TransactionsPage'
import ForecastPage from './pages/ForecastPage'
import QueryPage from './pages/QueryPage'
import UsersPage from './pages/UsersPage'
import OrderPage from './pages/OrderPage'

function App() {
  const { auth, authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected app, now under /app */}
        <Route
          path="/app"
          element={auth.token ? <Layout /> : <Navigate to="/login" />}
        >
          <Route index element={<Navigate to={getDefaultRoute(auth.role)} replace />} />

          <Route element={<RoleRoute allowedRoles={['Admin', 'Manager']} />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="forecast" element={<ForecastPage />} />
            <Route path="query" element={<QueryPage />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={['Admin']} />}>
            <Route path="users" element={<UsersPage />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={['Cashier']} />}>
            <Route path="orders" element={<OrderPage />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={['Admin', 'Manager', 'Cashier']} />}>
            <Route path="products" element={<ProductsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
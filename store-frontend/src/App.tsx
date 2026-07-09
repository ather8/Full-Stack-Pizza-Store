import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
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
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={auth.token ? <Layout /> : <Navigate to="/login" />}
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="forecast" element={<ForecastPage />} />
          <Route path="query" element={<QueryPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="orders" element={<OrderPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
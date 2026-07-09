import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  Receipt,
  TrendingUp,
  MessageSquare,
  Users,
  LogOut
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/orders', icon: PlusCircle, label: 'New Order' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/transactions', icon: Receipt, label: 'Transactions' },
  { to: '/forecast', icon: TrendingUp, label: 'Forecast' },
  { to: '/query', icon: MessageSquare, label: 'AI Query' },
  { to: '/users', icon: Users, label: 'Users' },
]

export default function Sidebar() {
  const { auth, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="w-52 h-full bg-gray-900 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">P</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm">PizzaStore</p>
            <p className="text-gray-400 text-xs">Operations System</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-gray-700">
        <div className="flex items-center gap-2 px-3 py-2 mb-1">
          <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {auth.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{auth.email}</p>
            <p className="text-gray-400 text-xs">{auth.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors w-full"
        >
          <LogOut size={16} />
          Log out
        </button>
      </div>
    </div>
  )
}
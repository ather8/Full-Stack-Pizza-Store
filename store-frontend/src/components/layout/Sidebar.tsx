import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  Receipt,
  TrendingUp,
  MessageSquare,
  Users,
  LogOut,
  X
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ROUTE_ROLES, type Role } from '../../lib/roles'

const navItems = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/orders', icon: PlusCircle, label: 'New Order' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/transactions', icon: Receipt, label: 'Transactions' },
  { to: '/forecast', icon: TrendingUp, label: 'Forecast' },
  { to: '/query', icon: MessageSquare, label: 'AI Query' },
  { to: '/users', icon: Users, label: 'Users' },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { auth, logout } = useAuth()
  const navigate = useNavigate()

  const visibleNavItems = navItems.filter(
    (item) => auth.role && ROUTE_ROLES[item.to]?.includes(auth.role as Role)
  )

  const handleLogout = () => {
    logout()
    onClose()
    navigate('/login')
  }

  return (
    <>
      {/* Backdrop — mobile only, closes the drawer on tap outside it */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <div
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 md:w-52 h-full bg-gray-900 flex flex-col flex-shrink-0 transform transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="PizzaStore" className="w-8 h-8 rounded-lg" />
            <div>
              <p className="text-white font-bold text-sm">PizzaStore</p>
              <p className="text-gray-400 text-xs">Operations System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-white p-1"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
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
    </>
  )
}
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile top bar — hidden on md+, where the sidebar is always visible */}
                <div className="md:hidden flex items-center gap-3 px-4 h-14 bg-gray-900 flex-shrink-0">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-gray-300 hover:text-white p-1 -ml-1"
                        aria-label="Open menu"
                    >
                        <Menu size={22} />
                    </button>
                    <span className="text-white font-semibold text-sm">PizzaStore</span>
                </div>

                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
import { useState, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { DollarSign, TrendingUp, ShoppingBag, AlertTriangle } from 'lucide-react'
import type { Product, Transaction } from '../types'
import { getProducts } from '../api/products'
import { getTransactions } from '../api/transactions'

export default function DashboardPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([getProducts(), getTransactions()])
            .then(([p, t]) => { setProducts(p); setTransactions(t) })
            .finally(() => setLoading(false))
    }, [])

    const today = new Date().toDateString()

    const todayTransactions = useMemo(() =>
        transactions.filter(t => new Date(t.created_at).toDateString() === today),
        [transactions]
    )

    const todayRevenue = useMemo(() =>
        todayTransactions.reduce((sum, t) => sum + t.total, 0),
        [todayTransactions]
    )

    const monthlyRevenue = useMemo(() => {
        const now = new Date()
        return transactions
            .filter(t => {
                const d = new Date(t.created_at)
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
            })
            .reduce((sum, t) => sum + t.total, 0)
    }, [transactions])

    const lowStockItems = products.filter(p => p.quantity < 50).length

    // Last 7 days revenue for chart
    const chartData = useMemo(() => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        const now = new Date()
        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(now)
            date.setDate(now.getDate() - (6 - i))
            const dayRevenue = transactions
                .filter(t => new Date(t.created_at).toDateString() === date.toDateString())
                .reduce((sum, t) => sum + t.total, 0)
            return {
                day: days[date.getDay() === 0 ? 6 : date.getDay() - 1],
                revenue: Math.round(dayRevenue * 100) / 100
            }
        })
    }, [transactions])

    if (loading) return <div className="p-8 text-gray-500">Loading...</div>

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-800">Overview</h1>
            <p className="text-gray-500 text-sm mt-1 mb-6">Here's what's happening at your restaurant today.</p>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <KpiCard
                    label="Today's Revenue"
                    value={`$${todayRevenue.toFixed(2)}`}
                    icon={<DollarSign size={18} className="text-orange-500" />}
                    bg="bg-orange-50"
                />
                <KpiCard
                    label="Monthly Revenue"
                    value={`$${monthlyRevenue.toFixed(2)}`}
                    icon={<TrendingUp size={18} className="text-green-500" />}
                    bg="bg-green-50"
                />
                <KpiCard
                    label="Today's Orders"
                    value={String(todayTransactions.length)}
                    icon={<ShoppingBag size={18} className="text-blue-500" />}
                    bg="bg-blue-50"
                />
                <KpiCard
                    label="Low Stock Items"
                    value={String(lowStockItems)}
                    icon={<AlertTriangle size={18} className="text-red-500" />}
                    bg="bg-red-50"
                    sub={lowStockItems > 0 ? "Needs attention" : "All good"}
                />
            </div>

            {/* Chart + System Status */}
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm">
                    <h2 className="font-semibold text-gray-800 mb-1">Revenue Trend</h2>
                    <p className="text-gray-400 text-xs mb-4">Last 7 days performance</p>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={chartData}>
                            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                            <Tooltip formatter={(v) => [`$${v}`, 'Revenue']} />
                            <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h2 className="font-semibold text-gray-800 mb-4">System Status</h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center">
                                <ShoppingBag size={16} className="text-orange-500" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs">Active Products</p>
                                <p className="text-gray-800 font-bold text-lg leading-none">{products.length}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                                <TrendingUp size={16} className="text-blue-500" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs">Total Transactions</p>
                                <p className="text-gray-800 font-bold text-lg leading-none">{transactions.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 bg-gray-50 rounded-xl p-4">
                        <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">Quick Action</p>
                        <p className="text-gray-800 text-sm font-medium">Need more supplies?</p>
                        <p className="text-gray-400 text-xs mt-1">Check the AI query tool for inventory predictions.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function KpiCard({ label, value, icon, bg, sub }: {
    label: string
    value: string
    icon: React.ReactNode
    bg: string
    sub?: string
}) {
    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <p className="text-gray-500 text-sm">{label}</p>
                <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
                    {icon}
                </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            {sub && <p className="text-gray-400 text-xs mt-1">{sub}</p>}
        </div>
    )
}
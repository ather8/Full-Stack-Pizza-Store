import { useState, useEffect, useMemo } from 'react'
import { Search, Calendar, Receipt, PlusCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Transaction } from '../types'
import { getTransactions } from '../api/transactions'

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [dateFilter, setDateFilter] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        getTransactions()
            .then(setTransactions)
            .finally(() => setLoading(false))
    }, [])

    const filtered = useMemo(() =>
        transactions.filter(t => {
            const matchesSearch = !search ||
                t.product_name.toLowerCase().includes(search.toLowerCase()) ||
                String(t.id).includes(search)
            const matchesDate = !dateFilter ||
                new Date(t.created_at).toLocaleDateString() === new Date(dateFilter).toLocaleDateString()
            return matchesSearch && matchesDate
        }), [transactions, search, dateFilter]
    )

    if (loading) return <div className="p-4 md:p-8 text-gray-500">Loading...</div>

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
                    <p className="text-gray-500 text-sm mt-1">Review past orders and receipts</p>
                </div>
                <button
                    onClick={() => navigate('/orders')}
                    className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                    <PlusCircle size={16} />
                    New Order
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search ID or product..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
                <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left text-xs font-medium text-gray-400 px-6 py-4">ID</th>
                            <th className="text-left text-xs font-medium text-gray-400 px-6 py-4">Product</th>
                            <th className="text-left text-xs font-medium text-gray-400 px-6 py-4">Size</th>
                            <th className="text-right text-xs font-medium text-gray-400 px-6 py-4">Qty</th>
                            <th className="text-right text-xs font-medium text-gray-400 px-6 py-4">Price</th>
                            <th className="text-right text-xs font-medium text-gray-400 px-6 py-4">Total</th>
                            <th className="text-right text-xs font-medium text-gray-400 px-6 py-4">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filtered.slice(0, 50).map(t => (
                            <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-xs text-gray-400 font-mono">#{t.id}</td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-800">{t.product_name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{t.size}</td>
                                <td className="px-6 py-4 text-sm text-gray-800 text-right">{t.quantity}</td>
                                <td className="px-6 py-4 text-sm text-gray-800 text-right">${t.price_at_sale.toFixed(2)}</td>
                                <td className="px-6 py-4 text-sm font-semibold text-gray-800 text-right">${t.total.toFixed(2)}</td>
                                <td className="px-6 py-4 text-xs text-gray-400 text-right">
                                    {new Date(t.created_at).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>

                {filtered.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <Receipt size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No transactions found</p>
                        <p className="text-xs mt-1">Try adjusting your date filter or search term.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
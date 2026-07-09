import { useState, useEffect } from 'react'
import { TrendingUp, BarChart2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { Product } from '../types'
import { getProducts, getForecast } from '../api/forecast'

export default function ForecastPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [forecast, setForecast] = useState<{date: string, predicted_quantity: number}[] | null>(null)
    const [notEnoughData, setNotEnoughData] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        getProducts().then(setProducts)
    }, [])


    useEffect(() => {
        setForecast(null)
        setNotEnoughData('')
        setError('')
    }, [selectedId])
    

    const handleForecast = async () => {
        if (!selectedId) return
        setLoading(true)
        setError('')
        setForecast(null)
        setNotEnoughData('')
        try {
            const result = await getForecast(selectedId)
            if (result.forecast === null) {
                setNotEnoughData(result.message ?? 'Not enough sales history to forecast this product yet.')
            } else {
                setForecast(result.forecast)
            }
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const selectedProduct = products.find(p => p.id === selectedId)

    const chartData = (forecast ?? []).map(f => ({
        date: new Date(f.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        units: f.predicted_quantity
    }))

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Demand Forecast</h1>
                <p className="text-gray-500 text-sm mt-1">Predict inventory needs using historical transaction data</p>
            </div>

            {/* Selector */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                <h2 className="text-sm font-medium text-gray-700 mb-1">Select Product</h2>
                <p className="text-xs text-gray-400 mb-4">Choose an item to see its 7-day demand prediction</p>
                <div className="flex gap-3">
                    <select
                        value={selectedId ?? ''}
                        onChange={(e) => setSelectedId(Number(e.target.value))}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="">Select a product...</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.size} {p.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleForecast}
                        disabled={loading || !selectedId}
                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    >
                        <TrendingUp size={16} />
                        {loading ? 'Running...' : 'Run Forecast Model'}
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 text-red-600 rounded-xl p-4 text-sm mb-6">
                    {error}
                </div>
            )}

            {/* Results */}
            {notEnoughData && (
                <div className="bg-amber-50 text-amber-700 rounded-xl p-4 text-sm mb-6">
                    {notEnoughData}
                </div>
            )}

            {forecast && forecast.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="font-semibold text-gray-800">
                                7-Day Forecast — {selectedProduct?.name}
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">Predicted units to sell per day</p>
                        </div>
                        <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-lg">
                            <BarChart2 size={14} className="text-orange-500" />
                            <span className="text-orange-600 text-xs font-medium">XGBoost Model</span>
                        </div>
                    </div>

                    {/* Chart */}
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={chartData} barSize={32}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <Tooltip
                                formatter={(v) => [`${v} units`, 'Predicted']}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="units" fill="#f97316" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Table */}
                    <div className="mt-6 divide-y divide-gray-50">
                        {forecast.map((f, i) => (
                            <div key={i} className="flex items-center justify-between py-3">
                                <span className="text-sm text-gray-600">
                                    {new Date(f.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                </span>
                                <span className="text-sm font-semibold text-gray-800">
                                    {f.predicted_quantity} units
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
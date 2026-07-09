import { useState, useEffect, useMemo } from 'react'
import { Search, Package } from 'lucide-react'
import type { Product } from '../types'
import { getProducts } from '../api/products'

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        getProducts()
            .then(setProducts)
            .finally(() => setLoading(false))
    }, [])

    const filtered = useMemo(() =>
        products.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.category?.toLowerCase().includes(search.toLowerCase()))
        ), [products, search]
    )

    const categoryColors: Record<string, string> = {
        'Pizza': 'bg-orange-100 text-orange-700',
        'Pasta': 'bg-blue-100 text-blue-700',
        'Sides': 'bg-green-100 text-green-700',
        'Drinks': 'bg-purple-100 text-purple-700',
    }

    if (loading) return <div className="p-8 text-gray-500">Loading...</div>

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Products</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your menu and inventory</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left text-xs font-medium text-gray-400 px-6 py-4">Product</th>
                            <th className="text-left text-xs font-medium text-gray-400 px-6 py-4">Category</th>
                            <th className="text-left text-xs font-medium text-gray-400 px-6 py-4">Size</th>
                            <th className="text-right text-xs font-medium text-gray-400 px-6 py-4">Price</th>
                            <th className="text-right text-xs font-medium text-gray-400 px-6 py-4">Stock</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filtered.map(product => (
                            <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Package size={16} className="text-orange-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{product.name}</p>
                                            {product.description && (
                                                <p className="text-xs text-gray-400 mt-0.5">{product.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {product.category && (
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${categoryColors[product.category] || 'bg-gray-100 text-gray-600'}`}>
                                            {product.category}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{product.size}</td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-800 text-right">
                                    ${product.price.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className={`text-sm font-medium ${
                                        product.quantity < 50 ? 'text-red-500' :
                                        product.quantity < 100 ? 'text-orange-500' :
                                        'text-gray-800'
                                    }`}>
                                        {product.quantity}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filtered.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <Package size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No products found</p>
                    </div>
                )}
            </div>
        </div>
    )
}
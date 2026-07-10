import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react'
import type { Product } from '../types'
import { getProducts } from '../api/products'
import { createTransactionsBulk } from '../api/transactions'

interface CartItem {
    product: Product
    quantity: number
}

export default function OrderPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState<string>('All')
    const [cart, setCart] = useState<CartItem[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        getProducts().then(setProducts)
    }, [])

    const categories = useMemo(() =>
        ['All', ...new Set(products.map(p => p.category).filter(Boolean) as string[])],
        [products]
    )

    const filtered = useMemo(() =>
        products.filter(p =>
            (category === 'All' || p.category === category) &&
            p.name.toLowerCase().includes(search.toLowerCase())
        ), [products, search, category]
    )

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id)
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...prev, { product, quantity: 1 }]
        })
    }

    const updateQuantity = (productId: number, delta: number) => {
        setCart(prev =>
            prev
                .map(item =>
                    item.product.id === productId
                        ? { ...item, quantity: item.quantity + delta }
                        : item
                )
                .filter(item => item.quantity > 0)
        )
    }

    const removeItem = (productId: number) => {
        setCart(prev => prev.filter(item => item.product.id !== productId))
    }

    const total = useMemo(() =>
        cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
        [cart]
    )

    const handleCheckout = async () => {
        if (cart.length === 0) return
        setSubmitting(true)
        setError('')
        try {
            // One atomic request for the whole cart — either it all commits
            // or none of it does, so a failure never leaves partial sales
            // recorded while the cart still shows those items as unpaid.
            await createTransactionsBulk(
                cart.map(item => ({ product_id: item.product.id, quantity: item.quantity }))
            )
            setCart([])
            navigate('/transactions')
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="flex flex-col md:flex-row md:h-full">
            {/* Left — product picker */}
            <div className="flex-1 p-4 md:p-8 md:overflow-y-auto">
                <h1 className="text-2xl font-bold text-gray-800">New Order</h1>
                <p className="text-gray-500 text-sm mt-1 mb-6">Select items to add to the cart</p>

                {/* Search */}
                <div className="relative mb-4">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>

                {/* Category tabs */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {categories.map(c => (
                        <button
                            key={c}
                            onClick={() => setCategory(c)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                                category === c
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-white text-gray-500 border border-gray-200 hover:border-orange-300'
                            }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>

                {/* Product grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {filtered.map(product => (
                        <button
                            key={product.id}
                            onClick={() => addToCart(product)}
                            className="bg-white rounded-2xl shadow-sm p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all"
                        >
                            <p className="text-sm font-medium text-gray-800">{product.name}</p>
                            {product.description && (
                                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{product.description}</p>
                            )}
                            <div className="flex items-center justify-between mt-3">
                                <span className="text-sm font-semibold text-orange-500">
                                    ${product.price.toFixed(2)}
                                </span>
                                <span className="text-xs text-gray-400">{product.size}</span>
                            </div>
                        </button>
                    ))}
                </div>

                {filtered.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-sm">No products match your search</p>
                    </div>
                )}
            </div>

            {/* Right — cart panel */}
            <div className="w-full md:w-96 md:flex-shrink-0 bg-white border-t md:border-t-0 md:border-l border-gray-100 p-4 md:p-6 flex flex-col md:overflow-y-auto">
                <div className="flex items-center gap-2 mb-6">
                    <ShoppingCart size={18} className="text-gray-700" />
                    <h2 className="font-semibold text-gray-800">Current Order</h2>
                    <span className="ml-auto text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                        {cart.reduce((n, i) => n + i.quantity, 0)} items
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3">
                    {cart.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <ShoppingCart size={28} className="mx-auto mb-2 opacity-40" />
                            <p className="text-sm">Cart is empty</p>
                            <p className="text-xs mt-1">Tap a product to add it</p>
                        </div>
                    )}

                    {cart.map(item => (
                        <div key={item.product.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{item.product.name}</p>
                                <p className="text-xs text-gray-400">${item.product.price.toFixed(2)} each</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => updateQuantity(item.product.id, -1)}
                                    className="w-6 h-6 flex items-center justify-center bg-white rounded-full border border-gray-200 hover:bg-gray-100"
                                >
                                    <Minus size={12} />
                                </button>
                                <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                                <button
                                    onClick={() => updateQuantity(item.product.id, 1)}
                                    className="w-6 h-6 flex items-center justify-center bg-white rounded-full border border-gray-200 hover:bg-gray-100"
                                >
                                    <Plus size={12} />
                                </button>
                            </div>
                            <button
                                onClick={() => removeItem(item.product.id)}
                                className="text-gray-300 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>

                {error && (
                    <p className="text-red-500 text-xs mt-3">{error}</p>
                )}

                <div className="border-t border-gray-100 pt-4 mt-4">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-500">Total</span>
                        <span className="text-xl font-bold text-gray-800">${total.toFixed(2)}</span>
                    </div>
                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || submitting}
                        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium rounded-xl py-3 text-sm transition-colors"
                    >
                        {submitting ? 'Processing...' : 'Complete Order'}
                    </button>
                </div>
            </div>
        </div>
    )
}
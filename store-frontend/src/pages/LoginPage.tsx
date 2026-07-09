import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as loginApi } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const response = await loginApi(email, password)
            await login(response.access_token)
            navigate('/dashboard')
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg">P</span>
                    </div>
                    <div>
                        <p className="text-white font-bold text-lg leading-none">PizzaStore</p>
                        <p className="text-gray-400 text-xs">Operations System</p>
                    </div>
                </div>

                {/* Card */}
                <div className="bg-gray-800 rounded-2xl p-8">
                    <h2 className="text-white text-xl font-semibold mb-6">Sign in</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="admin@example.com"
                                className="w-full bg-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full bg-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>

                        {error && (
                            <p className="text-red-400 text-sm">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
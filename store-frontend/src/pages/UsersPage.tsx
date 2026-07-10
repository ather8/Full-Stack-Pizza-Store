import { useState, useEffect } from 'react'
import { Plus, X, UserCircle } from 'lucide-react'
import type { User } from '../types'
import { getUsers, createUser } from '../api/users'

const roleColors: Record<string, string> = {
    Admin: 'bg-red-100 text-red-700',
    Manager: 'bg-blue-100 text-blue-700',
    Cashier: 'bg-gray-100 text-gray-600',
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('Cashier')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const fetchUsers = () => {
        setLoading(true)
        getUsers().then(setUsers).finally(() => setLoading(false))
    }

    useEffect(() => { fetchUsers() }, [])

    const resetForm = () => {
        setName(''); setEmail(''); setPassword(''); setRole('Cashier'); setError('')
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSubmitting(true)
        setError('')
        try {
            await createUser(name, email, password, role)
            setShowModal(false)
            resetForm()
            fetchUsers()
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="p-4 md:p-8 text-gray-500">Loading...</div>

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Users</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage staff accounts and permissions</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                    <Plus size={16} />
                    Add User
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[560px]">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left text-xs font-medium text-gray-400 px-6 py-4">Name</th>
                            <th className="text-left text-xs font-medium text-gray-400 px-6 py-4">Email</th>
                            <th className="text-left text-xs font-medium text-gray-400 px-6 py-4">Role</th>
                            <th className="text-left text-xs font-medium text-gray-400 px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <UserCircle size={18} className="text-gray-400" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-800">{u.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleColors[u.role] || 'bg-gray-100 text-gray-600'}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                        u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {u.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">Add New User</h2>
                            <button onClick={() => { setShowModal(false); resetForm() }} className="text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                                <input
                                    type="text" value={name} onChange={(e) => setName(e.target.value)} required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                                <input
                                    type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Password</label>
                                <input
                                    type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                                <select
                                    value={role} onChange={(e) => setRole(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                >
                                    <option value="Cashier">Cashier</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>

                            {error && <p className="text-red-500 text-xs">{error}</p>}

                            <button
                                type="submit" disabled={submitting}
                                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium rounded-xl py-2.5 text-sm transition-colors"
                            >
                                {submitting ? 'Creating...' : 'Create User'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
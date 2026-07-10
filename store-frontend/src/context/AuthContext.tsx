import { createContext, useContext, useState, useEffect } from 'react'
import { BASE_URL } from '../api/client'

interface AuthState {
    token: string | null
    email: string | null
    role: string | null
}

interface AuthContextType {
    auth: AuthState
    authLoading: boolean  // add this
    login: (token: string) => Promise<string>
    logout: () => void
}


const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [auth, setAuth] = useState<AuthState>({
    token: localStorage.getItem('token'),
    email: null,
    role: null,
    })
    const [authLoading, setAuthLoading] = useState(true)  // add this

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (token) {
            fetch(`${BASE_URL}/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(user => {
                setAuth({ token, email: user.email, role: user.role })
            })
            .catch(() => {
                localStorage.removeItem('token')
                setAuth({ token: null, email: null, role: null })
            })
            .finally(() => setAuthLoading(false))  // add this
        } else {
            setAuthLoading(false)  // add this
        }
    }, [])

    const login = async (token: string): Promise<string> => {
        localStorage.setItem('token', token)

        const response = await fetch(`${BASE_URL}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        const user = await response.json()

        setAuth({
            token,
            email: user.email,
            role: user.role,
        })

        return user.role
    }

    const logout = () => {
        localStorage.removeItem('token')
        setAuth({ token: null, email: null, role: null })
    }

    return (
        <AuthContext.Provider value={{ auth, authLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used inside AuthProvider')
    return context
}
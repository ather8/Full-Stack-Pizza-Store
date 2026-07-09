import { BASE_URL } from './client'
import type { User } from '../types'

export async function getUsers(): Promise<User[]> {
    const token = localStorage.getItem('token')
    const response = await fetch(`${BASE_URL}/users/`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!response.ok) throw new Error('Failed to fetch users')
    return response.json()
}

export async function createUser(name: string, email: string, password: string, role: string): Promise<User> {
    const token = localStorage.getItem('token')
    const response = await fetch(`${BASE_URL}/users/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, role, is_active: true })
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to create user')
    }
    return response.json()
}
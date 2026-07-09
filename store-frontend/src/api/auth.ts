import { BASE_URL } from './client'
import type { LoginResponse } from '../types'

export async function login(email: string, password: string): Promise<LoginResponse> {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)
    formData.append('grant_type', 'password')

    const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
    })

    if (!response.ok) throw new Error('Invalid credentials')
    return response.json()
}
import { BASE_URL } from './client'
import type { Product } from '../types'

export async function getProducts(): Promise<Product[]> {
    const token = localStorage.getItem('token')
    const response = await fetch(`${BASE_URL}/products/`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!response.ok) throw new Error('Failed to fetch products')
    return response.json()
}
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

export interface ForecastResponse {
    product: string
    forecast: { date: string, predicted_quantity: number }[] | null
    message?: string
}

export async function getForecast(productId: number): Promise<ForecastResponse> {
    const token = localStorage.getItem('token')
    const response = await fetch(`${BASE_URL}/forecast/${productId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Forecast failed')
    }
    return response.json()
}
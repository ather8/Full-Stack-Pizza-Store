import { BASE_URL } from './client'
import type { Transaction } from '../types'

export async function getTransactions(): Promise<Transaction[]> {
    const token = localStorage.getItem('token')
    const response = await fetch(`${BASE_URL}/transactions/`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!response.ok) throw new Error('Failed to fetch transactions')
    return response.json()
}

export async function createTransaction(productId: number, quantity: number): Promise<Transaction> {
    const token = localStorage.getItem('token')
    const response = await fetch(`${BASE_URL}/transactions/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ product_id: productId, quantity })
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to create transaction')
    }
    return response.json()
}

export interface CartLine {
    product_id: number
    quantity: number
}

// Commits an entire cart as one all-or-nothing request — either every line
// is recorded as a sale, or none are. Prevents the previous per-line-POST
// loop from partially committing a cart when a later line fails.
export async function createTransactionsBulk(items: CartLine[]): Promise<Transaction[]> {
    const token = localStorage.getItem('token')
    const response = await fetch(`${BASE_URL}/transactions/bulk`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items })
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to complete order')
    }
    return response.json()
}
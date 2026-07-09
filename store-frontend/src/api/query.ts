import { BASE_URL } from './client'

export async function askQuestion(question: string): Promise<string> {
    const token = localStorage.getItem('token')
    const response = await fetch(`${BASE_URL}/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question })
    })
    if (!response.ok) throw new Error('Query failed')
    const data = await response.json()
    return data.answer
}
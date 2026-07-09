import { BASE_URL } from './client'

export class ApiError extends Error {
    status: number
    detail?: string

    constructor(status: number, detail?: string) {
        super(detail || `Request failed with status ${status}`)
        this.name = 'ApiError'
        this.status = status
        this.detail = detail
    }
}

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

    if (!response.ok) {
        let detail: string | undefined
        try {
            const errBody = await response.json()
            detail = errBody?.detail
        } catch {
            // response body wasn't JSON (e.g. network-level error page) — ignore
        }
        throw new ApiError(response.status, detail)
    }

    const data = await response.json()
    return data.answer
}
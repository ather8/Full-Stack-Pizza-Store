export type Role = 'Admin' | 'Manager' | 'Cashier'

export const ROUTE_ROLES: Record<string, Role[]> = {
    '/app/dashboard': ['Admin', 'Manager'],
    '/app/orders': ['Cashier'],
    '/app/products': ['Admin', 'Manager', 'Cashier'],
    '/app/transactions': ['Admin', 'Manager'],
    '/app/forecast': ['Admin', 'Manager'],
    '/app/query': ['Admin', 'Manager'],
    '/app/users': ['Admin'],
}

export function getDefaultRoute(role: string | null): string {
    if (role === 'Cashier') return '/app/orders'
    if (role === 'Admin' || role === 'Manager') return '/app/dashboard'
    return '/login'
}
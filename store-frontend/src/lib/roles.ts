export type Role = 'Admin' | 'Manager' | 'Cashier'

export const ROUTE_ROLES: Record<string, Role[]> = {
    '/dashboard': ['Admin', 'Manager'],       // needs GET /transactions/ (Admin/Manager only)
    '/orders': ['Cashier'],                   // POST /transactions/ is Cashier-only on the backend
    '/products': ['Admin', 'Manager', 'Cashier'],
    '/transactions': ['Admin', 'Manager'],
    '/forecast': ['Admin', 'Manager'],
    '/query': ['Admin', 'Manager'],
    '/users': ['Admin'],
}

// Where to send a user immediately after login / at "/" — the first route
// in ROUTE_ROLES they're actually allowed to hit.
export function getDefaultRoute(role: string | null): string {
    if (role === 'Cashier') return '/orders'
    if (role === 'Admin' || role === 'Manager') return '/dashboard'
    return '/login'
}
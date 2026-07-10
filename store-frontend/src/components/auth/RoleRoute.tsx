import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getDefaultRoute, type Role } from '../../lib/roles'

interface RoleRouteProps {
    allowedRoles: Role[]
}

// Guards a route by role, not just by "is logged in". Sidebar hides links
// the user can't use, but that alone doesn't stop someone typing the URL
// directly — this catches that case and sends them somewhere that will
// actually work for their role instead of a broken/403 page.
export default function RoleRoute({ allowedRoles }: RoleRouteProps) {
    const { auth } = useAuth()

    if (!auth.role || !allowedRoles.includes(auth.role as Role)) {
        return <Navigate to={getDefaultRoute(auth.role)} replace />
    }

    return <Outlet />
}
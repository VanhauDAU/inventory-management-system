import { Navigate, Outlet } from 'react-router-dom'

function checkAuth() {
  return !!(
    localStorage.getItem('access_token') ||
    localStorage.getItem('accessToken')
  )
}

export default function PrivateRoute() {
  return checkAuth() ? <Outlet /> : <Navigate to="/login" replace />
}

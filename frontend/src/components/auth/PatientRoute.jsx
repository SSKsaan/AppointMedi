import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function PatientRoute() {
  const { user, isPatient } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!isPatient) return <Navigate to="/admin" replace />
  return <Outlet />
}

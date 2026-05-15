import { useEffect, useRef } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AdminRoute from '@/components/auth/AdminRoute'
import PatientRoute from '@/components/auth/PatientRoute'

import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import Profile from '@/pages/Profile'
import AdminDashboard from '@/pages/dashboard/AdminDashboard'
import AppointmentsList from '@/pages/appointments/AppointmentsList'
import AppointmentDetail from '@/pages/appointments/AppointmentDetail'
import CreateAppointment from '@/pages/appointments/CreateAppointment'
import Payments from '@/pages/Payments'
import PaymentSuccess from '@/pages/PaymentSuccess'
import PaymentFailure from '@/pages/PaymentFailure'
import TopUp from '@/pages/TopUp'
import ReviewsPage from '@/pages/Reviews'
import NotFound from '@/pages/NotFound'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

export default function App() {
  const { user } = useAuth()
  const cacheRef = useRef({})

  useEffect(() => {
    const rootUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '') || 'http://localhost:8000'
    let id
    const ping = () => { id = setTimeout(ping, 600_000); fetch(rootUrl).catch(() => {}) }
    const start = () => { clearTimeout(id); id = setTimeout(ping, 600_000) }
    const stop = () => clearTimeout(id)
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start())
    start()
    return () => { stop(); document.removeEventListener('visibilitychange', stop) }
  }, [])

  useEffect(() => {
    if (!user) return

    const apiUrl = import.meta.env.VITE_API_URL || '/api'
    let lastPoll = new Date().toISOString()
    let interval
    let visible = true

    const poll = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        const res = await fetch(`${apiUrl}/appointments/updates/?after=${lastPoll}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) return
        lastPoll = new Date().toISOString()
        const updates = await res.json()
        if (!updates.length || !visible) return

        const batch = updates.slice(0, 3)
        batch.forEach((a) => {
          const key = `${a.id}-${a.status}`
          if (cacheRef.current[key]) return
          cacheRef.current[key] = true
          const msg = user.is_staff
            ? a.status === 'PENDING'
              ? `New PENDING request #${a.id} from ${a.patient_email}`
              : `Appointment #${a.id} is now ${a.status}`
            : `Appointment #${a.id} is now ${a.status}`
          toast(msg, { duration: 5000 })
        })
        if (updates.length > 3) toast(`${updates.length} appointments updated`, { duration: 5000 })
      } catch {}
    }

    const start = () => { interval = setInterval(poll, 30_000) }
    const stop = () => clearInterval(interval)
    document.addEventListener('visibilitychange', () => { visible = !document.hidden; document.hidden ? stop() : (poll(), start()) })
    start()
    return () => { stop(); document.removeEventListener('visibilitychange', stop) }
  }, [user])

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="payment/success" element={<PaymentSuccess />} />
        <Route path="payment/failure" element={<PaymentFailure />} />

        <Route element={<ProtectedRoute />}>
          <Route path="profile" element={<Profile />} />
          <Route path="appointments" element={<AppointmentsList />} />
          <Route path="appointments/:id" element={<AppointmentDetail />} />
          <Route path="payments" element={<Payments />} />

          <Route path="dashboard" element={<Navigate to="/appointments" replace />} />

          <Route element={<PatientRoute />}>
            <Route path="appointments/new" element={<CreateAppointment />} />
            <Route path="top-up" element={<TopUp />} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/dashboard" element={<Navigate to="/admin" replace />} />
            <Route path="reviews" element={<ReviewsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

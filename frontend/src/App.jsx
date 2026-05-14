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

export default function App() {
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

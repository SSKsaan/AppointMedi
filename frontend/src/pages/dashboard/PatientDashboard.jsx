import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, CheckCircle, XCircle, PlusCircle, DollarSign, AlertCircle, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import { listAppointments } from '@/api/appointments'
import { formatDate } from '@/lib/utils'

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({})

  useEffect(() => {
    setError(null)
    listAppointments({ page_size: 100 })
      .then(({ data }) => {
        const items = data.results || []
        setAppointments(items)
        setStats({
          PENDING: items.filter((a) => a.status === 'PENDING').length,
          PROCESSING: items.filter((a) => a.status === 'PROCESSING').length,
          RESPONDED: items.filter((a) => a.status === 'RESPONDED').length,
          CONFIRMED: items.filter((a) => a.status === 'CONFIRMED').length,
          COMPLETED: items.filter((a) => a.status === 'COMPLETED').length,
          CANCELLED: items.filter((a) => a.status === 'CANCELLED').length,
        })
      })
      .catch(() => setError('Failed to load your appointments'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />

  const statCards = [
    { label: 'Pending', value: stats.PENDING || 0, icon: Clock, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20' },
    { label: 'Processing', value: stats.PROCESSING || 0, icon: AlertCircle, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20' },
    { label: 'Responded', value: stats.RESPONDED || 0, icon: Calendar, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20' },
    { label: 'Confirmed', value: stats.CONFIRMED || 0, icon: CheckCircle, color: 'text-green-600 bg-green-100 dark:bg-green-900/20' },
    { label: 'Completed', value: stats.COMPLETED || 0, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20' },
    { label: 'Cancelled', value: stats.CANCELLED || 0, icon: XCircle, color: 'text-gray-600 bg-gray-100 dark:bg-gray-800' },
  ]

  const recent = appointments.slice(0, 5)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-3xl font-bold">Patient Dashboard</h1>
        <Link to="/appointments/new">
          <Button className="gap-2"><PlusCircle className="h-4 w-4" /> New Appointment</Button>
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6 text-center">
              <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <p className="mt-3 font-heading text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Appointments</CardTitle>
          <Link to="/appointments">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No appointments yet. Create your first one!
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((appt) => (
                <Link key={appt.id} to={`/appointments/${appt.id}`} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{appt.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(appt.created_at)}</p>
                  </div>
                  <StatusBadge status={appt.status} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Link to="/payments">
          <Card className="transition-colors hover:border-primary/50">
            <CardContent className="flex items-center gap-4 pt-6">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Payment History</p>
                <p className="text-sm text-muted-foreground">View your transaction history</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/top-up">
          <Card className="transition-colors hover:border-primary/50">
            <CardContent className="flex items-center gap-4 pt-6">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="font-medium">Top Up Balance</p>
                <p className="text-sm text-muted-foreground">Deposit funds to your account</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Clock, CheckCircle, XCircle, AlertCircle, Calendar, DollarSign, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import Pagination from '@/components/shared/Pagination'
import { listAppointments } from '@/api/appointments'
import { useAuth } from '@/context/AuthContext'
import { formatDate, STATUS_LABELS } from '@/lib/utils'

const STATUS_FILTERS = ['', 'PENDING', 'PROCESSING', 'INCOMPLETE', 'RESPONDED', 'CONFIRMED', 'REJECTED', 'COMPLETED', 'CANCELLED']

export default function AppointmentsList() {
  const { user, isPatient, isAdmin } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [count, setCount] = useState()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({})
  const pageSize = 10

  const fetchAppointments = () => {
    setLoading(true)
    setError(null)
    const params = { page, page_size: pageSize }
    if (statusFilter) params.status = statusFilter
    if (search) params.search = search
    listAppointments(params)
      .then(({ data }) => {
        setAppointments(data.results || [])
        setCount(data.count)
        if (!statusFilter && !search) {
          const items = data.results || []
          setStats({
            PENDING: items.filter((a) => a.status === 'PENDING').length,
            PROCESSING: items.filter((a) => a.status === 'PROCESSING').length,
            RESPONDED: items.filter((a) => a.status === 'RESPONDED').length,
            CONFIRMED: items.filter((a) => a.status === 'CONFIRMED').length,
            COMPLETED: items.filter((a) => a.status === 'COMPLETED').length,
            CANCELLED: items.filter((a) => a.status === 'CANCELLED').length,
          })
        }
      })
      .catch(() => setError('Failed to load appointments'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAppointments() }, [page, statusFilter, search])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
  }

  const statCards = [
    { label: 'Pending', value: stats.PENDING || 0, icon: Clock, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20' },
    { label: 'Processing', value: stats.PROCESSING || 0, icon: AlertCircle, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20' },
    { label: 'Responded', value: stats.RESPONDED || 0, icon: Calendar, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20' },
    { label: 'Confirmed', value: stats.CONFIRMED || 0, icon: CheckCircle, color: 'text-green-600 bg-green-100 dark:bg-green-900/20' },
    { label: 'Completed', value: stats.COMPLETED || 0, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20' },
    { label: 'Cancelled', value: stats.CANCELLED || 0, icon: XCircle, color: 'text-gray-600 bg-gray-100 dark:bg-gray-800' },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">
            {isPatient ? 'My Appointments' : 'All Appointments'}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {count !== undefined ? `${count} appointment${count !== 1 ? 's' : ''} found` : ''}
          </p>
        </div>
        {isPatient && (
          <Link to="/appointments/new">
            <Button className="gap-2"><PlusCircle className="h-4 w-4" /> New Request</Button>
          </Link>
        )}
      </div>

      {!statusFilter && !search && count > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-6 text-center">
                <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <p className="mt-3 font-heading text-2xl font-bold">
                  {count !== undefined ? (Object.entries(stats).find(([k]) => k === s.label.toUpperCase())?.[1] || 0) : '-'}
                </p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row">
            <form onSubmit={handleSearch} className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-10" placeholder="Search description, email..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </form>
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="w-full sm:w-auto">
              <option value="">All Appointments</option>
              {STATUS_FILTERS.filter(Boolean).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
              ))}
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchAppointments} />
          ) : appointments.length === 0 ? (
            <EmptyState
              message="No appointments found"
              description={statusFilter ? 'Try a different filter' : isPatient ? 'Create your first appointment request' : ''}
            />
          ) : (
            <div className="space-y-3">
              {appointments.map((appt) => (
                <Link key={appt.id} to={`/appointments/${appt.id}`} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
                  <div className="flex-1 min-w-0 max-w-[70%] sm:max-w-none">
                    <p className="truncate text-sm font-medium">{appt.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {isAdmin && appt.patient_email && <span>{appt.patient_email} &middot; </span>}
                      {formatDate(appt.created_at)}
                      {isAdmin && appt.claimed_by_email && <span className="ml-2">Claimed by: {appt.claimed_by_email}</span>}
                    </p>
                  </div>
                  <StatusBadge status={appt.status} />
                </Link>
              ))}
            </div>
          )}
          <Pagination count={count || 0} page={page} pageSize={pageSize} onPageChange={setPage} />
        </CardContent>
      </Card>

      {isPatient && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Link to="/payments">
            <Card className="transition-colors hover:border-primary/50">
              <CardContent className="flex items-center gap-4 pt-6">
                <DollarSign className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">Transaction History</p>
                  <p className="text-sm text-muted-foreground">View your transactions</p>
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
      )}
    </div>
  )
}

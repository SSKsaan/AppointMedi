import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Calendar, TrendingUp, Shield, ExternalLink, ThumbsUp, ThumbsDown, RefreshCw, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import EmptyState from '@/components/shared/EmptyState'
import { getAdminStats } from '@/api/users'
import { claimAppointment } from '@/api/appointments'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#eab308', '#3b82f6', '#f97316', '#a855f7', '#22c55e', '#ef4444', '#10b981', '#6b7280']

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [claimingId, setClaimingId] = useState(null)
  const [pendingPage, setPendingPage] = useState(0)
  const PENDING_PAGE_SIZE = 4

  const fetchStats = () => {
    setLoading(true)
    setError(null)
    getAdminStats()
      .then(({ data }) => setStats(data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load stats'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchStats() }, [])

  const handleClaim = async (id) => {
    setClaimingId(id)
    try {
      await claimAppointment(id)
      toast.success('Appointment claimed')
      fetchStats()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to claim')
    } finally {
      setClaimingId(null)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={fetchStats} />
  if (!stats) return <EmptyState message="No data available" />

  const statusData = stats.requests_by_status
    ? Object.entries(stats.requests_by_status).map(([name, value]) => ({ name, value }))
    : []

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-3xl font-bold">Admin Dashboard</h1>
        <a href={import.meta.env.VITE_API_URL?.replace('/api', '/admin/') || '/admin/'} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="gap-2">
            <Shield className="h-4 w-4" /> Django Admin <ExternalLink className="h-3 w-3" />
          </Button>
        </a>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total_users}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Object.values(stats.requests_by_status || {}).reduce((a, b) => a + b, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Requests</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <ThumbsUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.my_responses_success || 0}</p>
              <p className="text-xs text-muted-foreground">Personal Success</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <ThumbsDown className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.my_responses_failed || 0}</p>
              <p className="text-xs text-muted-foreground">Personal Failure</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Requests by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <EmptyState message="No requests yet" />
            ) : (
              <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" labelLine={false} outerRadius={120} dataKey="value">
                      {statusData.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {(!stats.recent_requests || stats.recent_requests.length === 0) ? (
              <EmptyState message="No pending requests" />
            ) : (
              <>
                <div className="space-y-3 overflow-hidden" style={{ height: '376px' }}>
                  {Array.from({ length: PENDING_PAGE_SIZE }).map((_, idx) => {
                    const req = stats.recent_requests[pendingPage * PENDING_PAGE_SIZE + idx]
                    if (!req) return <div key={`empty-${idx}`} className="h-[85px]" />
                    return (
                      <div key={req.id} className="flex items-center justify-between rounded-lg border p-3 h-[85px]">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{req.patient_full_name || req.patient_email}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(req.created_at)}</p>
                          {req.claimed_by_email && (
                            <p className="text-xs text-muted-foreground mt-0.5">Claimed by: {req.claimed_by_email}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {req.status === 'PENDING' && (
                            <Button size="icon" variant="outline" disabled={claimingId === req.id} onClick={() => handleClaim(req.id)} className="h-7 w-7">
                              {claimingId === req.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 text-primary" />}
                            </Button>
                          )}
                          <StatusBadge status={req.status} />
                          <Link to={`/appointments/${req.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">View</Button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center justify-center gap-2 pt-5">
                  <Button variant="outline" size="sm" disabled={pendingPage === 0} onClick={() => setPendingPage(pendingPage - 1)}>
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {pendingPage + 1} of {Math.ceil(stats.recent_requests.length / PENDING_PAGE_SIZE)}
                  </span>
                  <Button variant="outline" size="sm" disabled={(pendingPage + 1) * PENDING_PAGE_SIZE >= stats.recent_requests.length} onClick={() => setPendingPage(pendingPage + 1)}>
                    Next
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Link to="/appointments">
          <Button variant="outline" className="w-full">View All Appointments</Button>
        </Link>
        <Link to="/reviews">
          <Button variant="outline" className="w-full">Manage Reviews</Button>
        </Link>
        <Link to="/payments">
          <Button variant="outline" className="w-full">All Transactions</Button>
        </Link>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { DollarSign, CreditCard, ExternalLink, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import Pagination from '@/components/shared/Pagination'
import { getPaymentHistory } from '@/api/payments'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

const TYPE_LABELS = { DEPOSIT: 'Deposit', DEDUCT: 'Charged' }
const STATUS_VARIANTS = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  SUCCESS: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export default function Payments() {
  const { isPatient } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const pageSize = 10

  const fetchHistory = () => {
    setLoading(true)
    setError(null)
    const params = { page, page_size: pageSize }
    if (typeFilter === 'REFUND') params.visual_type = 'REFUND'
    else if (typeFilter === 'DEPOSIT') params.visual_type = 'DEPOSIT'
    else if (typeFilter) params.type = typeFilter
    if (statusFilter) params.status = statusFilter
    getPaymentHistory(params)
      .then(({ data }) => {
        setTransactions(data.results || [])
        setCount(data.count || 0)
      })
      .catch(() => setError('Failed to load payment history'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchHistory() }, [page, typeFilter, statusFilter])

  const copyId = (id) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id)
      toast.success('Transaction ID copied')
      setTimeout(() => setCopiedId(null), 2000)
    }).catch(() => toast.error('Failed to copy'))
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-3xl font-bold">Transaction History</h1>
        {isPatient && (
          <Link to="/top-up">
            <Button className="gap-2"><CreditCard className="h-4 w-4" /> Top Up</Button>
          </Link>
        )}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex gap-4">
            <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}>
              <option value="">All Types</option>
              <option value="DEPOSIT">Deposit</option>
              <option value="REFUND">Refund</option>
              <option value="DEDUCT">Charged</option>
            </Select>
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
              <option value="">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchHistory} />
          ) : transactions.length === 0 ? (
            <EmptyState message="No transactions found" description={isPatient ? 'Top up your balance to get started' : ''} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {transactions.map((txn) => {
                    const isRefund = txn.type === 'DEPOSIT' && [100, 50].includes(parseFloat(txn.amount))
                    return (
                    <TableRow key={txn.id}>
                      <TableCell>
                        <button onClick={() => copyId(txn.transaction_id)} className="font-mono text-xs hover:text-primary flex items-center gap-1" title="Click to copy">
                          {txn.transaction_id?.slice(0, 8)}...
                          {copiedId === txn.transaction_id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100" />}
                        </button>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          isRefund
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : txn.type === 'DEPOSIT'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {txn.type === 'DEPOSIT' ? <DollarSign className="h-3 w-3" /> : <ExternalLink className="h-3 w-3" />}
                          {isRefund ? 'Refund' : TYPE_LABELS[txn.type] || txn.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">BDT {parseFloat(txn.amount).toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_VARIANTS[txn.status] || 'bg-gray-100 text-gray-800'}`}>
                          {txn.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{txn.gateway_ref || '-'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(txn.created_at)}</TableCell>
                    </TableRow>
                  )})}
              </TableBody>
            </Table>
          )}
          <Pagination count={count} page={page} pageSize={pageSize} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  )
}

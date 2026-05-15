import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getPaymentHistory } from '@/api/payments'
import { getProfile } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'

export default function PaymentSuccess() {
  const { updateUser } = useAuth()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading')
  const transactionId = searchParams.get('transaction_id')

  useEffect(() => {
    if (!transactionId) {
      setStatus('invalid')
      return
    }
    const check = setTimeout(() => {
      getPaymentHistory({ transaction_id: transactionId, page_size: 1 })
        .then(({ data }) => {
          const txn = data.results?.[0]
          if (txn?.status === 'SUCCESS') {
            setStatus('success')
            getProfile().then(({ data }) => updateUser(data)).catch(() => {})
          }
          else if (txn?.status === 'PENDING') setStatus('pending')
          else setStatus('failed')
        })
        .catch(() => setStatus('unverified'))
    }, 2000)
    return () => clearTimeout(check)
  }, [transactionId])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8">
          {status === 'loading' && (
            <>
              <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary" />
              <h1 className="mt-6 font-heading text-2xl font-bold">Verifying Payment</h1>
              <p className="mt-2 text-muted-foreground">Please wait while we confirm your transaction...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
              <h1 className="mt-6 font-heading text-2xl font-bold text-green-600">Payment Successful!</h1>
              <p className="mt-2 text-muted-foreground">Your balance has been updated.</p>
              {transactionId && <p className="mt-1 text-xs text-muted-foreground">Transaction: {transactionId}</p>}
              <div className="mt-6 flex justify-center gap-3">
                <Link to="/payments"><Button variant="outline">View History</Button></Link>
                <Link to="/dashboard"><Button className="gap-2">Dashboard <ArrowRight className="h-4 w-4" /></Button></Link>
              </div>
            </>
          )}
          {status === 'pending' && (
            <>
              <Loader2 className="mx-auto h-16 w-16 animate-spin text-yellow-500" />
              <h1 className="mt-6 font-heading text-2xl font-bold">Payment Pending</h1>
              <p className="mt-2 text-muted-foreground">Your transaction is still being processed. It may take a few moments.</p>
            </>
          )}
          {(status === 'failed' || status === 'invalid' || status === 'unverified') && (
            <>
              <h1 className="mt-6 font-heading text-2xl font-bold text-destructive">Payment Issue</h1>
              <p className="mt-2 text-muted-foreground">
                {status === 'invalid' ? 'No transaction reference found.' : 'We could not verify your payment. Please check your transaction history.'}
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link to="/payments"><Button variant="outline">View History</Button></Link>
                <Link to="/top-up"><Button>Try Again</Button></Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

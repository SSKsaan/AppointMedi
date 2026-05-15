import { Link, useSearchParams } from 'react-router-dom'
import { XCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const REASON_LABELS = {
  missing_params: 'Missing payment reference',
  invalid_transaction: 'Invalid transaction ID',
  already_processed: 'This payment was already processed',
  validation_failed: 'Payment validation with the gateway failed',
  validation_error: 'An error occurred while validating your payment',
}

export default function PaymentFailure() {
  const [searchParams] = useSearchParams()
  const reason = searchParams.get('reason')

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8">
          <XCircle className="mx-auto h-16 w-16 text-destructive" />
          <h1 className="mt-6 font-heading text-2xl font-bold text-destructive">Payment Failed</h1>
          <p className="mt-2 text-muted-foreground">
            {REASON_LABELS[reason] || 'Your payment could not be completed.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/payments"><Button variant="outline">View History</Button></Link>
            <Link to="/top-up"><Button className="gap-2">Try Again <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

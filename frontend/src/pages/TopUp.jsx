import { Link } from 'react-router-dom'
import { useState } from 'react'
import { DollarSign, CreditCard, ArrowRight, AlertCircle, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { initiatePayment } from '@/api/payments'
import { toast } from 'sonner'

export default function TopUp() {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const maxDeposit = import.meta.env.VITE_MAX_DEPOSIT || 100000

  const handleSubmit = async (e) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (numAmount > maxDeposit) {
      setError(`Maximum deposit is BDT ${maxDeposit}`)
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data } = await initiatePayment(amount)
      if (data.redirect_url) {
        window.location.href = data.redirect_url
      } else {
        toast.error('Payment initiation failed')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to initiate payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
          <DollarSign className="h-6 w-6 text-green-600" />
        </div>
        <h1 className="mt-4 font-heading text-3xl font-bold">Top Up Balance</h1>
        <p className="mt-1 text-muted-foreground">Deposit funds to your account via SSLCommerz</p>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Deposit Amount</CardTitle>
          <CardDescription>Enter the amount you want to add to your balance (max BDT {maxDeposit})</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (BDT)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  className="pl-10 text-lg font-bold"
                  placeholder="100"
                  min="1"
                  max={maxDeposit}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[100, 500, 1000, 5000].map((val) => (
                <Button
                  key={val}
                  type="button"
                  variant={parseFloat(amount) === val ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAmount(String(val))}
                >
                  BDT {val}
                </Button>
              ))}
            </div>

            <Button type="submit" className="w-full gap-2" disabled={loading}>
              <CreditCard className="h-4 w-4" />
              {loading ? 'Processing...' : `Pay BDT ${parseFloat(amount || 0).toFixed(2)}`}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>

            <div className="text-center">
              <Link to="/payments" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
                <History className="h-4 w-4" /> View Transaction History
              </Link>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              You will be redirected to SSLCommerz to complete the payment securely.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DollarSign, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createAppointment } from '@/api/appointments'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

export default function CreateAppointment() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fee = import.meta.env.VITE_MEDIATION_FEE || 100
  const balance = parseFloat(user?.balance || 0)
  const insufficient = balance < fee

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!description.trim()) {
      setError('Description is required')
      return
    }
    if (insufficient) {
      setError(`Insufficient balance. You need at least BDT ${fee}.`)
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data } = await createAppointment({ description })
      if (user) {
        updateUser({ ...user, balance: (balance - fee).toString() })
      }
      toast.success('Appointment created successfully!')
      navigate(`/appointments/${data.id || ''}`, { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.description?.[0] || 'Failed to create appointment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold">New Appointment Request</h1>
      <p className="mt-2 text-muted-foreground">Describe your medical needs and our team will find the right specialist for you.</p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
          <CardDescription>A mediation fee of BDT {fee} will be deducted from your balance.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Your Balance</span>
                </div>
                <span className="font-heading text-lg font-bold">BDT {balance.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Mediation Fee</span>
                <span className="font-medium">- BDT {fee}.00</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t pt-2 text-sm">
                <span className="text-muted-foreground">After submission</span>
                <span className={`font-semibold ${insufficient ? 'text-destructive' : 'text-green-600'}`}>
                  BDT {(balance - fee).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Describe your medical requirement *</Label>
              <Textarea
                id="description"
                className="min-h-[150px]"
                placeholder="Example: I need to see a cardiologist in Dhaka. I have a history of high blood pressure and need a checkup..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full gap-2" disabled={loading || insufficient}>
              <Send className="h-4 w-4" />
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

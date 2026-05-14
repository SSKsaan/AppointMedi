import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, CheckCircle, XCircle, AlertCircle, RefreshCw, FileText, Edit3, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import {
  getAppointment, updateAppointment, claimAppointment, respondAppointment, requestIncomplete,
  confirmAppointment, rejectAppointment, cancelAppointment, completeAppointment, followUpAppointment,
} from '@/api/appointments'
import { useAuth } from '@/context/AuthContext'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

const FEE = parseFloat(import.meta.env.VITE_MEDIATION_FEE || 100)
const FOLLOW_UP_FEE = FEE / 2

function AppActions({ appt, isAdmin, isPatient, actionLoading, descriptionText, setDescriptionText, handleAction, userBalance, onCancelClick }) {
  const insufficient = userBalance < FOLLOW_UP_FEE

  if (isAdmin && appt.status === 'PENDING') {
    return (
      <ActionRow>
        <Button onClick={() => handleAction('claim')} disabled={actionLoading === 'claim'} className="gap-2">
          {actionLoading === 'claim' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          Claim
        </Button>
      </ActionRow>
    )
  }
  if (isAdmin && appt.status === 'CONFIRMED') {
    return (
      <ActionRow>
        <Button onClick={() => handleAction('complete')} disabled={actionLoading === 'complete'} className="gap-2">
          {actionLoading === 'complete' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          Complete
        </Button>
      </ActionRow>
    )
  }
  if (isAdmin && (appt.status === 'PROCESSING' || appt.status === 'REJECTED')) {
    const isProcessing = appt.status === 'PROCESSING'
    return (
      <>
        <div className="space-y-2">
          <Label>{(isProcessing ? 'Response' : 'Respond again') + (appt.claimed_by_email ? ` (Claimed By: ${appt.claimed_by_email})` : '')}</Label>
          <Textarea className="min-h-[80px]" value={descriptionText} onChange={(e) => setDescriptionText(e.target.value)} placeholder="Enter your response..." />
        </div>
        <ActionRow>
          <Button onClick={() => handleAction('respond')} disabled={actionLoading === 'respond' || !descriptionText.trim()} className="gap-2">
            {actionLoading === 'respond' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Respond
          </Button>
          {isProcessing && (
            <Button variant="outline" onClick={() => handleAction('request_incomplete')} disabled={actionLoading === 'request_incomplete' || !descriptionText.trim()} className="gap-2">
              {actionLoading === 'request_incomplete' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <AlertCircle className="h-4 w-4" />}
              Request More Info
            </Button>
          )}
        </ActionRow>
      </>
    )
  }
  if (isPatient && (appt.status === 'PENDING' || appt.status === 'INCOMPLETE')) {
    return (
      <ActionRow>
        <Button variant="outline" onClick={onCancelClick} disabled={actionLoading === 'cancel'} className="gap-2">
          {actionLoading === 'cancel' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
          Cancel Request
        </Button>
      </ActionRow>
    )
  }
  if (isPatient && (appt.status === 'COMPLETED' || appt.status === 'CONFIRMED')) {
    return (
      <>
        <div className="space-y-2">
          <Label>Follow-up description</Label>
          <Textarea className="min-h-[80px]" value={descriptionText} onChange={(e) => setDescriptionText(e.target.value)} placeholder="Describe your needs (follow-up: same doctor, same hospital)..." />
        </div>
        <ActionRow className="items-center">
          <Button onClick={() => handleAction('follow_up')} disabled={actionLoading === 'follow_up' || !descriptionText.trim() || insufficient} className="gap-2">
            {actionLoading === 'follow_up' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Follow Up
          </Button>
          <span className={`text-xs ${insufficient ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
            <DollarSign className="inline h-3 w-3 mr-0.5" />
            {insufficient ? 'Insufficient balance' : `BDT ${FOLLOW_UP_FEE}.00 fee`}
          </span>
        </ActionRow>
      </>
    )
  }
  return null
}

function ActionRow({ children, className }) {
  return <div className={`flex flex-wrap gap-2 pt-2 border-t ${className || ''}`}>{children}</div>
}

export default function AppointmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin, isPatient, updateUser } = useAuth()
  const [appt, setAppt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [descriptionText, setDescriptionText] = useState('')
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editText, setEditText] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const fetchAppt = () => {
    setLoading(true)
    setError(null)
    getAppointment(id)
      .then(({ data }) => {
        setAppt(data)
        setDescriptionText('')
      })
      .catch(() => setError('Appointment not found'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAppt() }, [id])

  const handleAction = async (action) => {
    setActionLoading(action)
    try {
      if (action === 'claim') await claimAppointment(id)
      else if (action === 'respond') await respondAppointment(id, { description: descriptionText })
      else if (action === 'request_incomplete') await requestIncomplete(id, { description: descriptionText })
      else if (action === 'confirm') await confirmAppointment(id)
      else if (action === 'reject') await rejectAppointment(id)
      else if (action === 'cancel') {
        await cancelAppointment(id)
        if (user) {
          const refundAmount = appt?.parent_request ? FEE / 2 : FEE
          const updatedBalance = parseFloat(user.balance) + refundAmount
          updateUser({ ...user, balance: updatedBalance.toString() })
        }
      }
      else if (action === 'complete') await completeAppointment(id)
      else if (action === 'follow_up') {
        const { data } = await followUpAppointment(id, { description: descriptionText })
        toast.success('Follow-up created')
        if (user) {
          const updatedBalance = Math.max(0, parseFloat(user.balance) - FOLLOW_UP_FEE)
          updateUser({ ...user, balance: updatedBalance.toString() })
        }
        navigate(`/appointments/${data.id}`)
        return
      }
      toast.success('Action completed')
      fetchAppt()
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${action}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleEditDescription = async () => {
    if (!editText.trim()) return
    try {
      await updateAppointment(id, { description: editText })
      toast.success('Description updated')
      setShowEditDialog(false)
      fetchAppt()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update')
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={fetchAppt} />
  if (!appt) return null

  const canEdit = isPatient && (appt.status === 'PENDING' || appt.status === 'INCOMPLETE')

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center gap-4">
        <h1 className="font-heading text-2xl font-bold">Appointment #{appt.id}</h1>
        <StatusBadge status={appt.status} />
      </div>

      <Card className="mt-6">
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Patient</p>
              <p className="font-medium">{appt.patient_full_name || appt.patient_email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="font-medium">{formatDate(appt.created_at)}</p>
            </div>
            <div className="sm:col-span-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{appt.description}</p>
                </div>
                {canEdit && (
                  <Button variant="outline" size="sm" className="gap-1 shrink-0" onClick={() => { setEditText(appt.description); setShowEditDialog(true) }}>
                    <Edit3 className="h-3 w-3" /> Edit
                  </Button>
                )}
              </div>
            </div>
            {appt.parent_request && (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Follow-up of</p>
                <button onClick={() => navigate(`/appointments/${appt.parent_request}`)} className="text-sm text-primary hover:underline">Appointment #{appt.parent_request}</button>
              </div>
            )}
          </div>

          <AppActions
            appt={appt}
            isAdmin={isAdmin}
            isPatient={isPatient}
            actionLoading={actionLoading}
            descriptionText={descriptionText}
            setDescriptionText={setDescriptionText}
            handleAction={handleAction}
            userBalance={parseFloat(user?.balance || 0)}
            onCancelClick={() => setShowCancelConfirm(true)}
          />
        </CardContent>
      </Card>

      {appt.response && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Response{isAdmin && appt.response?.admin_email ? ` (By ${appt.response.admin_email})` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="whitespace-pre-wrap text-sm">{appt.response.description}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(appt.response.created_at)}
                {appt.response.updated_at !== appt.response.created_at && ` (updated ${formatDate(appt.response.updated_at)})`}
              </p>
            </div>
            {isPatient && appt.status === 'RESPONDED' && (
              <div className="flex flex-wrap gap-2 mt-4">
                <Button onClick={() => handleAction('confirm')} disabled={actionLoading === 'confirm'} className="gap-2">
                  {actionLoading === 'confirm' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Confirm
                </Button>
                <Button variant="destructive" onClick={() => handleAction('reject')} disabled={actionLoading === 'reject'} className="gap-2">
                  {actionLoading === 'reject' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Reject
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Request</DialogTitle>
            <DialogDescription>Are you sure you want to cancel this appointment request? The mediation fee will be refunded to your balance.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-6 sm:pt-4">
            <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>Keep Request</Button>
            <Button variant="destructive" onClick={() => { setShowCancelConfirm(false); handleAction('cancel') }}>Yes, Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="space-y-6">
            <DialogHeader>
              <DialogTitle>Edit Description</DialogTitle>
              <DialogDescription>Update your appointment request description.</DialogDescription>
            </DialogHeader>
            <Textarea className="min-h-[120px]" value={editText} onChange={(e) => setEditText(e.target.value)} />
            <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEditDescription} disabled={!editText.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

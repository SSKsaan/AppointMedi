import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Mail, Phone, FileText, LogOut, DollarSign, Shield, Lock, Star, Camera, Plus, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useAuth } from '@/context/AuthContext'
import { getProfile, updateProfile } from '@/api/auth'
import { listReviews, createReview, deleteReview } from '@/api/reviews'
import api from '@/api/client'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

export default function Profile() {
  const { user, logout, updateUser, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')

  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [myReview, setMyReview] = useState(null)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSaving, setReviewSaving] = useState(false)

  const fileInputRef = useRef(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  useEffect(() => {
    getProfile()
      .then(({ data }) => {
        setFullName(data.full_name || '')
        setPhone(data.phone || '')
        setBio(data.bio || '')
        setPhotoPreview(data.photo || null)
        updateUser(data)
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false))

    if (!isAdmin) {
      listReviews({ ordering: '-created_at' })
        .then(({ data }) => {
          const uid = user?.id
          const found = (data.results || []).find((r) => r.user === uid)
          if (found) setMyReview(found)
        })
        .catch(() => {})
    }
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await updateProfile({ full_name: fullName, phone, bio })
      updateUser(data)
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    setPasswordError('')
    if (!oldPassword || !newPassword) {
      setPasswordError('Both fields are required')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters')
      return
    }
    setPasswordSaving(true)
    try {
      await api.post('/auth/password/change/', { old_password: oldPassword, new_password: newPassword })
      toast.success('Password changed')
      setShowPasswordDialog(false)
      setOldPassword('')
      setNewPassword('')
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Failed to change password')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('photo', file)
    try {
      const { data } = await api.patch('/auth/profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setPhotoPreview(data.photo)
      updateUser(data)
      toast.success('Photo updated')
    } catch {
      toast.error('Failed to upload photo')
    }
  }

  const handleReviewSave = async () => {
    if (reviewRating === 0) { toast.error('Select a rating'); return }
    setReviewSaving(true)
    try {
      if (myReview) {
        const { data } = await api.patch(`/reviews/${myReview.id}/`, { rating: reviewRating, comment: reviewComment })
        setMyReview(data)
        toast.success('Review updated')
      } else {
        const { data } = await createReview({ rating: reviewRating, comment: reviewComment })
        setMyReview(data)
        toast.success('Review submitted')
      }
      setShowReviewDialog(false)
    } catch (err) {
      toast.error(err.response?.data?.error || Object.values(err.response?.data || {}).flat().join('. ') || 'Failed to save review')
    } finally {
      setReviewSaving(false)
    }
  }

  const handleDeleteReview = async () => {
    if (!myReview) return
    try {
      await deleteReview(myReview.id)
      setMyReview(null)
      setShowReviewDialog(false)
      toast.success('Review deleted')
    } catch {
      toast.error('Failed to delete review')
    }
  }

  const handleLogout = async () => {
    await logout()
    setShowLogoutConfirm(false)
    navigate('/')
  }

  const openReviewDialog = () => {
    if (myReview) {
      setReviewRating(myReview.rating)
      setReviewComment(myReview.comment || '')
    } else {
      setReviewRating(0)
      setReviewComment('')
    }
    setShowReviewDialog(true)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 overflow-x-hidden">

      <div className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr]">
        {/* Sidebar */}
        <div className="min-w-0">
          <Card className="min-w-0 overflow-hidden">
            <CardContent className="flex flex-col items-center pt-6">
              <div className="relative">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-2 ring-primary/20">
                  {photoPreview && <AvatarImage src={photoPreview} className="object-cover w-full h-full rounded-full" />}
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1.5 text-white shadow hover:bg-primary/90">
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>
              <h2 className="mt-4 font-heading text-xl font-semibold">{user?.full_name || 'User'}</h2>
              <p className="text-sm text-muted-foreground truncate w-full text-center" title={user?.email}>{user?.email}</p>
              <div className="mt-2 flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {isAdmin ? 'Administrator' : 'Patient'}
              </div>
              <div className="mt-4 w-full space-y-3 text-sm">
                {!isAdmin && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Balance</span>
                  <span className="font-semibold">BDT {parseFloat(user?.balance || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                  <span className="text-muted-foreground shrink-0">Joined</span>
                  <span className="font-semibold text-xs sm:text-sm text-right leading-snug">{user?.created_at ? formatDate(user.created_at) : '-'}</span>
                </div>
              </div>

              {/* Review Section */}
              {!isAdmin && (
                <div className="mt-6 w-full border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold">Your Review</p>
                    <Button variant="ghost" size="sm" onClick={openReviewDialog}>
                      {myReview ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                  {myReview ? (
                    <div className="text-left">
                      <div className="flex justify-start gap-0.5 text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={i < myReview.rating ? 'fill-yellow-400' : 'text-muted-foreground/30'} size={14} />
                        ))}
                      </div>
                      {myReview.comment && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{myReview.comment}</p>}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center">No review yet. Click + to add one.</p>
                  )}
                </div>
              )}

              {isAdmin && (
                <a href={import.meta.env.VITE_API_URL?.replace('/api', '/admin/') || '/admin/'} target="_blank" rel="noopener noreferrer" className="mt-4 w-full">
                  <Button variant="outline" className="w-full gap-2">
                    <Shield className="h-4 w-4" /> Django Admin
                  </Button>
                </a>
              )}
              <Button variant="destructive" className="mt-4 w-full gap-2" onClick={() => setShowLogoutConfirm(true)}>
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="min-w-0">
          <Card className="border-0 shadow-none min-w-0 overflow-hidden">
            <CardContent className="pt-0">
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="field-tooltip-wrapper relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="name" className="pl-10" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                      <span className="field-tooltip">{fullName}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="field-tooltip-wrapper relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input id="email" className="pl-10" value={user?.email || ''} disabled />
                      <span className="field-tooltip">{user?.email}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <div className="field-tooltip-wrapper relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input id="phone" className="pl-10" placeholder="+8801XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
                      <span className="field-tooltip">{phone || '+8801XXXXXXXXX'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="balance">Balance</Label>
                    <div className="field-tooltip-wrapper relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="balance" className="pl-10" value={`BDT ${parseFloat(user?.balance || 0).toFixed(2)}`} disabled />
                      <span className="field-tooltip">BDT {parseFloat(user?.balance || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea id="bio" className="min-h-[100px] pl-10" placeholder="Tell us about yourself..." value={bio} onChange={(e) => setBio(e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-3 max-sm:flex-col max-sm:w-full">
                      <Button type="submit" disabled={saving} className="max-sm:w-full">
                        {saving ? 'Saving...' : 'Update Profile'}
                      </Button>
                  <Button type="button" variant="outline" className="gap-2 max-sm:w-full" onClick={() => { setPasswordError(''); setOldPassword(''); setNewPassword(''); setShowPasswordDialog(true) }}>
                    <Lock className="h-4 w-4" /> Change Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {passwordError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{passwordError}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="oldPassword">Current Password</Label>
              <Input id="oldPassword" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" placeholder="Min. 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
              <p className="text-xs text-muted-foreground text-left sm:mr-auto"><Link to="/forgot-password" onClick={() => window.scrollTo(0, 0)} className="text-primary hover:underline">Forgot Password?</Link></p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
              <Button onClick={handlePasswordChange} disabled={passwordSaving}>
                {passwordSaving ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>Are you sure you want to log out?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleLogout}>Logout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{myReview ? 'Edit Your Review' : 'Write a Review'}</DialogTitle>
            <DialogDescription>Rate your experience with AppointMedi</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Rating</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onClick={() => setReviewRating(s)} className="transition-transform hover:scale-110">
                    <Star size={28} className={s <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Comment (optional)</Label>
              <Textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Tell us about your experience..." />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>Cancel</Button>
            {myReview && <Button variant="destructive" onClick={handleDeleteReview}>Delete</Button>}
            <Button onClick={handleReviewSave} disabled={reviewSaving || reviewRating === 0}>
              {reviewSaving ? 'Saving...' : myReview ? 'Update' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

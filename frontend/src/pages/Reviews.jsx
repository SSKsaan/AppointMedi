import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Star, EyeOff, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import Pagination from '@/components/shared/Pagination'
import { listReviews, hideReview } from '@/api/reviews'
import { useAuth } from '@/context/AuthContext'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

const PAGE_SIZE = 10

export default function ReviewsPage() {
  const { user, isAdmin } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)

  if (!isAdmin) return <Navigate to="/" replace />

  const fetchReviews = () => {
    setLoading(true)
    setError(null)
    listReviews({ page, page_size: PAGE_SIZE, ordering: '-created_at' })
      .then(({ data }) => {
        setReviews(data.results || [])
        setCount(data.count || 0)
      })
      .catch(() => setError('Failed to load reviews'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchReviews() }, [page])

  const handleHide = async (id) => {
    try {
      const { data } = await hideReview(id)
      toast.success(data.hidden ? 'Review hidden from homepage' : 'Review visible on homepage')
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, hidden: data.hidden } : r))
    } catch {
      toast.error('Failed to toggle visibility')
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold">Manage Reviews</h1>
      <p className="mt-1 text-muted-foreground">Admin panel — view and moderate all platform reviews.</p>

      <div className="mt-8 space-y-4">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchReviews} />
        ) : reviews.length === 0 ? (
          <EmptyState message="No reviews yet" />
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className={review.hidden ? 'opacity-60' : ''}>
              <CardContent className="flex items-start gap-4 pt-6">
                <Avatar>
                  <AvatarFallback>{(review.user_full_name || review.user_email || 'U')[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{review.user_full_name || 'Anonymous'}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'} />
                      ))}
                    </div>
                  </div>
                  {review.comment && <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>}
                  {review.hidden && <p className="mt-1 text-xs text-muted-foreground">Hidden from homepage</p>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleHide(review.id)} title={review.hidden ? 'Show on homepage' : 'Hide from homepage'}>
                  {review.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>

              </CardContent>
            </Card>
          ))
        )}
        <Pagination count={count} page={page} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>
    </div>
  )
}

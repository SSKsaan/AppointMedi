import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Stethoscope, Shield, CreditCard, Clock, ArrowRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { listReviews } from '@/api/reviews'

const features = [
  { icon: Stethoscope, title: 'Find Specialists', desc: 'Submit requests and get matched with the right medical professionals.' },
  { icon: Shield, title: 'Verified Process', desc: 'Every appointment request is mediated and verified by our team.' },
  { icon: CreditCard, title: 'Transparent Fee', desc: `Fixed mediation fee of BDT ${import.meta.env.VITE_MEDIATION_FEE || 100}. No hidden charges.` },
  { icon: Clock, title: 'Quick Response', desc: 'Get responses from admins within 24 hours for most requests.' },
]

const stats = [
  { value: '1000+', label: 'Appointments Completed' },
  { value: '50+', label: 'Healthcare Partners' },
  { value: '99%', label: 'Satisfaction Rate' },
  { value: '6hrs', label: 'Average Response Time' },
]

export default function Home() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    listReviews({ ordering: '-created_at', hidden: 'false' })
      .then(({ data }) => setReviews(data.results || []))
      .catch(() => {})
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl flex-col items-center gap-8 px-4 py-16 sm:px-6 lg:flex-row lg:px-8">
          <div className="flex-1 text-center lg:text-left lg:pl-12">
            <div className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Get the Best Healthcare{' '}
              <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent animate-shimmer">
                Effortlessly
              </span>
            </div>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              No more searching through countless clinics or waiting on calls. Simply share a few details, and we will connect you with the best available medical help and book the appointment seamlessly.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              {user ? (
                <Link to={user.is_staff ? '/admin' : '/appointments'}>
                  <Button size="lg" className="gap-2">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" className="gap-2">
                      Get Started <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline" size="lg">Sign In</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex-1">
            <div className="relative mx-auto flex h-80 w-80 items-center justify-center sm:h-96 sm:w-96 lg:h-[550px] lg:w-[550px] lg:ml-8">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-cyan-300/20 blur-3xl" />
              <img src="/images/hero.png" alt="Appointment illustration" className="relative h-full w-full animate-wiggle rounded-2xl object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center group">
                <p className="font-heading text-3xl font-bold text-primary transition-all duration-300 group-hover:text-yellow-500 group-hover:drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold">How It Works</h2>
          <p className="mt-2 text-muted-foreground">Simple steps to get the care you need</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="border-0 bg-muted/30 text-center transition-transform duration-300 hover:scale-105">
              <CardContent className="pt-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {reviews.length > 0 && (
      <section className="bg-muted/30 py-20 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold">What Our Users Say</h2>
            <p className="mt-2 text-muted-foreground">Real reviews from real patients</p>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-background via-background/50 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-background via-background/50 to-transparent" />
            <div className="scroll-group flex gap-6 overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)' }}>
              {[0, 1].map((dup) => {
                const items = []
                for (let g = 0; g < 4; g++) {
                  for (let i = 0; i < reviews.length; i++) {
                    const review = reviews[i]
                    const name = review.user_full_name || (review.user_email ? review.user_email.split('@')[0] : 'Anonymous')
                    const censored = name.length > 5
                      ? name.slice(0, name.length - 5) + '*****'
                      : name[0] + '*'.repeat(name.length - 1)
                    items.push(
                      <div key={`${dup}-${g}-${i}`} className="w-72 shrink-0">
                        <Card className="h-full">
                          <CardContent className="pt-6">
                            <div className="flex gap-0.5 text-yellow-400 mb-3">
                              {[...Array(review.rating)].map((_, s) => <Star key={s} className="fill-yellow-400" size={16} />)}
                            </div>
                            {review.comment && <p className="text-sm text-muted-foreground line-clamp-3">{review.comment}</p>}
                            <p className="mt-4 text-xs font-medium">{censored}</p>
                          </CardContent>
                        </Card>
                      </div>
                    )
                  }
                }
                return (
                  <div key={dup} className={`flex gap-6 animate-scroll shrink-0`} {...(dup === 1 ? { 'aria-hidden': true } : {})}>
                    {items}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>
      )}

    </div>
  )
}

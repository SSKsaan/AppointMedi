import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="font-heading text-8xl font-bold text-primary">404</h1>
      <p className="mt-4 text-lg text-muted-foreground">Page not found</p>
      <p className="mt-1 text-sm text-muted-foreground">The page you are looking for doesn&apos;t exist or has been moved.</p>
      <Link to="/" className="mt-6">
        <Button className="gap-2"><Home className="h-4 w-4" /> Go Home</Button>
      </Link>
    </div>
  )
}

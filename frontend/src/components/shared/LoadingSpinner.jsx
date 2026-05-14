import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ size = 32 }) {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2
        className="animate-spin text-primary"
        style={{ width: size, height: size }}
      />
    </div>
  )
}

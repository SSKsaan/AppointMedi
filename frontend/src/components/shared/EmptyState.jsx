import { Inbox } from 'lucide-react'

export default function EmptyState({ message = 'No data found', description }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Inbox className="h-12 w-12 text-muted-foreground/50" />
      <p className="mt-4 text-sm font-medium">{message}</p>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
    </div>
  )
}

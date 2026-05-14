import { Star } from 'lucide-react'

export default function StarRating({ rating = 0, onChange, readonly = false, size = 16 }) {
  const stars = [1, 2, 3, 4, 5]

  return (
    <div className="flex items-center gap-0.5">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <Star
            size={size}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}
          />
        </button>
      ))}
    </div>
  )
}

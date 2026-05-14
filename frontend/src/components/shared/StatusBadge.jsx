import { STATUS_LABELS, STATUS_COLORS } from '@/lib/utils'

export default function StatusBadge({ status }) {
  if (!status) return null
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

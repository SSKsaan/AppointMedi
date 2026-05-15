import { useState, useEffect, useRef } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { subscribe } from '@/api/client'
import api from '@/api/client'

export default function BackendIndicator() {
  const [disconnected, setDisconnected] = useState(false)
  const [justConnected, setJustConnected] = useState(false)
  const prev = useRef(false)

  useEffect(() => subscribe((offline) => {
    if (prev.current && !offline) {
      setJustConnected(true)
      setTimeout(() => setJustConnected(false), 2000)
    }
    prev.current = offline
    setDisconnected(offline)
  }), [])

  useEffect(() => {
    api.get('/').catch(() => { setDisconnected(true); prev.current = true })
  }, [])

  useEffect(() => {
    if (!disconnected) return
    const id = setInterval(() => {
      api.get('/').catch(() => {}).then(() => {
        if (prev.current) {
          prev.current = false
          setDisconnected(false)
          setJustConnected(true)
          setTimeout(() => setJustConnected(false), 2000)
        }
      })
    }, 5000)
    return () => clearInterval(id)
  }, [disconnected])

  if (justConnected) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-xs text-green-700 shadow-lg backdrop-blur dark:bg-green-900/30 dark:text-green-400">
        <CheckCircle2 className="h-3 w-3" />
        Connected
      </div>
    )
  }

  if (!disconnected) return null

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-muted/80 px-3 py-1.5 text-xs text-muted-foreground shadow-lg backdrop-blur">
      <Loader2 className="h-3 w-3 animate-spin" />
      Connecting...
    </div>
  )
}
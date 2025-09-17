import React from 'react'
import apiClient from '@/services/apiClient.js'

const THROTTLE_MS = 6 * 60 * 60 * 1000 // 6 ore
const STORAGE_KEY = 'pv_last_sent_map'

// Cache in-memory per evitare doppi invii nella stessa sessione
const sentThisSession = new Set<string>()
// Evita doppi invii ravvicinati su mount/ricomposizioni
const inFlight = new Set<string>()

function loadMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveMap(map: Record<string, number>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)) } catch {}
}

type Props = {
  venueId: string
  matchId?: string
  children: React.ReactNode
  /** percentuale visibilità per scatenare il tracking (0..1) */
  threshold?: number
  /** margin per anticipare trigger (es: '0px 0px -20% 0px') */
  rootMargin?: string
}

const ProfileViewTracker: React.FC<Props> = ({ venueId, matchId, children, threshold = 0.25, rootMargin = '0px 0px -20% 0px' }) => {
  const ref = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!venueId) return
    const node = ref.current
    if (!node) return

    const key = matchId ? `${venueId}:${matchId}` : venueId
    const sendOnce = async (observer: IntersectionObserver, target: Element) => {
      if (sentThisSession.has(key) || inFlight.has(key)) { observer.unobserve(target); return }
      const map = loadMap()
      const last = map[key] || 0
      const now = Date.now()
      if (now - last < THROTTLE_MS) { sentThisSession.add(key); observer.unobserve(target); return }
      try {
        // debug log leggero
        console.debug('[PV] sending profile-view for venue:', venueId, 'match:', matchId)
        inFlight.add(key)
        await apiClient.post('/analytics/profile-view', { venueId, ...(matchId ? { matchId } : {}) })
        map[key] = now
        saveMap(map)
        sentThisSession.add(key)
        try { window.dispatchEvent(new CustomEvent('analytics:dirty')) } catch {}
      } catch (e) {
        console.warn('[PV] failed to send profile-view', e)
      } finally {
        inFlight.delete(key)
        observer.unobserve(target)
      }
    }

    const onIntersect: IntersectionObserverCallback = async (entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.intersectionRatio < threshold) continue
        // Debounce breve per evitare doppio fire da rimontaggi
        const tgt = entry.target
        const timer = setTimeout(() => { sendOnce(observer, tgt) }, 120)
        // Se necessario, potremmo cancellare timer on unobserve
      }
    }

    const observer = new IntersectionObserver(onIntersect, { root: null, threshold, rootMargin })
    observer.observe(node)

    // Fallback: se già visibile al mount, invia dopo un tick
    const r = node.getBoundingClientRect()
    const vh = window.innerHeight || document.documentElement.clientHeight
    if (r.top < vh * (1 - 0.2) && r.bottom > 0) {
      // già visibile per >~20% → debounce breve
      setTimeout(() => sendOnce(observer, node), 120)
    }
    return () => observer.disconnect()
  }, [venueId, matchId, threshold, rootMargin])

  return <div ref={ref} data-venue-id={venueId} data-match-id={matchId || ''}>{children}</div>
}

export default ProfileViewTracker



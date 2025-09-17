import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Info, MessageSquare } from 'lucide-react'
import { reviewsService } from '@/services'

function formatRelativeTime(input) {
  try {
    const date = new Date(input)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const sec = Math.round(diffMs / 1000)
    if (sec < 45) return 'adesso'
    const min = Math.round(sec / 60)
    if (min < 60) return min === 1 ? '1 minuto fa' : `${min} minuti fa`
    const hr = Math.round(min / 60)
    if (hr < 24) return hr === 1 ? '1 ora fa' : `${hr} ore fa`
    const day = Math.round(hr / 24)
    if (day < 30) return day === 1 ? '1 giorno fa' : `${day} giorni fa`
    const mon = Math.round(day / 30)
    if (mon < 12) return mon === 1 ? '1 mese fa' : `${mon} mesi fa`
    const yr = Math.round(mon / 12)
    return yr === 1 ? '1 anno fa' : `${yr} anni fa`
  } catch (e) {
    return ''
  }
}

function Stars({ value }) {
  return (
    <div className="flex items-center">
      {[1,2,3,4,5].map((i)=> (
        <svg key={i} viewBox="0 0 24 24" className={` ${i<=value? 'text-primary':'text-muted-foreground'} w-5 h-5 md:w-6 md:h-6`} fill="currentColor">
          <path d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.787 1.401 8.168L12 18.896l-7.335 3.87 1.401-8.168L.132 9.211l8.2-1.193z"/>
        </svg>
      ))}
    </div>
  )
}

function StarsAverage({ value }) {
  const full = Math.floor(value)
  return (
    <div className="flex items-center gap-1.5">
      {[1,2,3,4,5].map((i)=> (
        <svg key={i} viewBox="0 0 24 24" className={` ${i<=full? 'text-primary':'text-muted-foreground'} w-7 h-7 md:w-8 md:h-8`} fill="currentColor">
          <path d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.787 1.401 8.168L12 18.896l-7.335 3.87 1.401-8.168L.132 9.211l8.2-1.193z"/>
        </svg>
      ))}
    </div>
  )
}

function StarBar({ label, value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3 text-base">
      <div className="w-6 text-muted-foreground font-medium">{label}</div>
      <div className="h-3.5 md:h-4 bg-muted rounded w-full overflow-hidden">
        <div className="h-3.5 md:h-4" style={{ backgroundColor: 'hsl(var(--accent))', width: `${pct}%` }}></div>
      </div>
      <div className="w-6 text-right text-muted-foreground">{value}</div>
    </div>
  )
}

function ReviewRow({ r, onReply }) {
  return (
    <div className="py-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs text-foreground">{(r.customer?.name || 'U')[0]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-semibold text-foreground truncate">{r.customer?.name || 'Utente'}</div>
          </div>
          <div className="mt-1 flex items-center [&>svg]:w-5 [&>svg]:h-5 md:[&>svg]:w-6 md:[&>svg]:h-6">
            <Stars value={r.rating?.overall || r.rating || 0} />
            <span className="text-xs text-muted-foreground ml-2">{formatRelativeTime(r.createdAt)}</span>
          </div>
          <div className="mt-2 text-sm text-foreground/90">{r.content}</div>
        </div>
        <div className="pt-0.5 shrink-0">
          <Button size="sm" className="gap-1" aria-label="Rispondi" onClick={()=> onReply && onReply(r._id)}>
            <MessageSquare className="w-4 h-4"/>
          </Button>
        </div>
      </div>
      {r.response?.content && (
        <div className="mt-3 ml-12 pl-4 border-l-4" style={{ borderColor: 'hsl(var(--primary))' }}>
          <div className="text-sm font-semibold">Risposta del locale</div>
          <div className="text-base line-clamp-3 md:line-clamp-3">{r.response.content}</div>
        </div>
      )}
    </div>
  )
}

export default function Recensioni() {
  const [summary, setSummary] = React.useState({ total: 0, avg: 0, stars: { 1:0,2:0,3:0,4:0,5:0 } })
  const [items, setItems] = React.useState([])
  const [selectedStar, setSelectedStar] = React.useState(null)
  const [replyOpen, setReplyOpen] = React.useState(false)
  const [replyText, setReplyText] = React.useState('')
  const [replyingId, setReplyingId] = React.useState(null)

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const venueId = user?.venue?.id

  const load = React.useCallback(async (star = null) => {
    if (!venueId) return
    const s = await reviewsService.getSummary(venueId).then(r=>r.data)
    setSummary(s)
    const l = await reviewsService.getList(venueId, star ? { rating: star } : {}).then(r=>r.data.items)
    setItems(l)
  }, [venueId])

  React.useEffect(() => { load(selectedStar) }, [load, selectedStar])

  const maxStar = Math.max(...[5,4,3,2,1].map(k => (summary?.stars?.[k] ?? 0)))

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recensioni</h1>
          <div className="text-muted-foreground inline-block mt-1 rounded-full border px-3 py-0.5 text-sm">Totali: {summary.total}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="order-1 md:order-2 md:col-span-2 lg:col-span-2 sticky md:top-4 h-fit">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <StarsAverage value={summary.avg} />
              <div className="text-base md:text-lg font-semibold leading-none">{Number(summary.avg || 0).toFixed(1)}</div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <div className="mb-3 text-xs text-muted-foreground bg-muted rounded-md px-3 py-2 flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5" />
              <span className="block">Tocca una barra o le stelle per filtrare le recensioni.</span>
            </div>
            <div className="space-y-2 md:space-y-2.5">
              {[5,4,3,2,1].map((s) => (
                <div key={s} onClick={()=>setSelectedStar(s)} className={`cursor-pointer transition-all duration-200 rounded-md px-1 ${selectedStar===s?'bg-muted/40':'hover:bg-muted/30'}`} aria-pressed={selectedStar===s}>
                  <div className="flex items-center justify-between font-medium">
                    <div className="flex-1 min-w-0 font-semibold">
                      <StarBar label={s} value={summary.stars?.[s] || 0} max={maxStar} />
                    </div>
                    {selectedStar===s && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide rounded bg-accent/80 text-accent-foreground px-2 py-0.5">Attivo</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="order-2 md:order-1 md:col-span-3 lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 flex-wrap justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle>Tutte le recensioni</CardTitle>
                <span className="text-xs rounded-full bg-muted px-2 py-1">{items.length} recensioni</span>
                {selectedStar && (
                  <Button variant="outline" size="sm" aria-label={`Rimuovi filtro ${selectedStar} stelle`} onClick={()=>setSelectedStar(null)}>Filtro: {selectedStar} stelle <span className="ml-2">✕</span></Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {items.length === 0 && (
                <div className="py-6 text-sm text-muted-foreground">Nessuna recensione {selectedStar ? `con ${selectedStar} stelle` : ''}.</div>
              )}
              {items.map((r) => (
                <div key={r._id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <ReviewRow r={r} onReply={(id)=>{setReplyOpen(true); setReplyText(''); setReplyingId(id)}} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rispondi alla recensione</DialogTitle>
          </DialogHeader>
          <textarea value={replyText} onChange={(e)=>setReplyText(e.target.value)} className="w-full min-h-[120px] rounded-md border border-input bg-background p-3 text-sm" placeholder="Scrivi una risposta gentile e utile..." />
          <DialogFooter>
            <Button onClick={async()=>{ if(replyText.trim() && replyingId){ await reviewsService.postReply(replyingId, replyText.trim()); setReplyOpen(false); load(selectedStar); } }} disabled={!replyText.trim()}>Invia risposta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}



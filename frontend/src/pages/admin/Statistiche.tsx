import React from 'react'
import { TrendingUp, Eye, Users, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { analyticsService } from '@/services'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartEmptyOverlay, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Bar } from 'recharts'

type Period = '7days' | '30days' | '90days' | 'all'

function getRange(period: Period) {
  const to = new Date()
  const from = new Date(to)
  if (period === '7days') from.setDate(to.getDate() - 6)
  else if (period === '30days') from.setDate(to.getDate() - 29)
  else if (period === '90days') from.setDate(to.getDate() - 89)
  else from.setDate(to.getDate() - 29)
  return { from, to }
}

function formatRange(from: Date, to: Date) {
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
  return `${fmt(from)} – ${fmt(to)}`
}

const Statistiche = () => {
  const [period, setPeriod] = React.useState<Period>('7days')
  const [overview, setOverview] = React.useState<any>(null)
  const [top, setTop] = React.useState<any[]>([])
  const [globalTop, setGlobalTop] = React.useState<any[]>([])
  const [leagueFilter, setLeagueFilter] = React.useState<string|undefined>(undefined)
  const [series, setSeries] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState<boolean>(false)

  const venueId = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}')?.venue?.id || '' } catch { return '' }
  }, [])

  React.useEffect(() => {
    if (!venueId) return
    const { from, to } = getRange(period)
    const q = { from: from.toISOString(), to: to.toISOString() }
    ;(async () => {
      setLoading(true)
      try {
        const o = await analyticsService.getOverview(venueId, q).then((r:any)=> r.data)
        setOverview(o)
      } catch (e) {
        setOverview(null)
      }
      try {
        // Usa traffico per match attribuito al venue nel periodo
        const mt = await analyticsService.getVenueMatchTraffic(venueId, q).then((r:any)=> r.data?.items || [])
        // Mappa in un formato coerente con la UI attuale
        const t = (mt || []).map((it:any) => ({
          matchId: it.matchId,
          views: it.views || 0,
          clicks: it.clicks || 0,
          title: it.title || `Partita ${it.matchId}`,
          kickoff: it.kickoff || null,
          homeTeamLogo: it.homeTeamLogo || null,
          awayTeamLogo: it.awayTeamLogo || null,
        }))
        setTop(Array.isArray(t) ? t : [])
      } catch {
        setTop([])
      }
      try {
        const gt = await analyticsService.getTopMatchesGlobal({ limit: 5, ...q, global: true }).then((r:any)=> r.data?.items || r.data || [])
        setGlobalTop(Array.isArray(gt) ? gt : [])
      } catch {
        setGlobalTop([])
      }
      try {
        const viewsPoints = await analyticsService.getTimeseries(venueId, { metric: 'views', ...q }).then((r:any)=> r.data?.points || [])
        const clicksPoints = await analyticsService.getTimeseries(venueId, { metric: 'clicks', ...q }).then((r:any)=> r.data?.points || [])
        // normalizza per label (YYYY-MM-DD)
        const map: Record<string,{label:string, views:number, clicks:number}> = {}
        for (const v of viewsPoints) { const d=v.t; map[d]={ label:d, views:v.value||0, clicks:0 } }
        for (const c of clicksPoints) { const d=c.t; map[d]={ label:d, views:map[d]?.views||0, clicks:c.value||0 } }
        const arr = Object.values(map).sort((a,b)=>a.label.localeCompare(b.label))
        if (arr.length === 0) {
          // Fallback visivo: usa overview aggregata in un singolo punto per mostrare le barre
          setSeries([{ label: new Date().toISOString().slice(0,10), views: (overview?.views ?? 0), clicks: (overview?.clicks ?? 0) }])
        } else {
          setSeries(arr)
        }
      } catch {
        setSeries([])
      }
      setLoading(false)
    })()
  }, [venueId, period])

  // Auto-refresh on focus/visibility/custom event
  React.useEffect(() => {
    if (!venueId) return
    const handler = () => {
      const { from, to } = getRange(period)
      const q = { from: from.toISOString(), to: to.toISOString() }
      ;(async () => {
        try {
          const o = await analyticsService.getOverview(venueId, q).then((r:any)=> r.data)
          setOverview(o)
          const mt = await analyticsService.getVenueMatchTraffic(venueId, q).then((r:any)=> r.data?.items || [])
          const t = (mt || []).map((it:any) => ({
            matchId: it.matchId,
            views: it.views || 0,
            clicks: it.clicks || 0,
            title: it.title || `Partita ${it.matchId}`,
            kickoff: it.kickoff || null,
            homeTeamLogo: it.homeTeamLogo || null,
            awayTeamLogo: it.awayTeamLogo || null,
          }))
          setTop(Array.isArray(t) ? t : [])
          const gt = await analyticsService.getTopMatchesGlobal({ limit: 5, ...q, global: true }).then((r:any)=> r.data?.items || r.data || [])
          setGlobalTop(Array.isArray(gt) ? gt : [])
          // Aggiorna anche le timeseries per il grafico
          const viewsPoints = await analyticsService.getTimeseries(venueId, { metric: 'views', ...q }).then((r:any)=> r.data?.points || [])
          const clicksPoints = await analyticsService.getTimeseries(venueId, { metric: 'clicks', ...q }).then((r:any)=> r.data?.points || [])
          const map: Record<string,{label:string, views:number, clicks:number}> = {}
          for (const v of viewsPoints) { const d=v.t; map[d]={ label:d, views:v.value||0, clicks:0 } }
          for (const c of clicksPoints) { const d=c.t; map[d]={ label:d, views:map[d]?.views||0, clicks:c.value||0 } }
          const arr = Object.values(map).sort((a,b)=>a.label.localeCompare(b.label))
          setSeries(arr.length ? arr : [{ label: new Date().toISOString().slice(0,10), views: (o?.views ?? 0), clicks: (o?.clicks ?? 0) }])
        } catch {}
      })()
    }
    window.addEventListener('focus', handler)
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') handler() })
    window.addEventListener('analytics:dirty', handler as any)
    return () => {
      window.removeEventListener('focus', handler)
      window.removeEventListener('analytics:dirty', handler as any)
    }
  }, [venueId, period])

  const Content = () => (
    <div className="space-y-4">
          {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-primary/10 p-2"><Eye className="h-5 w-5 text-primary" /></div>
                  <div>
                <p className="font-racing text-xl">{loading ? '–' : new Intl.NumberFormat().format(overview?.views ?? 0)}</p>
                <p className="font-kanit text-xs text-muted-foreground">Visualizzazioni</p>
                  </div>
                </div>
              </CardContent>
            </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-primary/10 p-2"><TrendingUp className="h-5 w-5 text-primary" /></div>
                  <div>
                <p className="font-racing text-xl">{loading ? '–' : new Intl.NumberFormat().format(overview?.clicks ?? 0)}</p>
                <p className="font-kanit text-xs text-muted-foreground">Click</p>
                  </div>
                </div>
              </CardContent>
            </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-primary/10 p-2"><Users className="h-5 w-5 text-primary" /></div>
                  <div>
                <p className="font-racing text-xl">{loading ? '–' : new Intl.NumberFormat().format(overview?.bookings?.total ?? 0)}</p>
                <p className="font-kanit text-xs text-muted-foreground">Prenotazioni</p>
                  </div>
                </div>
              </CardContent>
            </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-primary/10 p-2"><Calendar className="h-5 w-5 text-primary" /></div>
                  <div>
                <p className="font-racing text-xl">{loading ? '–' : new Intl.NumberFormat().format(overview?.fixtures?.total ?? 0)}</p>
                <p className="font-kanit text-xs text-muted-foreground">Partite pubblicate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart Placeholder */}
      <Card className="bg-card relative">
            <CardHeader>
          <CardTitle className="font-racing text-xl">ANDAMENTO VISUALIZZAZIONI</CardTitle>
          {overview && (
            <div className="text-xs text-muted-foreground font-kanit">{formatRange(getRange(period).from, getRange(period).to)}</div>
          )}
            </CardHeader>
            <CardContent>
          {(() => {
            const { from, to } = getRange(period)
            // Genera serie vuota (0) per mantenere il layout del grafico quando non ci sono dati
            const days = Math.max(1, Math.round((+to - +from) / (24*60*60*1000)) + 1)
            const zeroSeries = Array.from({ length: days }, (_, i) => {
              const d = new Date(from)
              d.setDate(from.getDate() + i)
              return { label: d.toISOString().slice(0,10), views: 0, clicks: 0 }
            })
            const display = series.length > 0 ? series : zeroSeries
            const allZero = display.every(d => (d.views || 0) === 0 && (d.clicks || 0) === 0)
            return (
              <div className="relative">
                <ChartContainer config={{ views:{label:'Visualizzazioni profilo', color:'hsl(var(--chart-1))'}, clicks:{label:'Click profilo', color:'hsl(var(--chart-2))'} }} className="h-56 border rounded-md">
                  <ChartEmptyOverlay visible={allZero} message="Nessun dato nel periodo" />
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart accessibilityLayer data={display} margin={{ top: 12, right: 12, left: 12, bottom: 12 }} barSize={22} barGap={6} barCategoryGap="28%">
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" interval="preserveStartEnd" tickFormatter={(v:string)=>{ try{ const d=new Date(v); return d.toLocaleDateString(undefined,{day:'2-digit',month:'2-digit'}) }catch{return v} }} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickMargin={8} />
                      <YAxis tickCount={3} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 8 }} />
                      <Bar name="Visualizzazioni profilo" dataKey="views" radius={[6,6,6,6]} fill="var(--color-views)" />
                      <Bar name="Click profilo" dataKey="clicks" radius={[6,6,6,6]} fill="var(--color-clicks)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
                
              </div>
            )
          })()}
            </CardContent>
          </Card>

      {/* Top Performing Fixtures (Locale) */}
      <Card className="bg-card">
            <CardHeader>
          <CardTitle className="font-racing text-xl">PARTITE PIÙ VISUALIZZATE (attribuite al tuo profilo)</CardTitle>
            </CardHeader>
            <CardContent>
          <div className="space-y-3">
            {top.length === 0 && (
              <div className="rounded-md border p-3 text-sm text-muted-foreground">Nessun dato nel periodo selezionato.</div>
            )}
            {top.map((m:any, idx:number) => (
              <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
                <div className="min-w-0 flex items-center gap-3">
                  {m?.homeTeamLogo && <img src={m.homeTeamLogo} alt="" className="w-6 h-6 rounded" />}
                  {m?.awayTeamLogo && <img src={m.awayTeamLogo} alt="" className="w-6 h-6 rounded" />}
                  <div className="min-w-0">
                    <p className="truncate font-kanit font-semibold">{m?.title || 'Partita'}</p>
                    {m?.kickoff && (
                      <p className="font-kanit text-xs text-muted-foreground">{new Date(m.kickoff).toLocaleString()}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-racing text-base">{new Intl.NumberFormat().format(m?.views ?? 0)} visualizzazioni</p>
                  <p className="font-kanit text-xs text-green-600">{new Intl.NumberFormat().format(m?.clicks ?? 0)} click</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Matches Globali */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="font-racing text-xl">TREND GLOBALI – PARTITE PIÙ CLICCATE</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {globalTop.length === 0 && (
              <div className="rounded-md border p-3 text-sm text-muted-foreground">Nessun dato globale nel periodo.</div>
            )}
            {/* Filtro Lega */}
            <div className="flex items-center gap-2">
              <select
                value={leagueFilter || ''}
                onChange={(e)=>setLeagueFilter(e.target.value || undefined)}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="">Tutte le leghe</option>
                {[...new Set(globalTop.map((g:any)=>g?.league?.name).filter(Boolean))].map((lg:any)=> (
                  <option key={lg} value={lg}>{lg}</option>
                ))}
              </select>
                  </div>
            {(globalTop.filter((g:any)=> !leagueFilter || g?.league?.name===leagueFilter)).map((m:any, idx:number) => (
              <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
                <div className="min-w-0 flex items-center gap-3">
                  {m?.homeTeamLogo && <img src={m.homeTeamLogo} alt="" className="w-6 h-6 rounded" />}
                  <div className="min-w-0">
                    <p className="truncate font-kanit font-semibold">{m?.title || 'Partita'}</p>
                    <p className="font-kanit text-xs text-muted-foreground">{m?.league?.name || '–'}</p>
                    {m?.kickoff && (
                      <p className="font-kanit text-[10px] text-muted-foreground">{new Date(m.kickoff).toLocaleString()}</p>
                    )}
                  </div>
                  </div>
                  <div className="text-right">
                  <p className="font-racing text-base">{new Intl.NumberFormat().format(m?.clicks ?? 0)} click</p>
                </div>
              </div>
            ))}
              </div>
            </CardContent>
          </Card>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Time Filter Tabs (brand via token) */}
      <Tabs value={period} onValueChange={(v)=>setPeriod(v as Period)} className="w-full sticky top-[56px] z-30">
        <TabsList
          className="w-full flex flex-nowrap items-center gap-3 overflow-x-auto scrollbar-hide bg-muted rounded-3xl py-2 px-3 snap-x snap-mandatory"
          style={{
            paddingInline: 'calc(env(safe-area-inset-left) + 12px) calc(env(safe-area-inset-right) + 12px)',
            scrollPaddingInline: '24px',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {([
            {value:'7days',label:'7g',aria:'Ultimi 7 giorni'},
            {value:'30days',label:'30g',aria:'Ultimi 30 giorni'},
            {value:'90days',label:'90g',aria:'Ultimi 90 giorni'},
            {value:'all',label:'Tutto',aria:'Tutto il periodo'},
          ] as const).map(t => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              aria-label={t.aria}
              className="font-kanit rounded-full border text-[14px] leading-none px-5 py-2.5 data-[state=active]:bg-[hsl(var(--secondary))] data-[state=active]:outline data-[state=active]:outline-1 data-[state=active]:outline-[hsl(var(--primary))] border-[hsl(var(--ring))] text-[hsl(var(--primary))] whitespace-nowrap snap-center min-w-[72px]"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="7days"><Content /></TabsContent>
        <TabsContent value="30days"><Content /></TabsContent>
        <TabsContent value="90days"><Content /></TabsContent>
        <TabsContent value="all"><Content /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Statistiche;

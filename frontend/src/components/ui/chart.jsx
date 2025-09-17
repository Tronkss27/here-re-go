import * as React from "react"
import { Tooltip, Legend as ReLegend } from "recharts"
import { cn } from "@/utils"

// ChartContainer: sets CSS variables for series colors using config keys
// Usage: <ChartContainer config={{views:{label:'Views', color:'#22c55e'}}}>{...}</ChartContainer>
export function ChartContainer({ className, children, config = {} }) {
  const style = Object.keys(config).reduce((acc, key) => {
    acc[`--color-${key}`] = config[key]?.color || 'hsl(var(--chart-1))'
    return acc
  }, {})
  return (
    <div className={cn("w-full", className)} style={style}>
      {children}
    </div>
  )
}

// Tooltip wrapper to match shadcn signature
export function ChartTooltip(props) {
  return <Tooltip cursor={{ fill: 'hsl(var(--muted))', opacity: 0.35 }} {...props} />
}

export function ChartTooltipContent({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-xl border border-border bg-popover text-popover-foreground shadow-lg px-3 py-2 text-sm">
      <div className="font-medium mb-1">{label}</div>
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />
              <span className="text-muted-foreground">{p.name}</span>
            </div>
            <span className="font-medium">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChartLegend({ content, ...rest }) {
  // Recharts <Legend/> proxy so callers can pass our custom content (ESM safe)
  return <ReLegend content={content} {...rest} />
}

export function ChartLegendContent({ payload = [] }) {
  if (!payload.length) return null
  return (
    <div className="flex items-center gap-4 text-xs">
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// For TS parity docs, export an empty object as ChartConfig (JS projects can ignore)
export const ChartConfig = {}


// Optional overlay to show an empty-state inside a chart area
export function ChartEmptyOverlay({ visible, message = "Nessun dato" }) {
  if (!visible) return null
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="rounded-md border bg-background/85 px-3 py-2 text-xs text-muted-foreground shadow-sm">
        {message}
      </div>
    </div>
  )
}



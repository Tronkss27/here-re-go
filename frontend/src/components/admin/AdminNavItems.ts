import { LayoutDashboard, BarChart3, CalendarDays, Megaphone, Users, MessageSquare, Building2, Settings, LogOut, Tag } from 'lucide-react'

export type AdminNavItem = {
  label: string
  href: string
  Icon: any
}

export const adminNavItems: AdminNavItem[] = [
  { label: 'Dashboard', href: '/admin', Icon: LayoutDashboard },
  { label: 'Statistiche', href: '/admin/statistiche', Icon: BarChart3 },
  { label: 'Calendario', href: '/admin/calendario', Icon: CalendarDays },
  { label: 'Annunci', href: '/admin/annunci', Icon: Megaphone },
  { label: 'Offerte', href: '/admin/offers', Icon: Tag },
  { label: 'Prenotazioni', href: '/admin/prenotazioni', Icon: Users },
  { label: 'Recensioni', href: '/admin/recensioni', Icon: MessageSquare },
  { label: 'Profilo locale', href: '/admin/profilo', Icon: Building2 },
  { label: 'Impostazioni', href: '/admin/impostazioni', Icon: Settings },
  { label: 'Logout', href: '/logout', Icon: LogOut },
]



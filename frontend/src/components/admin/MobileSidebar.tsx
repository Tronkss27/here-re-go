import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/utils'
import { adminNavItems } from './AdminNavItems'

type MobileSidebarProps = {
  open: boolean
  onOpenChange: (v: boolean) => void
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ open, onOpenChange }) => {
  const location = useLocation()
  const navigate = useNavigate()

  const handleNavigate = (href: string) => {
    onOpenChange(false)
    if (href === '/logout') {
      // Solo navigazione; la logica di logout rimane fuori da qui
      navigate(href)
      return
    }
    if (location.pathname !== href) navigate(href)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/40" />
      <DialogContent className="fixed inset-y-0 left-0 right-auto top-0 h-full w-[320px] max-w-[85vw] translate-x-0 translate-y-0 rounded-none p-0 shadow-xl data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left">
        <div className="flex h-full flex-col" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}>
          <div className="px-4 pb-3">
            <h2 className="font-racing text-2xl">Menu</h2>
          </div>
          <Separator />
          <nav className="flex-1 overflow-y-auto">
            <ul className="py-2">
              {adminNavItems.map(({ label, href, Icon }) => {
                const isActive = location.pathname === href
                return (
                  <li key={href}>
                    <button
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-3 text-left text-sm',
                        isActive ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-muted'
                      )}
                      onClick={() => handleNavigate(href)}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-kanit">{label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
          <div className="px-4 pb-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} BarMatch</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default MobileSidebar



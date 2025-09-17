import React from 'react'
import { Menu } from 'lucide-react'
import { cn } from '@/utils'

type AdminTopBarProps = {
  title?: string
  onOpenSidebar: () => void
  rightSlot?: React.ReactNode
  className?: string
}

const AdminTopBar: React.FC<AdminTopBarProps> = ({ title, onOpenSidebar, rightSlot, className }) => {
  return (
    <div
      className={cn(
        'sticky top-0 z-40 flex items-center justify-between border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}
    >
      <button aria-label="Apri menu" className="p-3" onClick={onOpenSidebar}>
        <Menu className="h-6 w-6" />
      </button>
      <div className="flex-1 truncate px-1">
        {title && <h1 className="text-center font-racing text-xl leading-tight">{title}</h1>}
      </div>
      <div className="min-w-[48px] px-2 py-2 text-right">{rightSlot}</div>
    </div>
  )
}

export default AdminTopBar



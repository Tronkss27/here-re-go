import React from 'react'
import MobileSidebar from '@/components/admin/MobileSidebar'
import AdminTopBar from '@/components/admin/AdminTopBar'

type AdminLayoutProps = {
  title?: string
  children: React.ReactNode
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ title, children }) => {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="min-h-screen w-full">
      <AdminTopBar title={title} onOpenSidebar={() => setOpen(true)} />
      <MobileSidebar open={open} onOpenChange={setOpen} />
      <main className="mx-auto w-full max-w-screen-sm" style={{ padding: '12px 16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
        {children}
      </main>
    </div>
  )
}

export default AdminLayout



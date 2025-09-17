import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  House, 
  Calendar, 
  BarChart3, 
  User, 
  Settings,
  Menu,
  X,
  Eye,
  CalendarCheck,
  Tag,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import MobileSidebar from '@/components/admin/MobileSidebar';
import AdminTopBar from '@/components/admin/AdminTopBar';
import { adminNavItems } from '@/components/admin/AdminNavItems';
import { useAuth } from '@/contexts/AuthContext';
import { venueProfileService } from '@/services/venueService';

const AdminLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [venueName, setVenueName] = useState('');
  const [isCreatingVenue, setIsCreatingVenue] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      const profile = venueProfileService.getProfile(user.id);
      if (profile?.name) {
        setVenueName(profile.name);
      } else if (user?.venue?.name) {
        setVenueName(user.venue.name);
      } else {
        setVenueName('Il Tuo Locale');
      }
    }
  }, [user]);

  // Utility per ottenere il tenantId corretto dall'utente
  const getTenantId = (): string => {
    // ✅ FIX: Usa il tenantId dell'utente, non il suo ID
    if (user?.tenantId) {
      console.log('✅ Using user.tenantId:', user.tenantId);
      return user.tenantId;
    }
    
    // Fallback per compatibilità con utenti vecchi
    if (user?.id) {
      console.warn('⚠️ Using user.id as fallback tenantId:', user.id);
      return user.id;
    }
    
    console.error('❌ No tenantId found in user object');
    return '';
  };

  const handleViewPublicProfile = async () => {
    setIsCreatingVenue(true);
    console.log('🔍 Verifying venue profile...');

    try {
      const tenantId = getTenantId();
      if (!tenantId) {
        alert('❌ Errore: tenantId non trovato. Rifare il login.');
        setIsCreatingVenue(false);
        return;
      }

      // ✅ FIX: Usa venueId dell'utente invece del tenantId per l'accesso pubblico
      let venueId = user?.venue?._id || user?.venue?.id;
      
      if (!venueId) {
        console.log('🔍 Venue ID not in user object, trying to fetch from API...');
        
        // Fallback: cerca il venue tramite API usando tenantId
        const venueResponse = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'x-tenant-id': tenantId
          }
        });
        
        if (venueResponse.ok) {
          const responseData = await venueResponse.json();
          console.log('🔍 API Response from /api/auth/me:', responseData);
          
          // 🔧 FIX: L'endpoint restituisce {success: true, user: {venueId: ...}}
          venueId = responseData.user?.venueId?._id || responseData.user?.venueId?.id || responseData.user?.venueId;
          console.log('✅ Found venue ID from API:', venueId);
        }
      }

      if (!venueId) {
        alert('❌ Venue non trovato. Completa prima l\'onboarding del locale.');
        setIsCreatingVenue(false);
        return;
      }

      console.log('🔍 Verifying venue exists:', { venueId, tenantId });

      // Verifica che il venue esista ed è accessibile pubblicamente
      const response = await fetch(`/api/venues/public/${venueId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
          // NON includere x-tenant-id per accesso pubblico
        }
      });

      if (!response.ok) {
        console.error('❌ Venue verification failed:', response.status, response.statusText);
        alert(`❌ Venue non trovato (${response.status}). Verifica che il profilo sia stato completato correttamente.`);
        setIsCreatingVenue(false);
        return;
      }
    
    const venueData = await response.json();
    console.log('✅ Venue verification successful:', {
      venueId: venueData._id,
      venueName: venueData.name,
      tenantId: venueData.tenantId
    });
    
    // Apri la pagina pubblica del venue (senza header tenant, per accesso pubblico)
    const publicUrl = `${window.location.origin}/locale/${venueId}`;
    console.log('🌐 Opening public profile URL:', publicUrl);
    
    // Safari-friendly: Usa location.href invece di window.open per evitare blocco popup
    if (confirm('🔗 Aprire il profilo pubblico del locale? (Si aprirà in questa finestra)')) {
      window.location.href = publicUrl;
    }
    
  } catch (error) {
    console.error('❌ Error in handleViewPublicProfile:', error);
    alert('❌ Errore durante la verifica del profilo. Riprova più tardi.');
  } finally {
    setIsCreatingVenue(false);
  }
};

const menuItems = [
  { icon: House, label: 'HOME', path: '/admin' },
  { icon: Calendar, label: 'CALENDARIO PARTITE', path: '/admin/calendario' },
  { icon: CalendarCheck, label: 'PRENOTAZIONI', path: '/admin/bookings' },
  { icon: Tag, label: 'GESTIONE OFFERTE', path: '/admin/offers' },
  { icon: BarChart3, label: 'STATISTICHE', path: '/admin/statistiche' },
  { icon: User, label: 'PROFILO', path: '/admin/profilo' },
  { icon: Settings, label: 'ACCOUNT', path: '/admin/account' }
];

const currentPageTitle = () => {
  const currentItem = menuItems.find(item => item.path === location.pathname);
  return currentItem ? currentItem.label : 'ADMIN';
};

return (
  <div className="flex min-h-screen flex-col md:flex-row">
    {/* Top bar + Mobile sidebar */}
    <div className="md:hidden sticky top-0 z-40 w-full">
      <AdminTopBar title={currentPageTitle()} onOpenSidebar={() => setMobileOpen(true)} />
      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />
    </div>

    {/* Desktop sidebar (nuova, no classi legacy) */}
    <aside className="admin-rail hidden md:flex md:w-72 lg:w-80 shrink-0 flex-col border-r bg-background" style={{ position: 'sticky', top: 0, height: '100vh' }}>
      <div className="flex items-center justify-between px-4 py-4">
        <div className="text-xl font-special">🏆 SPOrTS</div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {adminNavItems.map(({ href, label, Icon }) => (
          <NavLink
            key={href}
            to={href}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-[15px] ${isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'}`
            }
          >
            <Icon className="h-5 w-5" />
            <span className="font-kanit">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-3 pb-4">
        <Button onClick={handleViewPublicProfile} disabled={isCreatingVenue} variant="outline" className="w-full">
          <Eye size={16} className="mr-2" />
          Visualizza Profilo Pubblico
          <ExternalLink size={14} className="ml-2" />
        </Button>
      </div>
    </aside>

    {/* Main Content */}
    <div className="flex-1 w-full">
      <div className="mx-auto w-full max-w-screen-md p-4 md:p-6" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
        <Outlet />
      </div>
    </div>
  </div>
);
};

export default AdminLayout;

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
import { useAuth } from '@/contexts/AuthContext';
import { venueProfileService } from '@/services/venueService';

const AdminLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
  <div className="admin-layout">
    {/* Sidebar */}
    <div className={`admin-sidebar ${sidebarCollapsed ? '' : 'open'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-xl font-special text-white">
            🏆 SPOrTS
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="text-white hover:bg-white/10 md:hidden"
        >
          {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
        </Button>
      </div>

      <nav className="mt-8 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-link flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-white/10 text-white font-medium active' 
                  : 'text-white/80 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Public Profile Link */}
      <div className="absolute bottom-6 left-6 right-6">
        <Button
          onClick={handleViewPublicProfile}
          disabled={isCreatingVenue}
          className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20"
          variant="outline"
        >
          <Eye size={16} className="mr-2" />
          Visualizza Profilo Pubblico
          <ExternalLink size={14} className="ml-2" />
        </Button>
      </div>
    </div>

    {/* Main Content */}
    <div className="admin-main">
      <Outlet />
    </div>
  </div>
);
};

export default AdminLayout;

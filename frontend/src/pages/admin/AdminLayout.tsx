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

  // Utility per generare tenantId univoco dall'user ID
  const generateTenantId = (userId: string): string => {
    if (!userId) {
      console.error('❌ Cannot generate tenantId: userId is missing');
      return '';
    }
    // Generiamo un tenantId deterministico dall'ID utente
    // Nel backend, durante la registrazione, viene usato lo stesso algoritmo
    return userId; // Per ora semplice: tenantId = userId
  };

  const handleViewPublicProfile = async () => {
    try {
      setIsCreatingVenue(true);
      
      console.log('🕵️‍♂️ [DEBUG] User context at handleViewPublicProfile:', {
        userId: user?.id,
        venueId: user?.venueId,
        venue: user?.venue,
        email: user?.email
      });
      
      // STRATEGIA SEMPLIFICATA: Usa solo il venue associato all'user
      let venueId = user?.venueId || user?.venue?.id || user?.venue?._id;

      if (!venueId) {
        console.error('❌ No venue associated with this user');
        alert('❌ Nessun locale associato a questo account. Completa prima la registrazione.');
        setIsCreatingVenue(false);
        return;
      }
      
      console.log('✅ Found venue ID from user context:', venueId);
      
      // Genera tenantId dall'user ID
      const tenantId = generateTenantId(user?.id);
      if (!tenantId) {
        console.error('❌ Cannot generate tenantId from user ID');
        alert("❌ Errore nell'identificazione del tenant. Riprova il login.");
        setIsCreatingVenue(false);
        return;
      }
      
      console.log('🏢 Generated tenantId:', tenantId);
      
      // Verifica che il venue esista nel database con tenant-aware query
      console.log('🔍 Verifying venue exists with tenant-aware query...');
      const response = await fetch(`/api/venues/${venueId}`, {
        method: 'GET',
            headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId // AGGIUNTO: Header tenant per query tenant-aware
            }
          });
      
      console.log('📡 Venue verification response status:', response.status);

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
      const publicUrl = `${window.location.origin}/venue/${venueId}`;
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
    <div className="min-h-screen flex w-full bg-fanzo-light-bg">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        sidebarCollapsed ? 'w-18' : 'w-60'
      } h-screen fixed left-0 top-0 z-40`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!sidebarCollapsed && (
            <h2 className="font-racing text-lg text-fanzo-dark">BARMATCH ADMIN</h2>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center space-x-3 p-3 rounded-lg transition-colors group ${
                  sidebarCollapsed ? 'justify-center' : ''
                } ${
                  isActive 
                    ? 'bg-fanzo-yellow text-fanzo-dark border-l-4 border-fanzo-teal' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-fanzo-dark'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {!sidebarCollapsed && (
                <span className="font-kanit font-semibold text-sm uppercase tracking-wide">
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-18' : 'ml-60'
      }`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
          <h1 className="font-racing text-2xl text-fanzo-dark">
            BENVENUTO, {venueName.toUpperCase()}!
          </h1>
          <Button
            onClick={handleViewPublicProfile}
            disabled={isCreatingVenue}
            variant="outline"
            className="border-fanzo-teal text-fanzo-teal hover:bg-fanzo-teal hover:text-white disabled:opacity-50"
          >
            {isCreatingVenue ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-fanzo-teal mr-2"></div>
                Creazione...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Visualizza Profilo Pubblico
              </>
            )}
          </Button>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

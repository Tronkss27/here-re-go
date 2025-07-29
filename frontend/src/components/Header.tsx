import { useState } from 'react';
import { Search, User, X, Menu, CalendarCheck, LogOut, LogIn, UserPlus, Building2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const navigationItems = [
    { label: 'Partite', href: '/' },
    { label: 'Locali', href: '/locali' },
    { label: 'App', href: '/app' },
    { label: 'Guida TV', href: '/guida-tv' },
    { label: 'Chi Siamo', href: '/chi-siamo' }
  ];

  const handleAuthAction = (action: 'logout' | 'my-bookings' | 'admin' | 'profile') => {
    setIsMenuOpen(false);
    
    if (action === 'logout') {
      logout();
      navigate('/');
    } else if (action === 'my-bookings') {
      navigate('/my-bookings');
    } else if (action === 'admin') {
      navigate('/admin');
    } else if (action === 'profile') {
      navigate('/profile');
    }
  };

  return (
    <header className="header sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-16 lg:h-16">
          {/* Mobile hamburger menu */}
          <button
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-md transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            {isMenuOpen ? (
              <X size={24} className="text-white" />
            ) : (
              <Menu size={24} className="text-white" />
            )}
          </button>

          {/* Logo - Verde con accento */}
          <div className="logo flex items-center">
            <h1 className="text-2xl md:text-3xl font-special">
              🏆 SPOrTS
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-white hover:text-green-300 transition-colors font-medium"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Search & Auth Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-white hover:bg-white/10 rounded-md transition-colors"
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <span className="text-white text-sm">
                    Ciao, {user?.name || 'Utente'}!
                  </span>
                  
                  {user?.isVenueOwner && (
                    <Button
                      onClick={() => handleAuthAction('admin')}
                      size="sm"
                      className="btn-accent"
                    >
                      <CalendarCheck size={16} className="mr-1" />
                      Admin
                    </Button>
                  )}

                  <Button
                    onClick={() => handleAuthAction('logout')}
                    variant="outline"
                    size="sm"
                    className="text-white border-white hover:bg-white hover:text-gray-900"
                  >
                    <LogOut size={16} className="mr-1" />
                    Esci
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  {/* 🎯 BOTTONE VENUE OWNERS - Con icona distintiva */}
                  <Button
                    onClick={() => navigate('/sports-login')}
                    size="sm"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-4 py-2 flex items-center space-x-2"
                  >
                    <Building2 size={16} />
                    <span>Accedi come Locale</span>
                  </Button>

                  {/* 🎯 BOTTONE CLIENT/USERS - Con icona distintiva */}
                  <Button
                    onClick={() => navigate('/client-login')}
                    size="sm"
                    variant="outline"
                    className="text-white border-white hover:bg-white hover:text-gray-900 px-4 py-2 flex items-center space-x-2"
                  >
                    <Users size={16} />
                    <span>Accedi come Cliente</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile User Menu */}
            <div className="md:hidden">
              <button
                className="p-2 text-white hover:bg-white/10 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="User menu"
              >
                <User size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {isSearchOpen && (
          <div className="py-4 border-t border-white/20">
            <div className="relative">
              <Input
                type="text"
                placeholder="Cerca squadre, competizioni e locali"
                className="w-full bg-white/10 border-white/20 text-white placeholder-white/70 focus:bg-white/20"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70" size={20} />
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/20">
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-2 text-white hover:bg-white/10 rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            
            <div className="mt-4 pt-4 border-t border-white/20 space-y-2">
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-2 text-white text-sm">
                    Ciao, {user?.name || 'Utente'}!
                  </div>
                  
                  {user?.isVenueOwner && (
                    <button
                      onClick={() => handleAuthAction('admin')}
                      className="w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded-md transition-colors flex items-center"
                    >
                      <CalendarCheck size={16} className="mr-2" />
                      Admin Panel
                    </button>
                  )}

                  <button
                    onClick={() => handleAuthAction('logout')}
                    className="w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded-md transition-colors flex items-center"
                  >
                    <LogOut size={16} className="mr-2" />
                    Esci
                  </button>
                </>
              ) : (
                <>
                  {/* 🎯 ACCESSO LOCALE - Con icona distintiva */}
                  <button
                    onClick={() => navigate('/sports-login')}
                    className="w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-md transition-colors flex items-center text-sm border-b border-white/10"
                  >
                    <Building2 size={16} className="mr-3" />
                    <div>
                      <div className="font-medium">Accedi come Locale</div>
                      <div className="text-xs text-white/70">Gestisci il tuo sport bar</div>
                    </div>
                  </button>

                  {/* 🎯 ACCESSO CLIENTE - Con icona distintiva */}
                  <button
                    onClick={() => navigate('/client-login')}
                    className="w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-md transition-colors flex items-center text-sm"
                  >
                    <Users size={16} className="mr-3" />
                    <div>
                      <div className="font-medium">Accedi come Cliente</div>
                      <div className="text-xs text-white/70">Trova locali per le partite</div>
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

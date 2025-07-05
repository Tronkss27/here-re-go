import { useState } from 'react';
import { Search, User, X, Menu, CalendarCheck, LogOut, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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

  const handleAuthAction = (action: 'login' | 'register' | 'logout' | 'my-bookings' | 'admin' | 'profile') => {
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
    } else {
      navigate(`/${action}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-fanzo-yellow shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-16 lg:h-16">
          {/* Mobile hamburger menu */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-fanzo-dark" />
            ) : (
              <Menu className="h-6 w-6 text-fanzo-dark" />
            )}
          </button>

          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <h1 className="text-2xl md:text-3xl font-racing text-fanzo-dark tracking-tight font-bold">
              BARMATCH
            </h1>
          </div>

          {/* Search and Auth */}
          <div className="flex items-center space-x-4">
            {/* Desktop Search */}
            <div className="hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search teams, competitions and venues"
                  className="pl-10 w-80 lg:w-96 bg-white border-none rounded-full"
                />
              </div>
            </div>

            {/* Mobile Search Toggle */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Cerca"
            >
              <Search className="h-5 w-5 text-fanzo-dark" />
            </button>

            {/* Auth Section */}
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-2">
                {/* User Bookings Button - Desktop */}
                <Button 
                  variant="outline"
                  className="hidden md:flex items-center gap-2 border-fanzo-teal text-fanzo-teal hover:bg-fanzo-teal hover:text-white font-kanit font-semibold rounded-full px-4"
                  onClick={() => handleAuthAction('my-bookings')}
                >
                  <CalendarCheck className="h-4 w-4" />
                  Le mie prenotazioni
                </Button>

                {/* User Menu - Desktop */}
                <div className="hidden md:flex items-center space-x-2">
                  <span className="text-fanzo-dark font-kanit font-medium">
                    Ciao, {user.name}
                  </span>
                  
                  {/* Accesso appropriato basato sul ruolo */}
                  {user.role === 'venue_owner' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-fanzo-teal text-fanzo-teal hover:bg-fanzo-teal hover:text-white font-kanit rounded-full"
                      onClick={() => handleAuthAction('admin')}
                    >
                      Admin
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-fanzo-teal text-fanzo-teal hover:bg-fanzo-teal hover:text-white font-kanit rounded-full"
                      onClick={() => handleAuthAction('profile')}
                    >
                      Profilo
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-kanit rounded-full"
                    onClick={() => handleAuthAction('logout')}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>

                {/* Mobile User Indicator */}
                <div className="md:hidden">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-fanzo-teal rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Not Authenticated - New Dual Access */
              <div className="flex items-center space-x-4">
                {/* Desktop Auth Buttons */}
                <div className="hidden md:flex items-center space-x-6">
                  {/* Tifoso Access */}
                  <div className="text-center">
                    <p className="text-xs text-fanzo-dark mb-1 font-kanit font-medium">Tifoso?</p>
                    <Button 
                      className="bg-blue-500 hover:bg-blue-600 text-white font-kanit font-semibold rounded-full px-4 py-1 text-sm"
                      onClick={() => window.location.href = '/client-login'}
                    >
                      Accedi
                    </Button>
                  </div>

                  <div className="h-8 w-px bg-gray-300"></div>

                  {/* Sports/Venue Access */}
                  <div className="text-center">
                    <Button 
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-kanit font-semibold rounded-full px-4 py-2"
                      onClick={() => window.location.href = '/sports-login'}
                    >
                      🚀 Accesso SPOrTS
                    </Button>
                  </div>
                </div>

                {/* Mobile Auth Button */}
                <Button 
                  className="md:hidden bg-fanzo-teal hover:bg-fanzo-teal/90 text-white font-kanit font-semibold rounded-full px-4"
                  onClick={() => handleAuthAction('login')}
                >
                  <User className="h-4 w-4 mr-2" />
                  Accedi
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="md:hidden py-4 border-t border-fanzo-teal/20 animate-fade-in">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search teams, competitions and venues"
                className="pl-10 w-full bg-white border-none rounded-full"
                autoFocus
              />
              <button
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setIsSearchOpen(false)}
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-fanzo-teal/20 animate-fade-in">
            <nav className="flex flex-col space-y-4">
              {navigationItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-fanzo-dark hover:text-fanzo-teal font-kanit font-medium transition-colors duration-200 py-2 text-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              
              {/* Mobile Auth Actions */}
              {isAuthenticated && user ? (
                <div className="border-t border-fanzo-teal/20 pt-4 space-y-3">
                  <div className="text-fanzo-dark font-kanit font-medium">
                    Ciao, {user.name}
                  </div>
                  
                  <button
                    className="flex items-center gap-2 text-fanzo-teal hover:text-fanzo-dark font-kanit font-medium transition-colors duration-200 py-2 text-lg w-full text-left"
                    onClick={() => handleAuthAction('my-bookings')}
                  >
                    <CalendarCheck className="h-5 w-5" />
                    Le mie prenotazioni
                  </button>
                  
                  {user.role === 'admin' && (
                    <button
                      className="flex items-center gap-2 text-fanzo-teal hover:text-fanzo-dark font-kanit font-medium transition-colors duration-200 py-2 text-lg w-full text-left"
                      onClick={() => handleAuthAction('admin')}
                    >
                      <User className="h-5 w-5" />
                      Pannello Admin
                    </button>
                  )}
                  
                  <button
                    className="flex items-center gap-2 text-red-500 hover:text-red-600 font-kanit font-medium transition-colors duration-200 py-2 text-lg w-full text-left"
                    onClick={() => handleAuthAction('logout')}
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="border-t border-fanzo-teal/20 pt-4 space-y-3">
                  <button
                    className="flex items-center gap-2 text-fanzo-teal hover:text-fanzo-dark font-kanit font-medium transition-colors duration-200 py-2 text-lg w-full text-left"
                    onClick={() => handleAuthAction('login')}
                  >
                    <LogIn className="h-5 w-5" />
                    Accedi
                  </button>
                  <button
                    className="flex items-center gap-2 text-fanzo-teal hover:text-fanzo-dark font-kanit font-medium transition-colors duration-200 py-2 text-lg w-full text-left"
                    onClick={() => handleAuthAction('register')}
                  >
                    <UserPlus className="h-5 w-5" />
                    Registrati
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

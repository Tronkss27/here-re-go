import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ModalProvider } from './contexts/ModalContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PublicRoute from './components/PublicRoute.jsx';
import VenueProtectedRoute from './components/VenueProtectedRoute.jsx';
import OnboardingProtectedRoute from './components/OnboardingProtectedRoute.jsx';

// Core components that should load immediately
import { performanceMonitor } from './utils/performance.js';

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-sports-white to-sports-medium flex items-center justify-center">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sports-primary mx-auto mb-4"></div>
      <p className="text-sports-dark font-medium">Caricamento...</p>
    </div>
  </div>
);

// Lazy-loaded pages for better performance
const ClientLogin = React.lazy(() => import('./pages/ClientLogin'));
const ClientRegister = React.lazy(() => import('./pages/ClientRegister'));
const SportsLogin = React.lazy(() => import('./pages/SportsLogin'));
const SportsRegister = React.lazy(() => import('./pages/SportsRegister'));
const UserProfile = React.lazy(() => import('./pages/UserProfile'));

// BarMatch Pages Integration - Lazy loaded
const Index = React.lazy(() => import('./pages/Index'));
const Locali = React.lazy(() => import('./pages/Locali'));
const VenueDetail = React.lazy(() => import('./pages/VenueDetail'));

const NotFound = React.lazy(() => import('./pages/NotFound'));

// BarMatch Admin Pages - Lazy loaded
const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const CalendarioPartite = React.lazy(() => import('./pages/admin/CalendarioPartite'));
const Statistiche = React.lazy(() => import('./pages/admin/Statistiche'));
const ProfiloLocale = React.lazy(() => import('./pages/admin/ProfiloLocale'));
const AccountSettings = React.lazy(() => import('./pages/admin/AccountSettings'));
const BookingsManagement = React.lazy(() => import('./pages/admin/BookingsManagement'));
const OffersManagement = React.lazy(() => import('./pages/admin/OffersManagement'));
const VenueOnboarding = React.lazy(() => import('./pages/admin/VenueOnboarding'));

// Admin pages
const Recensioni = React.lazy(() => import('./pages/admin/Recensioni'));

// User Booking Pages - Lazy loaded
const MyBookings = React.lazy(() => import('./pages/MyBookings'));
const Teams = React.lazy(() => import('./pages/Teams'));
const Favorites = React.lazy(() => import('./pages/Favorites'));

// RouteHandler per distinguere match vs venue ID
const RouteHandler = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  React.useEffect(() => {
    // Se l'ID è un MongoDB ObjectId (24 caratteri hex), reindirizza a /locale/
    if (id && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
      navigate(`/locale/${id}`, { replace: true });
    }
  }, [id, navigate]);
  
  // Altrimenti è un match ID, mostra Locali
  return <Locali />;
};

import './App.css'
import './styles/design-system.css'

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-200 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <h1 className="text-2xl font-bold text-red-800 mb-4">
              Oops! Qualcosa è andato storto
            </h1>
            <p className="text-red-600 mb-6">
              Si è verificato un errore inaspettato. Per favore ricarica la pagina.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Ricarica Pagina
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function App() {
  // Initialize performance monitoring
  useEffect(() => {
    // Track app initialization
    performanceMonitor.recordMetric('AppInitialization', {
      value: performance.now(),
      timestamp: Date.now()
    })

    // Track memory usage if supported
    if (performance.memory) {
      performanceMonitor.recordMetric('MemoryUsage', {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now()
      })
    }

    // Preload critical resources
    const criticalImages = ['/placeholder.svg']
    if (window.ImageOptimizer) {
      window.ImageOptimizer.preloadCriticalImages(criticalImages)
    }
  }, [])

  // SPOrTS inline styles for guaranteed rendering
  const appContainerStyle = {
    minHeight: '100vh',
    background: '#ffffff',
    fontFamily: 'Kanit, sans-serif'
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ModalProvider>
            <Router>
              <div style={appContainerStyle} className="min-h-screen">
                <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* BarMatch Main Routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/locali" element={<Locali />} />
                  {/* Route strutturata: /locali/[date]/[teams-slug]/[fixtureId] */}
                  <Route path="/locali/:date/:teamsSlug/:fixtureId" element={<Locali />} />
                  {/* Route per venue detail */}
                  <Route path="/locale/:id" element={<VenueDetail />} />
                  {/* Route intelligente che decide se è match o venue */}
                  <Route 
                    path="/locali/:id" 
                    element={
                      <RouteHandler />
                    } 
                  />
                  
                  {/* User Booking Routes */}
                  <Route 
                    path="/my-bookings" 
                    element={
                      <ProtectedRoute>
                        <MyBookings />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/bookings" 
                    element={
                      <ProtectedRoute>
                        <MyBookings />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/teams" 
                    element={
                      <ProtectedRoute>
                        <Teams />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/favorites" 
                    element={
                      <ProtectedRoute>
                        <Favorites />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* REMOVED: Generic /login route - using specific client/sports login instead */}

                  {/* Client Routes */}
                  <Route 
                    path="/client-login" 
                    element={
                      <PublicRoute>
                        <ClientLogin />
                      </PublicRoute>
                    } 
                  />
                  
                  <Route 
                    path="/client-register" 
                    element={
                      <PublicRoute>
                        <ClientRegister />
                      </PublicRoute>
                    } 
                  />

                  {/* Sports/Venue Owner Routes */}
                  <Route 
                    path="/sports-login" 
                    element={
                      <PublicRoute>
                        <SportsLogin />
                      </PublicRoute>
                    } 
                  />
                  
                  <Route 
                    path="/sports-register" 
                    element={
                      <PublicRoute>
                        <SportsRegister />
                      </PublicRoute>
                    } 
                  />
                  
                  {/* Redirect for compatibility - singular form */}
                  <Route 
                    path="/sport-register" 
                    element={<Navigate to="/sports-register" replace />} 
                  />

                  {/* User Profile Routes */}
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <UserProfile />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Demo/Mock routes rimossi nella pulizia */}
                  
                  {/* Venue Onboarding Route - SOLO per venue owner NON completati */}
                  <Route 
                    path="/admin/onboarding" 
                    element={
                      <OnboardingProtectedRoute>
                        <VenueOnboarding />
                      </OnboardingProtectedRoute>
                    } 
                  />

                  {/* BarMatch Admin Routes - accessible only after onboarding completion */}
                  <Route 
                    path="/admin" 
                    element={
                      <VenueProtectedRoute>
                        <AdminLayout />
                      </VenueProtectedRoute>
                    } 
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="calendario" element={<CalendarioPartite />} />
                    <Route path="statistiche" element={<Statistiche />} />
                    <Route path="recensioni" element={<Recensioni />} />
                    <Route path="profilo" element={<ProfiloLocale />} />
                    <Route path="account" element={<AccountSettings />} />
                    <Route path="bookings" element={<BookingsManagement />} />
                    <Route path="offers" element={<OffersManagement />} />
                  </Route>

                  {/* Mock admin routes rimossi */}
                  
                  {/* 404 - BarMatch style */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              
              {/* Modal Renderer */}
              {/* ModalRenderer is not defined in the provided code, assuming it's a placeholder or will be added later */}
              {/* <ModalRenderer /> */}
            </div>
          </Router>
        </ModalProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App

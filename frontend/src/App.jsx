import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ModalProvider } from './contexts/ModalContext'
import { ModalRenderer } from './components/ui'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import VenueProtectedRoute from './components/VenueProtectedRoute'

// Core components that should load immediately
import { Loading } from './components/ui/Loading'
import { performanceMonitor } from './utils/performance'

// Lazy-loaded pages for better performance
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ClientLogin = lazy(() => import('./pages/ClientLogin'))
const ClientRegister = lazy(() => import('./pages/ClientRegister'))
const SportsLogin = lazy(() => import('./pages/SportsLogin'))
const SportsRegister = lazy(() => import('./pages/SportsRegister'))
const ComponentDemo = lazy(() => import('./pages/ComponentDemo'))
const UserProfile = lazy(() => import('./pages/UserProfile'))

// BarMatch Pages Integration - Lazy loaded
const Index = lazy(() => import('./pages/Index'))
const Locali = lazy(() => import('./pages/Locali'))
const VenueDetail = lazy(() => import('./pages/VenueDetail'))

const NotFound = lazy(() => import('./pages/NotFound'))

// BarMatch Admin Pages - Lazy loaded
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const CalendarioPartite = lazy(() => import('./pages/admin/CalendarioPartite'))
const Statistiche = lazy(() => import('./pages/admin/Statistiche'))
const ProfiloLocale = lazy(() => import('./pages/admin/ProfiloLocale'))
const AccountSettings = lazy(() => import('./pages/admin/AccountSettings'))
const BookingsManagement = lazy(() => import('./pages/admin/BookingsManagement'))
const OffersManagement = lazy(() => import('./pages/admin/OffersManagement'))
const VenueOnboarding = lazy(() => import('./pages/admin/VenueOnboarding'))

// User Booking Pages - Lazy loaded
const MyBookings = lazy(() => import('./pages/MyBookings'))
const Teams = lazy(() => import('./pages/Teams'))
const Favorites = lazy(() => import('./pages/Favorites'))

import './App.css'
import './styles/design-system.css'

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-200 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
      <p className="text-orange-700 font-medium">Caricamento...</p>
    </div>
  </div>
)

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
    background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
    fontFamily: 'Kanit, sans-serif'
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ModalProvider>
          <Router>
            <div style={appContainerStyle} className="min-h-screen">
              <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* BarMatch Main Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/locali" element={<Locali />} />
                <Route path="/locali/:matchId" element={<Locali />} />
                <Route path="/venue/:id" element={<VenueDetail />} />
                
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
                
                {/* Public routes - accessible only when NOT authenticated */}
                <Route 
                  path="/login" 
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  } 
                />
                
                <Route 
                  path="/register" 
                  element={
                    <PublicRoute>
                      <Register />
                    </PublicRoute>
                  } 
                />

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
                
                {/* Component Demo route */}
                <Route 
                  path="/components" 
                  element={<ComponentDemo />} 
                />
                
                {/* Venue Onboarding Route - Special case, accessible before completion */}
                <Route 
                  path="/admin/onboarding" 
                  element={
                    <ProtectedRoute>
                      <VenueOnboarding />
                    </ProtectedRoute>
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
                  <Route path="profilo" element={<ProfiloLocale />} />
                  <Route path="account" element={<AccountSettings />} />
                  <Route path="bookings" element={<BookingsManagement />} />
                  <Route path="offers" element={<OffersManagement />} />
                </Route>
                
                {/* 404 - BarMatch style */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            
            {/* Modal Renderer */}
            <ModalRenderer />
          </div>
        </Router>
      </ModalProvider>
    </AuthProvider>
  </ErrorBoundary>
)
}

export default App

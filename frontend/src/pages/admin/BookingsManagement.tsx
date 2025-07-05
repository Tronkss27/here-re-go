import React, { useState } from 'react'
import BookingList from '../../components/BookingList'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { 
  CalendarIcon, 
  UsersIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  DownloadIcon,
  RefreshCwIcon,
  LoaderIcon
} from 'lucide-react'
import { useBookingStats } from '../../hooks/useBookingStats'

const BookingsManagement: React.FC = () => {
  const [selectedVenue, setSelectedVenue] = useState<string>('all')
  const [refreshKey, setRefreshKey] = useState(0)

  // Carica statistiche reali
  const { stats, loading: statsLoading, error: statsError, refreshStats } = useBookingStats(selectedVenue, refreshKey)

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
    refreshStats()
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting bookings...')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestione Prenotazioni
              </h1>
              <p className="text-gray-600 mt-2">
                Visualizza e gestisci tutte le prenotazioni del sistema
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                className="flex items-center gap-2"
              >
                <RefreshCwIcon className="h-4 w-4" />
                Aggiorna
              </Button>
              <Button 
                variant="outline" 
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <DownloadIcon className="h-4 w-4" />
                Esporta
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {statsLoading ? (
            // Loading state
            Array.from({ length: 5 }).map((_, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">
                    Caricamento...
                  </CardTitle>
                  <LoaderIcon className="h-4 w-4 text-gray-400 animate-spin" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-400">--</div>
                  <p className="text-xs text-muted-foreground">
                    Caricamento dati
                  </p>
                </CardContent>
              </Card>
            ))
          ) : statsError ? (
            // Error state
            <Card className="md:col-span-5">
              <CardContent className="pt-6">
                <div className="text-center text-red-600">
                  <p className="font-medium">Errore caricamento statistiche</p>
                  <p className="text-sm text-gray-500 mt-1">{statsError}</p>
                  <Button 
                    variant="outline" 
                    onClick={handleRefresh}
                    className="mt-3"
                  >
                    <RefreshCwIcon className="h-4 w-4 mr-2" />
                    Riprova
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Data loaded successfully
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Totale Prenotazioni
                  </CardTitle>
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.total || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Tutte le prenotazioni
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    In Attesa
                  </CardTitle>
                  <ClockIcon className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Da confermare
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Confermate
                  </CardTitle>
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats?.confirmed || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Prenotazioni attive
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Cancellate
                  </CardTitle>
                  <XCircleIcon className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats?.cancelled || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Prenotazioni annullate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Completate
                  </CardTitle>
                  <UsersIcon className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats?.completed || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Servizio completato
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Venue Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtri Avanzati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Filtra per locale
                </label>
                <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona locale" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i locali</SelectItem>
                    <SelectItem value="venue_1">The Queen's Head</SelectItem>
                    <SelectItem value="venue_2">Sports Bar Central</SelectItem>
                    <SelectItem value="venue_3">The Football Tavern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Additional filters can be added here */}
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedVenue('all')}
                  className="w-full"
                >
                  Pulisci filtri
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        <BookingList 
          key={refreshKey}
          venueId={selectedVenue === 'all' ? undefined : selectedVenue}
          showVenueInfo={true}
          showActions={true}
          adminView={true}
        />
      </div>
    </div>
  )
}

export default BookingsManagement 
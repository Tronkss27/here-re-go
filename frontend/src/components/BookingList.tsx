import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { 
  CalendarIcon, 
  ClockIcon, 
  Users, 
  MapPinIcon, 
  PhoneIcon, 
  MailIcon,
  FilterIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

import BookingStatusBadge from './BookingStatusBadge'
import BookingStatusActions from './BookingStatusActions'
import { bookingsService } from '../services/venueService'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../hooks/use-toast'
import { useModal } from '../contexts/ModalContext'

interface Booking {
  _id: string
  venue: {
    _id: string
    name: string
    address?: string
  }
  user: string
  bookingDate: string
  startTime: string
  endTime: string
  partySize: number
  customerName: string
  customerEmail: string
  customerPhone: string
  specialRequests?: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show'
  totalPrice: number
  deposit: number
  paymentStatus: string
  bookingType: string
  source: string
  confirmationCode: string
  createdAt: string
  updatedAt: string
  // Virtual fields
  isUpcoming?: boolean
  duration?: number
  remainingAmount?: number
}

interface BookingListProps {
  venueId?: string
  showVenueInfo?: boolean
  showActions?: boolean
  adminView?: boolean
}

const BookingList: React.FC<BookingListProps> = ({
  venueId,
  showVenueInfo = true,
  showActions = true,
  adminView = false
}) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const { showBookingDetailsModal } = useModal()

  // State
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalBookings, setTotalBookings] = useState(0)
  const itemsPerPage = 10

  // Load bookings
  const loadBookings = async () => {
    setLoading(true)
    setError(null)
    
    try {
      if (!user?.id) {
        setError('Utente non autenticato')
        setLoading(false)
        return
      }

      // Usa il servizio tenant-based
      const allBookings = await bookingsService.getBookings(user.id)
      
      // Applica filtri lato client
      let filteredBookings = allBookings
      
      // Filtro per status
      if (statusFilter !== 'all') {
        filteredBookings = filteredBookings.filter(booking => booking.status === statusFilter)
      }
      
      // Filtro per ricerca (nome cliente, email, telefono)
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        filteredBookings = filteredBookings.filter(booking => 
          booking.customerName?.toLowerCase().includes(search) ||
          booking.customerEmail?.toLowerCase().includes(search) ||
          booking.customerPhone?.toLowerCase().includes(search) ||
          booking.confirmationCode?.toLowerCase().includes(search)
        )
      }
      
      // Calcola paginazione
      const totalItems = filteredBookings.length
      const totalPagesCalc = Math.ceil(totalItems / itemsPerPage)
      const startIndex = (currentPage - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      const paginatedBookings = filteredBookings.slice(startIndex, endIndex)
      
      // Normalizza i dati per compatibilità con il componente
      const normalizedBookings = paginatedBookings.map((booking: any) => ({
          ...booking,
        _id: booking.id || booking._id,
        venue: {
          _id: user.venue?.id || 'venue-1',
          name: user.venue?.name || 'Il tuo locale'
        }
        }))
        
        setBookings(normalizedBookings)
      setTotalPages(totalPagesCalc)
      setTotalBookings(totalItems)
    } catch (err) {
      console.error('Errore caricamento prenotazioni:', err)
      setError('Errore nel caricamento delle prenotazioni')
    } finally {
      setLoading(false)
    }
  }

  // Effects
  useEffect(() => {
    if (user?.id) {
    loadBookings()
    }
  }, [user?.id, currentPage, venueId, statusFilter, dateFilter, searchTerm])

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (currentPage === 1) {
        loadBookings()
      } else {
        setCurrentPage(1)
      }
    }, 500)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm])

  // Handlers
  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      if (!user?.id) {
        toast({
          title: "Errore",
          description: "Utente non autenticato",
          variant: "destructive"
        })
        return
      }

      // Usa il servizio tenant-based
      const success = await bookingsService.updateBookingStatus(user.id, bookingId, newStatus)
      
      if (success) {
        toast({
          title: "Successo",
          description: "Status prenotazione aggiornato"
        })
        loadBookings() // Reload to get updated data
      } else {
        toast({
          title: "Errore",
          description: "Impossibile aggiornare lo status",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Errore aggiornamento status:', error)
      toast({
        title: "Errore",
        description: "Errore nell'aggiornamento dello status",
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Data non disponibile'
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: it })
    } catch (error) {
      console.warn('Errore formattazione data:', dateString, error)
      return 'Data non valida'
    }
  }

  const formatTime = (timeSlot: { startTime: string; endTime: string }) => {
    try {
      if (!timeSlot.startTime || !timeSlot.endTime) return 'Orario non disponibile'
      return `${timeSlot.startTime} - ${timeSlot.endTime}`
    } catch (error) {
      console.warn('Errore formattazione orario:', timeSlot, error)
      return 'Orario non valido'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento prenotazioni...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadBookings} variant="outline">
          Riprova
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {adminView ? 'Gestione Prenotazioni' : 'Le tue prenotazioni'}
          </h2>
          <p className="text-gray-600">
            {totalBookings} prenotazioni trovate
          </p>
        </div>
        <Button onClick={loadBookings} variant="outline" size="sm">
          Aggiorna
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5" />
            Filtri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cerca per nome, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tutti gli status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli status</SelectItem>
                <SelectItem value="pending">In attesa</SelectItem>
                <SelectItem value="confirmed">Confermata</SelectItem>
                <SelectItem value="cancelled">Cancellata</SelectItem>
                <SelectItem value="completed">Completata</SelectItem>
                <SelectItem value="no-show">Non presentato</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tutte le date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le date</SelectItem>
                <SelectItem value="today">Oggi</SelectItem>
                <SelectItem value="tomorrow">Domani</SelectItem>
                <SelectItem value="week">Questa settimana</SelectItem>
                <SelectItem value="month">Questo mese</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setDateFilter('all')
              }}
            >
              Pulisci filtri
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nessuna prenotazione trovata
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Prova a modificare i filtri di ricerca'
                : 'Non ci sono prenotazioni da visualizzare'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Booking Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {booking.customerName || 'Nome non disponibile'}
                        </h3>
                        {showVenueInfo && booking.venue?.name && (
                          <p className="text-gray-600 flex items-center gap-1">
                            <MapPinIcon className="h-4 w-4" />
                            {booking.venue.name}
                          </p>
                        )}
                      </div>
                      <BookingStatusBadge status={booking.status} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <CalendarIcon className="h-4 w-4" />
                        {formatDate(booking.bookingDate)}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <ClockIcon className="h-4 w-4" />
                        {formatTime({ startTime: booking.startTime || '', endTime: booking.endTime || '' })}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="h-4 w-4" />
                        {booking.partySize || 0} {booking.partySize === 1 ? 'persona' : 'persone'}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MailIcon className="h-4 w-4" />
                        {booking.customerEmail || 'Email non disponibile'}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <PhoneIcon className="h-4 w-4" />
                        {booking.customerPhone || 'Telefono non disponibile'}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* View Details */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => showBookingDetailsModal(booking)}
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      Dettagli
                    </Button>

                    {/* Status Actions */}
                    {showActions && (
                      <BookingStatusActions
                        booking={booking}
                        onStatusChange={handleStatusChange}
                        adminView={adminView}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Pagina {currentPage} di {totalPages} ({totalBookings} prenotazioni totali)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Precedente
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Successiva
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookingList 
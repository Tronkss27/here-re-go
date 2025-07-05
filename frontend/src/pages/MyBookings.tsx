import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import BookingList from '../components/BookingList'
import { Button } from '../components/ui/button'
import { CalendarIcon, PlusIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const MyBookings: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Accesso richiesto
          </h2>
          <p className="text-gray-600 mb-4">
            Devi effettuare l'accesso per visualizzare le tue prenotazioni
          </p>
          <Button onClick={() => navigate('/login')}>
            Accedi
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Le mie prenotazioni
              </h1>
              <p className="text-gray-600 mt-2">
                Gestisci e visualizza tutte le tue prenotazioni
              </p>
            </div>
            <Button 
              onClick={() => navigate('/locali')}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Nuova prenotazione
            </Button>
          </div>
        </div>

        {/* Bookings List */}
        <BookingList 
          showVenueInfo={true}
          showActions={true}
          adminView={false}
        />
      </div>
    </div>
  )
}

export default MyBookings 
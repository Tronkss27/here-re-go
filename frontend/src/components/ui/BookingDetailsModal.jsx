import React, { useState } from 'react'
import Modal from './Modal'
import BookingStatusBadge from '../BookingStatusBadge'
import BookingStatusActions from '../BookingStatusActions'
import { useModal } from '../../contexts/ModalContext'
import { CalendarIcon, ClockIcon, UserIcon, PhoneIcon, EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline'

/**
 * BookingDetailsModal - Modal specializzato per dettagli prenotazione
 */
const BookingDetailsModal = ({
  isOpen,
  booking,
  onClose,
  onStatusChange,
  ...props
}) => {
  const { showConfirmModal } = useModal()
  const [isUpdating, setIsUpdating] = useState(false)

  if (!booking) {
    return null
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Data non valida'
      }
      return date.toLocaleDateString('it-IT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      return 'Data non valida'
    }
  }

  const formatTime = (timeString) => {
    try {
      if (!timeString) return 'Orario non specificato'
      return timeString.slice(0, 5) // HH:MM
    } catch (error) {
      return 'Orario non valido'
    }
  }

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true)
    try {
      if (onStatusChange) {
        await onStatusChange(newStatus)
      }
      // Il modal può rimanere aperto per mostrare lo stato aggiornato
    } catch (error) {
      console.error('Errore aggiornamento status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = () => {
    showConfirmModal({
      title: 'Elimina Prenotazione',
      message: `Sei sicuro di voler eliminare la prenotazione #${booking.confirmationCode}? Questa azione non può essere annullata.`,
      confirmText: 'Elimina',
      variant: 'danger',
      onConfirm: () => {
        // TODO: Implementare eliminazione prenotazione
        console.log('Eliminazione prenotazione:', booking.id)
        onClose()
      }
    })
  }

  // Dati del cliente
  const customerName = booking.customerName || booking.customer?.name || 'Nome non disponibile'
  const customerEmail = booking.customerEmail || booking.customer?.email || 'Email non disponibile'
  const customerPhone = booking.customerPhone || booking.customer?.phone || 'Telefono non disponibile'

  // Dati del venue
  const venueName = booking.venue?.name || booking.venueName || 'Locale non specificato'
  const venueAddress = booking.venue?.address || booking.venueAddress || 'Indirizzo non disponibile'

  return (
    <Modal
      isOpen={isOpen}
      title={`Prenotazione #${booking.confirmationCode}`}
      size="large"
      onClose={onClose}
      {...props}
    >
      <Modal.Body>
        <div className="space-y-6">
          {/* Status e Azioni */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <BookingStatusBadge status={booking.status} />
              <span className="text-sm text-gray-600">
                Creata il {formatDate(booking.createdAt)}
              </span>
            </div>
            <BookingStatusActions
              booking={booking}
              onStatusChange={handleStatusChange}
              showQuickActions={true}
              size="sm"
            />
          </div>

          {/* Dettagli Prenotazione */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informazioni Generali */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Dettagli Prenotazione
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="font-medium text-gray-700 mr-2">Data:</span>
                  <span>{formatDate(booking.date)}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="font-medium text-gray-700 mr-2">Orario:</span>
                  <span>{formatTime(booking.time)} - {formatTime(booking.endTime)}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="font-medium text-gray-700 mr-2">Persone:</span>
                  <span>{booking.guests || booking.numberOfGuests || 1}</span>
                </div>

                {booking.specialRequests && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700 block mb-1">Richieste Speciali:</span>
                    <p className="text-gray-600 p-2 bg-gray-50 rounded">{booking.specialRequests}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Informazioni Cliente */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Informazioni Cliente
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="font-medium text-gray-700 mr-2">Nome:</span>
                  <span>{customerName}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="font-medium text-gray-700 mr-2">Email:</span>
                  <a 
                    href={`mailto:${customerEmail}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {customerEmail}
                  </a>
                </div>
                
                <div className="flex items-center text-sm">
                  <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="font-medium text-gray-700 mr-2">Telefono:</span>
                  <a 
                    href={`tel:${customerPhone}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {customerPhone}
                  </a>
                </div>
              </div>
            </div>

            {/* Informazioni Locale */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Informazioni Locale
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="font-medium text-gray-700 mr-2">Locale:</span>
                  <span>{venueName}</span>
                </div>
                
                <div className="flex items-start text-sm">
                  <MapPinIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                  <span className="font-medium text-gray-700 mr-2">Indirizzo:</span>
                  <span>{venueAddress}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline degli Eventi */}
          {booking.statusHistory && booking.statusHistory.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Cronologia
              </h3>
              
              <div className="space-y-2">
                {booking.statusHistory.map((event, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                    <span className="font-medium mr-2">{formatDate(event.date)}:</span>
                    <span>{event.status} - {event.note || 'Nessuna nota'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <div className="flex justify-between w-full">
          {/* Azioni Pericolose */}
          <button
            onClick={handleDelete}
            disabled={isUpdating}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Elimina Prenotazione
          </button>

          {/* Azioni Standard */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
            >
              Chiudi
            </button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  )
}

export default BookingDetailsModal 
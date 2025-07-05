import React, { useState } from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { useToast } from './ui/use-toast'
import { CheckCircleIcon, XCircleIcon, ClockIcon, CalendarCheckIcon, UserXIcon, MoreHorizontalIcon } from 'lucide-react'
import BookingStatusBadge from './BookingStatusBadge'
import bookingsService from '../services/bookingsService.js'
import type { BookingStatus, Booking } from '../types'

interface BookingStatusActionsProps {
  booking: Booking
  onStatusChange?: (newStatus: BookingStatus) => void
  showQuickActions?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const BookingStatusActions: React.FC<BookingStatusActionsProps> = ({
  booking,
  onStatusChange,
  showQuickActions = true,
  size = 'md',
  className = ''
}) => {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus>(booking.status)
  const [reason, setReason] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const getAvailableStatuses = (currentStatus: BookingStatus): BookingStatus[] => {
    switch (currentStatus) {
      case 'pending':
        return ['confirmed', 'cancelled']
      case 'confirmed':
        return ['completed', 'cancelled', 'no_show']
      case 'cancelled':
        return ['pending'] // Allow reactivation
      case 'completed':
        return [] // Final state
      case 'no_show':
        return ['confirmed'] // Allow correction
      default:
        return []
    }
  }

  const getStatusActionConfig = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return {
          label: 'Conferma',
          icon: CheckCircleIcon,
          variant: 'default' as const,
          className: 'bg-green-600 hover:bg-green-700 text-white'
        }
      case 'cancelled':
        return {
          label: 'Cancella',
          icon: XCircleIcon,
          variant: 'destructive' as const,
          className: 'bg-red-600 hover:bg-red-700 text-white'
        }
      case 'completed':
        return {
          label: 'Completa',
          icon: CalendarCheckIcon,
          variant: 'outline' as const,
          className: 'bg-blue-600 hover:bg-blue-700 text-white'
        }
      case 'no_show':
        return {
          label: 'Non Presentato',
          icon: UserXIcon,
          variant: 'secondary' as const,
          className: 'bg-gray-600 hover:bg-gray-700 text-white'
        }
      case 'pending':
        return {
          label: 'In Attesa',
          icon: ClockIcon,
          variant: 'outline' as const,
          className: 'bg-orange-600 hover:bg-orange-700 text-white'
        }
      default:
        return {
          label: 'Aggiorna',
          icon: MoreHorizontalIcon,
          variant: 'outline' as const,
          className: ''
        }
    }
  }

  const handleQuickStatusChange = async (newStatus: BookingStatus) => {
    setIsUpdating(true)
    try {
      const response = await bookingsService.updateBookingStatus(booking._id, newStatus)
      
      if (response.success) {
        toast({
          title: "Stato aggiornato",
          description: `Prenotazione ${getStatusActionConfig(newStatus).label.toLowerCase()}`,
        })
        
        if (onStatusChange) {
          onStatusChange(newStatus)
        }
      }
    } catch (error: any) {
      console.error('Errore aggiornamento stato:', error)
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare lo stato",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDialogStatusChange = async () => {
    if (selectedStatus === booking.status) {
      setIsDialogOpen(false)
      return
    }

    setIsUpdating(true)
    try {
      const response = await bookingsService.updateBookingStatus(booking._id, selectedStatus)
      
      if (response.success) {
        toast({
          title: "Stato aggiornato",
          description: `Prenotazione ${getStatusActionConfig(selectedStatus).label.toLowerCase()}`,
        })
        
        if (onStatusChange) {
          onStatusChange(selectedStatus)
        }
        
        setIsDialogOpen(false)
        setReason('')
      }
    } catch (error: any) {
      console.error('Errore aggiornamento stato:', error)
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare lo stato",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const availableStatuses = getAvailableStatuses(booking.status)

  if (availableStatuses.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <BookingStatusBadge status={booking.status} size={size} />
        <span className="text-xs text-gray-500">(Finale)</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Current Status */}
      <BookingStatusBadge status={booking.status} size={size} />

      {/* Quick Actions */}
      {showQuickActions && availableStatuses.length <= 2 && (
        <div className="flex gap-1">
          {availableStatuses.map((status) => {
            const config = getStatusActionConfig(status)
            const Icon = config.icon
            
            return (
              <Button
                key={status}
                variant={config.variant}
                size={size === 'sm' ? 'sm' : 'sm'}
                onClick={() => handleQuickStatusChange(status)}
                disabled={isUpdating}
                className={`${config.className} ${size === 'sm' ? 'px-2' : 'px-3'}`}
              >
                <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
                {size !== 'sm' && <span className="ml-1">{config.label}</span>}
              </Button>
            )
          })}
        </div>
      )}

      {/* More Actions Dialog */}
      {(availableStatuses.length > 2 || !showQuickActions) && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size={size === 'sm' ? 'sm' : 'sm'}
              className="px-2"
            >
              <MoreHorizontalIcon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Cambia Stato Prenotazione</DialogTitle>
              <DialogDescription>
                Seleziona il nuovo stato per la prenotazione #{booking.confirmationCode}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Current Status */}
              <div>
                <Label>Stato attuale</Label>
                <div className="mt-1">
                  <BookingStatusBadge status={booking.status} />
                </div>
              </div>

              {/* New Status Selection */}
              <div>
                <Label htmlFor="newStatus">Nuovo stato</Label>
                <Select value={selectedStatus} onValueChange={(value: BookingStatus) => setSelectedStatus(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={booking.status}>
                      <div className="flex items-center gap-2">
                        <BookingStatusBadge status={booking.status} size="sm" />
                        <span>(Attuale)</span>
                      </div>
                    </SelectItem>
                    {availableStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        <BookingStatusBadge status={status} size="sm" />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reason (optional) */}
              <div>
                <Label htmlFor="reason">Motivo (opzionale)</Label>
                <Textarea
                  id="reason"
                  placeholder="Aggiungi una nota sul cambio di stato..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isUpdating}
              >
                Annulla
              </Button>
              <Button
                onClick={handleDialogStatusChange}
                disabled={isUpdating || selectedStatus === booking.status}
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Aggiornando...
                  </>
                ) : (
                  'Aggiorna Stato'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default BookingStatusActions 
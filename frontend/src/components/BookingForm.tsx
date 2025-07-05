import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { CalendarIcon, ClockIcon, Users, PhoneIcon, MailIcon, MessageSquareIcon, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Calendar } from './ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { useToast } from './ui/use-toast'
import { cn } from '../utils/cn'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import bookingsService from '../services/bookingsService.js'
import CalendarComponent, { CalendarEvent } from './CalendarComponent'
import type { CreateBookingForm, BookingTimeSlot, BookingTablePreference, Venue } from '../types'

interface BookingFormProps {
  venueId: string
  venueName: string
  fixtureId?: string
  preselectedDate?: Date
  preselectedTimeSlot?: BookingTimeSlot
  onSuccess?: (booking: any) => void
  onCancel?: () => void
  mode?: 'simple' | 'advanced' // New prop for booking mode
  matchInfo?: { // Add match info for display
    homeTeam?: string
    awayTeam?: string
    league?: string
    time?: string
  }
}

interface BookingFormData {
  date: Date | null
  timeSlot: BookingTimeSlot | null
  duration: number // in hours
  partySize: number
  tablePreference: BookingTablePreference
  customerName: string
  customerEmail: string
  customerPhone: string
  specialRequests: string
  // Recurring booking options
  isRecurring: boolean
  recurringFrequency: 'weekly' | 'monthly' | 'biweekly'
  recurringEndDate: Date | null
  recurringOccurrences: number
}

interface CreateBookingForm {
  venue: string
  fixture?: string
  date: string
  timeSlot: BookingTimeSlot
  duration: number
  partySize: number
  tablePreference: BookingTablePreference
  customer: {
    name: string
    email: string
    phone: string
  }
  specialRequests?: string
  // Recurring booking options
  isRecurring?: boolean
  recurringFrequency?: 'weekly' | 'monthly' | 'biweekly'
  recurringEndDate?: string
  recurringOccurrences?: number
}

const BookingForm: React.FC<BookingFormProps> = ({
  venueId,
  venueName,
  fixtureId,
  preselectedDate,
  preselectedTimeSlot,
  onSuccess,
  onCancel,
  mode = 'simple', // Default to simple mode for backward compatibility
  matchInfo
}) => {
  const navigate = useNavigate()
  const { toast } = useToast()

  // Default booking settings
  const defaultBookingSettings = {
    advanceBookingDays: 30,
    minimumPartySize: 1,
    maximumPartySize: 12
  }

  // Form state
  const [formData, setFormData] = useState<BookingFormData>({
    date: preselectedDate || null,
    timeSlot: preselectedTimeSlot || null,
    duration: 2,
    partySize: 2,
    tablePreference: 'any',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    specialRequests: '',
    // Recurring booking options
    isRecurring: false,
    recurringFrequency: 'weekly',
    recurringEndDate: null,
    recurringOccurrences: 0
  })

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [availableSlots, setAvailableSlots] = useState<BookingTimeSlot[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false)
  const [isValidatingForm, setIsValidatingForm] = useState(false)
  const [bookingMode, setBookingMode] = useState<'match' | 'generic'>(
    fixtureId ? 'match' : 'generic'
  )
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [isAdvancedMode, setIsAdvancedMode] = useState(mode === 'advanced')
  const [isGenericBooking, setIsGenericBooking] = useState(!fixtureId)

  // Venue capacity and conflict management
  const maxVenueCapacity = 80 // This should come from venue data
  const [capacityWarning, setCapacityWarning] = useState<string | null>(null)
  const [conflictWarning, setConflictWarning] = useState<string | null>(null)
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

  // Date constraints
  const today = new Date()
  const maxDate = new Date()
  maxDate.setDate(today.getDate() + defaultBookingSettings.advanceBookingDays)

  // Load calendar events when component mounts or advanced mode changes
  useEffect(() => {
    if (isAdvancedMode) {
      loadCalendarEvents()
    }
  }, [isAdvancedMode, venueId])

  // Check venue capacity and conflicts
  const checkVenueCapacity = () => {
    if (!formData.timeSlot || !formData.partySize) {
      setCapacityWarning(null)
      return
    }

    // Calculate overlapping time period based on duration
    const startTime = formData.timeSlot.start
    const endTime = new Date(new Date(`2000-01-01 ${startTime}`).getTime() + formData.duration * 60 * 60 * 1000)
      .toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

    // Simulate capacity check (in real implementation, this would check existing bookings)
    const estimatedCurrentCapacity = Math.floor(Math.random() * 60) // Mock current bookings
    const newTotalCapacity = estimatedCurrentCapacity + formData.partySize

    if (newTotalCapacity > maxVenueCapacity) {
      setCapacityWarning(`⚠️ Attenzione: La prenotazione porterebbe la capacità a ${newTotalCapacity}/${maxVenueCapacity} persone (${startTime}-${endTime})`)
    } else if (newTotalCapacity > maxVenueCapacity * 0.8) {
      setCapacityWarning(`📊 Locale quasi al completo: ${newTotalCapacity}/${maxVenueCapacity} persone (${startTime}-${endTime})`)
    } else {
      setCapacityWarning(null)
    }
  }

  // Check capacity when relevant fields change
  useEffect(() => {
    checkVenueCapacity()
  }, [formData.timeSlot, formData.partySize, formData.duration])

  // Check conflicts when booking details change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      checkBookingConflicts()
    }, 500) // Debounce di 500ms per evitare troppe chiamate API

    return () => clearTimeout(debounceTimer)
  }, [formData.date, formData.timeSlot, formData.duration, formData.partySize])

  // Load available time slots when date changes
  useEffect(() => {
    if (formData.date) {
      loadAvailableSlots()
    }
  }, [formData.date, venueId])

  // FIXED: Cleanup sicuro per evitare errori DOM
  useEffect(() => {
    return () => {
      console.log('🧹 DEBUG: Component cleanup running, showSummary =', showSummary)
      // Cleanup safety: NON modificare stati durante unmount per evitare errori removeChild
      // React gestirà automaticamente la pulizia dei componenti
    };
  }, []);

  const loadAvailableSlots = async () => {
    if (!formData.date) {
      console.log('🔍 DEBUG loadAvailableSlots - No date selected, skipping')
      return
    }

    console.log('🔍 DEBUG loadAvailableSlots - Loading slots for date:', formData.date)

    setIsLoadingSlots(true)
    try {
      const dateStr = format(formData.date, 'yyyy-MM-dd')
      console.log('🔍 DEBUG loadAvailableSlots - Calling API with:', venueId, dateStr)
      
      const response = await bookingsService.getAvailableSlots(venueId, dateStr)
      console.log('🔍 DEBUG loadAvailableSlots - API response:', response)
      
      if (response.success && response.data) {
        console.log('🔍 DEBUG loadAvailableSlots - Setting slots:', response.data.slots)
        setAvailableSlots(response.data.slots || [])
      } else {
        console.error('Failed to load time slots:', response.error)
        setAvailableSlots([])
      }
    } catch (error) {
      console.error('Errore caricamento slot:', error)
      toast({
        title: "Errore",
        description: "Impossibile caricare gli orari disponibili",
        variant: "destructive"
      })
    } finally {
      setIsLoadingSlots(false)
    }
  }

  const loadCalendarEvents = async () => {
    setIsLoadingCalendar(true)
    try {
      const response = await bookingsService.getVenueBookings(venueId)
      if (response.success && response.data) {
        const events: CalendarEvent[] = response.data.map((booking: any) => ({
          id: booking._id || booking.id,
          title: `${booking.customerName} (${booking.partySize} persone)`,
          start: new Date(`${booking.date}T${booking.startTime}`),
          end: new Date(`${booking.date}T${booking.endTime || booking.startTime}`),
          type: booking.fixtureId ? 'match' : 'booking',
          resource: booking
        }))
        setCalendarEvents(events)
      }
    } catch (error) {
      console.error('Errore caricamento eventi calendario:', error)
      toast({
        title: "Errore",
        description: "Impossibile caricare gli eventi del calendario",
        variant: "destructive"
      })
    } finally {
      setIsLoadingCalendar(false)
    }
  }

  // Handle calendar date selection
  const handleCalendarDateSelect = (date: Date) => {
    updateField('date', date)
    // Reset time slot when date changes
    updateField('timeSlot', null)
  }

  // Handle calendar event selection
  const handleCalendarEventSelect = (event: CalendarEvent) => {
    // Show event details or allow editing
    console.log('Selected event:', event)
  }

  // Form validation
  const validateForm = (): boolean => {
    setIsValidatingForm(true)
    const newErrors: Record<string, string> = {}

    console.log('🔍 DEBUG validateForm - Starting validation with:', formData)

    // Date validation
    if (!formData.date) {
      newErrors.date = 'Seleziona una data'
      console.log('❌ DEBUG validateForm - Date missing')
    } else {
      const selectedDate = new Date(formData.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate < today) {
        newErrors.date = 'Non puoi prenotare per date passate'
      }
      
      if (selectedDate > maxDate) {
        newErrors.date = `Prenotazioni disponibili solo entro ${defaultBookingSettings.advanceBookingDays} giorni`
      }
    }

    // Time slot validation with business hours
    if (!formData.timeSlot) {
      newErrors.timeSlot = 'Seleziona un orario'
      console.log('❌ DEBUG validateForm - TimeSlot missing')
    } else {
      const timeSlotHour = parseInt(formData.timeSlot.start.split(':')[0])
      if (timeSlotHour < 9 || timeSlotHour > 23) {
        newErrors.timeSlot = 'Orario deve essere tra le 09:00 e le 23:00'
      }
      
      // Check if booking end time would exceed venue closing
      const endHour = timeSlotHour + formData.duration
      if (endHour > 24) {
        newErrors.duration = 'La prenotazione non può oltrepassare la mezzanotte'
      }
    }

    // Enhanced party size validation
    if (formData.partySize < defaultBookingSettings.minimumPartySize) {
      newErrors.partySize = `Minimo ${defaultBookingSettings.minimumPartySize} persone`
    }

    if (formData.partySize > defaultBookingSettings.maximumPartySize) {
      newErrors.partySize = `Massimo ${defaultBookingSettings.maximumPartySize} persone`
    }

    // Customer information validation
    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Nome richiesto'
    } else if (formData.customerName.trim().length < 2) {
      newErrors.customerName = 'Nome deve contenere almeno 2 caratteri'
    }

    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = 'Email richiesta'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'Email non valida'
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'Telefono richiesto'
    } else if (!/^[\+]?[\d\s\-\(\)]{8,15}$/.test(formData.customerPhone)) {
      newErrors.customerPhone = 'Formato telefono non valido'
    }

    // Duration validation
    if (formData.duration < 1 || formData.duration > 4) {
      newErrors.duration = 'Durata deve essere tra 1 e 4 ore'
    }

    // Recurring booking validation with improved logic
    if (formData.isRecurring) {
      if (!formData.recurringEndDate && formData.recurringOccurrences === 0) {
        newErrors.recurringEndDate = 'Seleziona data fine o numero ripetizioni'
      }
      
      if (formData.recurringEndDate && formData.date) {
        const diffTime = formData.recurringEndDate.getTime() - formData.date.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffDays <= 0) {
          newErrors.recurringEndDate = 'Data fine deve essere successiva alla data iniziale'
        }
        
        if (formData.recurringFrequency === 'weekly' && diffDays > 365) {
          newErrors.recurringEndDate = 'Prenotazioni ricorrenti settimanali non possono superare 1 anno'
        }
        
        if (formData.recurringFrequency === 'monthly' && diffDays > 730) {
          newErrors.recurringEndDate = 'Prenotazioni ricorrenti mensili non possono superare 2 anni'
        }
      }

      if (formData.recurringOccurrences > 12) {
        newErrors.recurringOccurrences = 'Massimo 12 ripetizioni'
      }
    }

    // Cross-field validation
    if (conflictWarning?.includes('❌')) {
      newErrors.general = 'Risolvi i conflitti di capacità prima di procedere'
    }

    console.log('🔍 DEBUG validateForm - Final errors:', newErrors)
    console.log('🔍 DEBUG validateForm - Is valid:', Object.keys(newErrors).length === 0)

    setErrors(newErrors)
    setIsValidatingForm(false)
    return Object.keys(newErrors).length === 0
  }

  // Form submission - show summary first, then final submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // BROWSER DETECTION per gestione modal differenziata
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);

    // 🚨 DEBUG: Log form data e validazione
    console.log('🔍 DEBUG handleSubmit - FormData:', formData)
    console.log('🔍 DEBUG handleSubmit - Errors before validation:', errors)
    console.log('🌐 MODAL: Browser detected - Chrome:', isChrome, 'Safari:', isSafari)
    
    const isValid = validateForm()
    console.log('🔍 DEBUG handleSubmit - Validation result:', isValid)
    console.log('🔍 DEBUG handleSubmit - Errors after validation:', errors)

    if (!isValid) {
      toast({
        title: "Errori nel form",
        description: "Correggi gli errori evidenziati",
        variant: "destructive"
      })
      return
    }

    // First click: show summary (BROWSER-SAFE)
    if (!showSummary) {
      console.log('🎯 DEBUG: Setting showSummary to true - modal should open')
      console.log('🎯 DEBUG: Current showSummary state:', showSummary)
      
      if (isChrome) {
        // CHROME: Forza re-render per evitare race conditions
        setTimeout(() => {
      setShowSummary(true)
          console.log('🎯 CHROME: Called setShowSummary(true) with delay')
        }, 50)
      } else {
        // SAFARI/OTHER: Gestione immediata
        setShowSummary(true)
        console.log('🎯 SAFARI: Called setShowSummary(true) immediately')
      }
      return
    }
  }

  // Final submission from modal - separate function to avoid conflicts
  const handleFinalSubmit = async () => {
    // Prevenire multiple submissions
    if (isSubmitting) return
    
    // BROWSER DETECTION per gestione differenziata
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
    
    console.log('🌐 SUBMIT: Browser detected - Chrome:', isChrome, 'Safari:', isSafari);
    
    setIsSubmitting(true)

    try {
      // Validazione aggiuntiva pre-submit
      if (!formData.date || !formData.timeSlot || !formData.customerName.trim() || 
          !formData.customerEmail.trim() || !formData.customerPhone.trim()) {
        throw new Error('Tutti i campi richiesti devono essere compilati')
      }

      const bookingData: CreateBookingForm = {
        venue: venueId,
        fixture: fixtureId,
        date: format(formData.date!, 'yyyy-MM-dd'),
        timeSlot: formData.timeSlot!,
        duration: formData.duration,
        partySize: formData.partySize,
        tablePreference: formData.tablePreference,
        customer: {
          name: formData.customerName.trim(),
          email: formData.customerEmail.trim(),
          phone: formData.customerPhone.trim()
        },
        specialRequests: formData.specialRequests.trim() || undefined,
        // Recurring booking options
        isRecurring: formData.isRecurring,
        recurringFrequency: formData.isRecurring ? formData.recurringFrequency : undefined,
        recurringEndDate: formData.isRecurring && formData.recurringEndDate 
          ? format(formData.recurringEndDate, 'yyyy-MM-dd') 
          : undefined,
        recurringOccurrences: formData.isRecurring ? formData.recurringOccurrences : undefined
      }

      console.log('🚀 Invio prenotazione per venue:', venueId, 'con dati:', bookingData)

      // Invia la prenotazione
      const response = await bookingsService.createBooking(bookingData)
      
      console.log('📥 Risposta ricevuta:', response)

      if (response.success) {
        const message = formData.isRecurring 
          ? `Prenotazioni ricorrenti create! Codice principale: ${response.data.confirmationCode}. Riceverai email di conferma per ogni prenotazione.`
          : `Prenotazione confermata! Codice prenotazione: ${response.data.confirmationCode}. Riceverai una email di conferma a breve.`
        
        // BROWSER-SPECIFIC CLEANUP
        if (isChrome) {
          // CHROME: Reset immediato per evitare race conditions
          setIsSubmitting(false)
          setShowSummary(false)
          
          // Chrome: Delay minimo per stabilizzare DOM
          setTimeout(() => {
        toast({
          title: formData.isRecurring ? "Prenotazioni ricorrenti confermate!" : "Prenotazione confermata!",
          description: message,
              duration: 8000,
        })

        if (onSuccess) {
          onSuccess(response.data)
            }
          }, 100)
          
        } else {
          // SAFARI/OTHER: Gestione standard
          setIsSubmitting(false)
          setShowSummary(false)
          
          toast({
            title: formData.isRecurring ? "Prenotazioni ricorrenti confermate!" : "Prenotazione confermata!",
            description: message,
            duration: 8000,
          })

          if (onSuccess) {
            onSuccess(response.data)
          }
        }
        
      } else {
        throw new Error(response.error || 'Errore nella creazione della prenotazione')
      }
    } catch (error: any) {
      console.error('❌ Errore prenotazione completo:', error)
      
      // BROWSER-SAFE ERROR HANDLING
      setIsSubmitting(false)
      setShowSummary(false)
      
      const errorDelay = isChrome ? 150 : 0; // Chrome: delay aggiuntivo
      
      setTimeout(() => {
      toast({
        title: "Errore nella prenotazione",
          description: error.message || "Si è verificato un errore inaspettato. Riprova.",
        variant: "destructive"
      })
      }, errorDelay)
    }
  }

  // Function to go back to form editing - STABLE CALLBACK
  const handleBackToForm = useCallback(() => {
    console.log('🔙 MODAL: handleBackToForm chiamato')
    setShowSummary(false)
  }, [])

  // Handle field changes - STABLE CALLBACK  
  const updateField = useCallback(<K extends keyof BookingFormData>(
    field: K,
    value: BookingFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
      setErrors(prev => ({ ...prev, [field]: '' }))
  }, [])

  // Real-time conflict detection
  const checkBookingConflicts = async () => {
    if (!formData.date || !formData.timeSlot || !formData.duration) {
      setConflictWarning(null)
      return
    }

    setIsCheckingConflicts(true)
    try {
      // DISABILITATO TEMPORANEAMENTE PER EVITARE 404
      // const conflictData = {
      //   venueId,
      //   date: format(formData.date, 'yyyy-MM-dd'),
      //   startTime: formData.timeSlot.start,
      //   duration: formData.duration,
      //   partySize: formData.partySize,
      //   excludeBookingId: null // For future editing functionality
      // }

      // const response = await bookingsService.checkTimeConflict(conflictData)
      
      // if (response.success && response.data) {
      //   const { hasConflict, conflictingBookings, availableCapacity } = response.data
        
      //   if (hasConflict && conflictingBookings?.length > 0) {
      //     const conflictInfo = conflictingBookings[0]
      //     setConflictWarning(
      //       `⚠️ Possibile conflitto: ${conflictingBookings.length} prenotazioni sovrapposte. ` +
      //       `Capacità rimanente: ${availableCapacity}/${maxVenueCapacity} persone`
      //     )
      //   } else if (availableCapacity < formData.partySize) {
      //     setConflictWarning(
      //       `❌ Capacità insufficiente: servono ${formData.partySize} posti, disponibili solo ${availableCapacity}/${maxVenueCapacity}`
      //     )
      //   } else {
      //     setConflictWarning(null)
      //   }
      // }
      
      // Per ora non controlliamo i conflitti
      setConflictWarning(null)
      
    } catch (error) {
      console.error('Errore controllo conflitti:', error)
      // Non mostrare errore all'utente per non disturbare l'UX
      setConflictWarning(null)
    } finally {
      setIsCheckingConflicts(false)
    }
  }

  // Handle booking mode change
  const handleBookingModeChange = (newMode: 'match' | 'generic') => {
    setBookingMode(newMode)
    setIsGenericBooking(newMode === 'generic')
    
    // Reset relevant form fields when switching modes
    if (newMode === 'generic') {
      // When switching to generic, clear any match-specific preselections
      setFormData(prev => ({
        ...prev,
        date: null,
        timeSlot: null
      }))
    } else if (newMode === 'match' && matchInfo) {
      // When switching to match mode, restore match preselections
      setFormData(prev => ({
        ...prev,
        date: preselectedDate || null,
        timeSlot: preselectedTimeSlot || null
      }))
    }
    
    // Clear errors when switching modes
    setErrors({})
    setCapacityWarning(null)
    setConflictWarning(null)
  }

  // Check if booking summary should be shown
  const shouldShowSummary = formData.date && formData.timeSlot && formData.partySize && formData.duration && formData.customerName && formData.customerEmail && formData.customerPhone

  // Modal Component separato usando Portal per evitare conflitti DOM
  const ConfirmationModal = () => {
    console.log('🔍 DEBUG ConfirmationModal: showSummary =', showSummary)
    
    if (!showSummary) return null;

    try {
      // Usa document.body direttamente ma in modo sicuro
      console.log('🎯 MODAL: Rendering modal portal');
      return createPortal(
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleBackToForm}
          style={{ pointerEvents: isSubmitting ? 'none' : 'auto' }} // Disabilita interazioni durante submit
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="bg-orange-500 text-white p-6 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <CalendarIcon className="h-6 w-6" />
            Riepilogo Prenotazione
                </h2>
                <button
                  onClick={handleBackToForm}
                  className="text-white hover:bg-orange-400 rounded-full p-2 transition-colors"
                  type="button"
                  disabled={isSubmitting}
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-orange-100 mt-2">Controlla i dettagli prima di confermare definitivamente</p>
            </div>

            {/* Contenuto del Riepilogo */}
            <div className="p-6 space-y-6">
              {/* Venue Info */}
              <div className="text-center border-b border-gray-200 pb-6">
                <h3 className="text-2xl font-bold text-gray-900">{venueName}</h3>
                <p className="text-gray-600 text-lg">Prenotazione tavolo</p>
              </div>

              {/* Dettagli Prenotazione */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CalendarIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
                      <p className="font-semibold text-gray-800">Data e Orario</p>
                      <p className="text-gray-600">
                        {formData.date && format(formData.date, 'EEEE, dd MMMM yyyy', { locale: it })}
                      </p>
                      <p className="text-lg font-medium text-gray-900">
                        {formData.timeSlot?.start} - {formData.timeSlot?.start && new Date(new Date(`2000-01-01 ${formData.timeSlot.start}`).getTime() + formData.duration * 60 * 60 * 1000).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <ClockIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
                      <p className="font-semibold text-gray-800">Durata</p>
              <p className="text-gray-900">{formData.duration} {formData.duration === 1 ? 'ora' : 'ore'}</p>
            </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-orange-600" />
            </div>
            <div>
                      <p className="font-semibold text-gray-800">Numero Persone</p>
              <p className="text-gray-900">{formData.partySize} {formData.partySize === 1 ? 'persona' : 'persone'}</p>
            </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-orange-600" />
            </div>
            <div>
                      <p className="font-semibold text-gray-800">Cliente</p>
              <p className="text-gray-900">{formData.customerName}</p>
            </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MailIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
                      <p className="font-semibold text-gray-800">Email</p>
                      <p className="text-gray-900 break-all">{formData.customerEmail}</p>
            </div>
          </div>
          
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <PhoneIcon className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Telefono</p>
                      <p className="text-gray-900">{formData.customerPhone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Richieste Speciali */}
          {formData.specialRequests && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquareIcon className="h-5 w-5 text-orange-600" />
                    </div>
            <div>
                      <p className="font-semibold text-gray-800">Richieste Speciali</p>
                      <p className="text-gray-900 break-words">{formData.specialRequests}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Match e Ricorrenza */}
              {(matchInfo || formData.isRecurring) && (
                <div className="border-t border-gray-200 pt-6 space-y-4">
                  {matchInfo && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="font-semibold text-blue-800">Prenotazione per Partita</p>
                      <p className="text-blue-600">
                        {matchInfo.homeTeam} vs {matchInfo.awayTeam}
                        {matchInfo.league && ` - ${matchInfo.league}`}
                      </p>
            </div>
          )}

          {formData.isRecurring && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="font-semibold text-amber-800">Prenotazione Ricorrente</p>
                      <p className="text-amber-600">
                        Frequenza: {formData.recurringFrequency === 'weekly' ? 'Settimanale' : 
                 formData.recurringFrequency === 'monthly' ? 'Mensile' : 'Quindicinale'}
                {formData.recurringEndDate && ` fino al ${format(formData.recurringEndDate, 'dd/MM/yyyy')}`}
                {formData.recurringOccurrences > 0 && ` per ${formData.recurringOccurrences} ripetizioni`}
              </p>
                    </div>
                  )}
            </div>
          )}

              {/* Nota Importante */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Importante:</strong> Riceverai una email di conferma all'indirizzo fornito. 
                  La prenotazione sarà valida solo dopo la conferma da parte del locale.
                </p>
              </div>
            </div>

            {/* Footer con bottoni */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToForm}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Modifica
                </Button>
                <Button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Confermando...</span>
                    </div>
                  ) : (
                    'Conferma Definitiva'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      );
    } catch (error) {
      console.error('🚨 MODAL: Errore nel rendering del Portal:', error);
      // Fallback: render inline se il portal fallisce
      return (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleBackToForm}
          style={{ pointerEvents: isSubmitting ? 'none' : 'auto' }} // Disabilita interazioni durante submit
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="bg-orange-500 text-white p-6 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <CalendarIcon className="h-6 w-6" />
                  Riepilogo Prenotazione
                </h2>
                <button
                  onClick={handleBackToForm}
                  className="text-white hover:bg-orange-400 rounded-full p-2 transition-colors"
                  type="button"
                  disabled={isSubmitting}
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-orange-100 mt-2">Controlla i dettagli prima di confermare definitivamente</p>
            </div>

            {/* Contenuto del Riepilogo */}
            <div className="p-6 space-y-6">
              {/* Venue Info */}
              <div className="text-center border-b border-gray-200 pb-6">
                <h3 className="text-2xl font-bold text-gray-900">{venueName}</h3>
                <p className="text-gray-600 text-lg">Prenotazione tavolo</p>
              </div>

              {/* Dettagli Prenotazione */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CalendarIcon className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Data e Orario</p>
                      <p className="text-gray-600">
                        {formData.date && format(formData.date, 'EEEE, dd MMMM yyyy', { locale: it })}
                      </p>
                      <p className="text-lg font-medium text-gray-900">
                        {formData.timeSlot?.start} - {formData.timeSlot?.start && new Date(new Date(`2000-01-01 ${formData.timeSlot.start}`).getTime() + formData.duration * 60 * 60 * 1000).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <ClockIcon className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Durata</p>
                      <p className="text-gray-900">{formData.duration} {formData.duration === 1 ? 'ora' : 'ore'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Numero Persone</p>
                      <p className="text-gray-900">{formData.partySize} {formData.partySize === 1 ? 'persona' : 'persone'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Cliente</p>
                      <p className="text-gray-900">{formData.customerName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MailIcon className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Email</p>
                      <p className="text-gray-900 break-all">{formData.customerEmail}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <PhoneIcon className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Telefono</p>
                      <p className="text-gray-900">{formData.customerPhone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Richieste Speciali */}
              {formData.specialRequests && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquareIcon className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Richieste Speciali</p>
                      <p className="text-gray-900 break-words">{formData.specialRequests}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Match e Ricorrenza */}
              {(matchInfo || formData.isRecurring) && (
                <div className="border-t border-gray-200 pt-6 space-y-4">
          {matchInfo && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="font-semibold text-blue-800">Prenotazione per Partita</p>
                      <p className="text-blue-600">
                {matchInfo.homeTeam} vs {matchInfo.awayTeam}
                {matchInfo.league && ` - ${matchInfo.league}`}
              </p>
            </div>
          )}

                  {formData.isRecurring && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="font-semibold text-amber-800">Prenotazione Ricorrente</p>
                      <p className="text-amber-600">
                        Frequenza: {formData.recurringFrequency === 'weekly' ? 'Settimanale' : 
                                   formData.recurringFrequency === 'monthly' ? 'Mensile' : 'Quindicinale'}
                        {formData.recurringEndDate && ` fino al ${format(formData.recurringEndDate, 'dd/MM/yyyy')}`}
                        {formData.recurringOccurrences > 0 && ` per ${formData.recurringOccurrences} ripetizioni`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Nota Importante */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Importante:</strong> Riceverai una email di conferma all'indirizzo fornito. 
                  La prenotazione sarà valida solo dopo la conferma da parte del locale.
                </p>
              </div>
            </div>

            {/* Footer con bottoni */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToForm}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Modifica
                </Button>
                <Button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Confermando...</span>
                    </div>
                  ) : (
                    'Conferma Definitiva'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // Enhanced error message component
  const renderErrorMessage = (field: string) => {
    if (!errors[field]) return null

    const errorIcons = {
      date: CalendarIcon,
      timeSlot: ClockIcon,
      partySize: Users,
      customerEmail: MailIcon,
      customerPhone: PhoneIcon,
      general: MessageSquareIcon
    }

    const IconComponent = errorIcons[field as keyof typeof errorIcons] || MessageSquareIcon

    return (
      <Alert className="border-red-200 bg-red-50 mt-2">
        <IconComponent className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          {errors[field]}
        </AlertDescription>
      </Alert>
    )
  }

  // Check if date should be disabled in calendar
  const isDateDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Disable past dates
    if (date < today) return true
    
    // Disable dates beyond booking limit
    if (date > maxDate) return true
    
    // Could add venue-specific closed dates here
    const dayOfWeek = date.getDay()
    // Example: disable Mondays (0 = Sunday, 1 = Monday)
    // if (dayOfWeek === 1) return true
    
    return false
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Match Information Display - for match-based bookings */}
        {fixtureId && matchInfo && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h3 className="font-semibold text-blue-900">Prenotazione per Partita</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-3">
                <span className="font-medium text-gray-900">{matchInfo.homeTeam || 'Squadra Casa'}</span>
                <span className="text-gray-500 font-bold">VS</span>
                <span className="font-medium text-gray-900">{matchInfo.awayTeam || 'Squadra Ospite'}</span>
              </div>
              
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                {matchInfo.league && (
                  <span className="bg-white px-2 py-1 rounded border">{matchInfo.league}</span>
                )}
                {matchInfo.time && (
                  <span className="bg-white px-2 py-1 rounded border">{matchInfo.time}</span>
                )}
                {formData.date && (
                  <span className="bg-white px-2 py-1 rounded border">
                    {format(formData.date, "dd/MM/yyyy", { locale: it })}
                  </span>
                )}
              </div>
            </div>
            
            <div className="mt-3 text-xs text-blue-700 bg-blue-100 rounded px-2 py-1">
              📌 Data e orario sono preimpostati per questa partita
            </div>
          </div>
        )}

        {/* Booking Type Toggle - only for generic bookings */}
        {!fixtureId && (
          <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg">
            <Button
              type="button"
              variant={bookingMode === 'generic' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleBookingModeChange('generic')}
            >
              Prenotazione Libera
            </Button>
            <Button
              type="button"
              variant={bookingMode === 'match' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleBookingModeChange('match')}
            >
              Per una Partita
            </Button>
          </div>
        )}

        {/* Calendar Section */}
        {isAdvancedMode && bookingMode === 'generic' ? (
          <div className="space-y-2">
            <Label>Seleziona data e orario</Label>
            <CalendarComponent
              events={calendarEvents}
              selectedDate={formData.date || undefined}
              onSelectDate={handleCalendarDateSelect}
              onSelectEvent={handleCalendarEventSelect}
              minDate={today}
              maxDate={maxDate}
              height={400}
              className="border rounded-lg"
            />
            {renderErrorMessage('date')}
          </div>
        ) : (
          // Simple Date Selection (existing implementation)
          <div className="space-y-3 mb-6 booking-form-field">
            <Label htmlFor="date" className="text-sm font-medium text-gray-700">Data *</Label>
            <div className="relative">
              <Popover modal={true} open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isDatePickerOpen}
                    className={cn(
                      "w-full justify-start text-left font-normal h-12 px-4 py-3",
                      !formData.date && "text-muted-foreground",
                      errors.date && "border-red-500",
                      "hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500",
                      "transition-colors duration-200",
                      "border-2 border-gray-300 hover:border-orange-400"
                    )}
                    type="button"
                    data-testid="date-picker-trigger"
                  >
                    <CalendarIcon className="mr-2 h-5 w-5 flex-shrink-0 text-orange-500" />
                    <span className="truncate text-base">
                      {formData.date ? format(formData.date, "PPP", { locale: it }) : "Clicca qui per selezionare una data"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0 z-popover" 
                  align="start"
                  side="bottom"
                  sideOffset={8}
                  collisionPadding={10}
                >
                  <Calendar
                    mode="single"
                    selected={formData.date || undefined}
                    onSelect={(date) => {
                      console.log('Date selected:', date);
                      if (date) {
                          updateField('date', date);
                      }
                      setIsDatePickerOpen(false);
                    }}
                    disabled={(date) => isDateDisabled(date)}
                    initialFocus
                    locale={it}
                  />
                </PopoverContent>
              </Popover>
            </div>
            {renderErrorMessage('date')}
          </div>
        )}

        {/* Time Slot Selection */}
        {formData.date && (
          <div className="space-y-2">
            <Label htmlFor="timeSlot">Seleziona orario</Label>
            {isLoadingSlots ? (
              <div className="flex items-center gap-2 p-4 text-center text-gray-500">
                <div className="animate-spin h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full"></div>
                <span>Caricamento orari disponibili...</span>
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((slot) => (
                  <Button
                    key={`${slot.start}-${slot.end}`}
                    type="button"
                    variant={formData.timeSlot?.start === slot.start ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateField('timeSlot', slot)}
                    className="justify-center"
                  >
                    {slot.start}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Nessun orario disponibile per questa data
              </p>
            )}
            {renderErrorMessage('timeSlot')}
            
            {/* Conflict checking indicator */}
            {isCheckingConflicts && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="animate-spin h-3 w-3 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                <span>Controllo disponibilità...</span>
              </div>
            )}
          </div>
        )}

        {/* Duration Selection */}
        <div className="space-y-2">
          <Label htmlFor="duration">Durata prenotazione</Label>
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-gray-500" />
            <Select
              value={formData.duration.toString()}
              onValueChange={(value) => updateField('duration', parseInt(value))}
            >
              <SelectTrigger className={errors.duration ? "border-red-500" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 ora</SelectItem>
                <SelectItem value="2">2 ore</SelectItem>
                <SelectItem value="3">3 ore</SelectItem>
                <SelectItem value="4">4 ore</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {renderErrorMessage('duration')}
        </div>

        {/* Capacity Warning */}
        {capacityWarning && (
          <Alert className={capacityWarning.includes('⚠️') ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}>
            <AlertDescription className={capacityWarning.includes('⚠️') ? 'text-red-800' : 'text-yellow-800'}>
              {capacityWarning}
            </AlertDescription>
          </Alert>
        )}

        {/* Party Size */}
        <div className="space-y-3 mb-6 booking-form-field">
          <Label htmlFor="partySize" className="text-sm font-medium text-gray-700">Numero persone *</Label>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <Select
              value={formData.partySize.toString()}
              onValueChange={(value) => updateField('partySize', parseInt(value))}
            >
              <SelectTrigger className={cn(
                "h-11",
                errors.partySize ? "border-red-500" : "",
                "focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              )}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[50]">
                {Array.from(
                  { length: defaultBookingSettings.maximumPartySize - defaultBookingSettings.minimumPartySize + 1 },
                  (_, i) => defaultBookingSettings.minimumPartySize + i
                ).map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size} {size === 1 ? 'persona' : 'persone'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {renderErrorMessage('partySize')}
        </div>

        {/* Table Preference */}
        <div className="space-y-2">
          <Label htmlFor="tablePreference">Preferenza tavolo</Label>
          <Select
            value={formData.tablePreference}
            onValueChange={(value: BookingTablePreference) => updateField('tablePreference', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Qualsiasi</SelectItem>
              <SelectItem value="near_screen">Vicino agli schermi</SelectItem>
              <SelectItem value="quiet_area">Zona tranquilla</SelectItem>
              <SelectItem value="outdoor">All'esterno</SelectItem>
              <SelectItem value="bar_area">Area bar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Customer Information */}
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Informazioni di contatto</h3>
          
          <div className="space-y-2">
            <Label htmlFor="customerName">Nome completo *</Label>
            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                id="customerName"
                type="text"
                placeholder="Il tuo nome"
                value={formData.customerName}
                onChange={(e) => updateField('customerName', e.target.value)}
                className={cn("pl-10", errors.customerName && "border-red-500")}
              />
            </div>
            {renderErrorMessage('customerName')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerEmail">Email *</Label>
            <div className="relative">
              <MailIcon className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                id="customerEmail"
                type="email"
                placeholder="la.tua@email.com"
                value={formData.customerEmail}
                onChange={(e) => updateField('customerEmail', e.target.value)}
                className={cn("pl-10", errors.customerEmail && "border-red-500")}
              />
            </div>
            {renderErrorMessage('customerEmail')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone">Telefono *</Label>
            <div className="relative">
              <PhoneIcon className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                id="customerPhone"
                type="tel"
                placeholder="+39 123 456 7890"
                value={formData.customerPhone}
                onChange={(e) => updateField('customerPhone', e.target.value)}
                className={cn("pl-10", errors.customerPhone && "border-red-500")}
              />
            </div>
            {renderErrorMessage('customerPhone')}
          </div>
        </div>

        {/* Special Requests */}
        <div className="space-y-2">
          <Label htmlFor="specialRequests">Richieste speciali</Label>
          <div className="relative">
            <MessageSquareIcon className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <Textarea
              id="specialRequests"
              placeholder="Eventuali richieste particolari..."
              value={formData.specialRequests}
              onChange={(e) => updateField('specialRequests', e.target.value)}
              className="pl-10 min-h-[80px]"
              rows={3}
            />
          </div>
        </div>

        {/* Recurring Booking Options */}
        <div className="space-y-2">
          <Label htmlFor="isRecurring">Prenotazione ricorrente</Label>
          <Select
            value={formData.isRecurring ? 'true' : 'false'}
            onValueChange={(value) => updateField('isRecurring', value === 'true')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">No - Prenotazione singola</SelectItem>
              <SelectItem value="true">Sì - Prenotazione ricorrente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Recurring Details - only show if recurring is enabled */}
        {formData.isRecurring && (
          <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-medium text-amber-900">Opzioni ricorrenza</h4>
            
            {/* Frequency Selection */}
            <div className="space-y-2">
              <Label htmlFor="recurringFrequency">Frequenza</Label>
              <Select
                value={formData.recurringFrequency}
                onValueChange={(value: 'weekly' | 'monthly' | 'biweekly') => 
                  updateField('recurringFrequency', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Settimanale (ogni settimana)</SelectItem>
                  <SelectItem value="biweekly">Quindicinale (ogni 2 settimane)</SelectItem>
                  <SelectItem value="monthly">Mensile (ogni mese)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* End Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="recurringEndDate">Data fine ricorrenza</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.recurringEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.recurringEndDate 
                      ? format(formData.recurringEndDate, "PPP", { locale: it }) 
                      : "Seleziona data fine"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.recurringEndDate || undefined}
                    onSelect={(date) => updateField('recurringEndDate', date || null)}
                    disabled={(date) => !formData.date || date <= formData.date}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Number of Occurrences */}
            <div className="space-y-2">
              <Label htmlFor="recurringOccurrences">Numero ripetizioni (massimo 12)</Label>
              <Select
                value={formData.recurringOccurrences.toString()}
                onValueChange={(value) => updateField('recurringOccurrences', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(12)].map((_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1} {i + 1 === 1 ? 'ripetizione' : 'ripetizioni'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <AlertDescription>
                Le prenotazioni ricorrenti verranno create automaticamente. 
                Riceverai una conferma per ogni singola prenotazione.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Conflict Warning */}
        {conflictWarning && (
          <Alert className={conflictWarning.includes('⚠️') ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}>
            <AlertDescription className={conflictWarning.includes('⚠️') ? 'text-red-800' : 'text-yellow-800'}>
              {conflictWarning}
            </AlertDescription>
          </Alert>
        )}

        {/* General Errors */}
        {renderErrorMessage('general')}

        {/* Form Actions - always visible */}
        <div className="flex gap-3 pt-6 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isSubmitting}
            >
              Annulla
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-orange-500 hover:bg-orange-600"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Prenotando...</span>
              </div>
            ) : (
              'Conferma prenotazione'
            )}
          </Button>
        </div>
      </form>

      {/* MODAL RIEPILOGO CENTRATO CON SFOCATURA */}
      <ConfirmationModal />
    </>
  )
}

export default BookingForm 
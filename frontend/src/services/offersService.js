import apiClient from './apiClient'

class OffersService {
  async getAllOffers(filters = {}) {
    try {
      const queryParams = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value)
        }
      })

      const url = `/offers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const response = await apiClient.get(url)
      return response
    } catch (error) {
      console.error('Error fetching offers:', error)
      throw error
    }
  }

  async getOffersByVenue(venueId, activeOnly = false) {
    try {
      const url = `/offers/venue/${venueId}${activeOnly ? '?active=true' : ''}`
      const response = await apiClient.get(url)
      return response
    } catch (error) {
      console.error('Error fetching venue offers:', error)
      throw error
    }
  }

  async getOfferById(offerId) {
    try {
      const response = await apiClient.get(`/offers/${offerId}`)
      return response
    } catch (error) {
      console.error('Error fetching offer:', error)
      throw error
    }
  }

  async createOffer(offerData) {
    try {
      const response = await apiClient.post('/offers', offerData)
      return response
    } catch (error) {
      console.error('Error creating offer:', error)
      throw error
    }
  }

  async updateOffer(offerId, offerData) {
    try {
      const response = await apiClient.put(`/offers/${offerId}`, offerData)
      return response
    } catch (error) {
      console.error('Error updating offer:', error)
      throw error
    }
  }

  async deleteOffer(offerId) {
    try {
      const response = await apiClient.delete(`/offers/${offerId}`)
      return response
    } catch (error) {
      console.error('Error deleting offer:', error)
      throw error
    }
  }

  async updateOfferStatus(offerId, status) {
    try {
      const response = await apiClient.patch(`/offers/${offerId}/status`, { status })
      return response
    } catch (error) {
      console.error('Error updating offer status:', error)
      throw error
    }
  }

  async getOfferAnalytics(offerId) {
    try {
      const response = await apiClient.get(`/offers/${offerId}/analytics`)
      return response
    } catch (error) {
      console.error('Error fetching offer analytics:', error)
      throw error
    }
  }

  async getPredefinedTemplates() {
    try {
      const response = await apiClient.get('/offers/templates/predefined')
      return response
    } catch (error) {
      console.error('Error fetching predefined templates:', error)
      throw error
    }
  }

  // Utility methods
  formatOffer(offer) {
    return {
      ...offer,
      formattedDiscount: this.formatDiscount(offer.discount, offer.type),
      formattedValidPeriod: this.formatValidPeriod(offer.validFrom, offer.validUntil),
      statusBadge: this.getStatusBadge(offer.status),
      isExpiringSoon: this.isExpiringSoon(offer.validUntil)
    }
  }

  formatDiscount(discount, type) {
    switch (type) {
      case 'percentage':
        return `${discount.value}%`
      case 'fixed_amount':
        return `€${discount.value}`
      case 'buy_one_get_one':
        return 'BOGO'
      case 'happy_hour':
        return `${discount.value}% Happy Hour`
      case 'group_discount':
        return `${discount.value}% Gruppo`
      default:
        return `${discount.value}${discount.unit === 'percentage' ? '%' : '€'}`
    }
  }

  formatValidPeriod(validFrom, validUntil) {
    const startDate = new Date(validFrom).toLocaleDateString('it-IT')
    const endDate = new Date(validUntil).toLocaleDateString('it-IT')
    return `${startDate} - ${endDate}`
  }

  getStatusBadge(status) {
    const statusMap = {
      draft: { text: 'Bozza', color: 'bg-gray-100 text-gray-800' },
      active: { text: 'Attiva', color: 'bg-green-100 text-green-800' },
      paused: { text: 'In Pausa', color: 'bg-yellow-100 text-yellow-800' },
      expired: { text: 'Scaduta', color: 'bg-red-100 text-red-800' }
    }
    return statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' }
  }

  isExpiringSoon(validUntil, days = 7) {
    const endDate = new Date(validUntil)
    const now = new Date()
    const diffTime = endDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= days && diffDays > 0
  }

  // Validation methods - Server-side validation
  async validateOffer(offerData) {
    try {
      const response = await apiClient.post('/offers/validate', offerData)
      return response.validation
    } catch (error) {
      console.error('Validation error:', error)
      throw error
    }
  }

  async validateField(field, value, offerData = {}) {
    try {
      const response = await apiClient.post('/offers/validate-field', { 
        field, 
        value, 
        offerData 
      })
      return response.validation
    } catch (error) {
      console.error('Field validation error:', error)
      return { isValid: false, errors: ['Errore di connessione'] }
    }
  }

  // Client-side validation helpers for immediate feedback
  validateOfferData(offerData) {
    const errors = []
    const warnings = []

    // Required fields
    if (!offerData.title?.trim()) {
      errors.push('Il titolo è obbligatorio')
    } else if (offerData.title.length > 100) {
      errors.push('Il titolo non può superare i 100 caratteri')
    }

    if (!offerData.description?.trim()) {
      errors.push('La descrizione è obbligatoria')
    } else if (offerData.description.length > 500) {
      warnings.push('La descrizione è molto lunga')
    }

    if (!offerData.type) {
      errors.push('Il tipo di offerta è obbligatorio')
    }

    if (!offerData.discount?.value || offerData.discount.value <= 0) {
      errors.push('Il valore dello sconto deve essere maggiore di 0')
    } else {
      if (offerData.type === 'percentage' && offerData.discount.value > 100) {
        errors.push('La percentuale di sconto non può essere superiore al 100%')
      } else if (offerData.type === 'percentage' && offerData.discount.value > 50) {
        warnings.push('Sconto superiore al 50%')
      }
    }

    if (!offerData.validFrom) {
      errors.push('La data di inizio è obbligatoria')
    }
    if (!offerData.validUntil) {
      errors.push('La data di fine è obbligatoria')
    }

    // Date validation
    if (offerData.validFrom && offerData.validUntil) {
      const startDate = new Date(offerData.validFrom)
      const endDate = new Date(offerData.validUntil)
      const now = new Date()

      if (startDate >= endDate) {
        errors.push('La data di fine deve essere successiva alla data di inizio')
      }
      if (endDate <= now) {
        errors.push('La data di fine deve essere futura')
      }
      if (startDate < now) {
        warnings.push('L\'offerta sarà attiva immediatamente')
      }

      const durationDays = (endDate - startDate) / (1000 * 60 * 60 * 24)
      if (durationDays < 1) {
        warnings.push('Durata molto breve (meno di 1 giorno)')
      } else if (durationDays > 365) {
        warnings.push('Durata molto lunga (più di 1 anno)')
      }
    }

    // Time restrictions validation
    if (offerData.timeRestrictions?.startTime && offerData.timeRestrictions?.endTime) {
      const startTime = offerData.timeRestrictions.startTime
      const endTime = offerData.timeRestrictions.endTime
      
      if (startTime >= endTime) {
        errors.push('L\'orario di fine deve essere successivo all\'orario di inizio')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      severity: errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'success'
    }
  }

  validateDateRange(startDate, endDate) {
    const errors = []
    const warnings = []
    const now = new Date()

    if (!startDate) errors.push('Data di inizio richiesta')
    if (!endDate) errors.push('Data di fine richiesta')

    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)

      if (start >= end) {
        errors.push('La data di fine deve essere dopo quella di inizio')
      }

      if (end <= now) {
        errors.push('La data di fine deve essere futura')
      }

      if (start < now) {
        warnings.push('L\'offerta sarà attiva immediatamente')
      }

      const durationDays = (end - start) / (1000 * 60 * 60 * 24)
      if (durationDays < 1) {
        warnings.push('Durata molto breve (meno di 1 giorno)')
      } else if (durationDays > 365) {
        warnings.push('Durata molto lunga (più di 1 anno)')
      }
    }

    return { errors, warnings }
  }

  validateDiscount(type, value) {
    const errors = []
    const warnings = []

    if (!value || value <= 0) {
      errors.push('Valore sconto richiesto')
    } else {
      if (type === 'percentage') {
        if (value > 100) errors.push('Percentuale non può superare 100%')
        else if (value > 50) warnings.push('Sconto alto (>50%)')
      } else if (type === 'fixed_amount') {
        if (value > 100) warnings.push('Sconto fisso elevato')
      }
    }

    return { errors, warnings }
  }

  validateTimeRange(startTime, endTime) {
    const errors = []
    const warnings = []

    if (startTime && endTime) {
      if (startTime >= endTime) {
        errors.push('Orario fine deve essere dopo inizio')
      } else {
        const [startH, startM] = startTime.split(':').map(Number)
        const [endH, endM] = endTime.split(':').map(Number)
        const duration = (endH * 60 + endM) - (startH * 60 + startM)

        if (duration < 60) {
          warnings.push('Fascia oraria molto breve')
        } else if (duration > 12 * 60) {
          warnings.push('Fascia oraria molto ampia')
        }
      }
    }

    return { errors, warnings }
  }

  // Template helpers
  applyTemplate(templateId, baseData = {}) {
    const templates = {
      happy_hour: {
        title: 'Happy Hour',
        description: 'Sconto su bevande in fascia oraria specifica',
        type: 'percentage',
        discount: { value: 30, unit: 'percentage' },
        timeRestrictions: {
          daysOfWeek: [1, 2, 3, 4, 5], // Lun-Ven
          startTime: '17:00',
          endTime: '19:00'
        },
        applicableItems: [
          { name: 'Birre', category: 'beverages' },
          { name: 'Cocktail', category: 'beverages' }
        ],
        display: {
          backgroundColor: '#ff6b35',
          textColor: '#ffffff'
        }
      },
      derby_special: {
        title: 'Derby Special',
        description: 'Offerta speciale per eventi Derby e partite importanti',
        type: 'buy_one_get_one',
        discount: { value: 1, unit: 'item' },
        limits: {
          minimumPartySize: 2,
          minimumAmount: 15
        },
        applicableItems: [
          { name: 'Birre', category: 'beverages' },
          { name: 'Panini', category: 'food' }
        ],
        display: {
          backgroundColor: '#2563eb',
          textColor: '#ffffff'
        }
      },
      group_discount: {
        title: 'Sconto Gruppo',
        description: 'Sconto per gruppi numerosi',
        type: 'percentage',
        discount: { value: 15, unit: 'percentage' },
        limits: {
          minimumPartySize: 6
        },
        display: {
          backgroundColor: '#16a34a',
          textColor: '#ffffff'
        }
      },
      early_bird: {
        title: 'Early Bird',
        description: 'Sconto per prenotazioni anticipate',
        type: 'fixed_amount',
        discount: { value: 10, unit: 'euro' },
        limits: {
          minimumAmount: 30
        },
        display: {
          backgroundColor: '#dc2626',
          textColor: '#ffffff'
        }
      }
    }

    const template = templates[templateId]
    if (!template) {
      throw new Error(`Template ${templateId} non trovato`)
    }

    return {
      ...template,
      ...baseData,
      // Merge nested objects properly
      discount: { ...template.discount, ...baseData.discount },
      timeRestrictions: { ...template.timeRestrictions, ...baseData.timeRestrictions },
      limits: { ...template.limits, ...baseData.limits },
      display: { ...template.display, ...baseData.display }
    }
  }

  getDayName(dayIndex) {
    const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
    return days[dayIndex] || ''
  }

  formatTimeRestrictions(timeRestrictions) {
    if (!timeRestrictions) return ''

    let text = ''
    
    if (timeRestrictions.daysOfWeek?.length > 0) {
      const dayNames = timeRestrictions.daysOfWeek.map(day => this.getDayName(day))
      text += `Giorni: ${dayNames.join(', ')}`
    }

    if (timeRestrictions.startTime && timeRestrictions.endTime) {
      if (text) text += ' - '
      text += `Orario: ${timeRestrictions.startTime} - ${timeRestrictions.endTime}`
    }

    return text
  }

  // Event targeting methods
  async getAvailableLeagues() {
    try {
      const response = await apiClient.get('/offers/targeting/leagues')
      return response
    } catch (error) {
      console.error('Error fetching leagues:', error)
      throw error
    }
  }

  async getAvailableTeams() {
    try {
      const response = await apiClient.get('/offers/targeting/teams')
      return response
    } catch (error) {
      console.error('Error fetching teams:', error)
      throw error
    }
  }

  async getUpcomingFixtures(days = 30) {
    try {
      const response = await apiClient.get(`/offers/targeting/fixtures?days=${days}`)
      return response
    } catch (error) {
      console.error('Error fetching fixtures:', error)
      throw error
    }
  }

  async getOffersForEvent(venueId, fixtureId) {
    try {
      const response = await apiClient.get(`/offers/event/${fixtureId}?venue=${venueId}`)
      return response
    } catch (error) {
      console.error('Error fetching offers for event:', error)
      throw error
    }
  }

  async triggerAutoActivation() {
    try {
      const response = await apiClient.post('/offers/auto-activation/process')
      return response
    } catch (error) {
      console.error('Error triggering auto-activation:', error)
      throw error
    }
  }
}

export const offersService = new OffersService()
export default offersService 
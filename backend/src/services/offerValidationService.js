const Offer = require('../models/Offer')
const Fixture = require('../models/Fixture')

class OfferValidationService {
  /**
   * Validate offer data comprehensively
   */
  async validateOffer(offerData, existingOfferId = null) {
    const errors = []
    const warnings = []

    // Basic field validation
    const basicValidation = this.validateBasicFields(offerData)
    errors.push(...basicValidation.errors)
    warnings.push(...basicValidation.warnings)

    // Date and time validation
    const dateValidation = this.validateDatesAndTimes(offerData)
    errors.push(...dateValidation.errors)
    warnings.push(...dateValidation.warnings)

    // Event targeting validation
    if (offerData.eventTargeting?.enabled) {
      const eventValidation = await this.validateEventTargeting(offerData)
      errors.push(...eventValidation.errors)
      warnings.push(...eventValidation.warnings)
    }

    // Business logic validation
    const businessValidation = this.validateBusinessLogic(offerData)
    errors.push(...businessValidation.errors)
    warnings.push(...businessValidation.warnings)

    // Overlap validation (only for venue offers)
    if (offerData.venue) {
      const overlapValidation = await this.validateOverlaps(offerData, existingOfferId)
      errors.push(...overlapValidation.errors)
      warnings.push(...overlapValidation.warnings)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      severity: errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'success'
    }
  }

  /**
   * Validate basic required fields
   */
  validateBasicFields(offerData) {
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
      warnings.push('La descrizione è molto lunga, considera di accorciarla')
    }

    if (!offerData.type) {
      errors.push('Il tipo di offerta è obbligatorio')
    }

    // Discount validation
    if (!offerData.discount?.value || offerData.discount.value <= 0) {
      errors.push('Il valore dello sconto deve essere maggiore di 0')
    } else {
      if (offerData.type === 'percentage' && offerData.discount.value > 100) {
        errors.push('La percentuale di sconto non può essere superiore al 100%')
      }
      if (offerData.type === 'percentage' && offerData.discount.value > 50) {
        warnings.push('Sconto superiore al 50%: verifica che sia sostenibile economicamente')
      }
      if (offerData.type === 'fixed_amount' && offerData.discount.value > 100) {
        warnings.push('Sconto fisso elevato: verifica l\'impatto economico')
      }
    }

    return { errors, warnings }
  }

  /**
   * Validate dates and times
   */
  validateDatesAndTimes(offerData) {
    const errors = []
    const warnings = []
    const now = new Date()

    // Date validation
    if (!offerData.validFrom) {
      errors.push('La data di inizio è obbligatoria')
    }
    if (!offerData.validUntil) {
      errors.push('La data di fine è obbligatoria')
    }

    if (offerData.validFrom && offerData.validUntil) {
      const startDate = new Date(offerData.validFrom)
      const endDate = new Date(offerData.validUntil)

      // Date logic validation
      if (startDate >= endDate) {
        errors.push('La data di fine deve essere successiva alla data di inizio')
      }

      // Past date validation
      if (endDate <= now) {
        errors.push('La data di fine deve essere futura')
      }

      if (startDate < now) {
        warnings.push('La data di inizio è nel passato, l\'offerta sarà attiva immediatamente')
      }

      // Duration validation
      const durationMs = endDate - startDate
      const durationDays = durationMs / (1000 * 60 * 60 * 24)

      if (durationDays < 1) {
        warnings.push('Durata dell\'offerta inferiore a 1 giorno')
      } else if (durationDays > 365) {
        warnings.push('Durata dell\'offerta superiore a 1 anno')
      }

      // Weekend/holiday considerations
      const isStartWeekend = startDate.getDay() === 0 || startDate.getDay() === 6
      const isEndWeekend = endDate.getDay() === 0 || endDate.getDay() === 6

      if (isStartWeekend && durationDays <= 3) {
        warnings.push('L\'offerta inizia nel weekend e ha durata breve')
      }
    }

    // Time restrictions validation
    if (offerData.timeRestrictions) {
      const timeValidation = this.validateTimeRestrictions(offerData.timeRestrictions)
      errors.push(...timeValidation.errors)
      warnings.push(...timeValidation.warnings)
    }

    return { errors, warnings }
  }

  /**
   * Validate time restrictions
   */
  validateTimeRestrictions(timeRestrictions) {
    const errors = []
    const warnings = []

    // Time range validation
    if (timeRestrictions.startTime && timeRestrictions.endTime) {
      const startTime = timeRestrictions.startTime
      const endTime = timeRestrictions.endTime

      if (startTime >= endTime) {
        errors.push('L\'orario di fine deve essere successivo all\'orario di inizio')
      }

      // Duration warning
      const [startHour, startMin] = startTime.split(':').map(Number)
      const [endHour, endMin] = endTime.split(':').map(Number)
      const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin)

      if (durationMinutes < 60) {
        warnings.push('Fascia oraria molto breve (meno di 1 ora)')
      } else if (durationMinutes > 12 * 60) {
        warnings.push('Fascia oraria molto ampia (più di 12 ore)')
      }
    }

    // Days of week validation
    if (timeRestrictions.daysOfWeek) {
      if (timeRestrictions.daysOfWeek.length === 0) {
        warnings.push('Nessun giorno selezionato per le restrizioni orarie')
      } else if (timeRestrictions.daysOfWeek.length === 1) {
        warnings.push('Offerta attiva solo un giorno alla settimana')
      }

      // Check for valid day numbers (0-6)
      const invalidDays = timeRestrictions.daysOfWeek.filter(day => day < 0 || day > 6)
      if (invalidDays.length > 0) {
        errors.push('Giorni della settimana non validi')
      }
    }

    return { errors, warnings }
  }

  /**
   * Validate event targeting configuration
   */
  async validateEventTargeting(offerData) {
    const errors = []
    const warnings = []

    const targeting = offerData.eventTargeting

    // Check if at least one targeting method is configured
    const hasFixtures = targeting.fixtures && targeting.fixtures.length > 0
    const hasLeagues = targeting.leagues && targeting.leagues.length > 0
    const hasTeams = targeting.teams && targeting.teams.length > 0

    if (!hasFixtures && !hasLeagues && !hasTeams) {
      errors.push('Seleziona almeno un criterio di targeting (eventi, leghe o squadre)')
    }

    // Validate specific fixtures
    if (hasFixtures) {
      try {
        const validFixtures = await Fixture.find({
          _id: { $in: targeting.fixtures },
          isActive: true
        })

        if (validFixtures.length !== targeting.fixtures.length) {
          errors.push('Alcuni eventi selezionati non sono validi o non sono più attivi')
        }

        // Check if fixtures are in the future
        const now = new Date()
        const pastFixtures = validFixtures.filter(f => new Date(f.date) < now)
        if (pastFixtures.length > 0) {
          warnings.push(`${pastFixtures.length} eventi selezionati sono già terminati`)
        }

        // Check fixture alignment with offer dates
        if (offerData.validFrom && offerData.validUntil) {
          const offerStart = new Date(offerData.validFrom)
          const offerEnd = new Date(offerData.validUntil)

          const fixturesOutsideRange = validFixtures.filter(f => {
            const fixtureDate = new Date(f.date)
            return fixtureDate < offerStart || fixtureDate > offerEnd
          })

          if (fixturesOutsideRange.length > 0) {
            warnings.push(`${fixturesOutsideRange.length} eventi sono fuori dal periodo di validità dell'offerta`)
          }
        }
      } catch (error) {
        errors.push('Errore nella validazione degli eventi selezionati')
      }
    }

    // Auto-activation validation
    if (targeting.autoActivation?.enabled) {
      if (!targeting.autoActivation.minutesBefore || targeting.autoActivation.minutesBefore < 0) {
        errors.push('Specifica i minuti prima dell\'evento per l\'auto-attivazione')
      }
      if (!targeting.autoActivation.minutesAfter || targeting.autoActivation.minutesAfter < 0) {
        errors.push('Specifica i minuti dopo l\'evento per l\'auto-disattivazione')
      }

      if (targeting.autoActivation.minutesBefore > 24 * 60) {
        warnings.push('Auto-attivazione più di 24 ore prima dell\'evento')
      }
      if (targeting.autoActivation.minutesAfter > 6 * 60) {
        warnings.push('Auto-disattivazione più di 6 ore dopo l\'evento')
      }
    }

    return { errors, warnings }
  }

  /**
   * Validate business logic rules
   */
  validateBusinessLogic(offerData) {
    const errors = []
    const warnings = []

    // Limits validation
    if (offerData.limits) {
      const limits = offerData.limits

      if (limits.minimumPartySize && limits.minimumPartySize < 1) {
        errors.push('Il numero minimo di persone deve essere almeno 1')
      }
      if (limits.minimumPartySize && limits.minimumPartySize > 50) {
        warnings.push('Numero minimo di persone molto elevato (>50)')
      }

      if (limits.minimumAmount && limits.minimumAmount < 0) {
        errors.push('L\'importo minimo non può essere negativo')
      }
      if (limits.minimumAmount && limits.minimumAmount > 1000) {
        warnings.push('Importo minimo molto elevato (>€1000)')
      }

      if (limits.usagePerCustomer && limits.usagePerCustomer < 1) {
        errors.push('Gli utilizzi per cliente devono essere almeno 1')
      }
      if (limits.usagePerCustomer && limits.usagePerCustomer > 10) {
        warnings.push('Molti utilizzi per cliente (>10)')
      }

      if (limits.totalUsage && limits.totalUsage < 1) {
        errors.push('Gli utilizzi totali devono essere almeno 1')
      }
    }

    // Type-specific validation
    if (offerData.type === 'buy_one_get_one' && offerData.limits?.minimumPartySize < 2) {
      warnings.push('Per offerte "Prendi 2 Paghi 1" considera di richiedere almeno 2 persone')
    }

    if (offerData.type === 'group_discount' && offerData.limits?.minimumPartySize < 4) {
      warnings.push('Per sconti gruppo considera di richiedere almeno 4 persone')
    }

    return { errors, warnings }
  }

  /**
   * Check for overlapping offers
   */
  async validateOverlaps(offerData, existingOfferId = null) {
    const errors = []
    const warnings = []

    try {
      const query = {
        venue: offerData.venue,
        status: { $in: ['active', 'draft'] }
      }

      if (existingOfferId) {
        query._id = { $ne: existingOfferId }
      }

      // Find overlapping time periods
      if (offerData.validFrom && offerData.validUntil) {
        query.$or = [
          {
            validFrom: { $lt: new Date(offerData.validUntil) },
            validUntil: { $gt: new Date(offerData.validFrom) }
          }
        ]
      }

      const overlappingOffers = await Offer.find(query)

      if (overlappingOffers.length > 0) {
        // Check for exact same type overlaps
        const sameTypeOverlaps = overlappingOffers.filter(offer => offer.type === offerData.type)
        if (sameTypeOverlaps.length > 0) {
          warnings.push(`${sameTypeOverlaps.length} offerte dello stesso tipo sono attive nello stesso periodo`)
        }

        // Check for conflicting discounts
        const highDiscountOverlaps = overlappingOffers.filter(offer => {
          if (offer.type === 'percentage' && offerData.type === 'percentage') {
            return (offer.discount.value + offerData.discount.value) > 70
          }
          return false
        })

        if (highDiscountOverlaps.length > 0) {
          warnings.push('La combinazione di sconti potrebbe essere troppo elevata')
        }

        // Check for applicable items conflicts
        if (offerData.applicableItems && offerData.applicableItems.length > 0) {
          const itemConflicts = overlappingOffers.filter(offer => {
            if (!offer.applicableItems || offer.applicableItems.length === 0) return false
            
            return offer.applicableItems.some(item1 => 
              offerData.applicableItems.some(item2 => 
                item1.category === item2.category || item1.name === item2.name
              )
            )
          })

          if (itemConflicts.length > 0) {
            warnings.push('Altre offerte potrebbero applicarsi agli stessi prodotti')
          }
        }
      }

    } catch (error) {
      warnings.push('Impossibile verificare sovrapposizioni con altre offerte')
    }

    return { errors, warnings }
  }

  /**
   * Quick validation for real-time frontend feedback
   */
  quickValidate(field, value, offerData = {}) {
    const errors = []

    switch (field) {
      case 'title':
        if (!value?.trim()) errors.push('Il titolo è obbligatorio')
        else if (value.length > 100) errors.push('Massimo 100 caratteri')
        break

      case 'discount':
        if (!value?.value || value.value <= 0) {
          errors.push('Valore richiesto')
        } else if (offerData.type === 'percentage' && value.value > 100) {
          errors.push('Massimo 100%')
        }
        break

      case 'validFrom':
        if (!value) errors.push('Data richiesta')
        else if (new Date(value) < new Date()) errors.push('Data futura richiesta')
        break

      case 'validUntil':
        if (!value) errors.push('Data richiesta')
        else if (offerData.validFrom && new Date(value) <= new Date(offerData.validFrom)) {
          errors.push('Deve essere dopo l\'inizio')
        }
        break

      case 'timeRange':
        if (value.start && value.end && value.start >= value.end) {
          errors.push('Orario fine deve essere dopo inizio')
        }
        break
    }

    return { isValid: errors.length === 0, errors }
  }
}

module.exports = new OfferValidationService() 
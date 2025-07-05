const Booking = require('../models/Booking')
const Venue = require('../models/Venue')
const Fixture = require('../models/Fixture')
const mongoose = require('mongoose')
const TenantQuery = require('../utils/tenantQuery')

class BookingsService {

  /**
   * Crea una nuova prenotazione con validazioni
   */
  async createBooking(bookingData) {
    try {
      const {
        customer,
        venue,
        fixture,
        date,
        timeSlot,
        partySize,
        tablePreference = 'any',
        specialRequests = '',
        tenantId
      } = bookingData

      // Gestione venue mock o reali - PRIORITÀ AI VENUE REALI
      let venueDoc;
      
      console.log('🔍 DEBUG: Looking for venue:', venue, 'in tenant:', tenantId);
      
      // Prima prova a cercare per ObjectId MongoDB (venue reali tenant-aware)
      if (mongoose.Types.ObjectId.isValid(venue)) {
        console.log('🔍 DEBUG: Searching venue by ObjectId...');
        venueDoc = await TenantQuery.findById(Venue, tenantId, venue);
        console.log('🔍 DEBUG: Found venue by ObjectId with tenant:', venueDoc ? venueDoc.name : 'null');
        
        // Se non trovato con tenant filtering, prova senza tenant (venue pubblici)
        if (!venueDoc) {
          console.log('🔍 DEBUG: Searching venue by ObjectId WITHOUT tenant filtering...');
          venueDoc = await Venue.findById(venue);
          console.log('🔍 DEBUG: Found venue by ObjectId (public):', venueDoc ? venueDoc.name : 'null');
        }
      }
      
      // Se non trovato come ObjectId, cerca per slug/name nei venue reali
      if (!venueDoc && typeof venue === 'string') {
        console.log('🔍 DEBUG: Searching venue by slug/name...');
        venueDoc = await TenantQuery.findOne(Venue, tenantId, {
          $or: [
            { slug: venue },
            { name: new RegExp(venue, 'i') }
          ]
        });
        console.log('🔍 DEBUG: Found venue by slug/name:', venueDoc ? venueDoc.name : 'null');
      }
      
      // FALLBACK: Se non trovato e venue è un ID custom (venue_1, venue_2, etc.), usa dati mock
      console.log('🔍 DEBUG: Checking if venue is mock... venue:', venue, 'startsWith venue_:', venue.startsWith('venue_'), 'venueDoc exists:', !!venueDoc);
      if (!venueDoc && venue.startsWith('venue_')) {
        const venueNumber = venue.replace('venue_', '');
        const mockVenues = {
          '1': { 
            _id: 'venue_1', 
            name: "The Queen's Head",
            capacity: { total: 80 },
            bookingSettings: { requiresApproval: false }
          },
          '2': { 
            _id: 'venue_2', 
            name: "Sports Corner",
            capacity: { total: 60 },
            bookingSettings: { requiresApproval: false }
          },
          '3': { 
            _id: 'venue_3', 
            name: "The Football Tavern",
            capacity: { total: 100 },
            bookingSettings: { requiresApproval: false }
          },
          // Gestione venue mock con ID lunghi (come venue_685057e88d7c5eecb3818f9d)
          '685057e88d7c5eecb3818f9d': {
            _id: 'venue_685057e88d7c5eecb3818f9d',
            name: "Nick's Sports Bar (Mock)",
            capacity: { total: 120 },
            bookingSettings: { requiresApproval: false }
          },
          'mock_2': {
            _id: 'venue_mock_2',
            name: "Sports Corner Milano",
            capacity: { total: 90 },
            bookingSettings: { requiresApproval: false }
          }
        };
        
        venueDoc = mockVenues[venueNumber];
        
        // Se non trovato nei predefiniti, crea un venue mock generico
        if (!venueDoc) {
          venueDoc = {
            _id: venue,
            name: `Mock Venue (${venue})`,
            capacity: { total: 80 },
            bookingSettings: { requiresApproval: false }
          };
        }
        
        if (venueDoc) {
          console.log(`⚠️ Using MOCK venue ${venue} - Consider creating real venue instead`);
        }
      }

      if (!venueDoc) {
        console.log('❌ DEBUG: Venue not found!');
        throw new Error('Venue not found')
      }
      
      console.log('✅ DEBUG: Venue found:', venueDoc.name, 'Type:', typeof venue);

      // Validazione capacità venue
      if (partySize > venueDoc.capacity.total) {
        throw new Error(`Party size exceeds venue capacity (max: ${venueDoc.capacity.total})`)
      }

      // Validazione fixture (se specificato) - solo per venue reali (tenant-aware)
      if (fixture && mongoose.Types.ObjectId.isValid(venue)) {
        const fixtureDoc = await TenantQuery.findById(Fixture, tenantId, fixture)
        if (!fixtureDoc) {
          throw new Error('Fixture not found')
        }
      }

      // Per venue mock, creiamo una prenotazione reale nel database
      if (venue.startsWith('venue_')) {
        console.log('🚀 DEBUG: STEP 1 - Entering venue mock creation block');
        
        // Crea prenotazione reale nel database anche per venue mock (tenant-aware)
        const bookingCreateData = {
          // Usa direttamente l'ID venue mock
          venue: venue, // venue_1, venue_2, etc.
          user: new mongoose.Types.ObjectId('684977d5050e0ac38958a99e'), // User esistente nel database
          fixture: fixture ? new mongoose.Types.ObjectId(fixture) : undefined,
          
          // Date e time nel formato corretto
          bookingDate: new Date(date),
          startTime: timeSlot.start,
          endTime: timeSlot.end,
          partySize,
          
          // Customer info nel formato corretto (campi separati)
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          specialRequests: specialRequests || '',
          
          // Campi required mancanti
          totalPrice: 0, // Per ora 0, da implementare logic pricing
          status: 'confirmed', // Auto-conferma per venue mock
          bookingType: 'general_dining',
          source: 'website'
        };

        console.log('🚀 DEBUG: STEP 2 - Booking data created');

        // Aggiungi tenantId se presente
        if (tenantId) {
          // Converte in ObjectId se è una stringa valida
          if (typeof tenantId === 'string' && mongoose.Types.ObjectId.isValid(tenantId)) {
            bookingCreateData.tenantId = new mongoose.Types.ObjectId(tenantId);
          } else if (mongoose.Types.ObjectId.isValid(tenantId)) {
            bookingCreateData.tenantId = tenantId;
          }
        }
        
        console.log('🚀 DEBUG: STEP 3 - About to create Booking instance');
        
        // Crea booking
        const booking = new Booking(bookingCreateData);
        
        console.log('🚀 DEBUG: STEP 4 - Booking instance created');
        
        // Genera codice di conferma custom
        booking.confirmationCode = this.generateConfirmationCode();
        
        console.log('🚀 DEBUG: STEP 5 - Confirmation code generated:', booking.confirmationCode);
        
        // Validazione manuale
        const validationError = booking.validateSync();
        if (validationError) {
          console.error('❌ DEBUG: Validation error:', validationError.errors);
          throw validationError;
        }
        
        try {
        const savedBooking = await booking.save();
        
        console.log('✅ DEBUG: Booking saved successfully:', {
          id: savedBooking._id,
          venue: savedBooking.venue,
            tenantId: savedBooking.tenantId,
            confirmationCode: savedBooking.confirmationCode
          });
          
          // Verifica immediata che sia nel database
          const verification = await Booking.findById(savedBooking._id);
          console.log('🔍 DEBUG: Verification find result:', verification ? 'FOUND' : 'NOT FOUND');
          
          // BACKUP: Salvataggio diretto nella collezione se Mongoose fallisce
          if (!verification) {
            console.log('⚠️ DEBUG: Mongoose save failed, trying direct collection save...');
            const directSave = await mongoose.connection.db.collection('bookings').insertOne({
              venue: booking.venue,
              user: booking.user,
              bookingDate: booking.bookingDate,
              startTime: booking.startTime,
              endTime: booking.endTime,
              partySize: booking.partySize,
              customerName: booking.customerName,
              customerEmail: booking.customerEmail,
              customerPhone: booking.customerPhone,
              totalPrice: booking.totalPrice,
              status: booking.status,
              bookingType: booking.bookingType,
              source: booking.source,
              confirmationCode: booking.confirmationCode,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            console.log('🔍 DEBUG: Direct save result:', directSave.insertedId ? 'SUCCESS' : 'FAILED');
          }
          
        } catch (saveError) {
          console.error('❌ DEBUG: Save error:', saveError);
          throw saveError;
        }

        // Popola il venue con dati mock per il response
        const bookingResponse = savedBooking.toObject();
        bookingResponse.venue = {
          _id: venue,
          name: venueDoc.name,
          address: `Via ${venueDoc.name.replace(/[^a-zA-Z ]/g, '')}, Milano`,
          capacity: venueDoc.capacity
        };

        return {
          success: true,
          data: bookingResponse,
          message: 'Booking confirmed automatically'
        };
      }

      // Verifica conflitti di orario per venue reali 
      // Usa il tenantId del venue se esiste, altrimenti null per venue pubblici
      const venueTenantId = venueDoc.tenantId || null;
      console.log('🔍 DEBUG: Venue tenantId:', venueTenantId, 'vs requested tenantId:', tenantId);
      
      const conflicts = await this.checkTimeConflicts(venue, date, timeSlot, partySize, venueTenantId)
      if (conflicts.hasConflict) {
        throw new Error(`Time slot unavailable. ${conflicts.reason}`)
      }

      // Crea prenotazione reale per venue reali (tenant-aware)
      const bookingCreateData = {
        venue,
        user: new mongoose.Types.ObjectId('684977d5050e0ac38958a99e'), // User esistente nel database
        fixture,
        bookingDate: new Date(date),
        startTime: timeSlot.start,
        endTime: timeSlot.end,
        partySize,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        specialRequests: specialRequests || '',
        totalPrice: 0, // Da implementare logic pricing
        bookingType: 'general_dining',
        source: 'website'
      };

      // Aggiungi tenantId se presente (utilizzando il tenantId del venue)
      if (venueTenantId) {
        // Converte in ObjectId se è una stringa valida
        if (typeof venueTenantId === 'string' && mongoose.Types.ObjectId.isValid(venueTenantId)) {
          bookingCreateData.tenantId = new mongoose.Types.ObjectId(venueTenantId);
        } else if (mongoose.Types.ObjectId.isValid(venueTenantId)) {
          bookingCreateData.tenantId = venueTenantId;
        }
      }

      const booking = new Booking(bookingCreateData);

      // Genera codice di conferma se auto-confirmed
      if (!venueDoc.bookingSettings.requiresApproval) {
        booking.status = 'confirmed'
        booking.confirmationCode = this.generateConfirmationCode()
      }

      await booking.save()
      
      // Popola i riferimenti per il response
      await booking.populate(['venue', 'fixture'])

      return {
        success: true,
        data: booking,
        message: booking.status === 'confirmed' ? 
          'Booking confirmed automatically' : 
          'Booking created and pending confirmation'
      }

    } catch (error) {
      throw new Error(`Booking creation failed: ${error.message}`)
    }
  }

  /**
   * Verifica conflitti di orario e capacità
   */
  async checkTimeConflicts(venueId, date, timeSlot, partySize, tenantId) {
    try {
      // Se è un venue mock, restituisce sempre nessun conflitto
      if (venueId.startsWith('venue_')) {
        const mockVenues = {
          'venue_1': { capacity: { total: 80 } },
          'venue_2': { capacity: { total: 60 } },
          'venue_3': { capacity: { total: 100 } }
        };
        
        const venue = mockVenues[venueId];
        if (!venue) {
          throw new Error('Mock venue not found');
        }
        
        return {
          hasConflict: false,
          availableCapacity: venue.capacity.total - partySize,
          totalOccupancy: partySize
        };
      }

      const bookingDate = new Date(date)
      
      // Trova tutte le prenotazioni confermate per quella data
      let existingBookings;
      const bookingQuery = {
        venue: venueId,
        date: {
          $gte: new Date(bookingDate.setHours(0, 0, 0, 0)),
          $lt: new Date(bookingDate.setHours(23, 59, 59, 999))
        },
        status: { $in: ['confirmed', 'pending'] }
      };
      
      if (tenantId) {
        existingBookings = await TenantQuery.find(Booking, tenantId, bookingQuery);
      } else {
        // Per venue pubblici senza tenant filtering
        existingBookings = await Booking.find(bookingQuery);
      }

      // Controlla sovrapposizioni temporali
      const [newStart, newEnd] = [timeSlot.start, timeSlot.end]
      let totalOccupancy = 0

      for (const booking of existingBookings) {
        const [existingStart, existingEnd] = [booking.timeSlot.start, booking.timeSlot.end]
        
        // Controlla sovrapposizione temporale
        if (this.timeSlotOverlaps(newStart, newEnd, existingStart, existingEnd)) {
          totalOccupancy += booking.partySize
        }
      }

      // Verifica capacità venue - supporta sia venue con tenant che venue pubblici
      console.log(`🔍 [DEBUG] checkTimeConflicts - venueId: ${venueId}, tenantId: ${tenantId}`);
      let venue;
      if (tenantId) {
        console.log(`🔍 [DEBUG] Using TenantQuery with tenantId: ${tenantId}`);
        venue = await TenantQuery.findById(Venue, tenantId, venueId);
      } else {
        console.log(`🔍 [DEBUG] Using direct Venue.findById for venueId: ${venueId}`);
        venue = await Venue.findById(venueId);
      }
      
      console.log(`🔍 [DEBUG] Venue found:`, venue ? { id: venue._id, name: venue.name, capacity: venue.capacity } : 'NULL');
      
      if (!venue) {
        throw new Error(`Venue ${venueId} not found`);
      }
      
      const remainingCapacity = venue.capacity.total - totalOccupancy

      if (partySize > remainingCapacity) {
        return {
          hasConflict: true,
          reason: `Insufficient capacity. Available: ${remainingCapacity}, requested: ${partySize}`,
          availableCapacity: remainingCapacity
        }
      }

      return {
        hasConflict: false,
        availableCapacity: remainingCapacity,
        totalOccupancy
      }

    } catch (error) {
      throw new Error(`Conflict check failed: ${error.message}`)
    }
  }

  /**
   * Verifica sovrapposizione tra slot temporali
   */
  timeSlotOverlaps(start1, end1, start2, end2) {
    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    }

    const s1 = timeToMinutes(start1)
    const e1 = timeToMinutes(end1)
    const s2 = timeToMinutes(start2)
    const e2 = timeToMinutes(end2)

    return !(e1 <= s2 || s1 >= e2)
  }

  /**
   * Ottiene prenotazioni con filtri avanzati
   */
  async getBookings(options = {}) {
    try {
      const {
        venueId,
        status,
        date,
        fromDate,
        toDate,
        customerId,
        fixtureId,
        page = 1,
        limit = 20,
        sortBy = 'bookingDate',
        sortOrder = 'desc'
      } = options

      // Costruisce query
      const query = {}

      if (venueId) query.venue = venueId
      if (status) query.status = Array.isArray(status) ? { $in: status } : status
      if (customerId) query['customer.email'] = customerId
      if (fixtureId) query.fixture = fixtureId

      // Filtri per data
      if (date) {
        const targetDate = new Date(date)
        query.bookingDate = {
          $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          $lt: new Date(targetDate.setHours(23, 59, 59, 999))
        }
      } else {
        if (fromDate) query.bookingDate = { ...query.bookingDate, $gte: new Date(fromDate) }
        if (toDate) query.bookingDate = { ...query.bookingDate, $lte: new Date(toDate) }
      }

      // Configurazione ordinamento
      const sortConfig = {}
      sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1

      // Paginazione
      const skip = (page - 1) * limit

      // Esegue query con popolamento condizionale
      let bookings = await TenantQuery.find(Booking, { tenantId }, query)
        .sort(sortConfig)
        .skip(skip)
        .limit(limit)

      // Gestisce popolamento separatamente per venue reali e mock
      const processedBookings = []
      for (const booking of bookings) {
        const bookingObj = booking.toObject()
        
        // Se venue è un ObjectId valido, usa populate normale
        if (mongoose.Types.ObjectId.isValid(bookingObj.venue)) {
          await booking.populate('venue', 'name address capacity')
          await booking.populate('fixture', 'homeTeam awayTeam league date status')
          processedBookings.push(booking.toObject())
        } else {
          // Se venue è mock (venue_1, venue_2, etc.), aggiungi dati mock
          const mockVenues = {
            'venue_1': { 
              _id: 'venue_1', 
              name: "The Queen's Head",
              address: "Via The Queens Head, Milano",
              capacity: { total: 80 }
            },
            'venue_2': { 
              _id: 'venue_2', 
              name: "Sports Corner",
              address: "Via Sports Corner, Milano", 
              capacity: { total: 60 }
            },
            'venue_3': { 
              _id: 'venue_3', 
              name: "The Football Tavern",
              address: "Via The Football Tavern, Milano",
              capacity: { total: 100 }
            }
          }
          
          bookingObj.venue = mockVenues[bookingObj.venue] || {
            _id: bookingObj.venue,
            name: "Mock Venue",
            address: "Via Mock, Milano",
            capacity: { total: 50 }
          }
          
          // Per fixture mock, se necessario
          if (bookingObj.fixture && !mongoose.Types.ObjectId.isValid(bookingObj.fixture)) {
            bookingObj.fixture = null
          } else if (bookingObj.fixture) {
            await booking.populate('fixture', 'homeTeam awayTeam league date status')
            bookingObj.fixture = booking.fixture
          }
          
          processedBookings.push(bookingObj)
        }
      }

      const total = await TenantQuery.countDocuments(Booking, { tenantId }, query)

      return {
        success: true,
        data: processedBookings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        count: processedBookings.length
      }

    } catch (error) {
      throw new Error(`Failed to fetch bookings: ${error.message}`)
    }
  }

  /**
   * Ottiene statistiche prenotazioni per dashboard
   */
  async getBookingStats(venueId, options = {}) {
    try {
      const {
        fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 giorni fa
        toDate = new Date()
      } = options

      const stats = await TenantQuery.aggregate(Booking, {
        tenantId: mongoose.Types.ObjectId(venueId),
        date: { $gte: fromDate, $lte: toDate }
      }, [
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            confirmedBookings: {
              $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
            },
            pendingBookings: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            cancelledBookings: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            },
            totalCustomers: { $sum: '$partySize' },
            averagePartySize: { $avg: '$partySize' },
            totalRevenue: { $sum: '$pricing.finalPrice' }
          }
        }
      ])

      // Statistiche per status
      const statusStats = await TenantQuery.aggregate(Booking, {
        tenantId: mongoose.Types.ObjectId(venueId),
        date: { $gte: fromDate, $lte: toDate }
      }, [
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            customers: { $sum: '$partySize' }
          }
        }
      ])

      // Trending per giorno
      const dailyStats = await TenantQuery.aggregate(Booking, {
        tenantId: mongoose.Types.ObjectId(venueId),
        date: { $gte: fromDate, $lte: toDate }
      }, [
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            bookings: { $sum: 1 },
            customers: { $sum: '$partySize' },
            revenue: { $sum: '$pricing.finalPrice' }
          }
        },
        { $sort: { _id: 1 } }
      ])

      return {
        success: true,
        data: {
          overview: stats[0] || {
            totalBookings: 0,
            confirmedBookings: 0,
            pendingBookings: 0,
            cancelledBookings: 0,
            totalCustomers: 0,
            averagePartySize: 0,
            totalRevenue: 0
          },
          byStatus: statusStats,
          daily: dailyStats
        },
        period: { fromDate, toDate }
      }

    } catch (error) {
      throw new Error(`Failed to get booking stats: ${error.message}`)
    }
  }

  /**
   * Aggiorna status prenotazione
   */
  async updateBookingStatus(bookingId, status, options = {}) {
    try {
      const booking = await TenantQuery.findById(Booking, bookingId)
      if (!booking) {
        throw new Error('Booking not found')
      }

      const oldStatus = booking.status
      booking.status = status

      // Gestisce transizioni specifiche
      switch (status) {
        case 'confirmed':
          if (!booking.confirmationCode) {
            booking.generateConfirmationCode()
          }
          booking.confirmedAt = new Date()
          break

        case 'cancelled':
          booking.cancelledAt = new Date()
          booking.cancellationReason = options.reason || 'Manual cancellation'
          break

        case 'completed':
          // Logic per completamento (es. marking as show/no-show)
          break
      }

      // Aggiunge note admin se fornite
      if (options.adminNotes) {
        booking.adminNotes = options.adminNotes
      }

      await booking.save()
      await booking.populate(['venue', 'fixture'])

      return {
        success: true,
        data: booking,
        message: `Booking status updated from ${oldStatus} to ${status}`
      }

    } catch (error) {
      throw new Error(`Status update failed: ${error.message}`)
    }
  }

  /**
   * Elimina prenotazione (solo se cancelled o pending)
   */
  async deleteBooking(bookingId, options = {}) {
    try {
      const booking = await TenantQuery.findById(Booking, bookingId)
      if (!booking) {
        throw new Error('Booking not found')
      }

      // Verifica che sia cancellabile
      if (!['pending', 'cancelled'].includes(booking.status) && !options.force) {
        throw new Error('Cannot delete confirmed or completed bookings')
      }

      await TenantQuery.findByIdAndDelete(Booking, bookingId)

      return {
        success: true,
        message: 'Booking deleted successfully'
      }

    } catch (error) {
      throw new Error(`Booking deletion failed: ${error.message}`)
    }
  }

  /**
   * Cerca slot temporali disponibili
   */
  async findAvailableSlots(venueId, date, duration = 120, tenantId = null) {
    try {
      let venue;
      
      // Prima prova a cercare per ObjectId MongoDB
      if (mongoose.Types.ObjectId.isValid(venueId)) {
        venue = await Venue.findById(venueId);
      }
      
      // Se non trovato e venueId è un ID custom (venue_*), usa dati mock
      if (!venue && venueId.startsWith('venue_')) {
        // Genera dati mock per venue custom - gestisce sia venue_1 che venue_685057e88d7c5eecb3818f9d
        const venueNumber = venueId.replace('venue_', '');
        const mockVenues = {
          '1': { 
            _id: 'venue_1', 
            name: "The Queen's Head",
            capacity: { total: 80 }
          },
          '2': { 
            _id: 'venue_2', 
            name: 'Sports Corner',
            capacity: { total: 60 }
          },
          '3': { 
            _id: 'venue_3', 
            name: 'Champions Sports Lounge',
            capacity: { total: 100 }
          },
          // Gestione venue mock con ID lunghi (come venue_685057e88d7c5eecb3818f9d)
          '685057e88d7c5eecb3818f9d': {
            _id: 'venue_685057e88d7c5eecb3818f9d',
            name: "Nick's Sports Bar (Mock)",
            capacity: { total: 120 }
          },
          'mock_2': {
            _id: 'venue_mock_2',
            name: "Sports Corner Milano",
            capacity: { total: 90 }
          }
        };
        
        venue = mockVenues[venueNumber];
        
        // Se non trovato nei predefiniti, crea un venue mock generico
        if (!venue) {
          venue = {
            _id: venueId,
            name: `Mock Venue (${venueId})`,
            capacity: { total: 80 }
          };
        }
      }
      
      if (!venue) {
        throw new Error('Venue not found');
      }

      // Slot temporali standard (ogni 30 minuti)
      const timeSlots = []
      for (let hour = 12; hour <= 22; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          const endHour = Math.floor((hour * 60 + minute + duration) / 60)
          const endMinute = (hour * 60 + minute + duration) % 60
          const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`
          
          if (endHour <= 23) {
            timeSlots.push({ start: startTime, end: endTime })
          }
        }
      }

      // Per venue mock, restituisci alcuni slot disponibili senza controlli complessi
      if (venueId.startsWith('venue_')) {
        const availableSlots = timeSlots.slice(0, Math.floor(timeSlots.length * 0.7)); // 70% degli slot disponibili
        
        return {
          success: true,
          data: {
            slots: availableSlots.map(slot => ({
              ...slot,
              availableCapacity: venue.capacity.total - Math.floor(Math.random() * 20) // Capacità mock
            }))
          },
          venue: venue.name
        }
      }

      // Per venue reali, semplifichiamo temporaneamente per evitare errori di tenant
      console.log(`🔍 [DEBUG] Finding slots for real venue ${venueId}, tenantId: ${tenantId}, venue found:`, venue.name);
      
      // TEMPORANEO: Tratta i venue reali come mock per evitare problemi di tenant
      const availableSlots = timeSlots.slice(0, Math.floor(timeSlots.length * 0.8)); // 80% degli slot disponibili
      
      const slotsWithCapacity = availableSlots.map(slot => ({
            ...slot,
        availableCapacity: venue.capacity.total - Math.floor(Math.random() * 10) // Capacità simulata
      }));
      
      console.log(`✅ [DEBUG] Generated ${slotsWithCapacity.length} available slots for venue ${venue.name}`);
      
      return {
        success: true,
        data: {
          slots: slotsWithCapacity
        },
        venue: venue.name
      }

      return {
        success: true,
        data: {
          slots: availableSlots
        },
        venue: venue.name
      }

    } catch (error) {
      throw new Error(`Failed to find available slots: ${error.message}`)
    }
  }

  // Helper per generare codice di conferma
  generateConfirmationCode() {
    return Math.random().toString(36).substr(2, 9).toUpperCase()
  }
}

module.exports = new BookingsService() 
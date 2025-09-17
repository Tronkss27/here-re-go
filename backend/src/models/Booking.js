const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Tenant isolation
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: false // Temporaneamente opzionale per migrazione
  },
  
  // Riferimenti
  venue: {
    type: mongoose.Schema.Types.Mixed, // Accetta sia ObjectId che String per venue mock
    ref: 'Venue',
    required: true,
    // ✅ FIX: Aggiungi validazione e normalizzazione
    validate: {
      validator: function(v) {
        // Accetta ObjectId validi o stringhe che rappresentano ObjectId o venue mock
        return mongoose.Types.ObjectId.isValid(v) || 
               (typeof v === 'string' && (v.startsWith('venue_') || mongoose.Types.ObjectId.isValid(v)));
      },
      message: 'Venue must be a valid ObjectId or venue mock string'
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fixture: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fixture',
    required: false // Opzionale per prenotazioni generiche
  },

  // Dettagli prenotazione
  bookingDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v)
      },
      message: 'Start time must be in HH:MM format'
    }
  },
  endTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v)
      },
      message: 'End time must be in HH:MM format'
    }
  },
  partySize: {
    type: Number,
    required: true,
    min: 1,
    max: 50
  },

  // Informazioni cliente
  customerName: {
    type: String,
    required: true,
    maxLength: 100
  },
  customerEmail: {
    type: String,
    required: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  customerPhone: {
    type: String,
    required: true,
    match: [/^[\+]?[0-9][\d\s\-\(\)]{6,20}$/, 'Please enter a valid phone number']
  },
  specialRequests: {
    type: String,
    maxLength: 500
  },

  // Gestione stati
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
    default: 'pending'
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String
  }],

  // Pagamento e prezzo
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  deposit: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'online', 'bank_transfer'],
    required: false
  },

  // Snapshot offerte associate alla prenotazione (legate all'annuncio/match)
  offersSnapshot: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'OfferTemplate' },
    redeemed: { type: Boolean, default: false },
    redeemedAt: { type: Date },
    redeemedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  // Metadati
  bookingType: {
    type: String,
    enum: ['match_viewing', 'general_dining', 'private_event', 'group_booking'],
    default: 'general_dining'
  },
  source: {
    type: String,
    enum: ['website', 'phone', 'walk_in', 'app', 'third_party'],
    default: 'website'
  },
  
  // Note interne
  internalNotes: {
    type: String,
    maxLength: 1000
  },
  
  // Codice di conferma
  confirmationCode: {
    type: String,
    sparse: true, // Permette valori null/undefined
    uppercase: true
  },
  
  // Gestione modifiche
  modificationHistory: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    modifiedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Promemoria e notifiche
  remindersSent: [{
    type: {
      type: String,
      enum: ['confirmation', 'reminder_24h', 'reminder_2h', 'follow_up']
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    method: {
      type: String,
      enum: ['email', 'sms', 'push']
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indices per performance
bookingSchema.index({ tenantId: 1 });
bookingSchema.index({ tenantId: 1, venue: 1, bookingDate: 1 });
bookingSchema.index({ tenantId: 1, user: 1, bookingDate: -1 });
bookingSchema.index({ tenantId: 1, status: 1, bookingDate: 1 });
bookingSchema.index({ tenantId: 1, customerEmail: 1 });
bookingSchema.index({ tenantId: 1, bookingDate: 1, startTime: 1 });
bookingSchema.index({ tenantId: 1, confirmationCode: 1 }, { unique: true, sparse: true }); // Confirmation code unico per tenant
bookingSchema.index({ venue: 1, bookingDate: 1 });
bookingSchema.index({ user: 1, bookingDate: -1 });
bookingSchema.index({ status: 1, bookingDate: 1 });
bookingSchema.index({ customerEmail: 1 });
bookingSchema.index({ bookingDate: 1, startTime: 1 });

// Virtuali
bookingSchema.virtual('isUpcoming').get(function() {
  // Protezione per campi undefined
  if (!this.bookingDate || !this.startTime) {
    return false;
  }
  
  try {
    const now = new Date();
    const bookingDateTime = new Date(`${this.bookingDate.toISOString().split('T')[0]}T${this.startTime}`);
    return bookingDateTime > now;
  } catch (error) {
    console.warn('Error in isUpcoming virtual:', error);
    return false;
  }
});

bookingSchema.virtual('duration').get(function() {
  // Protezione per campi undefined
  if (!this.startTime || !this.endTime) {
    return 0;
  }
  
  try {
    const start = this.startTime.split(':');
    const end = this.endTime.split(':');
    const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
    const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
    return endMinutes - startMinutes;
  } catch (error) {
    console.warn('Error in duration virtual:', error);
    return 0;
  }
});

bookingSchema.virtual('remainingAmount').get(function() {
  // Protezione per campi undefined
  if (typeof this.totalPrice !== 'number' || typeof this.deposit !== 'number') {
    return 0;
  }
  
  return this.totalPrice - this.deposit;
});

// Middleware pre-save
bookingSchema.pre('save', function(next) {
  // Aggiungi alla cronologia degli stati se lo stato è cambiato
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      updatedBy: this._updatedBy || null
    });
  }

  // Validazione orari
  const start = this.startTime.split(':');
  const end = this.endTime.split(':');
  const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
  const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
  
  if (endMinutes <= startMinutes) {
    next(new Error('End time must be after start time'));
    return;
  }

  // Validazione data
  if (this.bookingDate < new Date().setHours(0, 0, 0, 0)) {
    next(new Error('Booking date cannot be in the past'));
    return;
  }

  next();
});

// Metodi statici
bookingSchema.statics.findByDateRange = function(venueId, startDate, endDate) {
  return this.find({
    venue: venueId,
    bookingDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate('user', 'name email').populate('fixture', 'homeTeam awayTeam startTime');
};

bookingSchema.statics.findConflicting = function(venueId, date, startTime, endTime, excludeId = null) {
  const query = {
    venue: venueId,
    bookingDate: date,
    status: { $in: ['confirmed', 'pending'] },
    $or: [
      {
        startTime: { $lt: endTime },
        endTime: { $gt: startTime }
      }
    ]
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return this.find(query);
};

bookingSchema.statics.getBookingStats = function(venueId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        venue: mongoose.Types.ObjectId(venueId),
        bookingDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$totalPrice' },
        avgPartySize: { $avg: '$partySize' }
      }
    }
  ]);
};

// Metodi di istanza
bookingSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const bookingDateTime = new Date(`${this.bookingDate.toISOString().split('T')[0]}T${this.startTime}`);
  const hoursUntilBooking = (bookingDateTime - now) / (1000 * 60 * 60);
  
  return this.status === 'confirmed' && hoursUntilBooking > 2; // Cancellazione fino a 2 ore prima
};

bookingSchema.methods.canBeModified = function() {
  const now = new Date();
  const bookingDateTime = new Date(`${this.bookingDate.toISOString().split('T')[0]}T${this.startTime}`);
  const hoursUntilBooking = (bookingDateTime - now) / (1000 * 60 * 60);
  
  return ['pending', 'confirmed'].includes(this.status) && hoursUntilBooking > 4; // Modifica fino a 4 ore prima
};

bookingSchema.methods.updateStatus = function(newStatus, updatedBy, reason) {
  this.status = newStatus;
  this._updatedBy = updatedBy;
  
  if (reason) {
    this.statusHistory[this.statusHistory.length - 1].reason = reason;
  }
  
  return this.save();
};

// ✅ FIX: Metodi statici per gestire query venue consistenti
bookingSchema.statics.normalizeVenueQuery = function(venueFilter) {
  if (!venueFilter) return {};
  
  // Se è un singolo venue
  if (typeof venueFilter === 'string' || mongoose.Types.ObjectId.isValid(venueFilter)) {
    return {
      venue: {
        $in: [
          venueFilter, // Formato originale
          mongoose.Types.ObjectId.isValid(venueFilter) ? venueFilter.toString() : venueFilter, // String format
          typeof venueFilter === 'string' && mongoose.Types.ObjectId.isValid(venueFilter) 
            ? new mongoose.Types.ObjectId(venueFilter) 
            : null // ObjectId format
        ].filter(Boolean)
      }
    };
  }
  
  // Se è un array o oggetto $in
  if (venueFilter.$in && Array.isArray(venueFilter.$in)) {
    const normalizedVenues = [];
    venueFilter.$in.forEach(v => {
      normalizedVenues.push(v); // Formato originale
      if (mongoose.Types.ObjectId.isValid(v)) {
        normalizedVenues.push(v.toString()); // String format
        if (typeof v === 'string') {
          normalizedVenues.push(new mongoose.Types.ObjectId(v)); // ObjectId format
        }
      }
    });
    
    return {
      venue: {
        $in: [...new Set(normalizedVenues)] // Rimuovi duplicati
      }
    };
  }
  
  return { venue: venueFilter };
};

// ✅ FIX: Metodo per query tenant-aware con venue normalizzato
bookingSchema.statics.findWithNormalizedVenue = function(tenantId, filter = {}) {
  const TenantQuery = require('../utils/tenantQuery');
  
  // Normalizza il filtro venue se presente
  if (filter.venue) {
    const normalizedVenueFilter = this.normalizeVenueQuery(filter.venue);
    filter = { ...filter, ...normalizedVenueFilter };
  }
  
  return TenantQuery.find(this, tenantId, filter);
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking; 
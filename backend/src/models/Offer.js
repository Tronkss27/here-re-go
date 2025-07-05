const mongoose = require('mongoose')

const offerSchema = new mongoose.Schema({
  // Tenant isolation
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: false // Temporaneamente opzionale per migrazione
  },
  
  // Basic offer information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  // Venue reference
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true
  },
  
  // Offer type
  type: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'buy_one_get_one', 'happy_hour', 'group_discount'],
    required: true
  },
  
  // Discount details
  discount: {
    value: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      enum: ['percentage', 'euro', 'item'],
      required: true
    }
  },
  
  // Validity period
  validFrom: {
    type: Date,
    required: true
  },
  
  validUntil: {
    type: Date,
    required: true
  },
  
  // Time restrictions
  timeRestrictions: {
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6 // 0 = Sunday, 6 = Saturday
    }],
    startTime: {
      type: String // Format: "HH:MM"
    },
    endTime: {
      type: String // Format: "HH:MM"
    }
  },
  
  // Usage limits
  limits: {
    totalUsage: {
      type: Number,
      default: null // null = unlimited
    },
    usagePerCustomer: {
      type: Number,
      default: 1
    },
    minimumPartySize: {
      type: Number,
      default: 1
    },
    minimumAmount: {
      type: Number,
      default: 0
    }
  },
  
  // Applicable items/categories
  applicableItems: [{
    name: { type: String },
    category: { type: String }
  }],
  
  // Event targeting
  eventTargeting: {
    enabled: {
      type: Boolean,
      default: false
    },
    // Specific fixtures
    fixtures: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fixture'
    }],
    // League targeting
    leagues: [{
      id: { type: String },
      name: { type: String }
    }],
    // Team targeting
    teams: [{
      id: { type: String },
      name: { type: String }
    }],
    // Auto-activation settings
    autoActivation: {
      enabled: { type: Boolean, default: false },
      minutesBefore: { type: Number, default: 60 }, // Minutes before match start
      minutesAfter: { type: Number, default: 120 }   // Minutes after match start
    }
  },
  
  // Terms and conditions
  terms: {
    type: String,
    maxlength: 1000
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'expired'],
    default: 'draft'
  },
  
  // Usage tracking
  analytics: {
    totalRedemptions: {
      type: Number,
      default: 0
    },
    uniqueCustomers: {
      type: Number,
      default: 0
    },
    totalSavings: {
      type: Number,
      default: 0
    }
  },
  
  // Display settings
  display: {
    isPublic: {
      type: Boolean,
      default: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    backgroundColor: {
      type: String,
      default: '#007bff'
    },
    textColor: {
      type: String,
      default: '#ffffff'
    }
  }
}, {
  timestamps: true
})

// Indexes ottimizzati
offerSchema.index({ tenantId: 1 })
offerSchema.index({ tenantId: 1, venue: 1, status: 1 })
offerSchema.index({ tenantId: 1, validFrom: 1, validUntil: 1 })
offerSchema.index({ tenantId: 1, type: 1 })
offerSchema.index({ tenantId: 1, 'display.isPublic': 1, 'display.isFeatured': 1 })
offerSchema.index({ tenantId: 1, venue: 1, status: 1, validFrom: 1, validUntil: 1 }) // Compound per query attive
offerSchema.index({ tenantId: 1, status: 1, validFrom: 1 }) // Per offer attive generale
offerSchema.index({ tenantId: 1, venue: 1, 'display.isFeatured': 1 }) // Per offer featured per venue
offerSchema.index({ tenantId: 1, 'timeRestrictions.daysOfWeek': 1 }) // Per filtri giorno
offerSchema.index({ tenantId: 1, createdAt: 1 }) // Per ordinamento cronologico
offerSchema.index({ venue: 1, status: 1 })
offerSchema.index({ validFrom: 1, validUntil: 1 })
offerSchema.index({ type: 1 })
offerSchema.index({ 'display.isPublic': 1, 'display.isFeatured': 1 })
offerSchema.index({ venue: 1, status: 1, validFrom: 1, validUntil: 1 }) // Compound per query attive
offerSchema.index({ status: 1, validFrom: 1 }) // Per offer attive generale
offerSchema.index({ venue: 1, 'display.isFeatured': 1 }) // Per offer featured per venue
offerSchema.index({ 'timeRestrictions.daysOfWeek': 1 }) // Per filtri giorno
offerSchema.index({ createdAt: 1 }) // Per ordinamento cronologico

// Virtual for checking if offer is currently valid
offerSchema.virtual('isCurrentlyValid').get(function() {
  const now = new Date()
  return this.status === 'active' && 
         this.validFrom <= now && 
         this.validUntil >= now
})

// Virtual for checking if offer is available for time
offerSchema.virtual('isAvailableNow').get(function() {
  if (!this.isCurrentlyValid) return false
  
  const now = new Date()
  const currentDay = now.getDay()
  const currentTime = now.toTimeString().substring(0, 5) // "HH:MM"
  
  // Check day restrictions
  if (this.timeRestrictions.daysOfWeek.length > 0 && 
      !this.timeRestrictions.daysOfWeek.includes(currentDay)) {
    return false
  }
  
  // Check time restrictions
  if (this.timeRestrictions.startTime && this.timeRestrictions.endTime) {
    return currentTime >= this.timeRestrictions.startTime && 
           currentTime <= this.timeRestrictions.endTime
  }
  
  return true
})

// Methods
offerSchema.methods.canBeUsedBy = function(customerId, partySize = 1, orderAmount = 0) {
  if (!this.isCurrentlyValid) return false
  
  // Check party size
  if (partySize < this.limits.minimumPartySize) return false
  
  // Check minimum amount
  if (orderAmount < this.limits.minimumAmount) return false
  
  // Check total usage limit
  if (this.limits.totalUsage && this.analytics.totalRedemptions >= this.limits.totalUsage) {
    return false
  }
  
  return true
}

offerSchema.methods.calculateDiscount = function(originalAmount) {
  let discountAmount = 0
  
  switch (this.type) {
    case 'percentage':
      discountAmount = (originalAmount * this.discount.value) / 100
      break
    case 'fixed_amount':
      discountAmount = Math.min(this.discount.value, originalAmount)
      break
    default:
      discountAmount = 0
  }
  
  return Math.round(discountAmount * 100) / 100 // Round to 2 decimal places
}

offerSchema.methods.redeem = function(customerId, discountAmount) {
  this.analytics.totalRedemptions += 1
  this.analytics.totalSavings += discountAmount
  
  return this.save()
}

// Event targeting methods
offerSchema.methods.isActiveForEvent = function(fixture) {
  if (!this.eventTargeting.enabled) return this.isCurrentlyValid
  
  // Check if offer is targeted to this specific fixture
  if (this.eventTargeting.fixtures.length > 0) {
    return this.eventTargeting.fixtures.some(f => f.toString() === fixture._id.toString())
  }
  
  // Check if offer is targeted to this league
  if (this.eventTargeting.leagues.length > 0) {
    const isLeagueMatch = this.eventTargeting.leagues.some(l => l.id === fixture.league.id)
    if (isLeagueMatch) return this.isCurrentlyValid
  }
  
  // Check if offer is targeted to these teams
  if (this.eventTargeting.teams.length > 0) {
    const isTeamMatch = this.eventTargeting.teams.some(t => 
      t.id === fixture.homeTeam.id || t.id === fixture.awayTeam.id
    )
    if (isTeamMatch) return this.isCurrentlyValid
  }
  
  return false
}

offerSchema.methods.shouldAutoActivate = function(fixture) {
  if (!this.eventTargeting.enabled || !this.eventTargeting.autoActivation.enabled) {
    return false
  }
  
  const now = new Date()
  const matchTime = new Date(fixture.date)
  const activationStart = new Date(matchTime.getTime() - (this.eventTargeting.autoActivation.minutesBefore * 60 * 1000))
  const activationEnd = new Date(matchTime.getTime() + (this.eventTargeting.autoActivation.minutesAfter * 60 * 1000))
  
  return now >= activationStart && now <= activationEnd && this.isActiveForEvent(fixture)
}

// Static methods
offerSchema.statics.findActiveByVenue = function(venueId) {
  const now = new Date()
  return this.find({
    venue: venueId,
    status: 'active',
    validFrom: { $lte: now },
    validUntil: { $gte: now },
    'display.isPublic': true
  }).sort({ 'display.isFeatured': -1, createdAt: -1 })
}

offerSchema.statics.findExpiring = function(venueId, days = 7) {
  const now = new Date()
  const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000))
  
  return this.find({
    venue: venueId,
    status: 'active',
    validUntil: { $gte: now, $lte: futureDate }
  }).sort({ validUntil: 1 })
}

// Event-based static methods
offerSchema.statics.findByEvent = function(venueId, fixture) {
  const now = new Date()
  return this.find({
    venue: venueId,
    status: 'active',
    validFrom: { $lte: now },
    validUntil: { $gte: now },
    $or: [
      { 'eventTargeting.enabled': false },
      { 'eventTargeting.fixtures': fixture._id },
      { 'eventTargeting.leagues.id': fixture.league.id },
      { 'eventTargeting.teams.id': { $in: [fixture.homeTeam.id, fixture.awayTeam.id] } }
    ]
  }).populate('eventTargeting.fixtures')
}

offerSchema.statics.findForAutoActivation = function() {
  return this.find({
    status: 'draft',
    'eventTargeting.enabled': true,
    'eventTargeting.autoActivation.enabled': true
  }).populate('eventTargeting.fixtures')
}

offerSchema.statics.getAnalytics = function(venueId, fromDate, toDate) {
  return this.aggregate([
    {
      $match: {
        venue: mongoose.Types.ObjectId(venueId),
        createdAt: { $gte: fromDate, $lte: toDate }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalRedemptions: { $sum: '$analytics.totalRedemptions' },
        totalSavings: { $sum: '$analytics.totalSavings' }
      }
    }
  ])
}

module.exports = mongoose.model('Offer', offerSchema) 
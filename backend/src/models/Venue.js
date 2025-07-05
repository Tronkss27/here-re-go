const mongoose = require('mongoose')

const venueSchema = new mongoose.Schema({
  // Tenant isolation
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: false // Temporaneamente opzionale per migrazione
  },
  
  // Basic information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  description: {
    type: String,
    maxlength: 1000
  },
  
  // Owner reference
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Contact information
  contact: {
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true
    },
    website: {
      type: String
    }
  },
  
  // Location
  location: {
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String },
      postalCode: { type: String, required: true },
      country: { type: String, required: true, default: 'Italy' }
    },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },
  
  // Opening hours
  hours: {
    monday: { open: String, close: String, closed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
    friday: { open: String, close: String, closed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, closed: { type: Boolean, default: false } }
  },
  
  // Capacity and facilities
  capacity: {
    total: { type: Number, required: true },
    tables: { type: Number },
    bar: { type: Number },
    outdoor: { type: Number, default: 0 }
  },
  
  // Features and amenities
  features: [{
    type: String,
    enum: [
      'live_sports', 'multiple_screens', 'outdoor_seating', 'private_rooms',
      'pool_table', 'darts', 'karaoke', 'live_music', 'food_service',
      'full_bar', 'craft_beer', 'wine_selection', 'parking', 'wheelchair_accessible',
      'wifi', 'air_conditioning', 'smoking_area'
    ]
  }],
  
  // Media
  images: [{
    url: { type: String, required: true },
    caption: { type: String },
    isMain: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Sports focus
  sportsOfferings: [{
    sport: { type: String, required: true }, // football, basketball, etc.
    leagues: [String], // Serie A, Champions League, etc.
    isPrimary: { type: Boolean, default: false }
  }],
  
  // Booking settings
  bookingSettings: {
    enabled: { type: Boolean, default: true },
    requiresApproval: { type: Boolean, default: false },
    advanceBookingDays: { type: Number, default: 30 },
    minimumPartySize: { type: Number, default: 1 },
    maximumPartySize: { type: Number, default: 10 },
    timeSlotDuration: { type: Number, default: 120 }, // minutes
    cancellationPolicy: { type: String, maxlength: 500 }
  },
  
  // Pricing
  pricing: {
    basePrice: { type: Number, default: 0 },
    pricePerPerson: { type: Number, default: 0 },
    minimumSpend: { type: Number, default: 0 },
    currency: { type: String, default: 'EUR' }
  },
  
  // Status and verification
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Analytics
  analytics: {
    totalBookings: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 }
  },
  
  // SEO
  slug: {
    type: String,
    sparse: true
  },
  
  // Admin notes
  adminNotes: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true
})

// Indexes
venueSchema.index({ tenantId: 1 })
venueSchema.index({ tenantId: 1, owner: 1 })
venueSchema.index({ tenantId: 1, status: 1 })
venueSchema.index({ tenantId: 1, 'location.address.city': 1 })
venueSchema.index({ tenantId: 1, 'location.coordinates.latitude': 1, 'location.coordinates.longitude': 1 })
venueSchema.index({ tenantId: 1, slug: 1 }, { unique: true, sparse: true }) // Slug unico per tenant
venueSchema.index({ tenantId: 1, isActive: 1, status: 1 })
venueSchema.index({ tenantId: 1, features: 1 })
venueSchema.index({ owner: 1 })
venueSchema.index({ status: 1 })
venueSchema.index({ 'location.address.city': 1 })
venueSchema.index({ 'location.coordinates.latitude': 1, 'location.coordinates.longitude': 1 })
venueSchema.index({ isActive: 1, status: 1 })
venueSchema.index({ features: 1 })

// Text search index
venueSchema.index({
  name: 'text',
  description: 'text',
  'location.address.city': 'text'
})

// Virtual for full address
venueSchema.virtual('fullAddress').get(function() {
  const addr = this.location.address
  return `${addr.street}, ${addr.city}, ${addr.postalCode}, ${addr.country}`
})

// Virtual for main image
venueSchema.virtual('mainImage').get(function() {
  const mainImg = this.images.find(img => img.isMain)
  return mainImg ? mainImg.url : (this.images[0] ? this.images[0].url : null)
})

// Virtual for current open status
venueSchema.virtual('isCurrentlyOpen').get(function() {
  const now = new Date()
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' })
  const currentTime = now.toTimeString().substring(0, 5) // "HH:MM"
  
  const dayHours = this.hours[currentDay]
  if (!dayHours || dayHours.closed) return false
  
  return currentTime >= dayHours.open && currentTime <= dayHours.close
})

// Methods
venueSchema.methods.generateSlug = function() {
  const slug = this.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-')
  
  this.slug = `${slug}-${this._id.toString().slice(-6)}`
  return this.slug
}

venueSchema.methods.updateAnalytics = function(field, increment = 1) {
  this.analytics[field] = (this.analytics[field] || 0) + increment
  return this.save()
}

venueSchema.methods.calculateAverageRating = async function() {
  const Review = mongoose.model('Review')
  const stats = await Review.aggregate([
    { $match: { venue: this._id, status: 'approved' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating.overall' },
        totalReviews: { $sum: 1 }
      }
    }
  ])
  
  if (stats.length > 0) {
    this.analytics.averageRating = Math.round(stats[0].averageRating * 10) / 10
    this.analytics.totalReviews = stats[0].totalReviews
  } else {
    this.analytics.averageRating = 0
    this.analytics.totalReviews = 0
  }
  
  return this.save()
}

// Static methods
venueSchema.statics.findNearby = function(latitude, longitude, maxDistance = 10000) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: { type: 'Point', coordinates: [longitude, latitude] },
        $maxDistance: maxDistance // meters
      }
    },
    isActive: true,
    status: 'approved'
  })
}

venueSchema.statics.findByCity = function(city) {
  return this.find({
    'location.address.city': new RegExp(city, 'i'),
    isActive: true,
    status: 'approved'
  }).sort({ 'analytics.averageRating': -1 })
}

venueSchema.statics.findByFeatures = function(features) {
  return this.find({
    features: { $in: features },
    isActive: true,
    status: 'approved'
  }).sort({ 'analytics.averageRating': -1 })
}

venueSchema.statics.search = function(query, options = {}) {
  const searchQuery = {
    $text: { $search: query },
    isActive: true,
    status: 'approved'
  }
  
  if (options.city) {
    searchQuery['location.address.city'] = new RegExp(options.city, 'i')
  }
  
  if (options.features && options.features.length > 0) {
    searchQuery.features = { $in: options.features }
  }
  
  return this.find(searchQuery, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(options.limit || 20)
}

// Pre-save middleware
venueSchema.pre('save', function(next) {
  if (this.isNew && !this.slug) {
    this.generateSlug()
  }
  next()
})

module.exports = mongoose.model('Venue', venueSchema) 
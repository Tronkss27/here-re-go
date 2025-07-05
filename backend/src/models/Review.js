const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
  // Tenant isolation
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: false // Temporaneamente opzionale per migrazione
  },
  
  // Venue reference
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true
  },
  
  // Customer information
  customer: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  
  // Rating (1-5 stars)
  rating: {
    overall: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    food: {
      type: Number,
      min: 1,
      max: 5
    },
    service: {
      type: Number,
      min: 1,
      max: 5
    },
    atmosphere: {
      type: Number,
      min: 1,
      max: 5
    },
    value: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  // Review content
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  // Visit details
  visitDate: {
    type: Date,
    required: true
  },
  
  visitType: {
    type: String,
    enum: ['dine_in', 'takeaway', 'delivery', 'event'],
    default: 'dine_in'
  },
  
  partySize: {
    type: Number,
    min: 1,
    max: 20
  },
  
  // Review metadata
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  
  isAnonymous: {
    type: Boolean,
    default: false
  },
  
  // Moderation
  moderationNotes: {
    type: String,
    maxlength: 500
  },
  
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  moderatedAt: {
    type: Date
  },
  
  // Venue response
  response: {
    content: {
      type: String,
      maxlength: 500
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: {
      type: Date
    }
  },
  
  // Engagement metrics
  helpfulVotes: {
    type: Number,
    default: 0
  },
  
  reportCount: {
    type: Number,
    default: 0
  },
  
  // Source tracking
  source: {
    type: String,
    enum: ['direct', 'google', 'facebook', 'tripadvisor', 'booking'],
    default: 'direct'
  },
  
  // Optional booking reference
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }
}, {
  timestamps: true
})

// Indexes
reviewSchema.index({ tenantId: 1 })
reviewSchema.index({ tenantId: 1, venue: 1, status: 1 })
reviewSchema.index({ tenantId: 1, 'customer.email': 1 })
reviewSchema.index({ tenantId: 1, 'rating.overall': 1 })
reviewSchema.index({ tenantId: 1, visitDate: 1 })
reviewSchema.index({ tenantId: 1, createdAt: 1 })
reviewSchema.index({ venue: 1, status: 1 })
reviewSchema.index({ 'customer.email': 1 })
reviewSchema.index({ 'rating.overall': 1 })
reviewSchema.index({ visitDate: 1 })
reviewSchema.index({ createdAt: 1 })

// Virtual for display name
reviewSchema.virtual('displayName').get(function() {
  if (this.isAnonymous) {
    return 'Anonymous'
  }
  return this.customer.name
})

// Virtual for average rating calculation
reviewSchema.virtual('averageRating').get(function() {
  const ratings = []
  if (this.rating.food) ratings.push(this.rating.food)
  if (this.rating.service) ratings.push(this.rating.service)
  if (this.rating.atmosphere) ratings.push(this.rating.atmosphere)
  if (this.rating.value) ratings.push(this.rating.value)
  
  if (ratings.length === 0) return this.rating.overall
  
  const sum = ratings.reduce((a, b) => a + b, 0)
  return Math.round((sum / ratings.length) * 10) / 10
})

// Methods
reviewSchema.methods.approve = function(moderatorId) {
  this.status = 'approved'
  this.moderatedBy = moderatorId
  this.moderatedAt = new Date()
  return this.save()
}

reviewSchema.methods.reject = function(moderatorId, reason) {
  this.status = 'rejected'
  this.moderatedBy = moderatorId
  this.moderatedAt = new Date()
  this.moderationNotes = reason
  return this.save()
}

reviewSchema.methods.respond = function(responseContent, responderId) {
  this.response.content = responseContent
  this.response.respondedBy = responderId
  this.response.respondedAt = new Date()
  return this.save()
}

reviewSchema.methods.markHelpful = function() {
  this.helpfulVotes += 1
  return this.save()
}

reviewSchema.methods.report = function() {
  this.reportCount += 1
  if (this.reportCount >= 3) {
    this.status = 'flagged'
  }
  return this.save()
}

// Static methods
reviewSchema.statics.findByVenue = function(venueId, options = {}) {
  const query = { 
    venue: venueId,
    status: options.includeAll ? { $in: ['pending', 'approved'] } : 'approved'
  }
  
  const sort = {}
  switch (options.sortBy) {
    case 'rating_desc':
      sort['rating.overall'] = -1
      break
    case 'rating_asc':
      sort['rating.overall'] = 1
      break
    case 'date_asc':
      sort.visitDate = 1
      break
    default:
      sort.createdAt = -1
  }
  
  return this.find(query)
    .sort(sort)
    .populate('response.respondedBy', 'name')
    .limit(options.limit || 20)
    .skip(options.skip || 0)
}

reviewSchema.statics.getVenueStats = function(venueId) {
  return this.aggregate([
    {
      $match: {
        venue: mongoose.Types.ObjectId(venueId),
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating.overall' },
        averageFood: { $avg: '$rating.food' },
        averageService: { $avg: '$rating.service' },
        averageAtmosphere: { $avg: '$rating.atmosphere' },
        averageValue: { $avg: '$rating.value' },
        ratingDistribution: {
          $push: '$rating.overall'
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalReviews: 1,
        averageRating: { $round: ['$averageRating', 1] },
        averageFood: { $round: ['$averageFood', 1] },
        averageService: { $round: ['$averageService', 1] },
        averageAtmosphere: { $round: ['$averageAtmosphere', 1] },
        averageValue: { $round: ['$averageValue', 1] },
        ratingDistribution: 1
      }
    }
  ])
}

reviewSchema.statics.getRecentReviews = function(venueId, limit = 5) {
  return this.find({
    venue: venueId,
    status: 'approved'
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .select('customer.name rating.overall title content createdAt isAnonymous')
}

reviewSchema.statics.getPendingModeration = function(limit = 10) {
  return this.find({ status: 'pending' })
    .sort({ createdAt: 1 })
    .limit(limit)
    .populate('venue', 'name')
}

module.exports = mongoose.model('Review', reviewSchema) 
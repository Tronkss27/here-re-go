const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const OfferReferenceSchema = new mongoose.Schema({
  id: {
    type: String,
    required: function() {
      // Required solo se title o description sono presenti
      return this.title || this.description;
    }
  },
  title: {
    type: String,
    required: function() {
      // Required solo se id o description sono presenti
      return this.id || this.description;
    }
  },
  description: {
    type: String,
    required: function() {
      // Required solo se id o title sono presenti
      return this.id || this.title;
    }
  },
  timeframe: {
    type: String,
    default: 'Durante l\'evento'
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  disclaimer: {
    type: String,
    default: 'Offerta gestita direttamente dal locale. SPOrTS facilita solo la comunicazione.'
  }
}, { _id: false });

const MatchSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  homeTeam: {
    type: String,
    required: true
  },
  awayTeam: {
    type: String,
    required: true
  },
  competition: {
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    logo: {
      type: String,
      default: '⚽'
    }
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  homeTeamLogo: {
    type: String,
    default: '🏠'
  },
  awayTeamLogo: {
    type: String,
    default: '✈️'
  },
  source: {
    type: String,
    enum: ['manual', 'api-football', 'football-data'],
    default: 'manual'
  },
  externalId: String // ID dalla API esterna
}, { _id: false });

const EventDetailsSchema = new mongoose.Schema({
  startDate: {
    type: String,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  description: {
    type: String,
    maxlength: 1000
  },
  selectedOffers: [OfferReferenceSchema]
}, { _id: false });

const MatchAnnouncementSchema = new mongoose.Schema({
  venueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true,
    index: true
  },
  match: {
    type: MatchSchema,
    required: true
  },
  eventDetails: {
    type: EventDetailsSchema,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published',
    index: true
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  clicks: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  // Campi per search e filtering
  searchTags: [{
    type: String,
    lowercase: true
  }],
  // Zero-liability disclaimer
  disclaimer: {
    type: String,
    default: 'SPOrTS facilita la comunicazione tra locali e clienti. La gestione degli eventi e delle offerte è responsabilità esclusiva del locale.'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Plugin per pagination
MatchAnnouncementSchema.plugin(mongoosePaginate);

// Indexes per performance multi-tenant
MatchAnnouncementSchema.index({ venueId: 1, status: 1 });
MatchAnnouncementSchema.index({ venueId: 1, createdAt: -1 });
MatchAnnouncementSchema.index({ 'match.date': 1, status: 1 });
MatchAnnouncementSchema.index({ 'match.competition.id': 1 });
MatchAnnouncementSchema.index({ searchTags: 1 });

// Virtual per calcolare engagement rate
MatchAnnouncementSchema.virtual('engagementRate').get(function() {
  if (this.views === 0) return 0;
  return ((this.clicks / this.views) * 100).toFixed(2);
});

// Pre-save middleware per generare search tags
MatchAnnouncementSchema.pre('save', function(next) {
  try {
    const tags = [
      this.match.homeTeam.toLowerCase(),
      this.match.awayTeam.toLowerCase(),
      this.match.competition.name.toLowerCase(),
    ];

    // Controlla se selectedOffers esiste ed è un array con elementi
    if (this.eventDetails.selectedOffers && 
        Array.isArray(this.eventDetails.selectedOffers) && 
        this.eventDetails.selectedOffers.length > 0) {
      
      // Filtra solo le offerte valide con title
      const validOffers = this.eventDetails.selectedOffers.filter(offer => offer && offer.title);
      tags.push(...validOffers.map(offer => offer.title.toLowerCase()));
    }

    this.searchTags = [...new Set(tags)]; // Remove duplicates
    console.log('🏷️ Generated search tags:', this.searchTags);
    next();
  } catch (error) {
    console.error('💥 Error in pre-save middleware:', error);
    next(error);
  }
});

// Static method per trovare annunci attivi per venue
MatchAnnouncementSchema.statics.findActiveByVenue = function(venueId, options = {}) {
  const query = {
    venueId: new mongoose.Types.ObjectId(venueId),
    status: 'published',
    isActive: true
  };
  
  // Aggiungi filtri opzionali
  if (options.fromDate) {
    query['match.date'] = { $gte: options.fromDate };
  }
  
  if (options.competition) {
    query['match.competition.id'] = options.competition;
  }
  
  return this.find(query)
    .sort({ 'match.date': 1, createdAt: -1 })
    .limit(options.limit || 20);
};

// Static method per ricerca pubblica (tutti i locali)
MatchAnnouncementSchema.statics.searchPublic = function(searchQuery, options = {}) {
  const query = {
    status: 'published',
    isActive: true
  };
  
  if (searchQuery) {
    query.searchTags = { $in: [new RegExp(searchQuery, 'i')] };
  }
  
  if (options.date) {
    query['match.date'] = options.date;
  }
  
  if (options.competition) {
    query['match.competition.id'] = options.competition;
  }
  
  return this.find(query)
    .populate('venueId', 'name location contact slug')
    .sort({ 'match.date': 1, views: -1 })
    .limit(options.limit || 50);
};

// Instance method per incrementare views/clicks in modo sicuro
MatchAnnouncementSchema.methods.incrementViews = function() {
  return this.constructor.findByIdAndUpdate(
    this._id,
    { $inc: { views: 1 } },
    { new: true }
  );
};

MatchAnnouncementSchema.methods.incrementClicks = function() {
  return this.constructor.findByIdAndUpdate(
    this._id,
    { $inc: { clicks: 1 } },
    { new: true }
  );
};

module.exports = mongoose.model('MatchAnnouncement', MatchAnnouncementSchema); 
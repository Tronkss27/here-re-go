const mongoose = require('mongoose');

// Modello per tracciare popolarità e analytics delle partite
const PopularMatchSchema = new mongoose.Schema({
  // Identificativo univoco della partita (riutilizzato tra venues)
  matchId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Dati base della partita
  homeTeam: {
    type: String,
    required: true
  },
  
  awayTeam: {
    type: String,
    required: true
  },
  
  competition: {
    id: String,
    name: String,
    logo: String
  },
  
  date: {
    type: String,
    required: true,
    index: true
  },
  
  time: {
    type: String,
    required: true
  },
  
  // Analytics e popolarità
  venueCount: {
    type: Number,
    default: 0,
    index: true // Per ordinare per popolarità
  },
  
  totalViews: {
    type: Number,
    default: 0
  },
  
  totalClicks: {
    type: Number,
    default: 0
  },
  
  // Lista dei venues che trasmettono questa partita
  venues: [{
    venueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      required: true
    },
    announcementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MatchAnnouncement',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Score di popolarità calcolato
  popularityScore: {
    type: Number,
    default: 0,
    index: true
  },
  
  // Metadati per homepage
  isHot: {
    type: Boolean,
    default: false,
    index: true
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Data primo annuncio (chi ha "creato" la partita)
  firstAnnouncedAt: {
    type: Date,
    default: Date.now
  },
  
  // Ultimo aggiornamento popolarità
  lastUpdatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes per performance
PopularMatchSchema.index({ date: 1, popularityScore: -1 });
PopularMatchSchema.index({ isHot: 1, popularityScore: -1 });
PopularMatchSchema.index({ venueCount: -1, totalViews: -1 });

// Metodo statico per calcolare popolarità
PopularMatchSchema.statics.calculatePopularity = function(venueCount, totalViews, totalClicks, daysSinceFirst) {
  // Formula: (venues * 10) + (views * 0.1) + (clicks * 2) - (days * 0.5)
  // Più venues = più popolare, ma decadimento nel tempo
  return (venueCount * 10) + (totalViews * 0.1) + (totalClicks * 2) - (daysSinceFirst * 0.5);
};

// Metodo per aggiornare la popolarità
PopularMatchSchema.methods.updatePopularity = function() {
  const daysSinceFirst = (Date.now() - this.firstAnnouncedAt) / (1000 * 60 * 60 * 24);
  this.popularityScore = this.constructor.calculatePopularity(
    this.venueCount,
    this.totalViews,
    this.totalClicks,
    daysSinceFirst
  );
  
  // Determina se è "hot" (score > 5 e almeno 1 venue per test)
  this.isHot = this.popularityScore > 5 && this.venueCount >= 1;
  
  this.lastUpdatedAt = new Date();
  return this.save();
};

// Metodo per aggiungere un venue
PopularMatchSchema.methods.addVenue = function(venueId, announcementId) {
  // Controlla se il venue è già presente
  const existingVenue = this.venues.find(v => v.venueId.toString() === venueId.toString());
  
  if (!existingVenue) {
    this.venues.push({
      venueId,
      announcementId,
      addedAt: new Date()
    });
    this.venueCount = this.venues.length;
    return this.updatePopularity();
  }
  
  return Promise.resolve(this);
};

// Metodo per rimuovere un venue
PopularMatchSchema.methods.removeVenue = function(venueId) {
  this.venues = this.venues.filter(v => v.venueId.toString() !== venueId.toString());
  this.venueCount = this.venues.length;
  return this.updatePopularity();
};

// Metodi statici per la homepage
PopularMatchSchema.statics.getHotMatches = function(limit = 10) {
  return this.find({ isHot: true })
    .sort({ popularityScore: -1, venueCount: -1 })
    .limit(limit);
};

PopularMatchSchema.statics.getTodayMatches = function(limit = 20) {
  const today = new Date().toISOString().split('T')[0];
  return this.find({ date: { $gte: today } })
    .sort({ popularityScore: -1, date: 1 })
    .limit(limit);
};

PopularMatchSchema.statics.getUpcomingMatches = function(days = 7, limit = 30) {
  const today = new Date();
  const endDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
  
  return this.find({ 
    date: { 
      $gte: today.toISOString().split('T')[0],
      $lte: endDate.toISOString().split('T')[0]
    }
  })
    .sort({ date: 1, popularityScore: -1 })
    .limit(limit);
};

module.exports = mongoose.model('PopularMatch', PopularMatchSchema); 
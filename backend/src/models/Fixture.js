const mongoose = require('mongoose')

const fixtureSchema = new mongoose.Schema({
  // Tenant isolation
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: false // Temporaneamente opzionale per migrazione
  },
  
  // Basic fixture information
  fixtureId: {
    type: String,
    required: true
  },
  
  // Match details
  homeTeam: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    logo: { type: String }
  },
  
  awayTeam: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    logo: { type: String }
  },
  
  // Competition info
  league: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    country: { type: String },
    logo: { type: String },
    season: { type: String }
  },
  
  // Timing
  date: {
    type: Date,
    required: true
  },
  
  status: {
    type: String,
    enum: ['scheduled', 'live', 'finished', 'postponed', 'cancelled'],
    default: 'scheduled'
  },
  
  // Score (when available)
  score: {
    home: { type: Number, default: null },
    away: { type: Number, default: null }
  },
  
  // Venue booking stats
  popularity: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  
  totalBookings: {
    type: Number,
    default: 0
  },
  
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Indexes for performance
fixtureSchema.index({ tenantId: 1 })
fixtureSchema.index({ tenantId: 1, fixtureId: 1 }, { unique: true, sparse: true })
fixtureSchema.index({ tenantId: 1, date: 1 })
fixtureSchema.index({ tenantId: 1, status: 1 })
fixtureSchema.index({ tenantId: 1, 'league.id': 1 })
fixtureSchema.index({ tenantId: 1, 'homeTeam.id': 1 })
fixtureSchema.index({ tenantId: 1, 'awayTeam.id': 1 })
fixtureSchema.index({ fixtureId: 1 })
fixtureSchema.index({ date: 1 })
fixtureSchema.index({ status: 1 })
fixtureSchema.index({ 'league.id': 1 })
fixtureSchema.index({ 'homeTeam.id': 1 })
fixtureSchema.index({ 'awayTeam.id': 1 })

// Static methods
fixtureSchema.statics.findUpcoming = function(limit = 20) {
  return this.find({
    date: { $gte: new Date() },
    status: 'scheduled',
    isActive: true
  })
  .sort({ date: 1 })
  .limit(limit)
}

fixtureSchema.statics.findByTeam = function(teamId) {
  return this.find({
    $or: [
      { 'homeTeam.id': teamId },
      { 'awayTeam.id': teamId }
    ],
    isActive: true
  }).sort({ date: -1 })
}

fixtureSchema.statics.findByLeague = function(leagueId) {
  return this.find({
    'league.id': leagueId,
    isActive: true
  }).sort({ date: -1 })
}

module.exports = mongoose.model('Fixture', fixtureSchema) 
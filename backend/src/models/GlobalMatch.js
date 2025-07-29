const mongoose = require('mongoose');

// Schema per GlobalMatch (come da roadmap Task 1.2)
const globalMatchSchema = new mongoose.Schema({
  providerId: { type: String, required: true, unique: true, index: true },
  league: {
    id: String,
    name: String,
    logo: String
  },
  season: {
    id: String,
    name: String
  },
  date: { type: Date, required: true, index: true },
  time: String,
  status: { name: String },
  participants: {
    home: { id: String, name: String, logo: String },
    away: { id: String, name: String, logo: String }
  },
  venue: { id: String, name: String, city: String },
  lastUpdatedFromProvider: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GlobalMatch', globalMatchSchema); 
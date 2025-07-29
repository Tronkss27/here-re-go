const express = require('express');
const mongoose = require('mongoose');
const PopularMatch = require('./src/models/PopularMatch');
const Venue = require('./src/models/Venue');

const app = express();

// Usa la stessa configurazione del server principale
require('dotenv').config();
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sports-bar';

mongoose.connect(mongoURI);

app.get('/test-db', async (req, res) => {
  try {
    const dbName = mongoose.connection.db.databaseName;
    const host = mongoose.connection.host;
    
    // Test PopularMatch
    const popularCount = await PopularMatch.countDocuments();
    const popularSample = await PopularMatch.find({}).limit(2);
    
    // Test Venue
    const venueCount = await Venue.countDocuments();
    const venueSample = await Venue.find({}).limit(2);
    
    res.json({
      database: { dbName, host },
      popularMatch: { count: popularCount, sample: popularSample },
      venue: { count: venueCount, sample: venueSample }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3003, () => {
  console.log('🧪 DB Test server on http://localhost:3003/test-db');
}); 
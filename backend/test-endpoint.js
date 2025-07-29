const express = require('express');
const mongoose = require('mongoose');
const PopularMatch = require('./src/models/PopularMatch');

const app = express();

mongoose.connect('mongodb://localhost:27017/sports-bar');

app.get('/test-debug', async (req, res) => {
  try {
    console.log('🔍 Testing PopularMatch.getHotMatches()...');
    
    // Test diretto del metodo
    const hotMatches = await PopularMatch.getHotMatches(5);
    console.log('📊 hotMatches result:', hotMatches);
    console.log('📊 hotMatches length:', hotMatches.length);
    
    // Test query diretta
    const directQuery = await PopularMatch.find({ isHot: true })
      .sort({ popularityScore: -1, venueCount: -1 })
      .limit(5);
    console.log('📊 directQuery result:', directQuery);
    console.log('📊 directQuery length:', directQuery.length);
    
    // Test collection esistenza
    const collections = await mongoose.connection.db.listCollections().toArray();
    const popularMatchCollection = collections.find(c => c.name === 'popularmatches');
    console.log('📊 popularmatches collection exists:', !!popularMatchCollection);
    
    if (popularMatchCollection) {
      const count = await mongoose.connection.db.collection('popularmatches').countDocuments();
      console.log('📊 popularmatches count:', count);
      
      const docs = await mongoose.connection.db.collection('popularmatches').find({}).toArray();
      console.log('📊 popularmatches docs:', docs);
    }
    
    res.json({
      hotMatches,
      directQuery,
      collectionExists: !!popularMatchCollection,
      debug: 'Check console for detailed logs'
    });
    
  } catch (error) {
    console.error('❌ Test error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3002, () => {
  console.log('🧪 Test server running on http://localhost:3002/test-debug');
}); 
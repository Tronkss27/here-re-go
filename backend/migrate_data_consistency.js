const mongoose = require('mongoose');

// Import models
const Booking = require('./src/models/Booking');
const Venue = require('./src/models/Venue');
const MatchAnnouncement = require('./src/models/MatchAnnouncement');

// Connect to database
mongoose.connect('mongodb://localhost:27017/sports', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

class DataMigration {
  constructor() {
    this.stats = {
      bookingsFixed: 0,
      matchAnnouncementsFixed: 0,
      indexesCreated: 0,
      errors: 0
    };
  }

  async run() {
    console.log('🚀 === STARTING DATA CONSISTENCY MIGRATION ===\n');
    
    try {
      await this.fixBookingVenueReferences();
      await this.addTenantIdToMatchAnnouncements();
      await this.ensureIndexes();
      await this.validateDataConsistency();
      
      this.printReport();
    } catch (error) {
      console.error('❌ Migration failed:', error);
      this.stats.errors++;
    } finally {
      mongoose.connection.close();
    }
  }

  // 1. Risolvi i riferimenti venue nei booking (String vs ObjectId)
  async fixBookingVenueReferences() {
    console.log('🔧 === FIXING BOOKING VENUE REFERENCES ===');
    
    try {
      // Trova tutti i booking con venue come stringa che potrebbe essere ObjectId
      const bookingsToFix = await Booking.find({
        venue: { $type: "string" },
        $expr: {
          $and: [
            { $eq: [{ $strLenCP: "$venue" }, 24] }, // Lunghezza ObjectId
            { $regexMatch: { input: "$venue", regex: /^[0-9a-fA-F]{24}$/ } } // Formato hex
          ]
        }
      });

      console.log(`Found ${bookingsToFix.length} bookings with string venue IDs that should be ObjectIds`);

      for (const booking of bookingsToFix) {
        try {
          // Verifica se il venue esiste
          const venueExists = await Venue.findById(booking.venue);
          if (venueExists) {
            // Mantieni come stringa ma valida (il nostro nuovo sistema gestisce entrambi)
            console.log(`✅ Booking ${booking._id}: venue ${booking.venue} validated (keeping as string)`);
          } else {
            console.log(`⚠️ Booking ${booking._id}: venue ${booking.venue} not found in database`);
          }
          this.stats.bookingsFixed++;
        } catch (error) {
          console.error(`❌ Error processing booking ${booking._id}:`, error.message);
          this.stats.errors++;
        }
      }
    } catch (error) {
      console.error('❌ Error in fixBookingVenueReferences:', error);
      this.stats.errors++;
    }
  }

  // 2. Aggiungi tenantId ai MatchAnnouncement esistenti
  async addTenantIdToMatchAnnouncements() {
    console.log('\n🔧 === ADDING TENANT ID TO MATCH ANNOUNCEMENTS ===');
    
    try {
      // Trova tutti i MatchAnnouncement senza tenantId
      const announcementsToFix = await MatchAnnouncement.find({
        tenantId: { $exists: false }
      });

      console.log(`Found ${announcementsToFix.length} match announcements without tenantId`);

      for (const announcement of announcementsToFix) {
        try {
          // Trova il venue per ottenere il tenantId
          const venue = await Venue.findById(announcement.venueId);
          if (venue && venue.tenantId) {
            await MatchAnnouncement.updateOne(
              { _id: announcement._id },
              { $set: { tenantId: venue.tenantId } }
            );
            console.log(`✅ Added tenantId ${venue.tenantId} to announcement ${announcement._id}`);
            this.stats.matchAnnouncementsFixed++;
          } else {
            console.log(`⚠️ Announcement ${announcement._id}: venue ${announcement.venueId} has no tenantId`);
          }
        } catch (error) {
          console.error(`❌ Error processing announcement ${announcement._id}:`, error.message);
          this.stats.errors++;
        }
      }
    } catch (error) {
      console.error('❌ Error in addTenantIdToMatchAnnouncements:', error);
      this.stats.errors++;
    }
  }

  // 3. Assicurati che tutti gli indici siano creati
  async ensureIndexes() {
    console.log('\n🔧 === ENSURING INDEXES ===');
    
    try {
      const models = [
        { name: 'Booking', model: Booking },
        { name: 'Venue', model: Venue },
        { name: 'MatchAnnouncement', model: MatchAnnouncement }
      ];

      for (const { name, model } of models) {
        try {
          await model.collection.createIndexes();
          console.log(`✅ Indexes ensured for ${name}`);
          this.stats.indexesCreated++;
        } catch (error) {
          console.error(`❌ Error creating indexes for ${name}:`, error.message);
          this.stats.errors++;
        }
      }
    } catch (error) {
      console.error('❌ Error in ensureIndexes:', error);
      this.stats.errors++;
    }
  }

  // 4. Valida la consistenza dei dati dopo la migrazione
  async validateDataConsistency() {
    console.log('\n🔍 === VALIDATING DATA CONSISTENCY ===');
    
    try {
      // Test 1: Verifica che i booking possano essere trovati con query normalizzate
      const sampleBooking = await Booking.findOne({ venue: { $type: "string" } });
      if (sampleBooking) {
        const normalizedQuery = Booking.normalizeVenueQuery(sampleBooking.venue);
        const foundBookings = await Booking.find(normalizedQuery.venue ? normalizedQuery : { venue: sampleBooking.venue });
        console.log(`✅ Normalized query test: found ${foundBookings.length} bookings for venue ${sampleBooking.venue}`);
      }

      // Test 2: Verifica tenant consistency
      const bookingsWithTenant = await Booking.countDocuments({ tenantId: { $exists: true } });
      const venuesWithTenant = await Venue.countDocuments({ tenantId: { $exists: true } });
      const announcementsWithTenant = await MatchAnnouncement.countDocuments({ tenantId: { $exists: true } });
      
      console.log(`✅ Tenant consistency check:`);
      console.log(`   - Bookings with tenantId: ${bookingsWithTenant}`);
      console.log(`   - Venues with tenantId: ${venuesWithTenant}`);
      console.log(`   - Announcements with tenantId: ${announcementsWithTenant}`);

      // Test 3: Verifica indici
      const collections = ['bookings', 'venues', 'matchannouncements'];
      for (const collectionName of collections) {
        const collection = mongoose.connection.db.collection(collectionName);
        const indexes = await collection.listIndexes().toArray();
        const hasTenantIndex = indexes.some(idx => idx.key && idx.key.tenantId);
        console.log(`✅ ${collectionName} has tenantId index: ${hasTenantIndex}`);
      }

    } catch (error) {
      console.error('❌ Error in validateDataConsistency:', error);
      this.stats.errors++;
    }
  }

  printReport() {
    console.log('\n📊 === MIGRATION REPORT ===');
    console.log(`Bookings processed: ${this.stats.bookingsFixed}`);
    console.log(`Match announcements fixed: ${this.stats.matchAnnouncementsFixed}`);
    console.log(`Indexes created: ${this.stats.indexesCreated}`);
    console.log(`Errors encountered: ${this.stats.errors}`);
    
    if (this.stats.errors === 0) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n⚠️ Migration completed with errors. Check logs above.');
    }
  }
}

// Run migration
const migration = new DataMigration();
migration.run(); 
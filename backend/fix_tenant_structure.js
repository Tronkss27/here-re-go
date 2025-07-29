const mongoose = require('mongoose');

// Import models
const Venue = require('./src/models/Venue');
const User = require('./src/models/User');
const MatchAnnouncement = require('./src/models/MatchAnnouncement');

// Connect to database
mongoose.connect('mongodb://localhost:27017/sports', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function fixTenantStructure() {
  console.log('🚀 === FIXING TENANT STRUCTURE ===\n');

  try {
    // 1. Trova venue senza tenantId
    const venuesWithoutTenant = await Venue.find({
      tenantId: { $exists: false }
    });

    console.log(`Found ${venuesWithoutTenant.length} venues without tenantId`);

    for (const venue of venuesWithoutTenant) {
      try {
        // Trova l'owner del venue
        const owner = await User.findById(venue.owner);
        
        if (owner) {
          // Usa l'ID dell'owner come tenantId (strategia attuale del sistema)
          const tenantId = owner._id;
          
          await Venue.updateOne(
            { _id: venue._id },
            { $set: { tenantId: tenantId } }
          );
          
          console.log(`✅ Venue ${venue._id} (${venue.name}): assigned tenantId ${tenantId} from owner ${owner.name}`);
        } else {
          console.log(`⚠️ Venue ${venue._id} (${venue.name}): owner ${venue.owner} not found`);
        }
      } catch (error) {
        console.error(`❌ Error processing venue ${venue._id}:`, error.message);
      }
    }

    // 2. Ora aggiorna i MatchAnnouncement
    const announcementsWithoutTenant = await MatchAnnouncement.find({
      tenantId: { $exists: false }
    });

    console.log(`\nFound ${announcementsWithoutTenant.length} match announcements without tenantId`);

    for (const announcement of announcementsWithoutTenant) {
      try {
        // Trova il venue (ora dovrebbe avere tenantId)
        const venue = await Venue.findById(announcement.venueId);
        
        if (venue && venue.tenantId) {
          await MatchAnnouncement.updateOne(
            { _id: announcement._id },
            { $set: { tenantId: venue.tenantId } }
          );
          
          console.log(`✅ Announcement ${announcement._id}: assigned tenantId ${venue.tenantId} from venue ${venue.name}`);
        } else {
          console.log(`⚠️ Announcement ${announcement._id}: venue ${announcement.venueId} still has no tenantId`);
        }
      } catch (error) {
        console.error(`❌ Error processing announcement ${announcement._id}:`, error.message);
      }
    }

    // 3. Verifica finale
    const venuesWithTenant = await Venue.countDocuments({ tenantId: { $exists: true } });
    const announcementsWithTenant = await MatchAnnouncement.countDocuments({ tenantId: { $exists: true } });
    const totalVenues = await Venue.countDocuments({});
    const totalAnnouncements = await MatchAnnouncement.countDocuments({});

    console.log('\n📊 === FINAL REPORT ===');
    console.log(`Venues with tenantId: ${venuesWithTenant}/${totalVenues}`);
    console.log(`Announcements with tenantId: ${announcementsWithTenant}/${totalAnnouncements}`);

    if (venuesWithTenant === totalVenues && announcementsWithTenant === totalAnnouncements) {
      console.log('\n✅ All documents now have proper tenant structure!');
    } else {
      console.log('\n⚠️ Some documents still missing tenantId. Manual review needed.');
    }

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixTenantStructure(); 
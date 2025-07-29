const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import all models
const Booking = require('./src/models/Booking');
const Venue = require('./src/models/Venue');
const User = require('./src/models/User');
const Tenant = require('./src/models/Tenant');
const Fixture = require('./src/models/Fixture');
const MatchAnnouncement = require('./src/models/MatchAnnouncement');

// Connect to database
mongoose.connect('mongodb://localhost:27017/sports', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

class SystemAudit {
  constructor() {
    this.discrepancies = [];
    this.models = { Booking, Venue, User, Tenant, Fixture, MatchAnnouncement };
  }

  log(level, category, message, details = null) {
    const entry = {
      level,
      category,
      message,
      details,
      timestamp: new Date().toISOString()
    };
    
    console.log(`${level.toUpperCase()} [${category}]: ${message}`);
    if (details) console.log('   Details:', details);
    
    if (level === 'ERROR' || level === 'WARNING') {
      this.discrepancies.push(entry);
    }
  }

  // 1. AUDIT FIELD TYPES - Verifica coerenza tipi tra schema e database
  async auditFieldTypes() {
    console.log('\n🔍 === AUDIT FIELD TYPES ===');
    
    for (const [modelName, Model] of Object.entries(this.models)) {
      try {
        const schema = Model.schema;
        const sampleDoc = await Model.findOne({}).lean();
        
        if (!sampleDoc) {
          this.log('INFO', 'FIELD_TYPES', `No documents found for ${modelName}`);
          continue;
        }

        // Verifica ogni campo dello schema
        for (const [fieldPath, schemaType] of Object.entries(schema.paths)) {
          if (fieldPath === '_id' || fieldPath === '__v') continue;
          
          const actualValue = this.getNestedValue(sampleDoc, fieldPath);
          if (actualValue === undefined) continue;
          
          const expectedType = this.getExpectedType(schemaType);
          const actualType = this.getActualType(actualValue);
          
          if (expectedType !== actualType && !this.isCompatibleType(expectedType, actualType)) {
            this.log('ERROR', 'FIELD_TYPES', 
              `Type mismatch in ${modelName}.${fieldPath}`,
              { expected: expectedType, actual: actualType, sampleValue: actualValue }
            );
          }
        }
      } catch (error) {
        this.log('ERROR', 'FIELD_TYPES', `Error auditing ${modelName}`, error.message);
      }
    }
  }

  // 2. AUDIT OBJECTID USAGE - Verifica uso coerente di ObjectId vs String
  async auditObjectIdUsage() {
    console.log('\n🔍 === AUDIT OBJECTID USAGE ===');
    
    // Verifica Booking.venue (dovrebbe essere Mixed ma usato come String)
    const bookings = await Booking.find({}).limit(10).lean();
    for (const booking of bookings) {
      const venueType = typeof booking.venue;
      const isObjectId = mongoose.Types.ObjectId.isValid(booking.venue) && venueType === 'object';
      
      if (venueType === 'string' && mongoose.Types.ObjectId.isValid(booking.venue)) {
        this.log('WARNING', 'OBJECTID_USAGE', 
          'Booking.venue stored as string but could be ObjectId',
          { bookingId: booking._id, venue: booking.venue, type: venueType }
        );
      }
    }

    // Verifica Venue.tenantId consistency
    const venues = await Venue.find({}).limit(10).lean();
    for (const venue of venues) {
      if (venue.tenantId) {
        const tenantIdType = typeof venue.tenantId;
        if (tenantIdType === 'string') {
          this.log('WARNING', 'OBJECTID_USAGE',
            'Venue.tenantId stored as string instead of ObjectId',
            { venueId: venue._id, tenantId: venue.tenantId, type: tenantIdType }
          );
        }
      }
    }

    // Verifica User references
    const users = await User.find({}).limit(5).lean();
    for (const user of users) {
      if (user.venueId && typeof user.venueId === 'string') {
        this.log('WARNING', 'OBJECTID_USAGE',
          'User.venueId stored as string instead of ObjectId',
          { userId: user._id, venueId: user.venueId }
        );
      }
    }
  }

  // 3. AUDIT TENANT CONSISTENCY - Verifica coerenza tenant tra documenti correlati
  async auditTenantConsistency() {
    console.log('\n🔍 === AUDIT TENANT CONSISTENCY ===');
    
    // Verifica Booking-Venue tenant consistency
    const bookingsWithVenues = await Booking.aggregate([
      { $match: { tenantId: { $exists: true } } },
      { $lookup: { 
          from: 'venues', 
          localField: 'venue', 
          foreignField: '_id', 
          as: 'venueDoc' 
        } 
      },
      { $match: { 'venueDoc.0': { $exists: true } } },
      { $limit: 10 }
    ]);

    for (const booking of bookingsWithVenues) {
      const venue = booking.venueDoc[0];
      if (venue && venue.tenantId) {
        const bookingTenant = booking.tenantId.toString();
        const venueTenant = venue.tenantId.toString();
        
        if (bookingTenant !== venueTenant) {
          this.log('ERROR', 'TENANT_CONSISTENCY',
            'Booking and Venue have different tenantIds',
            { 
              bookingId: booking._id,
              venueId: venue._id,
              bookingTenant,
              venueTenant
            }
          );
        }
      }
    }

    // Verifica User-Venue tenant consistency
    const usersWithVenues = await User.aggregate([
      { $match: { role: 'venue_owner' } },
      { $lookup: { 
          from: 'venues', 
          localField: '_id', 
          foreignField: 'owner', 
          as: 'venues' 
        } 
      },
      { $match: { 'venues.0': { $exists: true } } },
      { $limit: 5 }
    ]);

    for (const user of usersWithVenues) {
      for (const venue of user.venues) {
        if (venue.tenantId) {
          const userTenant = user.tenantId?.toString();
          const venueTenant = venue.tenantId.toString();
          
          if (userTenant && userTenant !== venueTenant) {
            this.log('ERROR', 'TENANT_CONSISTENCY',
              'User and owned Venue have different tenantIds',
              { 
                userId: user._id,
                venueId: venue._id,
                userTenant,
                venueTenant
              }
            );
          }
        }
      }
    }
  }

  // 4. AUDIT QUERY PATTERNS - Verifica pattern di query nei controller
  async auditQueryPatterns() {
    console.log('\n🔍 === AUDIT QUERY PATTERNS ===');
    
    // Leggi tutti i file controller
    const controllersDir = path.join(__dirname, 'src/controllers');
    const controllerFiles = fs.readdirSync(controllersDir).filter(f => f.endsWith('.js'));
    
    for (const file of controllerFiles) {
      const filePath = path.join(controllersDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Cerca pattern problematici
      this.checkQueryPatterns(file, content);
    }
  }

  checkQueryPatterns(filename, content) {
    // Pattern 1: Query dirette senza TenantQuery
    const directQueryPattern = /(Booking|Venue|User|Fixture)\.find\(/g;
    const matches = content.match(directQueryPattern);
    if (matches) {
      this.log('WARNING', 'QUERY_PATTERNS',
        `Direct model queries found in ${filename}`,
        { count: matches.length, patterns: matches }
      );
    }

    // Pattern 2: ObjectId inconsistencies
    const stringToObjectIdPattern = /new\s+mongoose\.Types\.ObjectId\(/g;
    const objectIdMatches = content.match(stringToObjectIdPattern);
    if (objectIdMatches) {
      this.log('INFO', 'QUERY_PATTERNS',
        `ObjectId conversions found in ${filename}`,
        { count: objectIdMatches.length }
      );
    }

    // Pattern 3: Mixed venue field usage
    const venueFieldPattern = /venue:\s*\{[^}]*\$in:/g;
    const venueMatches = content.match(venueFieldPattern);
    if (venueMatches) {
      this.log('INFO', 'QUERY_PATTERNS',
        `Complex venue queries found in ${filename}`,
        { count: venueMatches.length }
      );
    }
  }

  // 5. AUDIT FRONTEND-BACKEND MAPPING
  async auditFrontendBackendMapping() {
    console.log('\n🔍 === AUDIT FRONTEND-BACKEND MAPPING ===');
    
    // Leggi i tipi TypeScript del frontend
    const frontendTypesPath = path.join(__dirname, '../frontend/src/types/index.ts');
    if (fs.existsSync(frontendTypesPath)) {
      const typesContent = fs.readFileSync(frontendTypesPath, 'utf8');
      this.checkTypeDefinitions(typesContent);
    }

    // Verifica service files
    const servicesDir = path.join(__dirname, '../frontend/src/services');
    if (fs.existsSync(servicesDir)) {
      const serviceFiles = fs.readdirSync(servicesDir).filter(f => f.endsWith('.js'));
      for (const file of serviceFiles) {
        const filePath = path.join(servicesDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        this.checkServicePatterns(file, content);
      }
    }
  }

  checkTypeDefinitions(content) {
    // Cerca definizioni di BookingTablePreference
    const tablePreferencePattern = /BookingTablePreference\s*=\s*[^;]+/g;
    const matches = content.match(tablePreferencePattern);
    if (matches) {
      this.log('INFO', 'FRONTEND_TYPES',
        'Found BookingTablePreference definition',
        { definition: matches[0] }
      );
    }
  }

  checkServicePatterns(filename, content) {
    // Pattern 1: Inconsistent field mapping
    const convertBackendPattern = /convertBackendVenueToLegacy/g;
    if (convertBackendPattern.test(content)) {
      this.log('INFO', 'SERVICE_PATTERNS',
        `Backend conversion found in ${filename}`
      );
    }

    // Pattern 2: Direct field access without conversion
    const directFieldPattern = /\.bookingSettings(?!\s*[:|=])/g;
    const matches = content.match(directFieldPattern);
    if (matches) {
      this.log('WARNING', 'SERVICE_PATTERNS',
        `Direct bookingSettings access in ${filename}`,
        { count: matches.length }
      );
    }
  }

  // 6. AUDIT INDEX USAGE
  async auditIndexUsage() {
    console.log('\n🔍 === AUDIT INDEX USAGE ===');
    
    for (const [modelName, Model] of Object.entries(this.models)) {
      try {
        const collection = Model.collection;
        const indexes = await collection.listIndexes().toArray();
        
        // Verifica se ci sono indici su campi tenant
        const hasTenantIndex = indexes.some(idx => 
          idx.key && (idx.key.tenantId || idx.key.tenant_id)
        );
        
        if (!hasTenantIndex && modelName !== 'Tenant') {
          this.log('WARNING', 'INDEX_USAGE',
            `No tenant index found for ${modelName}`,
            { indexes: indexes.map(idx => Object.keys(idx.key)) }
          );
        }
      } catch (error) {
        this.log('ERROR', 'INDEX_USAGE',
          `Error checking indexes for ${modelName}`,
          error.message
        );
      }
    }
  }

  // Helper methods
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  getExpectedType(schemaType) {
    if (schemaType instanceof mongoose.Schema.Types.ObjectId) return 'ObjectId';
    if (schemaType instanceof mongoose.Schema.Types.Mixed) return 'Mixed';
    if (schemaType.instance) return schemaType.instance;
    return 'Unknown';
  }

  getActualType(value) {
    if (mongoose.Types.ObjectId.isValid(value) && typeof value === 'object') return 'ObjectId';
    if (Array.isArray(value)) return 'Array';
    if (value instanceof Date) return 'Date';
    return typeof value;
  }

  isCompatibleType(expected, actual) {
    const compatibleTypes = {
      'Mixed': ['string', 'number', 'boolean', 'object', 'ObjectId'],
      'ObjectId': ['ObjectId', 'string'],
      'String': ['string'],
      'Number': ['number'],
      'Boolean': ['boolean'],
      'Date': ['Date', 'string']
    };
    
    return compatibleTypes[expected]?.includes(actual) || false;
  }

  // Main audit runner
  async runFullAudit() {
    console.log('🚀 === STARTING SYSTEM AUDIT ===\n');
    
    try {
      await this.auditFieldTypes();
      await this.auditObjectIdUsage();
      await this.auditTenantConsistency();
      await this.auditQueryPatterns();
      await this.auditFrontendBackendMapping();
      await this.auditIndexUsage();
      
      this.generateReport();
    } catch (error) {
      console.error('❌ Audit failed:', error);
    } finally {
      mongoose.connection.close();
    }
  }

  generateReport() {
    console.log('\n📊 === AUDIT REPORT ===');
    
    const errorCount = this.discrepancies.filter(d => d.level === 'ERROR').length;
    const warningCount = this.discrepancies.filter(d => d.level === 'WARNING').length;
    
    console.log(`Total Issues Found: ${this.discrepancies.length}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Warnings: ${warningCount}`);
    
    if (errorCount > 0) {
      console.log('\n🚨 CRITICAL ERRORS:');
      this.discrepancies
        .filter(d => d.level === 'ERROR')
        .forEach((d, i) => {
          console.log(`${i + 1}. [${d.category}] ${d.message}`);
          if (d.details) console.log(`   Details:`, d.details);
        });
    }
    
    if (warningCount > 0) {
      console.log('\n⚠️ WARNINGS:');
      this.discrepancies
        .filter(d => d.level === 'WARNING')
        .forEach((d, i) => {
          console.log(`${i + 1}. [${d.category}] ${d.message}`);
          if (d.details) console.log(`   Details:`, d.details);
        });
    }
    
    // Save report to file
    const reportPath = path.join(__dirname, 'audit_report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: { total: this.discrepancies.length, errors: errorCount, warnings: warningCount },
      discrepancies: this.discrepancies
    }, null, 2));
    
    console.log(`\n📄 Full report saved to: ${reportPath}`);
  }
}

// Run audit
const audit = new SystemAudit();
audit.runFullAudit(); 
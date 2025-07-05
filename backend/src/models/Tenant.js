const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  // Identificatori tenant
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    maxLength: 50
  },
  name: {
    type: String,
    required: true,
    maxLength: 100
  },
  domain: {
    type: String,
    required: false,
    unique: true,
    sparse: true, // Permette valori null/undefined
    lowercase: true,
    match: [/^[a-z0-9.-]+\.[a-z]{2,}$/, 'Please enter a valid domain']
  },
  subdomain: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens']
  },

  // Configurazione tenant
  settings: {
    // Branding
    branding: {
      logoUrl: String,
      primaryColor: {
        type: String,
        match: [/^#[0-9A-F]{6}$/i, 'Primary color must be a valid hex color']
      },
      secondaryColor: {
        type: String,
        match: [/^#[0-9A-F]{6}$/i, 'Secondary color must be a valid hex color']
      }
    },
    
    // Features abilitate
    features: {
      bookingSystem: {
        type: Boolean,
        default: true
      },
      multiVenue: {
        type: Boolean,
        default: false
      },
      eventManagement: {
        type: Boolean,
        default: true
      },
      analytics: {
        type: Boolean,
        default: true
      },
      customDomain: {
        type: Boolean,
        default: false
      }
    },
    
    // Limitazioni tenant
    limits: {
      maxVenues: {
        type: Number,
        default: 1,
        min: 1
      },
      maxUsers: {
        type: Number,
        default: 10,
        min: 1
      },
      maxBookingsPerMonth: {
        type: Number,
        default: 500,
        min: 0
      },
      storageLimit: {
        type: Number, // in MB
        default: 100,
        min: 10
      }
    }
  },

  // Informazioni business
  businessInfo: {
    type: {
      type: String,
      enum: ['restaurant', 'bar', 'sports_bar', 'cafe', 'pub', 'club', 'other'],
      default: 'sports_bar'
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'IT'
      }
    },
    contact: {
      email: {
        type: String,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
      },
      phone: String,
      website: String
    },
    taxInfo: {
      vatNumber: String,
      taxCode: String
    }
  },

  // Stato e metadata
  status: {
    type: String,
    enum: ['active', 'suspended', 'trial', 'cancelled'],
    default: 'trial'
  },
  plan: {
    type: String,
    enum: ['trial', 'basic', 'premium', 'enterprise'],
    default: 'trial'
  },
  
  // Audit e monitoring
  usage: {
    currentUsers: {
      type: Number,
      default: 0
    },
    currentVenues: {
      type: Number,
      default: 0
    },
    bookingsThisMonth: {
      type: Number,
      default: 0
    },
    storageUsed: {
      type: Number, // in MB
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  
  // Date importanti
  trialEndsAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 giorni
  },
  subscriptionRenewalDate: Date,
  
  // Admin tenant
  ownerUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indices per performance (slug, domain, subdomain già indicizzati da unique: true)
tenantSchema.index({ status: 1 });
tenantSchema.index({ 'usage.lastActivity': -1 });

// Virtuali
tenantSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

tenantSchema.virtual('isTrialExpired').get(function() {
  return this.status === 'trial' && this.trialEndsAt < new Date();
});

tenantSchema.virtual('remainingTrialDays').get(function() {
  if (this.status !== 'trial') return 0;
  const now = new Date();
  const remaining = Math.max(0, Math.ceil((this.trialEndsAt - now) / (24 * 60 * 60 * 1000)));
  return remaining;
});

// Metodi di istanza
tenantSchema.methods.updateUsage = function(field, increment = 1) {
  if (this.usage[field] !== undefined) {
    this.usage[field] += increment;
    this.usage.lastActivity = new Date();
  }
  return this.save();
};

tenantSchema.methods.checkLimit = function(field, currentValue = null) {
  const limit = this.settings.limits[field];
  if (!limit) return true;
  
  const current = currentValue !== null ? currentValue : this.usage[`current${field.charAt(0).toUpperCase() + field.slice(1)}`];
  return current < limit;
};

// Middleware pre-save
tenantSchema.pre('save', function(next) {
  // Genera subdomain dal nome se non specificato
  if (!this.subdomain && this.slug) {
    this.subdomain = this.slug;
  }
  
  // Controlla limiti del piano
  if (this.plan === 'trial') {
    this.settings.limits.maxVenues = 1;
    this.settings.limits.maxUsers = 5;
    this.settings.features.multiVenue = false;
    this.settings.features.customDomain = false;
  }
  
  next();
});

module.exports = mongoose.model('Tenant', tenantSchema); 
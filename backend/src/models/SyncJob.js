const mongoose = require('mongoose');

const SyncJobSchema = new mongoose.Schema({
  jobId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    enum: ['league_sync'],
    default: 'league_sync'
  },
  league: {
    type: String,
    required: true
  },
  dateRange: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending'
  },
  progress: {
    total: {
      type: Number,
      default: 0
    },
    processed: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    currentChunk: {
      type: String,
      default: ''
    }
  },
  results: {
    totalFixtures: {
      type: Number,
      default: 0
    },
    newMatches: {
      type: Number,
      default: 0
    },
    cacheHits: {
      type: Number,
      default: 0
    },
    errors: {
      type: Number,
      default: 0
    }
  },
  errorDetails: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    message: String,
    data: String
  }],
  createdBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  estimatedDuration: {
    type: Number // milliseconds
  }
}, {
  timestamps: true
});

// Index per performance
SyncJobSchema.index({ status: 1, createdAt: -1 });
SyncJobSchema.index({ createdBy: 1, createdAt: -1 });

// Metodo per aggiornare progress
SyncJobSchema.methods.updateProgress = function(processed, total, currentChunk = '') {
  console.log(`📊 updateProgress called: ${processed}/${total} (${this.progress.percentage}%) - Status: ${this.status}`);
  
  this.progress.processed = processed;
  this.progress.total = total;
  this.progress.percentage = total > 0 ? Math.round((processed / total) * 100) : 0;
  this.progress.currentChunk = currentChunk;
  
  console.log(`📊 Checking completion: processed=${processed} >= total=${total} && status='${this.status}' === 'running'`);
  if (processed >= total && this.status === 'running') {
    console.log(`✅ Setting status to completed for job ${this.jobId}`);
    this.status = 'completed';
    this.completedAt = new Date();
  } else {
    console.log(`⚠️ NOT setting to completed: processed=${processed}, total=${total}, status='${this.status}'`);
  }
  
  return this.save();
};

// Metodo per aggiungere errore
SyncJobSchema.methods.addError = function(message, data = null) {
  this.errorDetails.push({
    timestamp: new Date(),
    message,
    data: data ? JSON.stringify(data) : null
  });
  this.results.errors += 1;
  return this.save();
};

module.exports = mongoose.model('SyncJob', SyncJobSchema);

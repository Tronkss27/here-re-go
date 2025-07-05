const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'venue_owner'],
    default: 'user'
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: false // Temporaneamente opzionale per la migrazione
  },
  venueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
})

// Indexes for performance (email già indicizzato da unique: true)
userSchema.index({ tenantId: 1 })
userSchema.index({ role: 1 })
userSchema.index({ venueId: 1 })
userSchema.index({ isActive: 1 })
userSchema.index({ email: 1, isActive: 1 })
userSchema.index({ role: 1, isActive: 1 })
userSchema.index({ tenantId: 1, email: 1 }, { unique: true }) // Email unica per tenant

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject()
  delete userObject.password
  return userObject
}

// Static methods for common queries
userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true }).select('-password')
}

userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true }).select('-password')
}

userSchema.statics.findVenueOwners = function() {
  return this.find({ role: 'venue_owner', isActive: true }).populate('venueId').select('-password')
}

module.exports = mongoose.model('User', userSchema) 
const mongoose = require('mongoose');

const OfferTemplateSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  price: {
    type: Number,
    required: false,
    min: 0
  },
  tags: [{ type: String, trim: true, lowercase: true }],
  isActive: { type: Boolean, default: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

OfferTemplateSchema.index({ tenantId: 1, isActive: 1, title: 1 });

module.exports = mongoose.model('OfferTemplate', OfferTemplateSchema);



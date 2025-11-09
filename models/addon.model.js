const mongoose = require('mongoose');
const { Schema } = mongoose;

const AddonSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  description: String,
  price: Number,
  bannerImage: String,
  duration: {
    value: Number,
    unit: {
      type: String,
      enum: ['days', 'months', 'years']
    }
  },
  compatiblePlans: [{
    type: String,
    enum: ['BASE_PLAN', 'STUDENT_PLAN', 'PREMIUM_PLAN']
  }],
  features: [String],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Add indexes
AddonSchema.index({ code: 1 });
AddonSchema.index({ isActive: 1 });
AddonSchema.index({ price: 1 });
AddonSchema.index({ 'compatiblePlans': 1 });

module.exports = mongoose.model('Addon', AddonSchema); 
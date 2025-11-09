const mongoose = require('mongoose');
const { Schema } = mongoose;

const SubscriptionPlanSchema = new Schema({
  name: { type: String, required: true },
  code: {
    type: String,
    enum: ['BASE_PLAN', 'STUDENT_PLAN', 'PREMIUM_PLAN'],
    required: true
  },
  description: String,
  price: Number,
  duration: {
    value: Number,
    unit: {
      type: String,
      enum: ['days', 'months', 'years']
    }
  },
  features: [{
    name: String,
    description: String,
    limit: Number
  }],
  benefits: [String],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Add indexes
SubscriptionPlanSchema.index({ code: 1 });
SubscriptionPlanSchema.index({ isActive: 1 });
SubscriptionPlanSchema.index({ price: 1 });

module.exports = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema); 
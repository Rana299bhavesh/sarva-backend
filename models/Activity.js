const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  teacher_id: { type: String, required: true, index: true },
  teacher_name: { type: String, required: true },
  activity_type: { type: String, enum: ['lesson', 'quiz', 'assessment'], required: true },
  subject: { type: String, required: true },
  class: { type: String, required: true },
  created_at: { type: Date, required: true }
}, { timestamps: true });

// HIDDEN TWIST SOLUTION: Compound Unique Index
// This prevents identical records from skewing the analytics.
// If a record has the same teacher, type, subject, class, and exact creation time, it's a duplicate.
activitySchema.index(
  { teacher_id: 1, activity_type: 1, subject: 1, class: 1, created_at: 1 }, 
  { unique: true }
);

module.exports = mongoose.model('Activity', activitySchema);
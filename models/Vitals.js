const mongoose = require('mongoose');

const VitalsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  bp_systolic: Number,
  bp_diastolic: Number,
  sugar: Number,
  weight: Number,
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model('Vitals', VitalsSchema);

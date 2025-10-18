const mongoose = require('mongoose');

const InsightSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true },
  summary_en: { type: String },
  summary_roman_ur: { type: String },
  doctorQuestions: { type: [String], default: [] },
  healthTips: { type: [String], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Insight', InsightSchema);

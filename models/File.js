const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String },
  fileUrl: { type: String, required: true },
  fileType: { type: String },
  status: { type: String, enum: ['pending', 'analyzed'], default: 'pending' },
  insightId: { type: mongoose.Schema.Types.ObjectId, ref: 'Insight' },
}, { timestamps: true });

module.exports = mongoose.model('File', FileSchema);

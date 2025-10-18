const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const File = require('../models/File');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// === Gemini AI Setup ===
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// === ChatMessage Schema (inline or separate model) ===
const ChatMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  sender: { type: String, enum: ['user', 'ai'], required: true },
  text_en: { type: String },
  text_roman_ur: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);

// ===========================================
// 1️⃣ Fetch chat history for a specific report
// ===========================================
router.get('/:fileId', auth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const messages = await ChatMessage.find({ userId: req.user.id, fileId }).sort({ createdAt: 1 });
    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// ===========================================
// 2️⃣ Send message to AI & get response
// ===========================================
router.post('/:fileId', auth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { message } = req.body;

    if (!message) return res.status(400).json({ message: 'Message required' });

    // Save user message
    const userMsg = new ChatMessage({
      userId: req.user.id,
      fileId,
      sender: 'user',
      text_en: message
    });
    await userMsg.save();

    // Fetch related file context (optional)
    const file = await File.findById(fileId);

    // === Gemini AI Call ===
    const prompt = `
    You are HealthMate AI — a smart medical assistant.
    The user uploaded a medical report. If file info is available, use it as context.
    Respond clearly in both English and Roman Urdu.

    File name: ${file?.filename || 'unknown'}
    User message: "${message}"

    Output JSON with two fields:
    {
      "english": "your English answer",
      "roman_urdu": "your Roman Urdu answer"
    }`;

    const result = await model.generateContent(prompt);
    const aiText = result.response.text();

    // Parse Gemini JSON (safe parse)
    let parsed;
    try {
      parsed = JSON.parse(aiText);
    } catch {
      parsed = { english: aiText, roman_urdu: "Mujhe aapka sawal samajh aaya, yeh uska jawab hai Roman Urdu mein." };
    }

    // Save AI response
    const aiMsg = new ChatMessage({
      userId: req.user.id,
      fileId,
      sender: 'ai',
      text_en: parsed.english,
      text_roman_ur: parsed.roman_urdu
    });
    await aiMsg.save();

    res.json({ reply: aiMsg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'AI chat failed' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const cloudinary = require('../utils/cloudinary');
const File = require('../models/File');
const Insight = require('../models/Insight');
const axios = require('axios');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// ===============================
// 1️⃣ Upload file (PDF / image)
// ===============================
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'File required' });

    const streamifier = require('streamifier');
    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'auto', folder: 'healthmate' },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });
    };

    const result = await streamUpload(req.file.buffer);

    const fileDoc = new File({
      userId: req.user.id,
      filename: req.file.originalname,
      fileUrl: result.secure_url,
      fileType: req.file.mimetype,
      status: 'pending'
    });

    await fileDoc.save();
    res.json({ message: 'Uploaded', file: fileDoc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

// ===============================
// 2️⃣ List user's files
// ===============================
router.get('/', auth, async (req, res) => {
  try {
    const files = await File.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ files });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// 3️⃣ Get single file + insight
// ===============================
router.get('/:id', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'Not found' });

    const insight = file.insightId ? await Insight.findById(file.insightId) : null;
    res.json({ file, insight });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// 4️⃣ Analyze file with Gemini (mock)
// ===============================
router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    // Mock analysis — Replace later with Gemini API
    const mockSummaryEn = `This is a sample English summary for ${file.filename}. Key findings: Example finding A, Example finding B.`;
    const mockSummaryUr = `Yeh sample Roman Urdu summary hai for ${file.filename}. Ahm nukta: Example finding A, Example finding B.`;
    const doctorQuestions = ['Show elevated values to doctor', 'Ask about medication changes'];
    const healthTips = ['Maintain hydration', 'Follow up after 2 weeks'];

    const insight = new Insight({
      userId: req.user.id,
      fileId: file._id,
      summary_en: mockSummaryEn,
      summary_roman_ur: mockSummaryUr,
      doctorQuestions,
      healthTips
    });
    await insight.save();

    file.status = 'analyzed';
    file.insightId = insight._id;
    await file.save();

    res.json({ message: 'Analyzed (mock)', insight });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Analysis failed' });
  }
});

// ===============================
module.exports = router;

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Vitals = require('../models/Vitals');

router.post('/', auth, async (req, res) => {
  try {
    const { date, bp_systolic, bp_diastolic, sugar, weight, notes } = req.body;
    const v = new Vitals({ userId: req.user.id, date, bp_systolic, bp_diastolic, sugar, weight, notes });
    await v.save();
    res.json({ message: 'Saved', vitals: v });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const list = await Vitals.find({ userId: req.user.id }).sort({ date: -1 });
    res.json({ list });
  } catch (err) {
    res.status(500).json({ message: 'Failed' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const sentimentController = require('../controllers/sentimentController');

// Analyze single text
router.post('/analyze', sentimentController.analyzeSentiment);

// Get analysis history
router.get('/history', sentimentController.getHistory);

// Delete analysis
router.delete('/history/:id', sentimentController.deleteAnalysis);

// Get statistics
router.get('/stats', sentimentController.getStats);

module.exports = router;
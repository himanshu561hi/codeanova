const express = require('express');
const router = express.Router();
const { createBroadcast, getLatestBroadcast, deleteBroadcast } = require('../controllers/broadcastController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, createBroadcast);
router.get('/latest', getLatestBroadcast);
router.delete('/clear', authMiddleware, deleteBroadcast);

module.exports = router;

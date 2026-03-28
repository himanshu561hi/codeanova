const express = require('express');
const router = express.Router();
const { submitProject, createRazorpayOrder, verifyRazorpayPayment } = require('../controllers/projectController');

// POST: /api/projects/submit
router.post('/submit', submitProject);

// POST: /api/projects/create-order
router.post('/create-order', createRazorpayOrder);

// POST: /api/projects/verify-payment
router.post('/verify-payment', verifyRazorpayPayment);

module.exports = router;

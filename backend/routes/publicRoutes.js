const express = require('express');
const router = express.Router();
const { verifyCertificate, downloadCertificate } = require('../controllers/publicController');

router.post('/verify', verifyCertificate);
router.get(/\/download-certificate\/(.*)/, downloadCertificate);

module.exports = router;

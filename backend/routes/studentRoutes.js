const express = require('express');
const router = express.Router();
const { getStudentProfile, uploadProfilePic, loginStudent } = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadCloud } = require('../config/cloudinary');

router.post('/login', loginStudent);
router.get('/profile', authMiddleware, getStudentProfile);
router.post('/upload-profile-pic', authMiddleware, uploadCloud.single('profilePic'), uploadProfilePic);

module.exports = router;

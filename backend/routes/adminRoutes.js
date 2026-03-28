const express = require('express');
const router = express.Router();
console.log("[DEBUG] >>> ADMIN ROUTER V2.0 LOADED <<< (Including Project Templates)");
const multer = require('multer');
const { 
  getAnalytics, sendOfferLetter, sendCertificate, loginAdmin, assignBatch, 
  updateProjectStatus, togglePayment, saveAdminNote, sendCustomEmail, markDownloaded,
  importInterns, bulkTogglePayment, bulkToggleOffer, deleteUser, importCertificates,
  getCertificates, deleteCertificate, createAdminProject, getAdminProjects,
  updateAdminProject, deleteAdminProject
} = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

// POST: /api/admin/login
router.post('/login', loginAdmin);

// POST: /api/admin/assign-batch
router.post('/assign-batch', authMiddleware, assignBatch);

// GET: /api/admin/analytics
router.get('/analytics', authMiddleware, getAnalytics);

// POST: /api/admin/offer-letter
router.post('/offer-letter', authMiddleware, sendOfferLetter);

// POST: /api/admin/certificate
router.post('/certificate', authMiddleware, sendCertificate);

// POST: /api/admin/update-project-status
router.post('/update-project-status', authMiddleware, updateProjectStatus);

// POST: /api/admin/toggle-payment  [NEW]
router.post('/toggle-payment', authMiddleware, togglePayment);

// POST: /api/admin/save-note  [NEW]
router.post('/save-note', authMiddleware, saveAdminNote);

// POST: /api/admin/send-email  [NEW]
router.post('/send-email', authMiddleware, sendCustomEmail);

// POST: /api/admin/mark-downloaded  [NEW]
router.post('/mark-downloaded', authMiddleware, markDownloaded);

// POST: /api/admin/import-excel  [NEW]
router.post('/import-excel', authMiddleware, upload.single('file'), importInterns);
router.post('/bulk-toggle-payment', authMiddleware, bulkTogglePayment);
router.post('/bulk-toggle-offer', authMiddleware, bulkToggleOffer);
router.post('/delete-user', authMiddleware, deleteUser);
router.post('/import-certificates', authMiddleware, upload.single('file'), importCertificates);
router.post('/update-user', authMiddleware, async (req, res) => {
  const User = require('../models/User'); // inline if not imported
  try {
    const { email, ...updates } = req.body;
    const user = await User.findOneAndUpdate({ email }, { $set: updates }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating user", error: error.message });
  }
});

router.get('/certificates', authMiddleware, getCertificates);
router.post('/delete-certificate', authMiddleware, deleteCertificate);

// ADMIN PROJECT TEMPLATES [NEW]
router.post('/admin-projects', authMiddleware, createAdminProject);
router.get('/admin-projects', authMiddleware, getAdminProjects);
router.put('/admin-projects/:id', authMiddleware, updateAdminProject);
router.delete('/admin-projects/:id', authMiddleware, deleteAdminProject);

module.exports = router;


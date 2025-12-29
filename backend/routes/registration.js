const express = require('express');
const router = express.Router();
const { 
  createOrder, 
  verifyPayment, 
  getAllRegistrations, 
  //unenrollCourse 
} = require('../controllers/registrationController');

// Import verifyToken from auth.js
const { verifyToken } = require('./auth');

// Public routes (no authentication needed)
router.post('/', createOrder);
router.post('/verify-payment', verifyPayment);
router.get('/all', getAllRegistrations);

// Protected route (authentication required)
// ⚠️ UNENROLL ROUTE - COMMENTED OUT FOR NOW
// Uncomment when ready to enable unenroll functionality
//router.post('/unenroll', verifyToken, unenrollCourse);

module.exports = router;

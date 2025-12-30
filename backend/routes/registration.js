const express = require('express');
const router = express.Router();

const {
  createOrder,
  verifyPayment,
  getAllRegistrations,
  markPaymentFailed,
} = require('../controllers/registrationController');

// Public routes
router.post('/', createOrder);
router.post('/verify-payment', verifyPayment);

// ✅ NEW (called from frontend on dismiss / failed)
router.post('/mark-failed', markPaymentFailed);

router.get('/all', getAllRegistrations);

module.exports = router;

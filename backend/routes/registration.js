const express = require('express');
const router = express.Router();

const registrationController = require('../controllers/registrationController');

// ✅ required handlers
const { createOrder, verifyPayment, getAllRegistrations, markPaymentFailed } = registrationController;

// Hard fail early with clear error (better than Express "undefined")
if (!createOrder) throw new Error('registrationController.createOrder is missing');
if (!verifyPayment) throw new Error('registrationController.verifyPayment is missing');
if (!getAllRegistrations) throw new Error('registrationController.getAllRegistrations is missing');

router.post('/', createOrder);
router.post('/verify-payment', verifyPayment);
router.get('/all', getAllRegistrations);

// optional (only if exists)
if (markPaymentFailed) {
  router.post('/mark-failed', markPaymentFailed);
}

module.exports = router;

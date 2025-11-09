const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const validate = require('../middleware/validator');

const router = express.Router();

// Validation middleware
const loginValidation = [
  body('phoneNumber')
    .matches(/^\+[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),
];

const otpValidation = [
  body('phoneNumber')
    .matches(/^\+[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),
  body('otp')
    .matches(/^\d{6}$/)
    .withMessage('OTP must be 6 digits'),
];

// Routes
router.post('/login', loginValidation, authController.sendOTP);
router.post('/verify-otp', otpValidation, authController.verifyOTP);

module.exports = router;

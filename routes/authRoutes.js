const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const validate = require('../middleware/validator');
const { AuthCredential,Member } = require('../models/index');
const router = express.Router();

// // Validation middleware
// const loginValidation = [
//   body('phoneNumber')
//     .matches(/^\+[1-9]\d{1,14}$/)
//     .withMessage('Invalid phone number format'),
// ];

// const otpValidation = [
//   body('phoneNumber')
//     .matches(/^\+[1-9]\d{1,14}$/)
//     .withMessage('Invalid phone number format'),
//   body('otp')
//     .matches(/^\d{6}$/)
//     .withMessage('OTP must be 6 digits'),
// ];

// // Routes
// router.post('/login', loginValidation, authController.sendOTP);
// router.post('/verify-otp', otpValidation, authController.verifyOTP);
// Validation schemas
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('phone').matches(/^\+?[\d\s-]+$/).withMessage('Please provide a valid phone number'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter'),
  body('userType')
    .isIn(['admin', 'navigator', 'nurse', 'doctor', 'empanelled_doctor', 'member'])
    .withMessage('Invalid user type')
];

const loginValidation = [
  body('phoneNumber').optional().matches(/^\+?[\d\s-]+$/).withMessage('Please provide a valid phone number'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('phoneNumber').optional().matches(/^\+?[\d\s-]+$/).withMessage('Please provide a valid phone number'),
  body('email').optional().isEmail().withMessage('Please provide a valid email')
];

const resetPasswordValidation = [
  // Token is fetched from Authorization header, no validation needed here
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
];

// Routes

router.post('/login', loginValidation, validate, authController.login);
router.post('/forgot-password', forgotPasswordValidation, validate, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, validate, authController.resetPassword);
router.post('/logout', authController.logout);





router.post('/send-otp', forgotPasswordValidation, validate, authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);

router.post('/register', registerValidation, validate, authController.register);
router.post('/refresh-token', authController.refreshToken);

// Check if email or phone exists
router.post("/check-user", async (req, res) => {
  try {
    const { email, phone } = req.body;

    // Check email in AuthCredential & Member
    const emailExists =
      email &&
      (await AuthCredential.findOne({ email })) ||
      (await Member.findOne({ email }));

    if (emailExists) {
      return res.status(400).json({
        success: false,
        field: "email",
        message: "Email already exists",
      });
    }

    // Check phone in AuthCredential & Member
    const phoneExists =
      phone &&
      (await AuthCredential.findOne({ phoneNumber: phone })) ||
      (await Member.findOne({ phone }));

    if (phoneExists) {
      return res.status(400).json({
        success: false,
        field: "phone",
        message: "Phone number already exists",
      });
    }

    console.log(phoneExists)
    console.log(emailExists)

    // Passed both checks
    return res.json({ success: true });

  } catch (error) {
    console.error("Error checking user:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;

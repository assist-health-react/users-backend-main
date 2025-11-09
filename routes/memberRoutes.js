const express = require('express');
const { body } = require('express-validator');
const memberController = require('../controllers/memberController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
// const validate = require('../middleware/validator');

const router = express.Router();

// Validation middleware
const memberValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name is required'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().matches(/^\+[1-9]\d{1,14}$/).withMessage('Invalid phone number format'),
  body('dob').optional().isISO8601().withMessage('Invalid date format'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('bloodGroup').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
  body('heightInFt').optional().isFloat({ min: 0 }).withMessage('Invalid height'),
  body('weightInKg').optional().isFloat({ min: 0 }).withMessage('Invalid weight'),
];

// Routes
router.post('/register', 
  auth,
  memberController.register
);

router.get('/profile',
  auth,
  memberController.getProfile
);

router.put('/profile',
  auth,
  memberController.updateProfile
);

// Subprofile routes
router.get('/subprofiles',
  auth,
  memberController.getSubprofiles
);

router.post('/subprofiles',
  auth,
  // validate,
  memberController.createSubprofile
);

// Generate membership card
router.get('/membership-card',
  auth,
  memberController.generateMembershipCard
);

module.exports = router;

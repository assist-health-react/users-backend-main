const express = require('express');
const { query, body } = require('express-validator');
const generalController = require('../controllers/generalController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validator');

const router = express.Router();

// Validation middleware
const contactFormValidation = [
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').matches(/^\+[1-9]\d{1,14}$/).withMessage('Valid phone number is required'),
  body('subject').notEmpty().trim().withMessage('Subject is required'),
  body('message').notEmpty().trim().withMessage('Message is required')
];

const appVersionValidation = [
  query('platform').optional().isIn(['android', 'ios']).withMessage('Invalid platform')
];

// Routes
router.get('/banners',
  auth,
  generalController.getBanners
);

router.get('/faqs',
  query('category').optional().isString(),
  validate,
  generalController.getFAQs
);

router.get('/terms-conditions',
  generalController.getTermsConditions
);

router.get('/stats',
  auth,
  generalController.getStats
);

router.post('/contact',
  contactFormValidation,
  validate,
  generalController.submitContactForm
);

router.get('/app-version',
  appVersionValidation,
  validate,
  generalController.getAppVersion
);

router.get('/subscription-plans',
  auth,
  generalController.getSubscriptionPlans
);

module.exports = router;

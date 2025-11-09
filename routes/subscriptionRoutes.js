const express = require('express');
const { param, body } = require('express-validator');
const subscriptionController = require('../controllers/subscriptionController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validator');

const router = express.Router();

// Routes
router.get('/',
  auth,
  subscriptionController.getAllSubscriptions
);


module.exports = router;

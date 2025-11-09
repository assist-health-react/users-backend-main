const express = require('express');
const router = express.Router();
const navigatorController = require('../controllers/navigatorController.js');
const auth = require('../middleware/auth');

// ... existing routes ...

// Get navigator by ID
router.get('/:id', auth, navigatorController.getNavigatorById);

module.exports = router; 
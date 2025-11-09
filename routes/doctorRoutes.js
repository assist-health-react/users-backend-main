const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController.js');
const auth = require('../middleware/auth');
// ... existing routes ...

// Get doctor by ID
router.get('/:id', auth, doctorController.getDoctorById);

module.exports = router; 
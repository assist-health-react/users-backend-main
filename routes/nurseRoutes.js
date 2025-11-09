const express = require('express');
const NurseController = require('../controllers/nurseController');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all nurses
router.get('/', 
  auth,
  NurseController.getNurses
);

// Get nurse by ID
router.get('/:id',
  auth,
  NurseController.getNurseById
);

module.exports = router; 
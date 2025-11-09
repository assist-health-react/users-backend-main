const express = require('express');
const { body, query, param } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validator');
const packageController = require('../controllers/packageController');

const router = express.Router();

// Routes

// Get all packages (with optional active filter)
router.get('/', packageController.getPackages);

// Get package by ID
router.get('/:id', packageController.getPackageById);

module.exports = router;

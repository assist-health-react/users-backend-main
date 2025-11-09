const express = require('express');
const { body, query } = require('express-validator');
const appointmentController = require('../controllers/appointmentController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validator');

const router = express.Router();

// Validation middleware
const appointmentValidation = [
  body('appointmentDateTime').isISO8601().withMessage('Invalid appointment datetime')
];

const prescriptionValidation = [
  body('prescription').isObject().withMessage('Invalid prescription format'),
  body('prescription.chiefComplaints').optional().isString(),
  body('prescription.allergies').optional().isString(),
  body('prescription.diagnosis').optional().isString(),
  body('prescription.medicines').optional().isArray(),
  body('prescription.medicines.*.name').optional().isString(),
  body('prescription.medicines.*.dosage').optional().isString(),
  body('prescription.medicines.*.frequency').optional().isString(),
  body('prescription.medicines.*.duration').optional().isString(),
  body('prescription.additionalInstructions').optional().isString()
];

// Routes
router.get('/',
  auth,
  query('status').optional().isIn(['pending', 'ongoing', 'cancelled', 'completed']),
  validate,
  appointmentController.getAppointments
);

router.post('/',
  auth,
  validate,
  appointmentController.createAppointment
);

router.patch('/:appointmentId/status',
  auth,
  body('status').isIn(['pending', 'ongoing', 'cancelled', 'completed']),
  validate,
  appointmentController.updateAppointmentStatus
);

router.patch('/:appointmentId/prescription',
  auth,
  prescriptionValidation,
  validate,
  appointmentController.updatePrescription
);

module.exports = router;

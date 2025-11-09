const express = require('express');
const { body, param } = require('express-validator');
const medicalHistoryController = require('../controllers/medicalHistoryController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validator');

const router = express.Router();

// Validation middleware
const lifestyleHabitsValidation = [
  body('smoking').isIn(['never', 'occasional', 'daily']).withMessage('Invalid smoking status'),
  body('alcoholConsumption').isIn(['never', 'occasional', 'daily']).withMessage('Invalid alcohol consumption status'),
  body('exercise').isIn(['never', 'occasional', 'daily']).withMessage('Invalid exercise status')
];

const treatingDoctorValidation = [
  body('name').notEmpty().withMessage('Doctor name is required'),
  body('hospitalName').optional().isString(),
  body('speciality').optional().isString()
];

const allergyValidation = [
  body('medications').optional().isString(),
  body('food').optional().isString(),
  body('other').optional().isString()
];

const medicalHistoryValidation = [
  body('treatingDoctors').optional().isArray(),
  body('treatingDoctors.*.name').optional().isString(),
  body('treatingDoctors.*.hospitalName').optional().isString(),
  body('treatingDoctors.*.speciality').optional().isString(),
  
  body('followUps').optional().isArray(),
  body('followUps.*.date').optional().isISO8601(),
  body('followUps.*.specialistDetails').optional().isString(),
  body('followUps.*.remarks').optional().isString(),

  body('familyHistory').optional().isArray(),
  body('familyHistory.*.condition').optional().isString(),
  body('familyHistory.*.relationship').optional().isString(),

  body('allergies').optional().isArray(),
  body('allergies.*.medications').optional().isString(),
  body('allergies.*.food').optional().isString(),
  body('allergies.*.other').optional().isString(),

  body('currentMedications').optional().isArray(),
  body('currentMedications.*.name').optional().isString(),
  body('currentMedications.*.dosage').optional().isString(),
  body('currentMedications.*.frequency').optional().isString(),

  body('surgeries').optional().isArray(),
  body('surgeries.*.procedure').optional().isString(),
  body('surgeries.*.date').optional().isISO8601(),
  body('surgeries.*.surgeonName').optional().isString(),

  body('lifestyleHabits').optional().isObject(),
  body('lifestyleHabits.smoking').optional().isIn(['never', 'occasional', 'daily']),
  body('lifestyleHabits.alcoholConsumption').optional().isIn(['never', 'occasional', 'daily']),
  body('lifestyleHabits.exercise').optional().isIn(['never', 'occasional', 'daily'])
];

// Routes
router.get('/',
  auth,
  medicalHistoryController.getMedicalHistory
);

router.post('/',
  auth,
  medicalHistoryValidation,
  validate,
  medicalHistoryController.updateMedicalHistory
);

router.post('/:memberId/treating-doctors',
  auth,
  param('memberId').isMongoId(),
  treatingDoctorValidation,
  validate,
  medicalHistoryController.addTreatingDoctor
);

router.put('/:memberId/lifestyle-habits',
  auth,
  param('memberId').isMongoId(),
  lifestyleHabitsValidation,
  validate,
  medicalHistoryController.updateLifestyleHabits
);

router.post('/:memberId/allergies',
  auth,
  param('memberId').isMongoId(),
  allergyValidation,
  validate,
  medicalHistoryController.addAllergy
);

module.exports = router;

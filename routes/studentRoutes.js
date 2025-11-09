const express = require('express');
const StudentController = require('../controllers/studentController');
const auth = require('../middleware/auth');

const router = express.Router();

// Get student by ID
router.get('/',
  auth,
  StudentController.getStudentById
);

// Get all infirmary visits
router.get('/infirmaries',
  auth,
  StudentController.getInfirmaryVisits
);

// Get infirmary visit by ID
router.get('/infirmaries/:id',
  auth,
  StudentController.getInfirmaryVisitById
);

// Get all assessments
router.get('/assessments',
  auth,
  StudentController.getAssessments
);

// Get assessment by ID
router.get('/assessments/:id',
  auth,
  StudentController.getAssessmentById
);

module.exports = router; 
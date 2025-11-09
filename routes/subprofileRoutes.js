const express = require('express');
const subprofileController = require('../controllers/subprofileController');
const auth = require('../middleware/auth');

const router = express.Router();

// Routes
router.post('/', 
  auth,
  subprofileController.createSubprofile
);

router.get('/',
  auth,
  subprofileController.getSubprofiles
);

router.get('/:id',
  auth,
  subprofileController.getSubprofile
);

router.put('/:id',
  auth,
  subprofileController.updateProfile
);

// router.delete('/:id',
//   auth,
//   subprofileController.deleteSubprofile
// );

module.exports = router;

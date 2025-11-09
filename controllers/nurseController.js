const { Nurse } = require('../models/index');

class NurseController {
  // Get all nurses
  async getNurses(req, res) {
    try {
      const nurses = await Nurse.find({});
      
      res.status(200).json({
        message: 'Nurses fetched successfully',
        data: nurses
      });
    } catch (error) {
      console.error('Get Nurses Error:', error);
      res.status(500).json({
        message: 'Error fetching nurses',
        data: null
      });
    }
  }

  // Get nurse by ID
  async getNurseById(req, res) {
    try {
      const nurse = await Nurse.findById(req.params.id);
      
      if (!nurse) {
        return res.status(404).json({
          message: 'Nurse not found',
          data: null
        });
      }

      res.status(200).json({
        message: 'Nurse fetched successfully',
        data: nurse
      });
    } catch (error) {
      console.error('Get Nurse By ID Error:', error);
      res.status(500).json({
        message: 'Error fetching nurse',
        data: null
      });
    }
  }

}

module.exports = new NurseController(); 
const { Member, Infirmary, Assessment } = require('../models/index');
const mongoose = require('mongoose');

class StudentController {
  // Get student by ID
  async getStudentById(req, res) {
    try {
      const student = await Member.findOne({
        _id: new mongoose.Types.ObjectId(req.user.userId),
        isStudent: true
      });
      
      if (!student) {
        return res.status(404).json({
          message: 'Student not found',
          data: null
        });
      }

      res.status(200).json({
        message: 'Student fetched successfully',
        data: student
      });
    } catch (error) {
      console.error('Get Student By ID Error:', error);
      res.status(500).json({
        message: 'Error fetching student',
        data: null
      });
    }
  }

  // Get all infirmary visits
  async getInfirmaryVisits(req, res) {
    try {
        let userId = req.user.userId;
        const visits = await Infirmary.find({
            studentId: new mongoose.Types.ObjectId(userId)
        }).populate('studentId', 'name grade section');

        res.status(200).json({
            message: 'Infirmary visits fetched successfully',
            data: visits
        });
    } catch (error) {
      console.error('Get Infirmary Visits Error:', error);
      res.status(500).json({
        message: 'Error fetching infirmary visits',
        data: null
      });
    }
  }

  // Get infirmary visit by ID
  async getInfirmaryVisitById(req, res) {
    try {
      const visit = await InfirmaryVisit.findOne({
        _id: new mongoose.Types.ObjectId(req.params.id),
        studentId: new mongoose.Types.ObjectId(req.user.userId)
      }).populate('studentId', 'name grade section');

      if (!visit) {
        return res.status(404).json({
          message: 'Infirmary visit not found',
          data: null
        });
      }

      res.status(200).json({
        message: 'Infirmary visit fetched successfully',
        data: visit
      });
    } catch (error) {
      console.error('Get Infirmary Visit By ID Error:', error);
      res.status(500).json({
        message: 'Error fetching infirmary visit',
        data: null
      });
    }
  }

  // Get all assessments
  async getAssessments(req, res) {
    try {
      const assessments = await Assessment.find({
        studentId: new mongoose.Types.ObjectId(req.user.userId)
      }).populate('studentId', 'name grade section');

      res.status(200).json({
        message: 'Assessments fetched successfully',
        data: assessments
      });
    } catch (error) {
      console.error('Get Assessments Error:', error);
      res.status(500).json({
        message: 'Error fetching assessments',
        data: null
      });
    }
  }

  // Get assessment by ID
  async getAssessmentById(req, res) {
    try {
      const assessment = await Assessment.findOne({
        _id: new mongoose.Types.ObjectId(req.params.id),
        studentId: new mongoose.Types.ObjectId(req.user.userId)
      }).populate('studentId', 'name grade section');

      if (!assessment) {
        return res.status(404).json({
          message: 'Assessment not found',
          data: null
        });
      }

      res.status(200).json({
        message: 'Assessment fetched successfully',
        data: assessment
      });
    } catch (error) {
      console.error('Get Assessment By ID Error:', error);
      res.status(500).json({
        message: 'Error fetching assessment',
        data: null
      });
    }
  }

}

module.exports = new StudentController(); 
const MedicalHistory = require('../models/medical-history.model');
const { Member } = require('../models/member.model');

class MedicalHistoryController {
  // Get medical history
  async getMedicalHistory(req, res) {
    try {
      const { memberId, search } = req.query;
      
      // If memberId is provided, verify it's a subprofile of the current user
      if (memberId && memberId !== req.user.userId.toString()) {
        const isSubprofile = await Member.exists({
          userId: memberId,
          primaryMemberId: req.user.userId
        });

        if (!isSubprofile) {
          return res.status(403).json({
            status: 'error',
            message: 'Access denied to requested medical history'
          });
        }
      }

      const queryId = memberId || req.user.userId;
      
      // Base query
      let query = { memberId: queryId };

      // Add search functionality if search parameter is provided
      if (search) {
        query = {
          $and: [
            { memberId: queryId },
            {
              $or: [
                // Search in previousMedicalConditions
                { 'previousMedicalConditions.condition': { $regex: search, $options: 'i' } },
                // Search in treatingDoctors
                { 'treatingDoctors.name': { $regex: search, $options: 'i' } },
                { 'treatingDoctors.hospitalName': { $regex: search, $options: 'i' } },
                { 'treatingDoctors.speciality': { $regex: search, $options: 'i' } },
                // Search in allergies
                { 'allergies.medications': { $regex: search, $options: 'i' } },
                { 'allergies.food': { $regex: search, $options: 'i' } },
                { 'allergies.other': { $regex: search, $options: 'i' } },
                // Search in surgeries
                { 'surgeries.procedure': { $regex: search, $options: 'i' } },
                { 'surgeries.surgeonName': { $regex: search, $options: 'i' } }
              ]
            }
          ]
        };
      }

      const medicalHistories = await MedicalHistory.find(query);

      res.status(200).json({
        status: 'success',
        data: medicalHistories,
        count: medicalHistories.length
      });
    } catch (error) {
      console.error('Get Medical History Error:', error);
      res.status(500).json({ 
        status: 'error',
        message: 'Error fetching medical history' 
      });
    }
  }

  // Create or update medical history
  async updateMedicalHistory(req, res) {
    try {
      const { memberId } = req.body;

      // If memberId is provided, verify it's a subprofile of the current user
      if (memberId && memberId !== req.user._id.toString()) {
        const isSubprofile = await Member.exists({
          _id: memberId,
          primaryMemberId: req.user._id
        });

        if (!isSubprofile) {
          return res.status(403).json({
            message: 'Access denied to update medical history'
          });
        }
      }

      const updateData = {
        ...req.body,
        memberId: memberId || req.user._id
      };

      // Use upsert to create if doesn't exist
      const medicalHistory = await MedicalHistory.findOneAndUpdate(
        { memberId: updateData.memberId },
        updateData,
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true
        }
      );

      res.status(200).json(medicalHistory);
    } catch (error) {
      console.error('Update Medical History Error:', error);
      res.status(500).json({ message: 'Error updating medical history' });
    }
  }

  // Add treating doctor
  async addTreatingDoctor(req, res) {
    try {
      const { memberId } = req.params;
      const doctorData = req.body;

      // Verify access to medical history
      if (memberId !== req.user._id.toString()) {
        const isSubprofile = await Member.exists({
          _id: memberId,
          primaryMemberId: req.user._id
        });

        if (!isSubprofile) {
          return res.status(403).json({
            message: 'Access denied to update medical history'
          });
        }
      }

      const medicalHistory = await MedicalHistory.findOneAndUpdate(
        { memberId },
        { $push: { treatingDoctors: doctorData } },
        { new: true, upsert: true }
      );

      res.status(200).json(medicalHistory);
    } catch (error) {
      console.error('Add Treating Doctor Error:', error);
      res.status(500).json({ message: 'Error adding treating doctor' });
    }
  }

  // Update lifestyle habits
  async updateLifestyleHabits(req, res) {
    try {
      const { memberId } = req.params;
      const habits = req.body;

      // Verify access to medical history
      if (memberId !== req.user._id.toString()) {
        const isSubprofile = await Member.exists({
          _id: memberId,
          primaryMemberId: req.user._id
        });

        if (!isSubprofile) {
          return res.status(403).json({
            message: 'Access denied to update medical history'
          });
        }
      }

      const medicalHistory = await MedicalHistory.findOneAndUpdate(
        { memberId },
        { $set: { lifestyleHabits: habits } },
        { new: true, upsert: true }
      );

      res.status(200).json(medicalHistory);
    } catch (error) {
      console.error('Update Lifestyle Habits Error:', error);
      res.status(500).json({ message: 'Error updating lifestyle habits' });
    }
  }

  // Add allergy
  async addAllergy(req, res) {
    try {
      const { memberId } = req.params;
      const allergyData = req.body;

      // Verify access to medical history
      if (memberId !== req.user._id.toString()) {
        const isSubprofile = await Member.exists({
          _id: memberId,
          primaryMemberId: req.user._id
        });

        if (!isSubprofile) {
          return res.status(403).json({
            message: 'Access denied to update medical history'
          });
        }
      }

      const medicalHistory = await MedicalHistory.findOneAndUpdate(
        { memberId },
        { $push: { allergies: allergyData } },
        { new: true, upsert: true }
      );

      res.status(200).json(medicalHistory);
    } catch (error) {
      console.error('Add Allergy Error:', error);
      res.status(500).json({ message: 'Error adding allergy' });
    }
  }
}

module.exports = new MedicalHistoryController();

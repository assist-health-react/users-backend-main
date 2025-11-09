const { Member } = require('../models/index');
const multer = require('multer');
const emailService = require('../utils/email');
const path = require('path');


class MemberController {
  // Register new member
  async register(req, res) {
    try {
      const memberData = {
        ...req.body,
        profilePic: req.body.profilePic
      };

      if (memberData.isStudent && !memberData.studentDetails) {
        return res.status(400).json({
          message: 'Student details are required for student registration',
          error: 'Missing student details'
        });
      }

      const member = await Member.findOneAndUpdate(
        { _id: req.user._id },
        memberData,
        { new: true, upsert: true }
      );
      console.log(memberData);
      const toObj = {
        name: memberData.name,
        email: memberData.email
       }
       emailService.sendEmail('welcome', toObj, {
        number: memberData.phone,
        name: memberData.name
       });
      res.status(201).json({
        message: 'Member registered successfully',
        data: member
      });
    } catch (error) {
      console.error('Member Registration Error:', error);
      res.status(500).json({ 
        message: 'Error registering member',
        error: error.message 
      });
    }
  }

  // Get member profile
  async getProfile(req, res) {
    try {
      const member = await Member.findById(req.user.userId)
        .populate('healthcareTeam.navigator._id', 'name phone profilePic navigatorId introduction')
        .populate('healthcareTeam.doctor._id', 'name profilePic doctorId specialization medicalCouncilRegistrationNumber experienceYears introduction');
      if (!member) {
        return res.status(404).json({ 
          message: 'Member not found',
          error: 'Member profile does not exist'
        });
      }
      res.status(200).json({
        message: 'Profile retrieved successfully',
        data: member
      });
    } catch (error) {
      console.error('Get Profile Error:', error);
      res.status(500).json({ 
        message: 'Error fetching profile',
        error: error.message
      });
    }
  }

  // Update member profile
  async updateProfile(req, res) {
    try {
      // Handle date formatting
      if(req.body.dob) {
        try {
          // Parse ISO format date (YYYY-MM-DD)
          const parsedDate = new Date(req.body.dob);
          
          // Check if date is valid
          if (isNaN(parsedDate.getTime())) {
            throw new Error('Invalid date format. Expected YYYY-MM-DD');
          }
          
          req.body.dob = parsedDate;
        } catch (error) {
          return res.status(400).json({
            message: 'Invalid date of birth format',
            error: error.message
          });
        }
      }

      // Get existing member to preserve profilePic if not updated
      const existingMember = await Member.findById(req.user.userId);
      if (!existingMember) {
        return res.status(404).json({ 
          message: 'Member not found',
          error: 'Member profile does not exist'
        });
      }

      // Prepare update data
      const updateData = {
        ...req.body
      };

      // Handle address field properly
      if ('address' in req.body) {
        if (Array.isArray(req.body.address)) {
          // Get existing addresses or initialize empty array
          let existingAddresses = existingMember.address || [];

          // Process each address in the request
          updateData.address = req.body.address.map(newAddr => {
            if (newAddr._id) {
              // If address has _id, it's an update to existing address
              const existingIndex = existingAddresses.findIndex(
                addr => addr._id.toString() === newAddr._id.toString()
              );
              if (existingIndex !== -1) {
                // Update existing address while preserving any fields not included in update
                return {
                  ...existingAddresses[existingIndex].toObject(),
                  ...newAddr
                };
              }
            }
            // If no _id or matching address not found, treat as new address
            return newAddr;
          });
        } else if (typeof req.body.address === 'object') {
          // Single address object provided
          if (req.body.address._id) {
            // Update existing address
            const existingAddresses = existingMember.address || [];
            const existingIndex = existingAddresses.findIndex(
              addr => addr._id.toString() === req.body.address._id.toString()
            );
            
            if (existingIndex !== -1) {
              existingAddresses[existingIndex] = {
                ...existingAddresses[existingIndex].toObject(),
                ...req.body.address
              };
              updateData.address = existingAddresses;
            } else {
              // If _id not found, add as new address
              updateData.address = [...existingAddresses, req.body.address];
            }
          } else {
            // New single address
            updateData.address = [...(existingMember.address || []), req.body.address];
          }
        }
      }

      // Handle profilePic update
      if (req.file) {
        updateData.profilePic = req.file.filename;
      } else if (!updateData.profilePic && existingMember) {
        // Preserve existing profilePic if not being updated
        updateData.profilePic = existingMember.profilePic;
      }

      // Remove undefined/null values
      Object.keys(updateData).forEach(key => 
        updateData[key] === undefined || updateData[key] === null ? delete updateData[key] : {}
      );     

      // Update member and explicitly select all fields including profilePic
      const member = await Member.findByIdAndUpdate(
        req.user.userId,
        { $set: updateData },
        { 
          new: true, 
          runValidators: true,
          select: '+profilePic'
        }
      );

      res.status(200).json({
        message: 'Profile updated successfully',
        data: member
      });
    } catch (error) {
      console.error('Update Profile Error:', error);
      res.status(500).json({ 
        message: 'Error updating profile',
        error: error.message
      });
    }
  }

  // Get all subprofiles
  async getSubprofiles(req, res) {
    try {
      const subprofiles = await Member.find({ 
        primaryMemberId: req.user._id 
      });
      res.status(200).json({
        message: 'Subprofiles retrieved successfully',
        data: subprofiles
      });
    } catch (error) {
      console.error('Get Subprofiles Error:', error);
      res.status(500).json({ 
        message: 'Error fetching subprofiles',
        error: error.message
      });
    }
  }

  // Create subprofile
  async createSubprofile(req, res) {
    try {
      const subprofileData = {
        ...req.body,
        primaryMemberId: req.user._id,
        profilePic: req.file ? req.file.filename : undefined,
        userType: 'member'
      };

      const subprofile = await Member.create(subprofileData);
      res.status(201).json({
        message: 'Subprofile created successfully',
        data: subprofile
      });
    } catch (error) {
      console.error('Create Subprofile Error:', error);
      res.status(500).json({ 
        message: 'Error creating subprofile',
        error: error.message
      });
    }
  }

  /**
   * Generate membership card PDF for a member
   */
  async generateMembershipCard(req, res) {
    try {
      const member = await Member.findById(req.user.userId);
      if (!member) {
        return res.status(404).json({
          status: 'error',
          message: 'Member not found'
        });
      }

      const memberData = {
        memberName: member.name,
        assistHealthId: member.memberId,
        validDate: member.membershipStatus?.premiumMembership?.expiryDate ? 
                  new Date(member.membershipStatus.premiumMembership.expiryDate).toLocaleDateString('en-IN') :
                  new Date(Date.now() + (365.25 * 24 * 60 * 60 * 1000)).toLocaleDateString('en-IN')
      };

      const pdfService = require('../utils/pdfService');
      const result = await pdfService.generateMembershipCardPdf({
        name: memberData.memberName,
        memberId: memberData.assistHealthId,
        validDate: memberData.validDate,
        memberType: member.membershipStatus?.premiumMembership?.isActive ? 'Premium' : 'Regular'
      });

      res.json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Membership card generation error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error generating membership card'
      });
    }
  }
}

module.exports = new MemberController();

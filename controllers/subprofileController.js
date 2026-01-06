const { Member,Student } = require('../models/index');
const mongoose = require('mongoose');

class subprofileController {

  // ==============================
  // GET SUB PROFILES (UNIFIED)
  // ==============================
  async getSubprofiles(req, res) {
    try {
      const { userType, userId } = req.user;
      const { search } = req.query;

      let query = {};
      let Model;

      // ----------------------------------
      // MEMBER → MEMBER SUBPROFILES
      // ----------------------------------
      if (userType === 'member') {
        Model = Member;

        query = {
          primaryMemberId: userId,
          isSubprofile: true
        };
      }

      // ----------------------------------
      // STUDENT (PRIMARY) → STUDENT SUBPROFILES
      // ----------------------------------
      else if (userType === 'student') {
        const student = await Student.findById(userId);

        // sub profile student has no children
        if (!student || student.isSubprofile) {
          return res.status(200).json({
            message: 'No subprofiles',
            data: [],
            count: 0
          });
        }

        Model = Student;
        query = {
          primaryStudentId: student._id,
          isSubprofile: true
        };
      }

      else {
        return res.status(400).json({
          message: 'Invalid user type'
        });
      }

      // ----------------------------------
      // SEARCH FILTER (COMMON)
      // ----------------------------------
      if (search) {
        query = {
          $and: [
            query,
            {
              $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { gender: { $regex: search, $options: 'i' } },
                { bloodGroup: { $regex: search, $options: 'i' } }
              ]
            }
          ]
        };
      }

      const subprofiles = await Model.find(query).sort({ createdAt: 1 });

      res.status(200).json({
        message: 'Subprofiles retrieved successfully',
        type: userType,
        data: subprofiles,
        count: subprofiles.length
      });

    } catch (error) {
      console.error('Get Subprofiles Error:', error);
      res.status(500).json({
        message: 'Error fetching subprofiles',
        error: error.message
      });
    }
  }
    async getSubprofile(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          message: 'Invalid profile ID'
        });
      }

      // 1️⃣ Try Member collection
      let profile = await Member.findById(id);

      // 2️⃣ If not found, try Student collection
      if (!profile) {
        profile = await Student.findById(id);
      }

      // 3️⃣ Still not found
      if (!profile) {
        return res.status(404).json({
          message: 'Profile not found',
          error: 'No member or student exists with this ID'
        });
      }

      res.status(200).json({
        message: 'Profile retrieved successfully',
        data: profile
      });

    } catch (error) {
      console.error('Get Subprofile Error:', error);
      res.status(500).json({
        message: 'Error fetching profile',
        error: error.message
      });
    }
  }
  // Update member profile
  async updateProfile(req, res) {
    try {
      console.log(`req.body`, req.body);
      // Remove undefined/null values to prevent overwriting existing data
      if(req.body.dob) {
        // Parse date string in format "DD/MM/YY"
        const [day, month, year] = req.body.dob.split('/');
        const fullYear = year.length === 2 ? '20' + year : year;
        req.body.dob = new Date(fullYear, month - 1, day); // month is 0-based in Date constructor
      }
      const updateData = Object.fromEntries(
        Object.entries({
          ...req.body,
          profilePic: req.file ? req.file.filename : undefined
        }).filter(([_, v]) => v !== undefined && v !== null)
      );

      console.log(`updateData`, updateData);
      const member = await Member.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      console.log(`member`, member);
      if (!member) {
        return res.status(404).json({ 
          message: 'Member not found',
          error: 'Member profile does not exist'
        });
      }

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
   // Create subprofile
  async createSubprofile(req, res) {
    try {
      const subprofileData = {
        ...req.body,
        primaryMemberId: req.user.userId,
        profilePic: req.file ? req.file.filename : undefined,
        userType: 'member'
      };

      const subprofile = await Member.create(subprofileData);
      //update primary member with subprofile id
      await Member.findByIdAndUpdate(req.user.userId, { $push: { subprofileIds: subprofile._id } });
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
}

module.exports = new subprofileController();

// class subprofileController {

//   // Get subprofile profile
//   async getSubprofile(req, res) {
//     try {
//       const member = await Member.findById(req.params.id);
//       if (!member) {
//         return res.status(404).json({ 
//           message: 'Member not found',
//           error: 'Member profile does not exist'
//         });
//       }
//       res.status(200).json({
//         message: 'Profile retrieved successfully',
//         data: member
//       });
//     } catch (error) {
//       console.error('Get Profile Error:', error);
//       res.status(500).json({ 
//         message: 'Error fetching profile',
//         error: error.message
//       });
//     }
//   }

  // // Update member profile
  // async updateProfile(req, res) {
  //   try {
  //     console.log(`req.body`, req.body);
  //     // Remove undefined/null values to prevent overwriting existing data
  //     if(req.body.dob) {
  //       // Parse date string in format "DD/MM/YY"
  //       const [day, month, year] = req.body.dob.split('/');
  //       const fullYear = year.length === 2 ? '20' + year : year;
  //       req.body.dob = new Date(fullYear, month - 1, day); // month is 0-based in Date constructor
  //     }
  //     const updateData = Object.fromEntries(
  //       Object.entries({
  //         ...req.body,
  //         profilePic: req.file ? req.file.filename : undefined
  //       }).filter(([_, v]) => v !== undefined && v !== null)
  //     );

  //     console.log(`updateData`, updateData);
  //     const member = await Member.findByIdAndUpdate(
  //       req.params.id,
  //       { $set: updateData },
  //       { new: true, runValidators: true }
  //     );

  //     console.log(`member`, member);
  //     if (!member) {
  //       return res.status(404).json({ 
  //         message: 'Member not found',
  //         error: 'Member profile does not exist'
  //       });
  //     }

  //     res.status(200).json({
  //       message: 'Profile updated successfully',
  //       data: member
  //     });
  //   } catch (error) {
  //     console.error('Update Profile Error:', error);
  //     res.status(500).json({ 
  //       message: 'Error updating profile',
  //       error: error.message
  //     });
  //   }
  // }

//   // Get all subprofiles
//   async getSubprofiles(req, res) {
//     try {
//       const { search } = req.query;
      
//       // Base query for subprofiles
//       let query = { 
//         primaryMemberId: req.user.userId, 
//         isSubprofile: true
//       };

//       // Add search functionality if search parameter is provided
//       if (search) {
//         query = {
//           $and: [
//             {
//               primaryMemberId: req.user.userId,
//               isSubprofile: true
//             },
//             {
//               $or: [
//                 // Basic info
//                 { name: { $regex: search, $options: 'i' } },
//                 { email: { $regex: search, $options: 'i' } },
//                 { phone: { $regex: search, $options: 'i' } },
//                 { gender: { $regex: search, $options: 'i' } },
//                 { bloodGroup: { $regex: search, $options: 'i' } },
//                 // Emergency contact
//                 { 'emergencyContact.name': { $regex: search, $options: 'i' } },
//                 { 'emergencyContact.phone': { $regex: search, $options: 'i' } },
//                 // Additional info
//                 { additionalInfo: { $regex: search, $options: 'i' } }
//               ]
//             }
//           ]
//         };
//       }

//       const subprofiles = await Member.find(query);
      
//       res.status(200).json({
//         message: 'Subprofiles retrieved successfully',
//         data: subprofiles,
//         count: subprofiles.length
//       });
//     } catch (error) {
//       console.error('Get Subprofiles Error:', error);
//       res.status(500).json({ 
//         message: 'Error fetching subprofiles',
//         error: error.message
//       });
//     }
//   }

  // Create subprofile
//   async createSubprofile(req, res) {
//     try {
//       const subprofileData = {
//         ...req.body,
//         primaryMemberId: req.user.userId,
//         profilePic: req.file ? req.file.filename : undefined,
//         userType: 'member'
//       };

//       const subprofile = await Member.create(subprofileData);
//       //update primary member with subprofile id
//       await Member.findByIdAndUpdate(req.user.userId, { $push: { subprofileIds: subprofile._id } });
//       res.status(201).json({
//         message: 'Subprofile created successfully',
//         data: subprofile
//       });
//     } catch (error) {
//       console.error('Create Subprofile Error:', error);
//       res.status(500).json({ 
//         message: 'Error creating subprofile',
//         error: error.message
//       });
//     }
//   }
// }

// module.exports = new subprofileController();

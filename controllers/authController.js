const jwt = require('jsonwebtoken');
const { Member } = require('../models/index');
const { AuthCredential } = require('../models/index');
const mongoose = require('mongoose');
const { sendOtpSms } = require('../utils/helpers');
const emailService = require('../utils/email');
const bcrypt = require('bcryptjs');
// class AuthController {

//   constructor() {
//     // Bind the methods to the instance
//     this.generateAccessToken = this.generateAccessToken.bind(this);
//     this.generateRefreshToken = this.generateRefreshToken.bind(this);
//     this.logout = this.logout.bind(this);
//     this.sendOTP = this.sendOTP.bind(this);
//     this.verifyOTP = this.verifyOTP.bind(this);

//      this.login = this.login.bind(this);
//     this.register = this.register.bind(this);
//     this.refreshToken = this.refreshToken.bind(this);

//     this.forgotPassword = this.forgotPassword.bind(this);
//     this.resetPassword = this.resetPassword.bind(this);
//     this.getUserName = this.getUserName.bind(this);
//   }

//   // generateAccessToken(user) {
//   //   return jwt.sign(
//   //     {
//   //       id: user._id,
//   //       userType: user.userType
//   //     },
//   //     process.env.JWT_SECRET || 'digital_conquest',
//   //     { expiresIn: process.env.JWT_EXPIRES_IN || '1023230h' }
//   //   );
//   // }

//   // /**
//   //  * Generate refresh token
//   //  */
//   // generateRefreshToken(user) {
//   //   return jwt.sign(
//   //     { id: user._id },
//   //     process.env.JWT_REFRESH_SECRET || 'dc_refresh_secret',
//   //     { expiresIn: '7d' }
//   //   );
//   // }


//     /**
//      * Generate access token
//      */
//     generateAccessToken(user) {
//       return jwt.sign(
//         {
//           id: user._id,
//           userType: user.userType
//         },
//         process.env.JWT_SECRET || 'digital_conquest',
//         { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
//       );
//     }
  
//     /**
//      * Generate refresh token
//      */
//     generateRefreshToken(user) {
//       return jwt.sign(
//         { id: user._id },
//         process.env.JWT_REFRESH_SECRET || 'dc_refresh_secret',
//         { expiresIn: '7d' }
//       );
//     }
  
//     /**
//      * Login user  2.12.25
//      * 
//      */
//     async login(req, res) {
//       try {
//         const { phoneNumber, email, password } = req.body;
//         let user;
//         if(!phoneNumber && !email){
//           return res.status(400).json({
//             status: 'error',
//             message: 'Phone number or email is required'
//           });
//         }
//         console.log(`email: ${email} and phoneNumber: ${phoneNumber}`);
//         if(email){
//           // Find user
//           user = await AuthCredential.findOne({ email });
//           console.log(`user: ${user}`);
//         }else{
//           // Find user
//           user = await AuthCredential.findOne({ phoneNumber });
//           console.log(`user: ${user}`);
//         }
  
//         if (!user) {
//           console.log(`user not found`);
//           return res.status(401).json({
//             status: 'error',
//             message: 'Invalid credentials'
//           });
//         }
  
//         let isPasswordMatch = false;
  
//         if(user && user.isFirstLogin && user.passwordResetRequired && user.temporaryPassword){
//           console.log(`user found and isFirstLogin and passwordResetRequired and temporaryPassword`);
//           //check for expiry date of temporary password
//           if(user.temporaryPassword.expiresAt < new Date()){
//             return res.status(401).json({
//               status: 'error',
//               message: 'Temporary password has expired'
//             });
//           }
//           // Compare the provided password with the temporary password
//           isPasswordMatch = await bcrypt.compare(password, user.temporaryPassword.password);
//           if(isPasswordMatch){
//             console.log('temporary password matched');
//             user.isFirstLogin = false;
//             user.passwordResetRequired = true;
//             await user.save();
//           }
//         } else if(user && !user.isFirstLogin && user.passwordResetRequired){
//           console.log(`user found and isFirstLogin and passwordResetRequired`);
//           //check for expiry date of temporary password
//           if(user.temporaryPassword.expiresAt < new Date()){
//             return res.status(401).json({
//               status: 'error',
//               message: 'Temporary password has expired'
//             });
//           }
//           // Compare the provided password with the temporary password
//           isPasswordMatch = await bcrypt.compare(password, user.temporaryPassword.password);
//           if(isPasswordMatch){
//             console.log('temporary password matched');
//             user.isFirstLogin = false;
//             user.passwordResetRequired = true;
//             await user.save();
//           }
//         }else {
//           console.log(`user found and isFirstLogin and passwordResetRequired`);
//           if(user.password){
//             isPasswordMatch = await bcrypt.compare(password, user.password);
//           }else{
//             isPasswordMatch = false;
//           }
//         }
  
//         if (!isPasswordMatch) {
//           return res.status(401).json({
//             status: 'error',
//             message: 'Invalid credentials'
//           });
//         }
  
//         if (!user.isActive) {
//           return res.status(401).json({
//             status: 'error',
//             message: 'Account is inactive. Please contact support.'
//           });
//         }
  
//         // Generate tokens
//         const accessToken = this.generateAccessToken(user);
//         const refreshToken = this.generateRefreshToken(user);
  
//         res.json({
//           status: 'success',
//           data: {
//             user: {
//               id: user._id,
//               userId: user.userId,
//               email: user.email,
//               phoneNumber: user.phoneNumber,
//               userType: user.userType,
//               isFirstLogin: user.isFirstLogin,
//               passwordResetRequired: user.passwordResetRequired
//             },
//             tokens: {
//               accessToken,
//               refreshToken
//             }
//           }
//         });
//       } catch (error) {
//         logger.error('Login error:', error);
//         res.status(500).json({
//           status: 'error',
//           message: 'Error logging in'
//         });
//       }
//     }
//  /**
//    * Register a new user
//    */
//   async register(req, res) {
//     try {
//       const { name, email, phone, password, userType } = req.body;

//       // Check if user already exists
//       const existingUser = await AuthCredential.findOne({
//         $or: [{ email }, { phoneNumber: phone }]
//       });

//       if (existingUser) {
//         return res.status(400).json({
//           status: 'error',
//           message: 'User already exists with this email or phone number'
//         });
//       }

//       // Hash password
//       const hashedPassword = await bcrypt.hash(password, 12);

//       // Create user
//       const user = await AuthCredential.create({
//         phoneNumber: phone,
//         email,
//         password: hashedPassword,
//         userType
//       });

//       // Generate tokens
//       const accessToken = this.generateAccessToken(user);
//       const refreshToken = this.generateRefreshToken(user);

//       res.status(201).json({
//         status: 'success',
//         data: {
//           user: {
//             id: user._id,
//             email: user.email,
//             phoneNumber: user.phoneNumber,
//             userType: user.userType
//           },
//           tokens: {
//             accessToken,
//             refreshToken
//           }
//         }
//       });
//     } catch (error) {
//       logger.error('Registration error:', error);
//       res.status(500).json({
//         status: 'error',
//         message: 'Error registering user'
//       });
//     }
//   }

//   // Send OTP for login
//   async sendOTP(req, res) {
//     try {
//       const { phoneNumber, memberId } = req.body;

//       if(memberId && !phoneNumber){
//         //check if memberId is valid
//         const member = await Member.find({memberId: memberId}).then(result => result[0]);
//         if(!member){
//           return res.status(400).json({ message: 'Invalid memberId' });
//         }
//         console.log(`member already exists : ${member._id}`);
//         // Generate OTP
//         const otp = Math.floor(100000 + Math.random() * 900000).toString();
//         const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

//         console.log(`otp: ${otp}`);
//         console.log(`otpExpiry: ${otpExpiry}`);
//         const users = await AuthCredential.find({userType: 'member', userId: new mongoose.Types.ObjectId(member._id) }).populate({
//           path: 'userId',
//           model: 'Member',
//           select: 'name'
//         });
//         console.log(`users: ${JSON.stringify(users)}`);
//         const user = users[0];
//         user.lastOtp = {
//           code: otp,
//           expiresAt: otpExpiry
//         };
//         await user.save();
//         //send otp to the user
//         const response = await sendOtpSms({ mobile: member.phone, otp: otp, otp_expiry: 10 });
//         console.log(`response: ${JSON.stringify(response)}`);
//         return res.status(200).json({ 
//           message: 'OTP sent successfully',
//           otp: otp,
//           isNewUser: false,
//           phoneNumber: member.phone,
//           memberId: member.memberId,
//           name: member.name 
//         });
//       }else if(phoneNumber && !memberId){

//         //check if phone number is valid
//         if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
//           return res.status(400).json({ message: 'Invalid phone number format' });
//         }
//         // Generate OTP
//         const otp = Math.floor(100000 + Math.random() * 900000).toString();
//         const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

//         const members = await Member.find({ phone: phoneNumber });
//         if(members.length > 0){

//           const users = await AuthCredential.find({ phoneNumber, userType: 'member' }).populate({
//             path: 'userId',
//             model: 'Member',
//             select: 'name memberId isMember',
//           });
//           // console.log(`users: ${JSON.stringify(users)}`);
//           // Update OTP for all users with this phone number
//           for (const user of users) {
//             // console.log(` isNewUser: ${user.isNewUser}`);
//             user.lastOtp = {
//               code: otp,
//               expiresAt: otpExpiry
//             };
//             await user.save();
//           }
//           //send otp to the user
//           const response = await sendOtpSms({ mobile: phoneNumber, otp: otp, otp_expiry: 10 });
//           console.log(`response: ${JSON.stringify(response)}`);
//           return res.status(200).json({ 
//             message: 'OTP sent successfully',
//             otp: otp,
//             phoneNumber: phoneNumber,
//             members: users.map(user => ({
//               isNewUser: user.isNewUser,
//               name: user.userId.name,
//               memberId: user.userId.memberId,
//               isMember: user.userId.isMember,
//             }))
//           });

//         }else{
//           //create a new member
//           const newMember = new Member({
//             phone: phoneNumber,
//             active: true,
//             isMember: false
//           });

//           await newMember.save();
//           console.log(`newMember: ${JSON.stringify(newMember)}`);

//           const newUser = await AuthCredential.create({
//             phoneNumber,
//             userType: 'member',
//             userId: newMember._id,
//             lastOtp: {
//               code: otp,
//               expiresAt: otpExpiry
//             }
//           });

//           console.log(`newUser: ${JSON.stringify(newUser)}`);
//           //send otp to the user
//           const response = await sendOtpSms({ mobile: phoneNumber, otp: otp, otp_expiry: 10 });
//           console.log(`response: ${JSON.stringify(response)}`);

//           return res.status(200).json({ 
//             message: 'OTP sent successfully',
//             otp: otp,
//             isNewUser: true
//           });

//         }
//       }else{
//         return res.status(400).json({ message: 'Invalid request' });
//       }
      
//     } catch (error) {
//       console.error('Send OTP Error:', error);
//       res.status(500).json({ message: 'Error sending OTP' });
//     }
//   }

//   // Verify OTP and generate token
//   async verifyOTP(req, res) {
//     try {
//       const { phoneNumber, memberId, otp } = req.body;

//       // Validate phone number format
//       if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
//         return res.status(400).json({ message: 'Invalid phone number format' });
//       }

//       let query = { phoneNumber: phoneNumber, userType: 'member' };
//       if(memberId === undefined || memberId === null || memberId === '' || memberId === 'null'){
//         //no issues
//       }else{
//         query.memberId = memberId;
//       }
//       console.log(`query: ${JSON.stringify(query)}`);
//       let user = await AuthCredential.findOne(query);
//       console.log(`user: ${JSON.stringify(user)}`);
//       if(!user){
//         return res.status(400).json({ message: 'Member not found' });
//       }
//       if(user.lastOtp.code !== otp){
//         return res.status(400).json({ message: 'Invalid OTP' });
//       }
      
//       if(user.lastOtp.expiresAt < new Date()){
//         return res.status(400).json({ message: 'OTP expired' });
//       }

//       //check if otp is not expired and is correct
//       if(user.lastOtp.expiresAt > new Date() && user.lastOtp.code === otp){
//         //update the member isActive to true
//         await Member.findByIdAndUpdate({_id: new mongoose.Types.ObjectId(user.userId)}, { lastOtp: null,  isFirstLogin: false });
//       }

//       // Clear OTP
//       user.lastOtp = null;
//       await user.save();

//       // Generate tokens
//       const accessToken = this.generateAccessToken(user);
//       const refreshToken = this.generateRefreshToken(user);

//       res.json({
//         status: 'success',
//         message: 'OTP verified successfully',
//         data: {
//           user: {
//             id: user._id,
//             userId: user.userId,
//             phoneNumber: user.phoneNumber,
//             userType: user.userType,
//             isFirstLogin: user.isFirstLogin
//           },
//           tokens: {
//             accessToken,
//             refreshToken
//           }
//         }
//       });

//       user.isFirstLogin = false;
//       await user.save();

//     } catch (error) {
//       console.error('Verify OTP Error:', error);
//       res.status(500).json({ message: 'Error verifying OTP' });
//     }
//   }

//   async logout(req, res) {
//     try {
//       const { refreshToken } = req.body;

//       if (!refreshToken) {
//         return res.status(400).json({ message: 'Refresh token is required' });
//       }

//       const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'dc_refresh_secret');
//       const user = await AuthCredential.findById(decoded.id);

//       if (!user) {
//         return res.status(400).json({ message: 'User not found' });
//       }

//       user.lastLogout = new Date();
//       await user.save();

//       res.json({ message: 'Logged out successfully' });
//     } catch (error) {
//       console.error('Logout Error:', error);
//       res.status(500).json({ message: 'Error logging out' });
//     }
//   }
  
// }

class AuthController {
  constructor() {
    // Bind the methods to the instance
    this.generateAccessToken = this.generateAccessToken.bind(this);
    this.generateRefreshToken = this.generateRefreshToken.bind(this);
    this.login = this.login.bind(this);
    this.register = this.register.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.logout = this.logout.bind(this);
    this.sendOTP = this.sendOTP.bind(this);
    this.verifyOTP = this.verifyOTP.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.getUserName = this.getUserName.bind(this);
  }

  /**
   * Register a new user
   */
  async register(req, res) {
    try {
      const { name, email, phone, password, userType } = req.body;

      // Check if user already exists
      const existingUser = await AuthCredential.findOne({
        $or: [{ email }, { phoneNumber: phone }]
      });

      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'User already exists with this email or phone number'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await AuthCredential.create({
        phoneNumber: phone,
        email,
        password: hashedPassword,
        userType
      });

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      res.status(201).json({
        status: 'success',
        data: {
          user: {
            id: user._id,
            email: user.email,
            phoneNumber: user.phoneNumber,
            userType: user.userType
          },
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error registering user'
      });
    }
  }

  /**
   * Generate access token
   */
  generateAccessToken(user) {
    return jwt.sign(
      {
        id: user._id,
        userType: user.userType
      },
      process.env.JWT_SECRET || 'digital_conquest',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(user) {
    return jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET || 'dc_refresh_secret',
      { expiresIn: '7d' }
    );
  }

  /**
   * Login user
   */
async login(req, res) {
  try {
    const { phoneNumber, email, password } = req.body;

    if (!phoneNumber && !email) {
      return res.status(400).json({
        status: "error",
        message: "Phone number or email is required",
      });
    }

    // ----------------------------------------------------------------------
    // 1. FIND USER
    // ----------------------------------------------------------------------
    const user = await AuthCredential.findOne(
      email ? { email } : { phoneNumber }
    );

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid credentials",
      });
    }

    let isPasswordMatch = false;
    const now = new Date();

    // ----------------------------------------------------------------------
    // 2. HANDLE TEMPORARY PASSWORD IF EXISTS
    // ----------------------------------------------------------------------
    if (user.temporaryPassword) {
      const temp = user.temporaryPassword;

      // A) If temporary password object is corrupted / missing password field
      if (!temp.password || typeof temp.password !== "string") {
        console.log("Temporary password missing → clearing it");

        user.temporaryPassword = null;
        user.passwordResetRequired = false;
        user.isFirstLogin = false;
        await user.save();
      }

      // B) If temporary password expired
      else if (temp.expiresAt < now) {
        console.log("Temporary password expired → clearing it");

        user.temporaryPassword = null;
        user.passwordResetRequired = false;
        user.isFirstLogin = false;
        await user.save();
      }

      // C) Temporary password valid → try matching
      else {
        isPasswordMatch = await bcrypt.compare(password, temp.password);

        if (isPasswordMatch) {
          console.log("Temporary password matched");

          // User logged in with temp password → force them to reset
          user.isFirstLogin = false;
          user.passwordResetRequired = true;
          await user.save();
        }
      }
    }

    // ----------------------------------------------------------------------
    // 3. NORMAL PASSWORD CHECK (only if temp password did not match)
    // ----------------------------------------------------------------------
        //  console.log(user)
        //  console.log(user.password)
        // console.log(password)
    if (!isPasswordMatch) {
      if (user.password && typeof user.password === "string") {
        isPasswordMatch = await bcrypt.compare(password, user.password);
   
      }
    }

    // ----------------------------------------------------------------------
    // 4. IF STILL NOT MATCHED → INVALID
    // ----------------------------------------------------------------------
    if (!isPasswordMatch) {
      return res.status(401).json({
        status: "error",
        message: "Invalid credentials",
      });
    }

    // ----------------------------------------------------------------------
    // 5. CHECK ACCOUNT STATUS
    // ----------------------------------------------------------------------
    if (!user.isActive) {
      return res.status(401).json({
        status: "error",
        message: "Account is inactive. Please contact support.",
      });
    }

    // ----------------------------------------------------------------------
    // 6. GENERATE TOKENS
    // ----------------------------------------------------------------------
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // ----------------------------------------------------------------------
    // 7. SUCCESS RESPONSE
    // ----------------------------------------------------------------------
    return res.json({
      status: "success",
      data: {
        user: {
          id: user._id,
          userId: user.userId,
          email: user.email,
          phoneNumber: user.phoneNumber,
          userType: user.userType,
          isFirstLogin: user.isFirstLogin,
          passwordResetRequired: user.passwordResetRequired,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      status: "error",
      message: "Error logging in",
    });
  }
}



  /**
   * Send OTP
   */
  async sendOTP(req, res) {
    try {
      const { doctorId, phoneNumber } = req.body;
      if(!doctorId && !phoneNumber){
        return res.status(400).json({
          status: 'error',
          message: 'Doctor ID or phone number is required'
        });
      }

      // Validate phone number format
      if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
        return res.status(400).json({ message: 'Invalid phone number format' });
      }

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      console.log(`otp: ${otp}`);
      console.log(`otpExpiry: ${otpExpiry}`);

      // Find user
      const users = await AuthCredential.find({ phoneNumber, userType: 'doctor' }).populate({
        path: 'userId',
        model: 'Member',
        select: 'name'
      });
      console.log(`users: ${JSON.stringify(users)}`);
      if(users.length === 1){
        //update the user
        const user = users[0];
        const doctor = await Doctor.findOne({ _id: new mongoose.Types.ObjectId(user.userId) });
        user.lastOtp = {
          code: otp,
          expiresAt: otpExpiry
        };
        await user.save();
        return res.status(200).json({
          status: 'success',
          message: 'OTP sent successfully',
          otp,
          doctor
        });
      }else{
        return res.status(404).json({
          status: 'error',
          message: 'Users length is not equal to 1'
        });
      }
  
    } catch (error) {
      logger.error('Send OTP error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error sending OTP'
      });
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(req, res) {
    try {
      const { doctorId, phoneNumber, otp } = req.body;

      const user = await AuthCredential.findOne({ phoneNumber });


      if (!user || !user.lastOtp || user.lastOtp.code !== otp) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid OTP'
        });
      }

      if (new Date() > user.lastOtp.expiresAt) {
        return res.status(400).json({
          status: 'error',
          message: 'OTP has expired'
        });
      }

      // Clear OTP
      user.lastOtp = null;
      await user.save();

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      res.json({
        status: 'success',
        message: 'OTP verified successfully',
        data: {
          user: {
            id: user._id,
            userId: user.userId,
            email: user.email,
            phoneNumber: user.phoneNumber,
            userType: user.userType,
            isFirstLogin: user.isFirstLogin,
            passwordResetRequired: user.passwordResetRequired
          },
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });

      user.isFirstLogin = false;
      await user.save();

    } catch (error) {
      logger.error('Verify OTP error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error verifying OTP'
      });
    }
  }

  async getUserName(authUser) {
    try {
      let userName = '';
      
      switch (authUser.userType) {
        case 'admin':
          const admin = await Admin.findById(authUser.userId);
          userName = admin ? admin.name : '';
          break;
        case 'navigator':
          const navigator = await Navigator.findById(authUser.userId);
          userName = navigator ? navigator.name : '';
          break;
        case 'nurse':
          const nurse = await Nurse.findById(authUser.userId);
          userName = nurse ? nurse.name : '';
          break;
        default:
          userName = '';
      }
      return userName;
    } catch (error) {
      logger.error('Get user name error:', error);
      return '';
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const user = await AuthCredential.findOne({ email });

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      // Get user's name
      const userName = await this.getUserName(user);

      //generate and hash temporary password
      const temporaryPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const hashedPassword = await bcrypt.hash(temporaryPassword, 12);
      console.log(`temporary forgot password: ${temporaryPassword}`);

      //store this in auth credential
      user.temporaryPassword = {
        password: hashedPassword,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      };
      user.passwordResetRequired = true;
      await user.save();

      //send a email to the user with the temporary password
      const toObj = {
        name: userName,
        email: email
       }
       emailService.sendEmail('reset_password', toObj, {
        password: temporaryPassword
       });

      res.json({
        status: 'success',
        message: 'Temporary Password Sent'
      });
    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error processing forgot password request'
      });
    }
  }

  /**
   * Reset password
   */
  async resetPassword(req, res) {
    try {
      const { password } = req.body;

      const authHeader = req.headers.authorization;
      console.log("authHeader:"+authHeader)
      // const token = authHeader && authHeader.startsWith('Bearer ') 
      //   ? authHeader.slice(7) 
      //   : null;

      let token = null;

      // Accept both: "Bearer <token>" and "<token>"
      if (authHeader) {
        if (authHeader.startsWith("Bearer ")) {
          token = authHeader.slice(7);
        } else {
          token = authHeader; // raw token support
        }
      }

      if (!token) {
        return res.status(401).json({
          status: 'error',
          message: 'Access denied. No token provided.'
        });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || `digital_conquest`);
      const user = await AuthCredential.findById(decoded.id);

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      // Update password
      const hashedPassword = await bcrypt.hash(password, 12);
      user.password = hashedPassword;
      user.passwordResetRequired = false;
      user.passwordChangedAt = new Date();
      await user.save();

      res.json({
        status: 'success',
        message: 'Password reset successful'
      });
    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error resetting password'
      });
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          status: 'error',
          message: 'Refresh token is required'
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await AuthCredential.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid refresh token'
        });
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(user);

      res.json({
        status: 'success',
        data: {
          accessToken
        }
      });
    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token'
      });
    }
  }

  /**
   * Logout
   */
  async logout(req, res) {
    // In a real implementation, you might want to invalidate the token
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : null;

      if (!token) {
        return res.status(401).json({
          status: 'error',
          message: 'Access denied. No token provided.'
        });
      }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || `digital_conquest`);
    //invalidae the token
    const user = await AuthCredential.findById(decoded.id);
    if(!user){
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }
    // Set token expiry to current time to immediately invalidate it
    decoded.exp = Math.floor(Date.now() / 1000);
    // For now, we'll just send a success response
    res.json({
      status: 'success',
      message: 'Logged out successfully'
    });
  }
}

module.exports = new AuthController();

const jwt = require('jsonwebtoken');
const { Member } = require('../models/index');
const { AuthCredential } = require('../models/index');
const mongoose = require('mongoose');
const { sendOtpSms } = require('../utils/helpers');
const emailService = require('../utils/email');
class AuthController {

  constructor() {
    // Bind the methods to the instance
    this.generateAccessToken = this.generateAccessToken.bind(this);
    this.generateRefreshToken = this.generateRefreshToken.bind(this);
    this.logout = this.logout.bind(this);
    this.sendOTP = this.sendOTP.bind(this);
    this.verifyOTP = this.verifyOTP.bind(this);

     this.login = this.login.bind(this);
    this.register = this.register.bind(this);
    this.refreshToken = this.refreshToken.bind(this);

    this.forgotPassword = this.forgotPassword.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.getUserName = this.getUserName.bind(this);
  }

  generateAccessToken(user) {
    return jwt.sign(
      {
        id: user._id,
        userType: user.userType
      },
      process.env.JWT_SECRET || 'digital_conquest',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1023230h' }
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

  // Send OTP for login
  async sendOTP(req, res) {
    try {
      const { phoneNumber, memberId } = req.body;

      if(memberId && !phoneNumber){
        //check if memberId is valid
        const member = await Member.find({memberId: memberId}).then(result => result[0]);
        if(!member){
          return res.status(400).json({ message: 'Invalid memberId' });
        }
        console.log(`member already exists : ${member._id}`);
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        console.log(`otp: ${otp}`);
        console.log(`otpExpiry: ${otpExpiry}`);
        const users = await AuthCredential.find({userType: 'member', userId: new mongoose.Types.ObjectId(member._id) }).populate({
          path: 'userId',
          model: 'Member',
          select: 'name'
        });
        console.log(`users: ${JSON.stringify(users)}`);
        const user = users[0];
        user.lastOtp = {
          code: otp,
          expiresAt: otpExpiry
        };
        await user.save();
        //send otp to the user
        const response = await sendOtpSms({ mobile: member.phone, otp: otp, otp_expiry: 10 });
        console.log(`response: ${JSON.stringify(response)}`);
        return res.status(200).json({ 
          message: 'OTP sent successfully',
          otp: otp,
          isNewUser: false,
          phoneNumber: member.phone,
          memberId: member.memberId,
          name: member.name 
        });
      }else if(phoneNumber && !memberId){

        //check if phone number is valid
        if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
          return res.status(400).json({ message: 'Invalid phone number format' });
        }
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        const members = await Member.find({ phone: phoneNumber });
        if(members.length > 0){

          const users = await AuthCredential.find({ phoneNumber, userType: 'member' }).populate({
            path: 'userId',
            model: 'Member',
            select: 'name memberId isMember',
          });
          // console.log(`users: ${JSON.stringify(users)}`);
          // Update OTP for all users with this phone number
          for (const user of users) {
            // console.log(` isNewUser: ${user.isNewUser}`);
            user.lastOtp = {
              code: otp,
              expiresAt: otpExpiry
            };
            await user.save();
          }
          //send otp to the user
          const response = await sendOtpSms({ mobile: phoneNumber, otp: otp, otp_expiry: 10 });
          console.log(`response: ${JSON.stringify(response)}`);
          return res.status(200).json({ 
            message: 'OTP sent successfully',
            otp: otp,
            phoneNumber: phoneNumber,
            members: users.map(user => ({
              isNewUser: user.isNewUser,
              name: user.userId.name,
              memberId: user.userId.memberId,
              isMember: user.userId.isMember,
            }))
          });

        }else{
          //create a new member
          const newMember = new Member({
            phone: phoneNumber,
            active: true,
            isMember: false
          });

          await newMember.save();
          console.log(`newMember: ${JSON.stringify(newMember)}`);

          const newUser = await AuthCredential.create({
            phoneNumber,
            userType: 'member',
            userId: newMember._id,
            lastOtp: {
              code: otp,
              expiresAt: otpExpiry
            }
          });

          console.log(`newUser: ${JSON.stringify(newUser)}`);
          //send otp to the user
          const response = await sendOtpSms({ mobile: phoneNumber, otp: otp, otp_expiry: 10 });
          console.log(`response: ${JSON.stringify(response)}`);

          return res.status(200).json({ 
            message: 'OTP sent successfully',
            otp: otp,
            isNewUser: true
          });

        }
      }else{
        return res.status(400).json({ message: 'Invalid request' });
      }
      
    } catch (error) {
      console.error('Send OTP Error:', error);
      res.status(500).json({ message: 'Error sending OTP' });
    }
  }

  // Verify OTP and generate token
  async verifyOTP(req, res) {
    try {
      const { phoneNumber, memberId, otp } = req.body;

      // Validate phone number format
      if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
        return res.status(400).json({ message: 'Invalid phone number format' });
      }

      let query = { phoneNumber: phoneNumber, userType: 'member' };
      if(memberId === undefined || memberId === null || memberId === '' || memberId === 'null'){
        //no issues
      }else{
        query.memberId = memberId;
      }
      console.log(`query: ${JSON.stringify(query)}`);
      let user = await AuthCredential.findOne(query);
      console.log(`user: ${JSON.stringify(user)}`);
      if(!user){
        return res.status(400).json({ message: 'Member not found' });
      }
      if(user.lastOtp.code !== otp){
        return res.status(400).json({ message: 'Invalid OTP' });
      }
      
      if(user.lastOtp.expiresAt < new Date()){
        return res.status(400).json({ message: 'OTP expired' });
      }

      //check if otp is not expired and is correct
      if(user.lastOtp.expiresAt > new Date() && user.lastOtp.code === otp){
        //update the member isActive to true
        await Member.findByIdAndUpdate({_id: new mongoose.Types.ObjectId(user.userId)}, { lastOtp: null,  isFirstLogin: false });
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
            phoneNumber: user.phoneNumber,
            userType: user.userType,
            isFirstLogin: user.isFirstLogin
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
      console.error('Verify OTP Error:', error);
      res.status(500).json({ message: 'Error verifying OTP' });
    }
  }

  async logout(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'dc_refresh_secret');
      const user = await AuthCredential.findById(decoded.id);

      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }

      user.lastLogout = new Date();
      await user.save();

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout Error:', error);
      res.status(500).json({ message: 'Error logging out' });
    }
  }
  
}

module.exports = new AuthController();

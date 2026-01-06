// const jwt = require('jsonwebtoken');
// const { AuthCredential } = require('../models/index');

// const auth = async (req, res, next) => {
//   try {
//     const token = req.header('Authorization')?.replace('Bearer ', '');
//     //console.log(`token 1`, token);
//     if (!token) {
//       return res.status(401).json({ message: 'No authentication token, access denied' });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET || `digital_conquest`);
//    // console.log(`decoded`, decoded);
//     const user = await AuthCredential.findOne({ _id: decoded.id });

//     console.log(`user`, user);
//     if (!user) {
//       throw new Error('User not found');
//     }

//     if (!user.isActive) {
//       throw new Error('User account is inactive');
//     }

//     req.user = user;
//     req.token = token;
//     next();
//   } catch (error) {
//     console.log(error);
//     res.status(401).json({ message: 'Please authenticate' });
//   }
// };

// module.exports = auth;
const jwt = require('jsonwebtoken');
const { AuthCredential } = require('../models');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        message: 'No authentication token, access denied'
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'digital_conquest'
    );

    const authUser = await AuthCredential.findById(decoded.id);

    if (!authUser) {
      return res.status(401).json({
        message: 'User not found'
      });
    }

    if (!authUser.isActive) {
      return res.status(401).json({
        message: 'User account is inactive'
      });
    }

    // 🔥 NORMALIZED USER OBJECT
    req.user = {
      authId: authUser._id,          // AuthCredential ID
      userId: authUser.userId,       // Member / Student ID
      userType: authUser.userType,   // 'member' | 'student'
      email: authUser.email
    };

    req.token = token;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({
      message: 'Please authenticate'
    });
  }
};

module.exports = auth;

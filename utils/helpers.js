const axios = require('axios');
const config = require('../config/config');
/**
 * Send OTP SMS using MSG91 API
 * @param {Object} options
 * @param {string} options.mobile - Recipient mobile number (with country code if required)
 * @param {string} options.otp - OTP to send
 * @param {string} options.template_id - MSG91 template ID
 * @param {string} options.authkey - MSG91 Auth Key
 * @param {number} [options.otp_expiry=15] - OTP expiry in minutes
 * @param {Object} [options.params] - Additional params (Param1, Param2, ...)
 * @returns {Promise<Object>} - API response
 */
async function sendOtpSms({ mobile, otp, otp_expiry = 15, params = {} }) {

  //mobile and otp are required
  if(!mobile || !otp){
    throw new Error('Mobile and OTP are required');
  }
  const url = `https://control.msg91.com/api/v5/otp?otp=${otp}&otp_expiry=${otp_expiry}&template_id=${config.msg91.template_id}&mobile=${mobile}&authkey=${config.msg91.authkey}&realTimeResponse=1`;

  try {
    const response = await axios.post(
      url,
      params,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    // You can customize error handling as needed
    throw error.response ? error.response.data : error;
  }
}

module.exports = {
  sendOtpSms,
};

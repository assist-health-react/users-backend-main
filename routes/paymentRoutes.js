const express = require('express');
const { body, query, param } = require('express-validator');
const auth = require('../middleware/auth');
const axios = require('axios');
const crypto = require('crypto');
const cors = require("cors");
const { v4: uuidv4 } = require('uuid');

const config = require('../config/config');
const phonepe = config.phonepe.production;

const router = express.Router();
router.use(express.json());
router.use(cors());


// constants
const MERCHANT_KEY = phonepe.merchantKey
const MERCHANT_ID = phonepe.merchantId
const MERCHANT_BASE_URL= phonepe.baseUrl
const MERCHANT_STATUS_URL= phonepe.statusUrl
const redirectUrl = phonepe.redirectUrl
const successUrl = phonepe.successUrl
const failureUrl = phonepe.failureUrl
const callbackUrl = phonepe.callbackUrl
const mobileSuccessUrl = phonepe.mobileSuccessUrl
const mobileFailureUrl = phonepe.mobileFailureUrl


router.post('/initiate-payment', async (req, res) => {

    const {name, mobileNumber, amount, userId, platform} = req.body;
    const orderId = uuidv4()
    console.log(`userId: ${userId} - ${name} initiated payment for ${amount}`)
    //payment
    const paymentPayload = {
        merchantId : MERCHANT_ID,
        merchantUserId: userId,
        mobileNumber: mobileNumber,
        amount : amount * 100,
        merchantTransactionId: orderId,
        redirectUrl: `${redirectUrl}/?id=${orderId}&platform=${platform}`,
        redirectMode: 'POST',
        callbackUrl: `${callbackUrl}/?id=${orderId}&platform=${platform}`,
        paymentInstrument: {
            type: 'PAY_PAGE'
        }
    }

    const payload = Buffer.from(JSON.stringify(paymentPayload)).toString('base64')
    const keyIndex = 1
    const string  = payload + '/pg/v1/pay' + MERCHANT_KEY
    const sha256 = crypto.createHash('sha256').update(string).digest('hex')
    const checksum = sha256 + '###' + keyIndex

    const option = {
        method: 'POST',
        url:MERCHANT_BASE_URL,
        headers: {
            accept : 'application/json',
            'Content-Type': 'application/json',
            'X-VERIFY': checksum
        },
        data :{
            request : payload
        }
    }
    try {
        
        const response = await axios.request(option);
        console.log(response.data.data.instrumentResponse.redirectInfo.url)
        res.status(200).json({msg : "OK", url: response.data.data.instrumentResponse.redirectInfo.url})

        //store this payment in the database
        const payment = new Payment({
            userId: userId,
            amount: amount,
            orderId: orderId,
            status: 'pending'
        })
    } catch (error) {
        console.log("error in payment", error)
        res.status(500).json({error : 'Failed to initiate payment'})
    }

});


router.post('/status', async (req, res) => {
    const merchantTransactionId = req.query.id;
    const platform = req.query.platform;
    console.log(`merchantTransactionId: ${merchantTransactionId}`)
    const keyIndex = 1
    const string  = `/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}` + MERCHANT_KEY
    const sha256 = crypto.createHash('sha256').update(string).digest('hex')
    const checksum = sha256 + '###' + keyIndex

    const option = {
        method: 'GET',
        url:`${MERCHANT_STATUS_URL}/${MERCHANT_ID}/${merchantTransactionId}`,
        headers: {
            accept : 'application/json',
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
            'X-MERCHANT-ID': MERCHANT_ID
        },
    }

    axios.request(option).then((response) => {
        if (response.data.success === true){
            console.log("payment success: ", JSON.stringify(response.data))
            if(platform === 'web'){
                return res.redirect(successUrl)
            }else{
                return res.redirect(mobileSuccessUrl)
            }
        }else{
            console.log("payment failed: ", JSON.stringify(response.data))
            if(platform === 'web'){
                return res.redirect(failureUrl)
            }else{
                return res.redirect(mobileFailureUrl)
            }
        }
    })
});

// Backend callback handler
router.post('/callback', (req, res) => {
    try {
      const response = req.body;
      console.log('PhonePe Callback:', response);
      
      // Verify the checksum
      const receivedChecksum = req.headers['x-verify'];
      // Verify checksum logic here
      
      // Update payment status in your database
      // Send response back to PhonePe
      res.status(200).json({ status: 'OK' });
    } catch (error) {
      console.error('Callback error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router;
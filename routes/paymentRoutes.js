const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const cors = require("cors");

const router = express.Router();
router.use(express.json());
router.use(cors());

// Models
const Payment = require("../models/Payment");

// Config
const config = require('../config/config');
const phonepe = config.phonepe.sandbox;

// Constants
const MERCHANT_KEY = phonepe.merchantKey;
const MERCHANT_ID = phonepe.merchantId;
const MERCHANT_BASE_URL = phonepe.baseUrl;
const MERCHANT_STATUS_URL = phonepe.statusUrl;

const redirectUrl = phonepe.redirectUrl;
const successUrl = phonepe.successUrl;
const failureUrl = phonepe.failureUrl;
const callbackUrl = phonepe.callbackUrl;

// ====================================================================
// INITIATE PAYMENT
// ====================================================================
router.post('/initiate-payment', async (req, res) => {
  try {
    const { name, mobileNumber, amount, userId, platform,email } = req.body;
    const orderId = uuidv4();

    console.log(`userId: ${userId} - ${name} initiated payment for ${amount}`);

    const paymentPayload = {
      merchantId: MERCHANT_ID,
      merchantUserId: userId,
      mobileNumber: mobileNumber,
      amount: amount * 100,
      merchantTransactionId: orderId,
      redirectUrl: `${redirectUrl}/?id=${orderId}&platform=${platform}`,
      redirectMode: 'POST',
      callbackUrl: `${callbackUrl}/?id=${orderId}&platform=${platform}`,
      paymentInstrument: {
        type: "PAY_PAGE"
      }
    };

    const payload = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
    const keyIndex = 1;
    const checksumString = payload + "/pg/v1/pay" + MERCHANT_KEY;
    const sha256 = crypto.createHash("sha256").update(checksumString).digest("hex");
    const checksum = sha256 + "###" + keyIndex;

    const option = {
      method: "POST",
      url: MERCHANT_BASE_URL,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum
      },
      data: {
        request: payload
      }
    };

    const response = await axios.request(option);

    const redirectPayURL = response.data.data.instrumentResponse.redirectInfo.url;

    // Save payment in DB as PENDING
    await Payment.create({
      userId,
      name,
      mobileNumber,
      amount,
      orderId,
      platform,
      email,
      status: "pending",
      gatewayResponse: paymentPayload
    });

    console.log("PhonePe URL:", redirectPayURL);

    return res.status(200).json({ msg: "OK", url: redirectPayURL });

  } catch (error) {
    console.error("Error initiating payment:", error);
    return res.status(500).json({ error: "Failed to initiate payment" });
  }
});

// ====================================================================
// PAYMENT STATUS HANDLER (GET + POST Supported)
// ====================================================================
const handlePaymentStatus = async (req, res) => {
  try {
    const merchantTransactionId = req.query.id;
    const platform = req.query.platform;

    console.log("Checking Status for Txn:", merchantTransactionId);

    const keyIndex = 1;
    const checksumString =
      `/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}` + MERCHANT_KEY;

    const sha256 = crypto.createHash("sha256").update(checksumString).digest("hex");
    const checksum = sha256 + "###" + keyIndex;

    const option = {
      method: "GET",
      url: `${MERCHANT_STATUS_URL}/${MERCHANT_ID}/${merchantTransactionId}`,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": MERCHANT_ID
      }
    };

    const response = await axios.request(option);
    const success = response.data.success === true;
    const txnData = response.data.data;

    // Update payment status in DB
    await Payment.findOneAndUpdate(
      { orderId: merchantTransactionId },
      {
        status: success ? "success" : "failed",
        transactionDetails: txnData
      }
    );

    if (success) {
      console.log("Payment SUCCESS:", merchantTransactionId);
      return res.redirect(successUrl);
    } else {
      console.log("Payment FAILED:", merchantTransactionId);
      return res.redirect(failureUrl);
    }
  } catch (error) {
    console.log("Status Check Error:", error);
    return res.redirect(failureUrl);
  }
};

router.get('/status', handlePaymentStatus);
router.post('/status', handlePaymentStatus);

// ====================================================================
// PHONEPE CALLBACK (Server → Server)
// ====================================================================
router.post('/callback', async (req, res) => {
  try {
    const response = req.body;
    const receivedChecksum = req.headers["x-verify"];

    console.log("PhonePe Callback:", JSON.stringify(response, null, 2));

    const payload = JSON.stringify(response);
    const verifyString = payload + MERCHANT_KEY;

    const sha256 = crypto.createHash("sha256").update(verifyString).digest("hex");
    const expectedChecksum = sha256 + "###" + 1;

    if (receivedChecksum !== expectedChecksum) {
      console.log("❌ Invalid callback checksum");
      return res.status(400).json({ status: "FAIL", message: "Invalid checksum" });
    }

    const txnData = response.data;
    const merchantTransactionId = txnData.merchantTransactionId;

    await Payment.findOneAndUpdate(
      { orderId: merchantTransactionId },
      {
        status: response.success ? "success" : "failed",
        gatewayResponse: response,
        transactionDetails: txnData
      }
    );

    console.log("Callback Updated For:", merchantTransactionId);

    return res.status(200).json({ status: "OK" });

  } catch (error) {
    console.error("Callback Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

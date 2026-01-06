module.exports = {
    phonepe: {
        production: {
            merchantId: "M22GP7C1IXZX4",
            merchantKey: `d90972b6-380b-4d97-ab35-945e4e4fd978`,
            baseUrl: "https://api.phonepe.com/apis/hermes/pg/v1/pay",
            statusUrl: "https://api.phonepe.com/apis/hermes/pg/v1/status",
            redirectUrl: "https://api.assisthealth.cloud/users/api/v1/payments/status",
            callbackUrl: "https://api.assisthealth.cloud/users/api/v1/payments/callback",
            successUrl: "https://www.assisthealth.in/subscription/success",
            failureUrl: "https://www.assisthealth.in/subscription/failure",
            mobileSuccessUrl: "https://www.assisthealth.in/subscription/success",
            mobileFailureUrl: "https://www.assisthealth.in/subscription/failure",
            keyIndex: `1`,
            phone: `9880772287`,
            email: `assisthealthsolutions@gmail.com`,
        },
        // sandbox: {
        //     merchantId: "PGTESTPAYUAT86",
        //     merchantKey: "96434309-7796-489d-8924-ab56988a6076",
        // }
      

            sandbox: {
                merchantId: process.env.PHONEPE_MERCHANT_ID,
                merchantKey: process.env.PHONEPE_MERCHANT_KEY,

                baseUrl: "https://api-preprod.phonepe.com/apis/hermes/pg/v1/pay",
                statusUrl: "https://api-preprod.phonepe.com/apis/hermes/pg/v1/status",

                redirectUrl: process.env.BASE_DOMAIN + "payment/status",
                successUrl: process.env.BASE_FORNTEND + "subscription/success",
                failureUrl: process.env.BASE_FORNTEND + "subscription/failure",
                callbackUrl: process.env.BASE_DOMAIN + "payment/callback",

                mobileSuccessUrl: "assisthealth://payment/success",
                mobileFailureUrl: "assisthealth://payment/failure"
                }

    },
    msg91: {
        authkey: "448794A487pnci686bc7bfP1",
        template_id: "68664a43d6fc0504d674d6f2",
    }
}

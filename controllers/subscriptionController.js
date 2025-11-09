const { Subscription, Member, Package } = require('../models/index');
const mongoose = require('mongoose');

class SubscriptionController {

  async getAllSubscriptions(req, res) {
    try {
      const authUser = req.user;
      const member = await Member.findById(authUser.userId);

      if (!member) {
        return res.status(404).json({
          status: 'error',
          message: 'Member not found'
        });
      }

      // Convert memberId to ObjectId for querying
      const memberIdObj = new mongoose.Types.ObjectId(authUser.userId);
      
      const query = {
        memberId: memberIdObj,
        'subscriptionDetails.isActive': true
      };
      console.log('Final combined query:', JSON.stringify(query, null, 2));
      const activeSubscriptions = await Subscription.find(query).lean();
      console.log('Final query results:', activeSubscriptions);

      let packages = [];
      if (activeSubscriptions.length > 0) {
        for (const subscription of activeSubscriptions) {
          try {
            const pkg = await Package.findById(subscription.packageId).lean();
            if (pkg) {
              let pkgData = {
                packageId: pkg._id,
                packageCode: pkg.code,
                packageName: pkg.title,
                startDate: subscription.subscriptionDetails.startDate,
                expiryDate: subscription.subscriptionDetails.expiryDate,
                finalAmountPaid: subscription.pricing.finalAmountPaid,
                transactionId: subscription.transactionId
              };
              packages.push(pkgData);
            }
          } catch (pkgError) {
            console.error('Error finding package:', pkgError);
          }
        }
      }

      // Get inactive subscriptions for history
      let history = [];
      const oldSubscriptions = await Subscription.find({
        memberId: memberIdObj,
        'subscriptionDetails.isActive': false
      }).lean();

      if(oldSubscriptions.length > 0) {
        for(let subscription of oldSubscriptions) {
          try {
            const pkg = await Package.findById(subscription.packageId).lean();
            if (pkg) {
              let pkgData = {
                packageId: pkg._id,
                packageCode: pkg.code,
                packageName: pkg.title,
                startDate: subscription.subscriptionDetails.startDate,
                expiryDate: subscription.subscriptionDetails.expiryDate,
                finalAmountPaid: subscription.pricing.finalAmountPaid,
                transactionId: subscription.transactionId
              };
              history.push(pkgData);
            }
          } catch (pkgError) {
            console.error('Error finding package in history:', pkgError);
          }
        }
      }
      
      res.json({
        status: 'success',
        data: {
            memberId: member.memberId,
            memberName: member.name,
            membershipStatus: {
              isRegistered: member.membershipStatus.isRegistered,
              registrationDate: member.membershipStatus.registrationDate,
              premiumMembership: {
                isActive: member.membershipStatus.premiumMembership.isActive,
                startDate: member.membershipStatus.premiumMembership.startDate,
                expiryDate: member.membershipStatus.premiumMembership.expiryDate,
                renewalCount: member.membershipStatus.premiumMembership.renewalCount
              }
            },
            packages: packages,
            history: history
        }
      });
    } catch (error) {
      console.error('Get subscriptions error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching subscriptions'
      });
    }
  }
}

module.exports = new SubscriptionController();
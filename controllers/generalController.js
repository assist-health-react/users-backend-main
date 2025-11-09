const { Member, Appointment, Package, Setting } = require('../models/index');
const mongoose = require('mongoose');

const Banner = {}
const FAQ = {}
const TermsCondition = {}

class GeneralController {
  // Get active banners
  async getBanners(req, res) {
    try {
      const banners = await Banner.find({
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() }
      }).sort({ order: 1 });

      res.status(200).json(banners);
    } catch (error) {
      console.error('Get Banners Error:', error);
      res.status(500).json({ message: 'Error fetching banners' });
    }
  }

  // Get FAQs with optional category filter
  async getFAQs(req, res) {
    try {
      const { category } = req.query;
      const query = { isActive: true };
      
      if (category) {
        query.category = category;
      }

      const faqs = await FAQ.find(query)
        .sort({ order: 1, category: 1 });

      // Group FAQs by category
      const groupedFaqs = faqs.reduce((acc, faq) => {
        if (!acc[faq.category]) {
          acc[faq.category] = [];
        }
        acc[faq.category].push(faq);
        return acc;
      }, {});

      res.status(200).json(groupedFaqs);
    } catch (error) {
      console.error('Get FAQs Error:', error);
      res.status(500).json({ message: 'Error fetching FAQs' });
    }
  }

  // Get terms and conditions
  async getTermsConditions(req, res) {
    try {
      const terms = `Privacy Policy and Terms of Service

Last Updated: January 1, 2024

1. Introduction
Welcome to AssistHealth. This Privacy Policy describes how we collect, use, process, and disclose your information in connection with your use of our services.

2. Information We Collect
- Personal Information: Name, contact details, and demographic information
- Health Information: Medical history, appointments, and health metrics
- Technical Information: Device data, IP address, and usage statistics

3. How We Use Your Information
- To provide and improve our healthcare services
- To communicate with you about appointments and medical care
- To maintain and optimize our platform
- To comply with legal obligations

4. Data Security
We implement appropriate technical and organizational measures to protect your personal information against unauthorized access or disclosure.

5. Information Sharing
We may share your information with:
- Healthcare providers involved in your care
- Service providers who assist in our operations
- Legal authorities when required by law

6. Your Rights
You have the right to:
- Access your personal information
- Request corrections to your data
- Withdraw consent for data processing
- Request data deletion where applicable

7. Contact Us
For any privacy-related questions or concerns, please contact our Privacy Officer at privacy@assisthealth.com

By using our services, you agree to the terms of this Privacy Policy.`

      if (!terms) {
        return res.status(404).json({
          message: 'Terms and conditions not found',
          data: null
        });
      }

      res.status(200).json({
        message: 'Terms and conditions retrieved successfully',
        data: terms
      });
    } catch (error) {
      console.error('Get Terms Error:', error);
      res.status(500).json({
        message: 'Error fetching terms and conditions',
        error: error.message
      });
    }
  }

  // Get member statistics
  async getStats(req, res) {
    try {
      const memberId = req.user.userId;

      const member = await Member.findOne({ _id: new mongoose.Types.ObjectId(memberId) });
      let stats = {
        totalAppointments: await Appointment.countDocuments({ memberId }),
        pendingAppointments: await Appointment.countDocuments({ memberId, status: 'pending' }),
        completedAppointments: await Appointment.countDocuments({ memberId, status: 'completed' }),
        ongoingAppointments: await Appointment.countDocuments({ memberId, status: 'ongoing' }),
        subprofiles: member.subprofileIds.length
      }

      res.status(200).json({
        message: 'Stats fetched successfully',
        data: stats
      });
    } catch (error) {
      console.error('Get Stats Error:', error);
      res.status(500).json({ message: 'Error fetching statistics' });
    }
  }

  // Contact form submission
  async submitContactForm(req, res) {
    try {
      const { name, email, phone, message, subject } = req.body;

      // Store contact form submission
      // This is a placeholder - implement according to your needs
      const submission = {
        name,
        email,
        phone,
        message,
        subject,
        timestamp: new Date()
      };

      // Send notification email to admin
      await sendContactNotification(submission);

      res.status(200).json({
        message: 'Contact form submitted successfully',
        ticketId: Date.now() // Generate proper ticket ID in production
      });
    } catch (error) {
      console.error('Contact Form Error:', error);
      res.status(500).json({ message: 'Error submitting contact form' });
    }
  }

  // Get app version info
  async getAppVersion(req, res) {
    try {
      const { platform } = req.query;

      const versions = {
        android: {
          latest: '1.0.0',
          minimum: '0.9.0',
          forceUpdate: false
        },
        ios: {
          latest: '1.0.0',
          minimum: '0.9.0',
          forceUpdate: false
        }
      };

      if (platform && !versions[platform]) {
        return res.status(400).json({ message: 'Invalid platform' });
      }

      res.status(200).json(platform ? versions[platform] : versions);
    } catch (error) {
      console.error('Get App Version Error:', error);
      res.status(500).json({ message: 'Error fetching app version info' });
    }
  }

  // Get subscription plans
  async getSubscriptionPlans(req, res) {
    try {
      
      const settings = await Setting.findOne({ key: "subscription" });
      if(!settings) {
        return res.status(404).json({
          message: 'Subscription plans not found',
          data: null
        });
      }
      const packages = await Package.find({ active: true });
      if(!packages) {
        return res.status(404).json({
          message: 'Packages not found',
          data: null
        });
      }

      res.status(200).json({
        status: "success",
        data: {
            one_time_registration_cost: settings.value.one_time_registration_cost,
            premium_membership_cost: settings.value.premium_membership_cost,
            packages: packages
        }
    });
    } catch (error) {
      console.error('Get Subscription Plans Error:', error);
      res.status(500).json({ 
        message: 'Error fetching subscription plans',
        error: error.message 
      });
    }
  }
}

// Helper function to send contact form notification
async function sendContactNotification(submission) {
  // Implement email notification logic
  console.log('Sending contact form notification:', submission);
}

module.exports = new GeneralController();

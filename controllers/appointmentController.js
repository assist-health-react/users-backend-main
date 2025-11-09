const { Appointment, Member } = require('../models/index');
const mongoose = require('mongoose');

class AppointmentController {
  // Get appointments with optional status and search filter
  async getAppointments(req, res) {
    try {
      const { status, search } = req.query;
      console.log(`req.user: ${JSON.stringify(req.user)}`);
      
      // Base query with memberId
      let query = { memberId: req.user.userId };
      
      // Add status filter if provided
      if (status) {
        if (!['pending', 'ongoing', 'cancelled', 'completed'].includes(status)) {
          return res.status(400).json({ message: 'Invalid status value' });
        }
        query.status = status;
      }

      // Add search functionality if search parameter is provided
      if (search) {
        query = {
          $and: [
            { memberId: req.user.userId },
            status ? { status } : {},
            {
              $or: [
                // Basic appointment info
                { service: { $regex: search, $options: 'i' } },
                { specialization: { $regex: search, $options: 'i' } },
                { hospitalName: { $regex: search, $options: 'i' } },
                { hospitalAddress: { $regex: search, $options: 'i' } },
                { appointmentType: { $regex: search, $options: 'i' } },
                { additionalInfo: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } },
                // Prescription details
                { 'prescription.chiefComplaints': { $regex: search, $options: 'i' } },
                { 'prescription.allergies': { $regex: search, $options: 'i' } },
                { 'prescription.history': { $regex: search, $options: 'i' } },
                { 'prescription.diagnosis': { $regex: search, $options: 'i' } },
                { 'prescription.medicines.name': { $regex: search, $options: 'i' } },
                { 'prescription.additionalInstructions': { $regex: search, $options: 'i' } },
                // Member address
                { 'memberAddress.addressLine1': { $regex: search, $options: 'i' } },
                { 'memberAddress.addressLine2': { $regex: search, $options: 'i' } },
                { 'memberAddress.city': { $regex: search, $options: 'i' } },
                { 'memberAddress.state': { $regex: search, $options: 'i' } }
              ]
            }
          ]
        };
      }

      const appointments = await Appointment.find(query)
        .populate('memberId', 'name')
        .populate('doctorId', 'name specialization')
        .populate('navigatorId', 'name')
        .sort({ appointmentDateTime: -1 })
        .lean();

      // Add date and time fields to each appointment
      const appointmentsWithDateTime = appointments.map(appointment => {
        const dateTime = new Date(appointment.appointmentDateTime);
        return {
          ...appointment,
          date: dateTime.toLocaleDateString('en-GB'), // Format as DD/MM/YYYY
          time: dateTime.toLocaleTimeString('en-GB', { 
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }) // Format as HH:mm
        };
      });

      res.status(200).json({
        message: 'Appointments fetched successfully',
        data: appointmentsWithDateTime,
        count: appointmentsWithDateTime.length
      });
    } catch (error) {
      console.error('Get Appointments Error:', error);
      res.status(500).json({ 
        message: 'Error fetching appointments',
        data: null 
      });
    }
  }

  // Create new appointment
  async createAppointment(req, res) {
    try {
      const [day, month, year] = req.body.date.split('/');
      const [hours, minutes] = req.body.time.split(':');
      const dateTime = new Date(year, month - 1, day, hours, minutes);
      const isoDateTime = dateTime.toISOString();
      const memberAddress = req.body.address || {}
      const member = await Member.findOne({ _id: new mongoose.Types.ObjectId(req.user.userId) });
      console.log(`member: ${JSON.stringify(member)}`);
      const navigatorId = member.healthcareTeam.navigator._id.toString();
      console.log(`navigatorId: ${navigatorId}`);
      const appointmentData = {
        ...req.body,
        date: undefined,
        time: undefined,
        navigatorId: navigatorId,
        appointedBy: req.user.userId,
        appointmentDateTime: isoDateTime,
        memberAddress: memberAddress
      };

      // Validate appointment datetime is in future
      if (new Date(appointmentData.appointmentDateTime) < new Date()) {
        return res.status(400).json({
          message: 'Appointment datetime must be in the future',
          data: null
        });
      }

      const appointment = await Appointment.create(appointmentData);
      
      // Populate doctor and navigator details
      await appointment.populate('navigatorId', 'name');

      res.status(201).json({
        message: 'Appointment created successfully',
        data: appointment
      });
    } catch (error) {
      console.error('Create Appointment Error:', error);
      res.status(500).json({ 
        message: 'Error creating appointment',
        data: null 
      });
    }
  }

  // Update appointment status
  async updateAppointmentStatus(req, res) {
    try {
      const { appointmentId } = req.params;
      const { status } = req.body;

      if (!['pending', 'ongoing', 'cancelled', 'completed'].includes(status)) {
        return res.status(400).json({ 
          message: 'Invalid status value',
          data: null 
        });
      }

      const appointment = await Appointment.findOneAndUpdate(
        {
          _id: appointmentId,
          memberId: req.user._id
        },
        { status },
        { new: true }
      ).populate('doctorId', 'name specialization')
       .populate('navigatorId', 'name');

      if (!appointment) {
        return res.status(404).json({ 
          message: 'Appointment not found',
          data: null 
        });
      }

      res.status(200).json({
        message: 'Appointment status updated successfully',
        data: appointment
      });
    } catch (error) {
      console.error('Update Appointment Status Error:', error);
      res.status(500).json({ 
        message: 'Error updating appointment status',
        data: null 
      });
    }
  }

  // Update appointment prescription
  async updatePrescription(req, res) {
    try {
      const { appointmentId } = req.params;
      const { prescription } = req.body;

      const appointment = await Appointment.findOneAndUpdate(
        {
          _id: appointmentId,
          doctorId: req.user._id // Only doctor can update prescription
        },
        { prescription },
        { new: true }
      ).populate('doctorId', 'name specialization')
       .populate('navigatorId', 'name');

      if (!appointment) {
        return res.status(404).json({ 
          message: 'Appointment not found',
          data: null 
        });
      }

      res.status(200).json({
        message: 'Prescription updated successfully',
        data: appointment
      });
    } catch (error) {
      console.error('Update Prescription Error:', error);
      res.status(500).json({ 
        message: 'Error updating prescription',
        data: null 
      });
    }
  }
}

module.exports = new AppointmentController();

const { Doctor } = require('../models/index');



const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`id: ${id}`);

    const doctor = await Doctor.findById(id)
    // Convert time slots to payload format
    const doctorData = doctor.toObject();
    doctorData.onlineConsultationTimeSlots = this._convertTimeSlotsToPayload(doctor.onlineConsultationTimeSlots);
    doctorData.offlineConsultationTimeSlots = this._convertTimeSlotsToPayload(doctor.offlineConsultationTimeSlots);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Doctor fetched successfully',
      data: doctorData
    });

  } catch (error) {
    console.error(`Get Doctor By ID Error (ID: ${req.params.id}):`, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor details',
      error: error.message
    });
  }
};

/**
 * Convert schema time slots to payload format
 */
const _convertTimeSlotsToPayload = (timeSlots) => {
  const slotsByDay = {};
  
  timeSlots.forEach(slot => {
    if (!slotsByDay[slot.day]) {
      slotsByDay[slot.day] = [];
    }
    slotsByDay[slot.day].push(`${slot.from} | ${slot.to}`);
  });

  return Object.entries(slotsByDay).map(([day, slots]) => ({
    day,
    slots
  }));
};

module.exports = {
  getDoctorById,
  _convertTimeSlotsToPayload
}; 
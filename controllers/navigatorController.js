const { Navigator } = require('../models/index');

const getNavigatorById = async (req, res) => {
  try {
    const { id } = req.params;

    const navigator = await Navigator.findById(id)

    if (!navigator) {
      return res.status(404).json({
        success: false,
        message: 'Navigator not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Navigator fetched successfully',
      data: navigator
    });

  } catch (error) {
    console.error('Get Navigator By ID Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching navigator details',
      error: error.message
    });
  }
};

module.exports = {
  // ... existing exports ...
  getNavigatorById
}; 
const { Package } = require('../models/index');

class PackageController {
  // Get all packages
  async getPackages(req, res) {
    try {
      const { active } = req.query;
      
      // Build query
      let query = {};
      
      // Filter by active status if provided
      if (active !== undefined) {
        query.active = active === 'true';
      }
      
      const packages = await Package.find(query).sort({ createdAt: -1 });
      
      res.status(200).json({
        message: 'Packages retrieved successfully',
        data: packages,
        count: packages.length
      });
    } catch (error) {
      console.error('Get Packages Error:', error);
      res.status(500).json({ 
        message: 'Error fetching packages',
        error: error.message
      });
    }
  }

  // Get package by ID
  async getPackageById(req, res) {
    try {
      const packageData = await Package.findById(req.params.id);
      
      if (!packageData) {
        return res.status(404).json({ 
          message: 'Package not found',
          error: 'Package does not exist'
        });
      }
      
      res.status(200).json({
        message: 'Package retrieved successfully',
        data: packageData
      });
    } catch (error) {
      console.error('Get Package Error:', error);
      res.status(500).json({ 
        message: 'Error fetching package',
        error: error.message
      });
    }
  }
}

module.exports = new PackageController();

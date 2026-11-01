const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Installation = require('../models/Installation');
const ServiceTicket = require('../models/ServiceTicket');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/technicians
router.get('/', protect, async (req, res) => {
  try {
    const technicians = await User.find({ role: 'technician' }).select('-password');

    // Attach active workload and completed job counts
    const enriched = await Promise.all(
      technicians.map(async (tech) => {
        const [assignedInstalls, completedInstalls, activeTickets] = await Promise.all([
          Installation.find({
            leadTechnician: tech._id,
            status: { $in: ['assigned', 'in_progress', 'testing_in_progress'] }
          }).countDocuments(),
          Installation.find({
            leadTechnician: tech._id,
            status: { $in: ['completed', 'customer_accepted'] }
          }).countDocuments(),
          ServiceTicket.find({
            assignedTechnician: tech._id,
            status: { $in: ['technician_assigned', 'in_progress'] }
          }).countDocuments()
        ]);

        return {
          ...tech.toObject(),
          activeInstallations: assignedInstalls,
          completedInstallations: completedInstalls,
          activeTickets,
          totalWorkload: assignedInstalls + activeTickets
        };
      })
    );

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/technicians/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const technician = await User.findOne({ _id: req.params.id, role: 'technician' }).select('-password');
    if (!technician) return res.status(404).json({ success: false, message: 'Technician not found' });

    const installations = await Installation.find({ leadTechnician: technician._id })
      .populate('customer', 'name phone installationAddress')
      .sort({ scheduledDate: -1 });

    const tickets = await ServiceTicket.find({ assignedTechnician: technician._id })
      .populate('customer', 'name phone installationAddress')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        technician,
        installations,
        tickets
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

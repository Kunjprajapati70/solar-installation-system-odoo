const Setting = require('../../models/Setting');
const ApiResponse = require('../utils/apiResponse');

class SettingController {
  static async getSettings(req, res, next) {
    try {
      let settings = await Setting.findOne();
      if (!settings) {
        settings = await Setting.create({
          companyName: 'SunPower Solutions',
          tagline: 'Engineering High-Efficiency Solar Rooftops',
          contactEmail: 'contact@sunpowersolutions.com',
          contactPhone: '+91 98765 43210',
          warrantyDurationsYears: {
            panel: 20,
            inverter: 2,
            battery: 2,
            structure: 5
          },
          subsidySlabs: [
            { minKw: 1, maxKw: 1, subsidyAmount: 30000, scheme: 'PM Surya Ghar: 1 kW Rooftop Slab' },
            { minKw: 2, maxKw: 2, subsidyAmount: 60000, scheme: 'PM Surya Ghar: 2 kW Rooftop Slab' },
            { minKw: 3, maxKw: 10, subsidyAmount: 78000, scheme: 'PM Surya Ghar: 3 kW+ Maximum National Cap' }
          ]
        });
      }
      return ApiResponse.success(res, settings);
    } catch (err) {
      next(err);
    }
  }

  static async updateSettings(req, res, next) {
    try {
      let settings = await Setting.findOne();
      if (!settings) {
        settings = await Setting.create(req.body);
      } else {
        Object.assign(settings, req.body);
        await settings.save();
      }
      return ApiResponse.success(res, settings, 'Settings updated successfully.');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = SettingController;

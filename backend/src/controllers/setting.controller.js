const { Setting } = require('../models');

// Get settings (single row, create default if not exists)
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// Update settings (upsert behavior)
exports.updateSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create(req.body);
    } else {
      await settings.update(req.body);
    }
    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};
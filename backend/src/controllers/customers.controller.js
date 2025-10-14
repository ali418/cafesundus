// backend/src/controllers/customers.controller.js
const { Op } = require('sequelize');
const { Customer } = require('../models'); // adjust path to your models

/**
 * POST /api/v1/customers/find-or-create
 * body: { name, email, phone }
 * returns: { id, name, email, phone, createdAt, updatedAt }
 */
exports.findOrCreateCustomer = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ message: 'Email or phone is required' });
    }

    // find by email OR phone
    let customer = await Customer.findOne({
      where: {
        [Op.or]: [
          email ? { email } : null,
          phone ? { phone } : null
        ].filter(Boolean)
      }
    });

    if (!customer) {
      customer = await Customer.create({
        name: name || 'Walk-in Customer',
        email: email || null,
        phone: phone || null
      });
    } else {
      // optional: update name/email/phone if empty/changed
      const changes = {};
      if (name && !customer.name) changes.name = name;
      if (email && !customer.email) changes.email = email;
      if (phone && !customer.phone) changes.phone = phone;
      if (Object.keys(changes).length) {
        await customer.update(changes);
      }
    }

    return res.json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    });
  } catch (err) {
    console.error('findOrCreateCustomer error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
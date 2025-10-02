'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // PostgreSQL specific query to modify the check constraint for the type column
    // This adds 'order_status' and 'order_status_admin' to the allowed values
    return queryInterface.sequelize.query(`
      ALTER TABLE "notifications" 
      DROP CONSTRAINT IF EXISTS "notifications_type_check";
      
      ALTER TABLE "notifications" 
      ADD CONSTRAINT "notifications_type_check" 
      CHECK ("type" IN ('low_stock', 'new_order', 'payment_received', 'system_update', 'customer_return', 'expiry_alert', 'near_expiry', 'order_status', 'order_status_admin'));
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Revert back to the original constraint without 'order_status' and 'order_status_admin'
    return queryInterface.sequelize.query(`
      ALTER TABLE "notifications" 
      DROP CONSTRAINT IF EXISTS "notifications_type_check";
      
      ALTER TABLE "notifications" 
      ADD CONSTRAINT "notifications_type_check" 
      CHECK ("type" IN ('low_stock', 'new_order', 'payment_received', 'system_update', 'customer_return', 'expiry_alert', 'near_expiry'));
    `);
  }
};
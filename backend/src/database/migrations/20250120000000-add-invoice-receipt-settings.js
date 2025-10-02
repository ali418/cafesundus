'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('settings', 'invoice_prefix', {
      type: Sequelize.STRING(20),
      allowNull: true,
      defaultValue: 'INV'
    });

    await queryInterface.addColumn('settings', 'invoice_suffix', {
      type: Sequelize.STRING(20),
      allowNull: true,
      defaultValue: ''
    });

    await queryInterface.addColumn('settings', 'invoice_next_number', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1001
    });

    await queryInterface.addColumn('settings', 'invoice_show_logo', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: true
    });

    await queryInterface.addColumn('settings', 'invoice_show_tax_number', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: true
    });

    await queryInterface.addColumn('settings', 'invoice_show_signature', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: true
    });

    await queryInterface.addColumn('settings', 'invoice_footer_text', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: 'Thank you for your business!'
    });

    await queryInterface.addColumn('settings', 'invoice_terms_and_conditions', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: 'All sales are final. Returns accepted within 30 days with receipt.'
    });

    await queryInterface.addColumn('settings', 'receipt_show_logo', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: true
    });

    await queryInterface.addColumn('settings', 'receipt_show_tax_details', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: true
    });

    await queryInterface.addColumn('settings', 'receipt_print_automatically', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false
    });

    await queryInterface.addColumn('settings', 'receipt_footer_text', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: 'Thank you for shopping with us!'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('settings', 'invoice_prefix');
    await queryInterface.removeColumn('settings', 'invoice_suffix');
    await queryInterface.removeColumn('settings', 'invoice_next_number');
    await queryInterface.removeColumn('settings', 'invoice_show_logo');
    await queryInterface.removeColumn('settings', 'invoice_show_tax_number');
    await queryInterface.removeColumn('settings', 'invoice_show_signature');
    await queryInterface.removeColumn('settings', 'invoice_footer_text');
    await queryInterface.removeColumn('settings', 'invoice_terms_and_conditions');
    await queryInterface.removeColumn('settings', 'receipt_show_logo');
    await queryInterface.removeColumn('settings', 'receipt_show_tax_details');
    await queryInterface.removeColumn('settings', 'receipt_print_automatically');
    await queryInterface.removeColumn('settings', 'receipt_footer_text');
  }
};
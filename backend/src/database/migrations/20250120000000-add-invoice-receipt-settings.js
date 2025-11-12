'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('settings');

    if (!table.invoice_prefix) await queryInterface.addColumn('settings', 'invoice_prefix', {
      type: Sequelize.STRING(20),
      allowNull: true,
      defaultValue: 'INV'
    });

    if (!table.invoice_suffix) await queryInterface.addColumn('settings', 'invoice_suffix', {
      type: Sequelize.STRING(20),
      allowNull: true,
      defaultValue: ''
    });

    if (!table.invoice_next_number) await queryInterface.addColumn('settings', 'invoice_next_number', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1001
    });

    if (!table.invoice_show_logo) await queryInterface.addColumn('settings', 'invoice_show_logo', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: true
    });

    if (!table.invoice_show_tax_number) await queryInterface.addColumn('settings', 'invoice_show_tax_number', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: true
    });

    if (!table.invoice_show_signature) await queryInterface.addColumn('settings', 'invoice_show_signature', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: true
    });

    if (!table.invoice_footer_text) await queryInterface.addColumn('settings', 'invoice_footer_text', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: 'Thank you for your business!'
    });

    if (!table.invoice_terms_and_conditions) await queryInterface.addColumn('settings', 'invoice_terms_and_conditions', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: 'All sales are final. Returns accepted within 30 days with receipt.'
    });

    if (!table.receipt_show_logo) await queryInterface.addColumn('settings', 'receipt_show_logo', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: true
    });

    if (!table.receipt_show_tax_details) await queryInterface.addColumn('settings', 'receipt_show_tax_details', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: true
    });

    if (!table.receipt_print_automatically) await queryInterface.addColumn('settings', 'receipt_print_automatically', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false
    });

    if (!table.receipt_footer_text) await queryInterface.addColumn('settings', 'receipt_footer_text', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: 'Thank you for shopping with us!'
    });
  },

  down: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('settings');
    if (table.invoice_prefix) await queryInterface.removeColumn('settings', 'invoice_prefix');
    if (table.invoice_suffix) await queryInterface.removeColumn('settings', 'invoice_suffix');
    if (table.invoice_next_number) await queryInterface.removeColumn('settings', 'invoice_next_number');
    if (table.invoice_show_logo) await queryInterface.removeColumn('settings', 'invoice_show_logo');
    if (table.invoice_show_tax_number) await queryInterface.removeColumn('settings', 'invoice_show_tax_number');
    if (table.invoice_show_signature) await queryInterface.removeColumn('settings', 'invoice_show_signature');
    if (table.invoice_footer_text) await queryInterface.removeColumn('settings', 'invoice_footer_text');
    if (table.invoice_terms_and_conditions) await queryInterface.removeColumn('settings', 'invoice_terms_and_conditions');
    if (table.receipt_show_logo) await queryInterface.removeColumn('settings', 'receipt_show_logo');
    if (table.receipt_show_tax_details) await queryInterface.removeColumn('settings', 'receipt_show_tax_details');
    if (table.receipt_print_automatically) await queryInterface.removeColumn('settings', 'receipt_print_automatically');
    if (table.receipt_footer_text) await queryInterface.removeColumn('settings', 'receipt_footer_text');
  }
};
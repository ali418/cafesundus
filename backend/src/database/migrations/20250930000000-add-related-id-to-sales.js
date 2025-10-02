'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // إضافة عمود relatedId إلى جدول sales
    await queryInterface.addColumn('sales', 'related_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null
    });

    // إضافة فهرس للعمود لتحسين أداء البحث
    await queryInterface.addIndex('sales', ['related_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // إزالة الفهرس أولاً
    await queryInterface.removeIndex('sales', ['related_id']);
    
    // ثم إزالة العمود
    await queryInterface.removeColumn('sales', 'related_id');
  }
};
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const InventoryTransaction = sequelize.define('InventoryTransaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      get() {
        const val = this.getDataValue('id');
        return val ? val.toString() : null;
      },
      set(val) {
        this.setDataValue('id', val ? val.toString() : null);
      },
    },
    inventoryId: {
      type: DataTypes.INTEGER,
      field: 'inventory_id',
      allowNull: false,
      get() {
        return parseInt(this.getDataValue('inventoryId'), 10);
      },
      set(val) {
        this.setDataValue('inventoryId', parseInt(val, 10));
      },
    },
    userId: {
      type: DataTypes.UUID,
      field: 'user_id',
      allowNull: false,
      get() {
        const val = this.getDataValue('userId');
        return val ? val.toString() : null;
      },
      set(val) {
        this.setDataValue('userId', val ? val.toString() : null);
      },
    },
    type: {
      type: DataTypes.ENUM('purchase', 'sale', 'adjustment', 'return', 'transfer'),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notZero(value) {
          if (value === 0) {
            throw new Error('Quantity cannot be zero');
          }
        },
      },
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    referenceId: {
      type: DataTypes.UUID,
      field: 'reference_id',
      allowNull: true,
      comment: 'Reference to related entity (e.g., sale ID, purchase ID)',
      get() {
        const val = this.getDataValue('referenceId');
        return val ? val.toString() : null;
      },
      set(val) {
        this.setDataValue('referenceId', val ? val.toString() : null);
      },
    },
    referenceType: {
      type: DataTypes.STRING,
      field: 'reference_type',
      allowNull: true,
      comment: 'Type of reference (e.g., Sale, Purchase)',
    },
    previousQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    newQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    timestamps: true,
    updatedAt: false, // Transactions should not be updated
    underscored: true, // Use snake_case for column names
    createdAt: 'created_at',
  });

  InventoryTransaction.associate = (models) => {
    // A transaction belongs to an inventory record
    InventoryTransaction.belongsTo(models.Inventory, {
      foreignKey: {
        name: 'inventoryId',
        field: 'inventory_id',
        allowNull: false,
        type: DataTypes.INTEGER, // Match the database schema which uses INTEGER
      },
      onDelete: 'RESTRICT',
    });

    // A transaction is created by a user
    InventoryTransaction.belongsTo(models.User, {
      foreignKey: {
        name: 'userId',
        field: 'user_id',
        allowNull: false,
      },
      as: 'createdBy',
      onDelete: 'RESTRICT',
    });
  };

  return InventoryTransaction;
};
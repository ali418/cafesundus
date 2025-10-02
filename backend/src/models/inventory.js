const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Inventory = sequelize.define('Inventory', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'product_id',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    minStockLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'min_quantity',
      validate: {
        min: 0,
      },
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expiry_date',
    },
  }, {
    tableName: 'inventory',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  Inventory.associate = (models) => {
    // An inventory record belongs to a product
    Inventory.belongsTo(models.Product, {
      foreignKey: {
        name: 'productId',
        allowNull: false,
      },
      as: 'product',
      onDelete: 'CASCADE',
    });

    // An inventory has many inventory transactions
    Inventory.hasMany(models.InventoryTransaction, {
      foreignKey: 'inventoryId',
      as: 'transactions',
    });
  };

  return Inventory;
};
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SaleItem = sequelize.define('SaleItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'unit_price',
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'total_price',
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
  }, {
    tableName: 'sale_items',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  SaleItem.associate = (models) => {
    // A sale item belongs to a sale
    SaleItem.belongsTo(models.Sale, {
      foreignKey: {
        name: 'saleId',
        field: 'sale_id',
        allowNull: false,
      },
      onDelete: 'CASCADE',
    });

    // A sale item belongs to a product
    SaleItem.belongsTo(models.Product, {
      foreignKey: {
        name: 'productId',
        field: 'product_id',
        allowNull: false,
        type: DataTypes.INTEGER, // Match DB: products.id is INTEGER
      },
      onDelete: 'RESTRICT',
    });
  };

  return SaleItem;
};
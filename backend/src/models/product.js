const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    // Define field mappings for all columns to ensure consistency
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },
    // cost field removed as it doesn't exist in the database schema

    // Using fields that exist in the actual database schema
    stock: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    barcode: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    is_generated_barcode: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    // Additional fields from the database schema
    name_ar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description_ar: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    serial_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    unit_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    show_online: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    }
    // Additional fields may be needed based on the actual database schema
  }, {
    tableName: 'products',
    timestamps: true,
    paranoid: false, // Disable soft delete as deleted_at column doesn't exist
    underscored: true, // Use snake_case for column names in the database
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Product.associate = (models) => {
    // No category association - using category as a string field
    // instead of a foreign key relationship

    // A product has many inventory records
    Product.hasMany(models.Inventory, {
      foreignKey: 'product_id',
      as: 'inventoryItems',
    });

    // A product can be in many sales (through SaleItem)
    Product.hasMany(models.SaleItem, {
      foreignKey: 'product_id',
      as: 'saleItems',
    });
  };

  return Product;
};
module.exports = (sequelize, DataTypes) => {
  
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['low_stock', 'new_order', 'payment_received', 'system_update', 'customer_return', 'expiry_alert', 'near_expiry', 'order_status', 'order_status_admin']],
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    relatedId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID of the related entity (product, order, etc.)',
    },
    relatedType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Type of the related entity (product, order, etc.)',
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
  });

  Notification.associate = (models) => {
    // Associate with User model
    Notification.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return Notification;
};
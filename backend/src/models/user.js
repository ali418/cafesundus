module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('admin', 'manager', 'cashier', 'user', 'storekeeper', 'accountant', 'staff'),
      defaultValue: 'user',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'users',
    timestamps: true,
    paranoid: true, // Soft delete
    underscored: true, // Use snake_case for column names (created_at, updated_at, deleted_at)
  });

  User.associate = (models) => {
    // Define associations here
    // For example:
    // User.hasMany(models.Sale, { foreignKey: 'userId', as: 'sales' });
    User.hasMany(models.LoginHistory, { foreignKey: 'user_id', as: 'loginHistory' });
  };

  return User;
};
module.exports = (sequelize, DataTypes) => {
  const Setting = sequelize.define('Setting', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    store_name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'My Store',
    },
    currency_code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'UGX',
    },
    currency_symbol: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'UGX',
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      set(value) {
        const v = typeof value === 'string' ? value.trim() : value;
        this.setDataValue('email', v ? v : null);
      },
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    postal_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tax_rate: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
    logo_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    language: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'ar',
    },
    // Invoice settings
    invoice_prefix: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'INV',
    },
    invoice_suffix: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: '',
    },
    invoice_next_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1001,
    },
    invoice_show_logo: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    invoice_show_tax_number: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    invoice_show_signature: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    invoice_footer_text: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: 'Thank you for your business!',
    },
    invoice_terms_and_conditions: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: 'All sales are final. Returns accepted within 30 days with receipt.',
    },
    // Receipt settings
    receipt_show_logo: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    receipt_show_tax_details: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    receipt_print_automatically: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    receipt_show_online_order_qr: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    receipt_footer_text: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: 'Thank you for shopping with us!',
    },
    // Payment settings
    accept_cash: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    accept_credit_cards: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    accept_debit_cards: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    accept_mobile_payments: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    default_payment_method: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'cash',
    },
    mtn_phone_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    airtel_phone_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mobile_pin_digits: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 4,
    },
  }, {
    tableName: 'settings',
    timestamps: true,
    underscored: true,
  });

  return Setting;
};
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if settings table exists and has the old structure
    const tableDescription = await queryInterface.describeTable('settings');
    
    if (tableDescription.key && tableDescription.value) {
      // Old key-value structure exists, need to restructure
      
      // First, get any existing data
      const existingData = await queryInterface.sequelize.query(
        'SELECT * FROM settings',
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      // Drop the old table
      await queryInterface.dropTable('settings');
      
      // Create the new structure
      await queryInterface.createTable('settings', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        store_name: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'My Store',
        },
        currency_code: {
          type: Sequelize.STRING(10),
          allowNull: false,
          defaultValue: 'USD',
        },
        currency_symbol: {
          type: Sequelize.STRING(10),
          allowNull: false,
          defaultValue: '$',
        },
        email: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        phone: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        address: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        city: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        state: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        postal_code: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        country: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        website: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        tax_rate: {
          type: Sequelize.FLOAT,
          allowNull: true,
          defaultValue: 0,
        },
        logo_url: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        language: {
          type: Sequelize.STRING(10),
          allowNull: false,
          defaultValue: 'ar',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });
      
      // Migrate any existing key-value data to the new structure
      if (existingData.length > 0) {
        const newRecord = {
          store_name: 'My Store',
          currency_code: 'USD',
          currency_symbol: '$',
          language: 'ar',
          tax_rate: 0,
        };
        
        // Map old key-value pairs to new structure
        existingData.forEach(row => {
          switch (row.key) {
            case 'store_name':
              newRecord.store_name = row.value;
              break;
            case 'currency_code':
              newRecord.currency_code = row.value;
              break;
            case 'currency_symbol':
              newRecord.currency_symbol = row.value;
              break;
            case 'email':
              newRecord.email = row.value;
              break;
            case 'phone':
              newRecord.phone = row.value;
              break;
            case 'address':
              newRecord.address = row.value;
              break;
            case 'city':
              newRecord.city = row.value;
              break;
            case 'state':
              newRecord.state = row.value;
              break;
            case 'postal_code':
              newRecord.postal_code = row.value;
              break;
            case 'country':
              newRecord.country = row.value;
              break;
            case 'website':
              newRecord.website = row.value;
              break;
            case 'tax_rate':
              newRecord.tax_rate = parseFloat(row.value) || 0;
              break;
            case 'logo_url':
              newRecord.logo_url = row.value;
              break;
            case 'language':
              newRecord.language = row.value;
              break;
          }
        });
        
        // Insert the migrated data
        await queryInterface.bulkInsert('settings', [newRecord]);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // This is a destructive migration - we can't easily revert
    // Just recreate the old key-value structure
    await queryInterface.dropTable('settings');
    
    await queryInterface.createTable('settings', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      key: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      value: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },
};
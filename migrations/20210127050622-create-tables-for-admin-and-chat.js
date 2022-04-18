'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Admins', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      email: {
        type: Sequelize.STRING,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
      },

      firstName: {
        type: Sequelize.STRING,
      },
      lastName: {
        type: Sequelize.STRING,
      },
      settings: {
        type: Sequelize.JSONB,
      },
      role: {
        type: Sequelize.INTEGER,
      },
      status: {
        type: Sequelize.INTEGER,
      },
      banned: {
        type: Sequelize.BOOLEAN,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    //
    await queryInterface.createTable('AdminSessions', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING,
      },
      accessTokenUUID: {
        type: Sequelize.STRING,
      },
      refreshTokenUUID: {
        type: Sequelize.STRING,
      },
      adminId: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: 'Admins',
            schema: 'public',
          },
          key: 'id',
        },
      },
      lastUsedDate: {
        type: Sequelize.DATE,
      },
      lastUsedIp: {
        type: Sequelize.STRING,
      },
      access_exp: {
        type: Sequelize.DOUBLE,
      },
      refresh_exp: {
        type: Sequelize.DOUBLE,
      },
      iat: {
        type: Sequelize.DOUBLE,
      },
      userAgent: {
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('Chats', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.STRING,
        references: {
          model: {
            tableName: 'Users',
            schema: 'public',
          },
          key: 'id',
        },
      },
      active: {
        type: Sequelize.BOOLEAN,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('ChatLines', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      chatID: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: 'Chats',
            schema: 'public',
          },
          key: 'id',
        },
      },
      sender: {
        type: Sequelize.JSONB,
      },
      receiver: {
        type: Sequelize.JSONB,
      },
      message: {
        type: Sequelize.TEXT,
      },
      timestamp: {
        type: Sequelize.BIGINT,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('ChatLineAttachments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      chatLineId: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: 'ChatLines',
            schema: 'public',
          },
          key: 'id',
        },
      },
      file: {
        type: Sequelize.STRING,
      },
      ext: {
        type: Sequelize.JSONB,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('AdminSession');
    await queryInterface.dropTable('Admins');
    await queryInterface.dropTable('Chats');
    await queryInterface.dropTable('ChatLines');
    await queryInterface.dropTable('ChatLineAttachments');
  },
};

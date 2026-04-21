const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');

const databasePath = process.env.SQLITE_STORAGE_PATH
  ? path.resolve(process.env.SQLITE_STORAGE_PATH)
  : path.join(__dirname, '..', 'database.sqlite');
const databaseDir = path.dirname(databasePath);

if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, { recursive: true });
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: databasePath,
  logging: false,
});

const setReadyState = (value) => {
  try {
    Object.defineProperty(mongoose.connection, 'readyState', {
      configurable: true,
      enumerable: true,
      writable: true,
      value,
    });
  } catch (error) {
    mongoose.connection.readyState = value;
  }
};

const setConnectionHost = (value) => {
  try {
    Object.defineProperty(mongoose.connection, 'host', {
      configurable: true,
      enumerable: true,
      writable: true,
      value,
    });
  } catch (error) {
    mongoose.connection.host = value;
  }
};

setReadyState(0);
setConnectionHost('sqlite');

mongoose.connection.close = async () => {
  if (sequelize) {
    await sequelize.close();
  }

  setReadyState(0);
};

mongoose.connection.on = () => mongoose.connection;

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return {
      connected: true,
      dialect: 'sqlite',
      storage: databasePath,
    };
  }

  try {
    await sequelize.authenticate();
    await sequelize.sync({
      alter: process.env.DB_AUTO_ALTER !== 'false',
    });

    isConnected = true;
    setReadyState(1);
    setConnectionHost('sqlite');

    console.log(`[db] SQLite connected: ${databasePath}`);

    return {
      connected: true,
      dialect: 'sqlite',
      storage: databasePath,
    };
  } catch (error) {
    setReadyState(0);
    console.error(`[db] SQLite connection failed: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
module.exports.sequelize = sequelize;
module.exports.Sequelize = Sequelize;
module.exports.databasePath = databasePath;

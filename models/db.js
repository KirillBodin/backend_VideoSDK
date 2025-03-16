const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/mydb";

// Подключаемся к PostgreSQL через Render
const sequelize = new Sequelize(DATABASE_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Нужно для Render
    },
  },
  logging: false, // Отключаем логи SQL
});

module.exports = sequelize;

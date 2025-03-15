const { Sequelize } = require("sequelize");

// Подключаемся к PostgreSQL через Render
const sequelize = new Sequelize(process.env.DATABASE_URL, {
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

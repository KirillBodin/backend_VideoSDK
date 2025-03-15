const { Sequelize } = require("sequelize");

// Создаем подключение к PostgreSQL
const sequelize = new Sequelize("videosdk_db", "postgres", "mynewpassword", {
  host: "localhost",
  dialect: "postgres",
  logging: false, // Убираем логи SQL-запросов (можно включить для отладки)
});

module.exports = sequelize;

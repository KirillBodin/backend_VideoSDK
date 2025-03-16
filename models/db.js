const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://videosdk_db_user:iiu5vDshdBNSIvKNFmCGIjH0FFlQOwC6@dpg-cvas2oaj1k6c7390q660-a.oregon-postgres.render.com/videosdk_db";

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

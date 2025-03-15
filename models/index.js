const sequelize = require("./db"); // Подключаем Sequelize
const User = require("./User");
const School = require("./School");
const ClassMeeting = require("./ClassMeeting"); // Импортируем модель

// 🔹 Определяем связи между таблицами
User.belongsTo(School, { foreignKey: "schoolId", onDelete: "CASCADE" });
School.hasMany(User, { foreignKey: "schoolId" });

ClassMeeting.belongsTo(User, { foreignKey: "teacherId", onDelete: "CASCADE" }); // Урок принадлежит учителю
User.hasMany(ClassMeeting, { foreignKey: "teacherId" }); // Учитель может иметь много уроков

const initDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Подключение к БД успешно!");

    await sequelize.sync({ alter: true }); // Синхронизация с базой данных
    console.log("✅ База данных синхронизирована!");
  } catch (error) {
    console.error("❌ Ошибка подключения:", error);
  }
};

module.exports = { sequelize, initDB, User, School, ClassMeeting };

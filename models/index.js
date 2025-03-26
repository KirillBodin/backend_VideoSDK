import sequelize from "./db.js";
import User from "./User.js";
import ClassMeeting from "./ClassMeeting.js";
import Student from "./Student.js";

// Админ - Учителя
User.hasMany(User, { foreignKey: "adminId", as: "teachers" });
User.belongsTo(User, { foreignKey: "adminId", as: "admin" });

// Учитель - Уроки
User.hasMany(ClassMeeting, { foreignKey: "teacherId", as: "lessons" });
ClassMeeting.belongsTo(User, { foreignKey: "teacherId", as: "teacher" });

// Учитель - Ученики
User.hasMany(Student, { foreignKey: "teacherId", as: "students" });
Student.belongsTo(User, { foreignKey: "teacherId", as: "teacher" });

// М:N Связь — Уроки и Ученики
ClassMeeting.belongsToMany(Student, {
  through: "ClassStudent",
  foreignKey: "classId",
  otherKey: "studentId",
  as: "students",
  onDelete: "CASCADE",
});

Student.belongsToMany(ClassMeeting, {
  through: "ClassStudent",
  foreignKey: "studentId",
  otherKey: "classId",
  as: "classes",
  onDelete: "CASCADE",
});

// Инициализация БД
const initDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Подключение к БД успешно!");

    await sequelize.sync({ alter: true });
    console.log("✅ База данных синхронизирована!");
  } catch (error) {
    console.error("❌ Ошибка подключения:", error);
  }
};

export { sequelize, initDB, User, ClassMeeting, Student };

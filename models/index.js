import sequelize from "./db.js";
import User from "./User.js";
import ClassMeeting from "./ClassMeeting.js";
import Student from "./Student.js";
import StudentTeacher from "./StudentTeacher.js";
import ClassStudent from "./ClassStudent.js";


User.hasMany(User, { foreignKey: "adminId", as: "teachers" });
User.belongsTo(User, { foreignKey: "adminId", as: "admin" });


User.hasMany(ClassMeeting, { foreignKey: "teacherId", as: "lessons" });
ClassMeeting.belongsTo(User, { foreignKey: "teacherId", as: "teacher" });


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


User.belongsToMany(Student, {
  through: "StudentTeacher",
  foreignKey: "teacherId",
  otherKey: "studentId",
  as: "students",
  onDelete: "CASCADE",
});

Student.belongsToMany(User, {
  through: "StudentTeacher",
  foreignKey: "studentId",
  otherKey: "teacherId",
  as: "teachers",
  onDelete: "CASCADE",
});


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

export { sequelize, initDB, User, ClassMeeting, Student,StudentTeacher,ClassStudent  };

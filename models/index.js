const sequelize = require("./db"); 
const User = require("./User");
const ClassMeeting = require("./ClassMeeting");
const Student = require("./Student");


User.hasMany(User, { foreignKey: "adminId", as: "teachers" });
User.belongsTo(User, { foreignKey: "adminId", as: "admin" });


User.hasMany(ClassMeeting, { foreignKey: "teacherId", as: "lessons" });
ClassMeeting.belongsTo(User, { foreignKey: "teacherId", as: "teacher" });


User.hasMany(Student, { foreignKey: "teacherId", as: "students" });
Student.belongsTo(User, { foreignKey: "teacherId", as: "teacher" });


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


module.exports = { sequelize, initDB, User, ClassMeeting, Student };

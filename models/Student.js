const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const Student = sequelize.define("Student", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false, 
    references: {
      model: "Users",
      key: "id",
    },
    onDelete: "CASCADE",
  },
});

module.exports = Student;

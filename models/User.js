const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM("superadmin", "admin", "teacher"),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  schoolId: { // Привязка пользователя к школе
    type: DataTypes.INTEGER,
    allowNull: true, // Superadmin не привязан к школе
    references: {
      model: "Schools",
      key: "id",
    },
    onDelete: "CASCADE",
  }
});


module.exports = User;

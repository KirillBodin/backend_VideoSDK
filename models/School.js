const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const School = sequelize.define("School", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  }
});

module.exports = School;

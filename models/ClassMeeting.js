const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const ClassMeeting = sequelize.define("ClassMeeting", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  className: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  meetingId: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  teacherId: { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    references: {
      model: "Users", 
      key: "id",
    },
    onDelete: "CASCADE",
  }
});

module.exports = ClassMeeting;

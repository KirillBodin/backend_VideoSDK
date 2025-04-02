import { DataTypes } from "sequelize";
import sequelize from "./db.js";

const StudentTeacher = sequelize.define("StudentTeacher", {
}, {
  tableName: "StudentTeacher", 
  timestamps: false           
});

export default StudentTeacher;

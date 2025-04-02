import { DataTypes } from "sequelize";
import sequelize from "./db.js";

const ClassStudent = sequelize.define("ClassStudent", {}, {
  tableName: "ClassStudent",
  timestamps: false
});

export default ClassStudent;

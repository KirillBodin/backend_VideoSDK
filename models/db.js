import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = "postgresql://postgres:uCtubFHIINuYMIiDEbfyidGVOxDvLGng@shuttle.proxy.rlwy.net:58919/railway";

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: "postgres",
  logging: false,
});

export default sequelize;

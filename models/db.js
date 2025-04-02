import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = "postgresql://postgres:MoNAERbroaRegEwsGvvsWBdsNqMgzzlD@yamabiko.proxy.rlwy.net:55314/railway";

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: "postgres",
  logging: false,
});

export default sequelize;

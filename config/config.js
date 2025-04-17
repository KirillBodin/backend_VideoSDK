import dotenv from "dotenv";
dotenv.config();
import { Sequelize } from "sequelize";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:MoNAERbroaRegEwsGvvsWBdsNqMgzzlD@yamabiko.proxy.rlwy.net:55314/railway";

export default {
  development: {
    url: DATABASE_URL,
    dialect: "postgres",
  },
  test: {
    url: DATABASE_URL,
    dialect: "postgres",
  },
  production: {
    url: DATABASE_URL,
    dialect: "postgres",
  },
};

import "./config";
import sequelizeLogger from "sequelize-log-syntax-colors";

const CONFIG = {
  url: process.env.DATABASE_URL,
  logging: (str: string) => console.log(sequelizeLogger(str)),
  dialect: "postgres"
};

export const development = CONFIG;
export const production = CONFIG;

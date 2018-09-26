import "./util/config";
import Sequelize from "sequelize";
var sequelizeLogger: any = require("sequelize-log-syntax-colors");

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: (str: string) => console.log(sequelizeLogger(str))
});

export const ButtonPush = sequelize.define(
  "button_push",
  {
    deviceId: Sequelize.UUID,
    timestamp: Sequelize.DATE,
    count: Sequelize.INTEGER
  },
  {
    timestamps: false
  }
);

export async function setup() {
  await sequelize.sync();
}

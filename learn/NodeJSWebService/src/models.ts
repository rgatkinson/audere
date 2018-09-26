import "./util/config";
import Sequelize from "sequelize";
import { triggerAsyncId } from "async_hooks";
var sequelizeLogger: any = require("sequelize-log-syntax-colors");

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: (str: string) => console.log(sequelizeLogger(str))
});

export const ButtonPush = sequelize.define(
  "button_push",
  {
    deviceId: {
      type: Sequelize.UUID,
      allowNull: false,
      validate: {
        isUUID: 4
      }
    },
    timestamp: {
      type: Sequelize.DATE,
      allowNull: false
    },
    count: {
      type: Sequelize.INTEGER,
      allowNull: false
    }
  },
  {
    timestamps: false
  }
);

export async function setup() {
  await sequelize.sync();
}

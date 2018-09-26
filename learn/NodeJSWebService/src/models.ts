import "./util/config";
import Sequelize from "sequelize";

const sequelize = new Sequelize(process.env.DATABASE_URL);

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

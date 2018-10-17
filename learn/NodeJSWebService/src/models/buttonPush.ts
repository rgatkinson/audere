import Sequelize from "sequelize";
import { sequelize } from "./";

export const ButtonPush = sequelize.define(
  "button_push",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
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
    },
    extra: {
      type: Sequelize.TEXT,
      allowNull: true
    }
  },
  {
    timestamps: false
  }
);

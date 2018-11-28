import Sequelize from "sequelize";
import { sequelize } from "./";

interface AccessKeyAttributes {
  id?: string;
  key: string;
  valid: boolean;
}
type AccessKeyInstance = Sequelize.Instance<AccessKeyAttributes> &
  AccessKeyAttributes;

export const AccessKey = sequelize.define<
  AccessKeyInstance,
  AccessKeyAttributes
>("access_key", {
  key: {
    allowNull: false,
    type: Sequelize.STRING
  },
  valid: {
    allowNull: false,
    type: Sequelize.BOOLEAN
  }
});

import Sequelize from "sequelize";
import { sequelize } from "./";

interface VisitAttributes {
  id?: string;
  csruid: string;
  device: object;
  visit: object;
}
type VisitInstance = Sequelize.Instance<VisitAttributes> & VisitAttributes;

export const Visit = sequelize.define<VisitInstance, VisitAttributes>("visit", {
  csruid: {
    allowNull: false,
    unique: true,
    type: Sequelize.STRING
  },
  device: {
    allowNull: false,
    type: Sequelize.JSON
  },
  visit: {
    allowNull: false,
    type: Sequelize.JSON
  }
});

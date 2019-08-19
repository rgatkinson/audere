// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Model, SplitSql } from "backend-lib";
import { BarcodeAttributes, defineBarcodes } from "../models/db/fever";
import logger from "../util/logger";

export class BarcodeValidator {
  barcodeValidator: Model<BarcodeAttributes>;

  constructor(sql: SplitSql) {
    this.barcodeValidator = defineBarcodes(sql.nonPii);
  }

  async validate(req, res) {
    const { barcode } = req.params;
    const rows = await this.barcodeValidator.findAll({
      where: {
        barcode,
      },
    });

    logger.info(`validateBarcode(${barcode})`);
    switch (rows.length) {
      case 0:
        logger.info(`Returning not found for ${barcode}`);
        res.status(404).send("Not found");
        break;

      case 1: {
        logger.info(`Returning valid for ${barcode}`);
        res.status(200).send("Valid");
        break;
      }

      default:
        logger.error(`Multiple barcode entries for ${barcode}`);
        res.status(404).send("Multiple entries");
        break;
    }
  }
}

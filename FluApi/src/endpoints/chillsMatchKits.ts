// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { ChillsKits } from "../services/chills/chillsKitsService";
import { ChillsModels, defineChillsModels } from "../models/db/chills";
import { SplitSql } from "../util/sql";
import logger from "../util/logger";

interface MatchKitRequest {
  barcode: string;
  id: string;
  secret: string;
  demo?: boolean;
}

export class ChillsMatchKits {
  private readonly models: ChillsModels;
  private readonly service: ChillsKits;

  constructor(sql: SplitSql) {
    this.service = new ChillsKits(sql);
    this.models = defineChillsModels(sql);
  }

  /**
   * Matches barcodes to sent kits
   */
  public matchKit = async (req, res, next) => {
    const request = req.body as MatchKitRequest;

    const accessKey = await this.models.accessKey.findOne({
      where: { key: request.secret, valid: true },
    });

    if (accessKey == null) {
      logger.error(
        `Invalid access key in request to match barcode, ${request.secret}`
      );
      res.sendStatus(400);
      return;
    }

    // Barcodes should be 10 digits/characters
    const validBarcode = /^[\d\w]{10}$/;
    if (request.barcode == null || !validBarcode.test(request.barcode)) {
      logger.error(
        `Invalid barcode in request to match barcode, ${request.barcode}`
      );
      res.sendStatus(400);
      return;
    }

    // UUID V4
    const validIdentifier = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[4][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/i;
    if (request.id == null || !validIdentifier.test(request.id)) {
      logger.error(`Invalid id in request to match barcode, ${request.id}`);
      res.sendStatus(400);
      return;
    }

    const match = await this.service.matchKit(request.barcode, request.id);

    if (match != null) {
      res.json(match);
    } else {
      res.sendStatus(404);
    }
  };
}

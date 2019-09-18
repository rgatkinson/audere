// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  GiftcardAvailabilityResponse,
  GiftcardFailureReason,
  GiftcardRequest,
  GiftcardResponse,
} from "audere-lib/coughProtocol";
import parse from "csv-parse/lib/sync";
import { promises as fs } from "fs";
import querystring from "querystring";
import { Op } from "sequelize";
import { connectorFromSqlSecrets } from "../external/firebase";
import {
  CoughModels,
  defineCoughModels,
  GiftcardAttributes,
} from "../models/db/cough";
import { LiveConfig, Project } from "../util/liveConfig";
import { SplitSql } from "../util/sql";
import { SqlLock } from "../util/sqlLock";

const DEMO_GIFTCARD_URL = "https://www.example.com/giftcard";
const DEFAULT_RATE_LIMIT = {
  limit: 100,
  periodInSeconds: 24 * 60 * 60,
};

export type PrezzeeCsvGiftcard = {
  sku: string;
  denomination: number;
  cardNumber: string;
  pin: string;
  expiry: Date;
  theme: string;
  orderNumber: string;
  url: string;
};
type RawPrezzeeCsvGiftcard = {
  SKU: string;
  Denomination: string;
  CardNumber: string;
  PIN: string;
  Expiry: string;
  Theme: string;
  OrderNumber: string;
  Url: string;
};

enum BarcodeValidationType {
  PREFIX = "prefix",
}

type BarcodeValidation = {
  type: BarcodeValidationType;
  value: string;
};

type RateLimit = {
  limit: number;
  periodInSeconds: number;
};

export type CoughConfig = {
  rateLimit: RateLimit;
  barcodeValidations: BarcodeValidation[];
};

export class CoughGiftcardEndpoint {
  private readonly sql: SplitSql;
  private readonly models: CoughModels;
  private readonly sqlLock: SqlLock;
  private readonly getStatic?: () => string;
  private readonly liveConfig: LiveConfig<CoughConfig>;

  constructor(sql: SplitSql, getStatic?: () => string) {
    this.sql = sql;
    this.models = defineCoughModels(sql);
    this.sqlLock = new SqlLock(sql.nonPii);
    this.getStatic = getStatic;
    this.liveConfig = new LiveConfig(sql, Project.COUGH);
  }

  public importGiftcards = async (req, res) => {
    const { giftcardFile } = req.files;
    const rawGifcards = await this.getGiftcardsFromFile(giftcardFile.path);
    const prezzeeGiftcards = rawGifcards.map(convertRawGiftcard);
    const giftcards = prezzeeGiftcards.map(giftcard => ({
      ...giftcard,
      isDemo: false,
    }));
    try {
      const giftcardRecords = await this.models.giftcard.bulkCreate(giftcards);
      res.redirect(
        303,
        "coughGiftcards?" +
          querystring.stringify({
            success: `Uploaded ${giftcardRecords.length} giftcards`,
          })
      );
    } catch (e) {
      console.error(e);
      res.redirect(
        303,
        "coughGiftcards?" +
          querystring.stringify({
            error: e.message,
          })
      );
    }
  };

  public setRateLimit = async (req, res) => {
    const { limit } = req.body;
    this.liveConfig.set("rateLimit", {
      limit: parseInt(limit),
      periodInSeconds: 24 * 60 * 60,
    });
    res.redirect(
      303,
      "coughGiftcards?" +
        querystring.stringify({
          success: `Rate limit updated`,
        })
    );
  };

  public setBarcodeValidations = async (req, res) => {
    const { barcodePrefixes } = req.body;
    const barcodeValidations = barcodePrefixes
      .split("\n")
      .filter(prefix => prefix)
      .map(prefix => ({
        value: prefix.trim(),
        type: BarcodeValidationType.PREFIX,
      }));
    await this.liveConfig.set("barcodeValidations", barcodeValidations);
    res.redirect(
      303,
      "coughGiftcards?" +
        querystring.stringify({
          success: `Barcode validations updated`,
        })
    );
  };

  public importGiftcardForm = async (req, res) => {
    const { success, error } = req.query;
    await this.renderImportGiftcardForm(req, res, {
      success,
      error,
    });
  };

  private async renderImportGiftcardForm(req, res, extraParams) {
    const total = await this.models.giftcard.count();
    const unassignedByDenomination = await this.models.giftcard.count({
      where: { docId: null },
      attributes: ["denomination"],
      group: ["denomination"],
    });
    const unassigned = (unassignedByDenomination as any).reduce(
      (total, denomination) => total + parseInt(denomination.count),
      0
    );
    const rateLimit = (await this.liveConfig.get(
      "rateLimit",
      DEFAULT_RATE_LIMIT
    )).limit;
    const barcodePrefixes = (await this.liveConfig.get(
      "barcodeValidations",
      []
    ))
      .map(validation => validation.value)
      .join("\n");
    res.render("giftcardUpload.html", {
      static: this.getStatic(),
      csrf: req.csrfToken(),
      total,
      unassigned,
      unassignedByDenomination,
      rateLimit,
      barcodePrefixes,
      ...extraParams,
    });
  }

  public getGiftcard = async (
    request: GiftcardRequest
  ): Promise<GiftcardResponse> => {
    const {
      valid,
      failureReason: validationFailureReason,
    } = await this.validateGiftcardRequest(request);
    if (!valid) {
      return { failureReason: validationFailureReason };
    }
    const { giftcard, isNew, failureReason } = await this.getAndAllocateCard(
      request
    );
    if (giftcard) {
      if (request.isDemo) {
        return {
          giftcard: {
            url: DEMO_GIFTCARD_URL,
            denomination: request.denomination,
            isDemo: true,
            isNew,
          },
        };
      }
      return {
        giftcard: {
          url: giftcard.url,
          denomination: giftcard.denomination,
          isDemo: giftcard.isDemo,
          isNew,
        },
      };
    } else {
      return { failureReason };
    }
  };

  public checkGiftcardAvailability = async (
    request: GiftcardRequest
  ): Promise<GiftcardAvailabilityResponse> => {
    const {
      valid,
      failureReason: validationFailureReason,
    } = await this.validateGiftcardRequest(request);
    if (!valid) {
      return {
        giftcardAvailable: false,
        failureReason: validationFailureReason,
      };
    }
    const { giftcard, failureReason } = await this.getCard(request);
    if (giftcard) {
      return { giftcardAvailable: true };
    } else {
      return { giftcardAvailable: false, failureReason };
    }
  };

  private async validateGiftcardRequest(request: GiftcardRequest) {
    if (
      request.denomination === undefined ||
      request.docId === undefined ||
      request.barcode === undefined ||
      request.isDemo === undefined ||
      request.secret === undefined
    ) {
      throw new Error("Invalid giftcard request");
    }

    const matchingKey = await this.models.accessKey.findOne({
      where: { key: request.secret, valid: true },
    });
    if (!matchingKey) {
      throw new Error("Invalid secret");
    }

    if (!(await this.validateDocId(request.docId))) {
      return {
        valid: false,
        failureReason: GiftcardFailureReason.INVALID_DOC_ID,
      };
    }
    if (!(await this.validateBarcode(request.barcode))) {
      return {
        valid: false,
        failureReason: GiftcardFailureReason.INVALID_BARCODE,
      };
    }
    return { valid: true };
  }

  private async validateDocId(docId: string) {
    const firebase = await connectorFromSqlSecrets(this.sql)();
    const survey = await firebase
      .firestore()
      .collection("surveys")
      .doc(docId)
      .get();
    return survey.exists;
  }

  private async validateBarcode(barcode: string) {
    const prefixValidations = (await this.liveConfig.get(
      "barcodeValidations",
      []
    )).filter(validation => validation.type === BarcodeValidationType.PREFIX);
    return prefixValidations.some(prefixValidation =>
      barcode.startsWith(prefixValidation.value)
    );
  }

  private async getAndAllocateCard(request: GiftcardRequest) {
    return this.getCard(request, true);
  }

  private async getCard(
    request: GiftcardRequest,
    allocateCard: boolean = false
  ): Promise<{
    giftcard?: GiftcardAttributes;
    isNew?: boolean;
    failureReason?: GiftcardFailureReason;
  }> {
    const { docId, barcode, denomination, secret } = request;

    const existingCards = await this.models.giftcard.findAll({
      where: {
        [Op.or]: [{ docId }, { barcode }],
      },
    });
    if (existingCards.length > 0) {
      return {
        giftcard: existingCards[0],
        isNew: false,
      };
    }

    const rateLimit = await this.liveConfig.get(
      "rateLimit",
      DEFAULT_RATE_LIMIT
    );
    const cardsIssued = await this.countCardsIssued(rateLimit.periodInSeconds);
    if (cardsIssued >= rateLimit.limit) {
      return { failureReason: GiftcardFailureReason.CARDS_EXHAUSTED };
    }

    let giftcard;
    if (allocateCard) {
      giftcard = await this.sqlLock.runWhenFree("coughGiftcard", () =>
        this.getNewCard(request, allocateCard)
      )();
    } else {
      // No need to lock if we're just checking availability
      giftcard = await this.getNewCard(request, allocateCard);
    }
    if (giftcard) {
      return { giftcard, isNew: true };
    } else {
      return { failureReason: GiftcardFailureReason.CARDS_EXHAUSTED };
    }
  }

  private async getNewCard(
    request: GiftcardRequest,
    allocateCard: boolean
  ): Promise<GiftcardAttributes> {
    const newGiftcard = await this.models.giftcard.findOne({
      where: {
        denomination: {
          [Op.gte]: request.denomination,
        },
        docId: null,
        isDemo: request.isDemo,
      },
      order: [["denomination", "ASC"]],
    });
    if (!newGiftcard) {
      return;
    }
    if (allocateCard) {
      newGiftcard.docId = request.docId;
      newGiftcard.barcode = request.barcode;
      newGiftcard.allocatedAt = new Date();
      await newGiftcard.save();
    }
    return newGiftcard;
  }

  private async getGiftcardsFromFile(
    filePath: string
  ): Promise<RawPrezzeeCsvGiftcard[]> {
    const file = await fs.readFile(filePath, "utf-8");
    return parse(file, {
      columns: true,
      skip_empty_lines: true,
    });
  }

  private async countCardsIssued(seconds: number): Promise<number> {
    const startDate = new Date(new Date().getTime() - seconds * 1000);
    return await this.models.giftcard.count({
      where: {
        docId: { [Op.ne]: null },
        allocatedAt: { [Op.gt]: startDate },
      },
    });
  }
}

function convertRawGiftcard(
  giftcard: RawPrezzeeCsvGiftcard
): PrezzeeCsvGiftcard {
  return {
    sku: giftcard.SKU,
    denomination: parseFloat(giftcard.Denomination),
    cardNumber: giftcard.CardNumber,
    pin: giftcard.PIN,
    expiry: new Date(giftcard.Expiry),
    theme: giftcard.Theme,
    orderNumber: giftcard.OrderNumber,
    url: giftcard.Url,
  };
}

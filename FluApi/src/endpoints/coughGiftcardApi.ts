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
import { Op } from "sequelize";
import { connectorFromSqlSecrets } from "../external/firebase";
import {
  CoughModels,
  defineCoughModels,
  GiftcardAttributes,
} from "../models/db/cough";
import { SecretConfig } from "../util/secretsConfig";
import { SplitSql } from "../util/sql";
import { SqlLock } from "../util/sqlLock";

const DEMO_GIFTCARD_URL = "https://www.example.com/giftcard";

export class CoughGiftcardEndpoint {
  private readonly sql: SplitSql;
  private readonly models: CoughModels;
  private readonly secrets: SecretConfig;
  private readonly sqlLock: SqlLock;

  constructor(sql: SplitSql) {
    this.sql = sql;
    this.secrets = new SecretConfig(sql);
    this.models = defineCoughModels(sql);
    this.sqlLock = new SqlLock(sql.nonPii);
  }

  public getGiftcard = async (
    request: GiftcardRequest
  ): Promise<GiftcardResponse> => {
    if (request.isDemo) {
      return {
        giftcard: {
          url: DEMO_GIFTCARD_URL,
          denomination: request.denomination,
          isDemo: true,
          isNew: true,
        },
      };
    }
    const {
      valid,
      failureReason: validationFailureReason,
    } = await this.validateGiftcardRequest(request);
    if (!valid) {
      return { failureReason: validationFailureReason };
    }
    const { giftcard, isNew, failureReason } = await this.getCard(
      request,
      true
    );
    if (giftcard) {
      return {
        giftcard: {
          url: giftcard.url,
          denomination: giftcard.denomination,
          isDemo: false,
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
    const { giftcard, failureReason } = await this.getCard(request, true);
    if (giftcard) {
      return { giftcardAvailable: true };
    } else {
      return { giftcardAvailable: false, failureReason };
    }
  };

  private async validateGiftcardRequest(request: GiftcardRequest) {
    if (
      request.denomination === undefined ||
      request.installationId === undefined ||
      request.barcode === undefined ||
      request.isDemo === undefined ||
      request.secret === undefined
    ) {
      throw new Error("Invalid giftcard request");
    }

    const giftcardSecret = await this.secrets.getOrCreate(
      "COUGH_GIFTCARD_SECRET"
    );
    if (request.secret !== giftcardSecret) {
      throw new Error("Invalid secret");
    }
    if (!(await this.validateInstallationId(request.installationId))) {
      return {
        valid: false,
        failureReason: GiftcardFailureReason.INVALID_INSTALLATION_ID,
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

  private async validateInstallationId(installationId: string) {
    const firebase = await connectorFromSqlSecrets(this.sql)();
    const surveys = firebase.firestore().collection("surveys");
    const matchingSurveys = await surveys
      .where("device.installation", "==", installationId)
      .get();
    return !matchingSurveys.empty;
  }

  private async validateBarcode(barcode: string) {
    //TODO(ram): validate barcode against list of valid barcodes
    return true;
  }

  private async getCard(
    request: GiftcardRequest,
    allocateCard: boolean
  ): Promise<{
    giftcard?: GiftcardAttributes;
    isNew?: boolean;
    failureReason?: GiftcardFailureReason;
  }> {
    const { installationId, barcode, denomination, isDemo, secret } = request;

    const existingCards = await this.models.giftcard.findAll({
      where: {
        [Op.or]: [{ installationId }, { barcode }],
      },
    });
    if (existingCards.length > 0) {
      return {
        giftcard: existingCards[0],
        isNew: false,
      };
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
        installationId: null,
      },
      order: [["denomination", "ASC"]],
    });
    if (!newGiftcard) {
      return;
    }
    if (allocateCard) {
      newGiftcard.installationId = request.installationId;
      newGiftcard.barcode = request.barcode;
      await newGiftcard.save();
    }
    return newGiftcard;
  }
}

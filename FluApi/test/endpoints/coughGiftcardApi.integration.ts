// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Op } from "sequelize";
import { GiftcardFailureReason } from "audere-lib/coughProtocol";
import { createPublicApp } from "../../src/app";
import {
  defineCoughModels,
  CoughModels,
  GiftcardAttributes,
} from "../../src/models/db/cough";
import { LiveConfig, Project } from "../../src/util/liveConfig";
import { createSplitSql } from "../../src/util/sql";
import { createTestSessionStore } from "../../src/endpoints/webPortal/endpoint";
import {
  CoughGiftcardEndpoint,
  CoughConfig,
  BarcodeValidationType,
} from "../../src/endpoints/coughGiftcardApi";

const TEST_ACCESS_KEY = "this is super secret";
const INVALID_ACCESS_KEY = "this is not super secret";
const TEST_BARCODE = "12341234";
const INVALID_BARCODE = "56785678";

describe("Cough Giftcard API", () => {
  let sql;
  let publicApp;
  let coughModels: CoughModels;
  let api: CoughGiftcardEndpoint;
  let docIdIsValid = true;
  let accessKey;
  let liveConfig: LiveConfig<CoughConfig>;
  let barcodeValidations;

  beforeAll(async done => {
    sql = createSplitSql();
    const sessionStore = createTestSessionStore(sql);
    api = new CoughGiftcardEndpoint(sql);
    coughModels = defineCoughModels(sql);
    accessKey = await coughModels.accessKey.create({
      key: TEST_ACCESS_KEY,
      valid: true,
    });
    liveConfig = new LiveConfig(sql, Project.COUGH);
    barcodeValidations = await liveConfig.get("barcodeValidations", []);
    await liveConfig.set(
      "barcodeValidations",
      barcodeValidations.concat([
        {
          type: BarcodeValidationType.PREFIX,
          value: TEST_BARCODE,
        },
      ])
    );

    // Bleh
    (api as any).validateDocId = () => Promise.resolve(docIdIsValid);

    done();
  });

  afterAll(async done => {
    await accessKey.destroy();
    await liveConfig.set("barcodeValidations", barcodeValidations);
    done();
  });

  beforeEach(() => {
    docIdIsValid = true;
  });

  afterEach(async done => {
    await coughModels.giftcard.destroy({ where: {} });
    done();
  });

  describe("getGiftcard", () => {
    it("returns a giftcard", async () => {
      await coughModels.giftcard.create(giftcard("1"));
      const response = await api.getGiftcard({
        docId: "1234",
        barcode: TEST_BARCODE,
        denomination: 50,
        isDemo: false,
        secret: TEST_ACCESS_KEY,
      });
      expect(response.giftcard).toBeDefined();
      expect(response.giftcard.denomination).toBe(50);
      expect(response.giftcard.isDemo).toBe(false);
      expect(response.giftcard.isNew).toBe(true);
    });

    it("assigns a docId to an assigned gift card", async () => {
      const giftcard1 = giftcard("1");
      const giftcard2 = giftcard("2");
      await coughModels.giftcard.create(giftcard1);
      await coughModels.giftcard.create(giftcard2);
      const response = await api.getGiftcard({
        docId: "1234",
        barcode: TEST_BARCODE,
        denomination: 50,
        isDemo: false,
        secret: TEST_ACCESS_KEY,
      });

      const assignedGiftcard = await coughModels.giftcard.findOne({
        where: { url: response.giftcard.url },
      });
      const otherGiftcard = await coughModels.giftcard.findOne({
        where: {
          url: { [Op.ne]: response.giftcard.url },
        },
      });

      expect(assignedGiftcard.docId).toBe("1234");
      expect(otherGiftcard.docId).toBeNull();
    });

    it("does not return a giftcard when none are available", async () => {
      const response = await api.getGiftcard({
        docId: "1234",
        barcode: TEST_BARCODE,
        denomination: 50,
        isDemo: false,
        secret: TEST_ACCESS_KEY,
      });
      expect(response.giftcard).toBeUndefined();
      expect(response.failureReason).toBe(
        GiftcardFailureReason.CARDS_EXHAUSTED
      );
    });

    it("does not return a giftcard for a higher denomination than available", async () => {
      await coughModels.giftcard.create(giftcard("1"));
      const response = await api.getGiftcard({
        docId: "1234",
        barcode: TEST_BARCODE,
        denomination: 51,
        isDemo: false,
        secret: TEST_ACCESS_KEY,
      });
      expect(response.giftcard).toBeUndefined();
      expect(response.failureReason).toBe(
        GiftcardFailureReason.CARDS_EXHAUSTED
      );
    });

    it("returns a giftcard for a higher denomination than requested", async () => {
      await coughModels.giftcard.create(giftcard("1"));
      const response = await api.getGiftcard({
        docId: "1234",
        barcode: TEST_BARCODE,
        denomination: 49,
        isDemo: false,
        secret: TEST_ACCESS_KEY,
      });
      expect(response.giftcard).toBeDefined();
      expect(response.giftcard.denomination).toBe(50);
      expect(response.giftcard.isDemo).toBe(false);
      expect(response.giftcard.isNew).toBe(true);
    });

    it("does not return a giftcard if the barcode is invalid", async () => {
      await coughModels.giftcard.create(giftcard("1"));
      const response = await api.getGiftcard({
        docId: "1234",
        barcode: INVALID_BARCODE,
        denomination: 50,
        isDemo: false,
        secret: TEST_ACCESS_KEY,
      });
      expect(response.giftcard).toBeUndefined();
      expect(response.failureReason).toBe(
        GiftcardFailureReason.INVALID_BARCODE
      );
    });

    it("does not return a giftcard if the docId is invalid", async () => {
      await coughModels.giftcard.create(giftcard("1"));
      docIdIsValid = false;
      const response = await api.getGiftcard({
        docId: "1234",
        barcode: TEST_BARCODE,
        denomination: 50,
        isDemo: false,
        secret: TEST_ACCESS_KEY,
      });
      expect(response.giftcard).toBeUndefined();
      expect(response.failureReason).toBe(GiftcardFailureReason.INVALID_DOC_ID);
    });

    it("throws an exception for a bad secret", async () => {
      await coughModels.giftcard.create(giftcard("1"));
      expect(
        api.getGiftcard({
          docId: "1234",
          barcode: TEST_BARCODE,
          denomination: 50,
          isDemo: false,
          secret: INVALID_ACCESS_KEY,
        })
      ).rejects.toBeDefined();
    });

    it("returns a demo giftcard", async () => {
      await coughModels.giftcard.create(giftcard("1", true));
      const response = await api.getGiftcard({
        docId: "1234",
        barcode: TEST_BARCODE,
        denomination: 50,
        isDemo: true,
        secret: TEST_ACCESS_KEY,
      });
      expect(response.giftcard).toBeDefined();
      expect(response.giftcard.denomination).toBe(50);
      expect(response.giftcard.isDemo).toBe(true);
      expect(response.giftcard.isNew).toBe(true);
    });

    it("Does not return a demo giftcard as a non-demo card", async () => {
      await coughModels.giftcard.create(giftcard("1", true));
      const response = await api.getGiftcard({
        docId: "1234",
        barcode: TEST_BARCODE,
        denomination: 50,
        isDemo: false,
        secret: TEST_ACCESS_KEY,
      });
      expect(response.giftcard).toBeUndefined();
    });

    it("Does not return a non-demo giftcard as a demo card", async () => {
      await coughModels.giftcard.create(giftcard("1"));
      const response = await api.getGiftcard({
        docId: "1234",
        barcode: TEST_BARCODE,
        denomination: 50,
        isDemo: true,
        secret: TEST_ACCESS_KEY,
      });
      expect(response.giftcard).toBeUndefined();
    });
  });
});

function giftcard(urlSuffix: string, isDemo = false): GiftcardAttributes {
  return {
    cardNumber: "1234123412341324",
    pin: "1234",
    denomination: "50.00",
    expiry: new Date("December 31, 2050"),
    isDemo,
    orderNumber: "7",
    sku: "sku",
    theme: "blue",
    url: "https://www.example.com/giftcard" + urlSuffix,
  };
}

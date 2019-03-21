// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import request from "supertest";
import { createPublicApp, createInternalApp } from "../../src/app";
import {
  AddressInfo,
  DocumentType,
  VisitInfo,
  AddressInfoUse
} from "audere-lib/snifflesProtocol";
import { VisitInfoBuilder } from "../visitInfoBuilder";
import rawResponse from "../resources/geocodingRawResponse.json";

import nock = require("nock");
import { createSplitSql } from "../../src/util/sql";
import { SecretConfig } from "../../src/util/secretsConfig";
import { getGeocodingConfig } from "../../src/util/geocodingConfig";
import { getHutchConfig } from "../../src/util/hutchUploadConfig";
import {
  defineSnifflesModels,
  VisitNonPIIInstance,
  VisitPIIInstance
} from "../../src/models/db/sniffles";
import { defineHutchUpload } from "../../src/models/db/hutchUpload";
import { createTestSessionStore } from "../../src/endpoints/webPortal/endpoint";

describe("export controller", () => {
  let sql;
  let internalApp;
  let publicApp;
  let models;
  let hutchUpload;
  let accessKey;
  let geocodingConfig;
  let hutchConfig;

  beforeAll(async done => {
    sql = createSplitSql();
    const sessionStore = createTestSessionStore(sql);
    const config = { sql, sessionStore };
    publicApp = await createPublicApp(config);
    internalApp = createInternalApp(config);
    models = defineSnifflesModels(sql);
    hutchUpload = defineHutchUpload(sql);
    accessKey = await models.accessKey.create({
      key: "accesskey1",
      valid: true
    });
    const secrets = new SecretConfig(sql);
    geocodingConfig = await getGeocodingConfig(secrets);
    hutchConfig = await getHutchConfig(secrets);
    done();
  });

  afterAll(async done => {
    await accessKey.destroy();
    await sql.close();
    done();
  });

  async function destroyVisits(
    instances: (VisitNonPIIInstance | VisitPIIInstance)[]
  ): Promise<void[]> {
    return Promise.all(instances.map(i => i.destroy()));
  }

  async function createVisit(
    csruid: string,
    visit: VisitInfo
  ): Promise<[VisitNonPIIInstance, VisitPIIInstance]> {
    const contents = {
      schemaId: 1,
      csruid: csruid,
      documentType: DocumentType.Visit,
      device: {
        installation: "uuid",
        clientVersion: "1.2.3-testing",
        deviceName: "My Phone",
        yearClass: "2020",
        idiomText: "handset",
        platform: "iOS"
      },
      visit: visit
    };

    await request(publicApp)
      .put(`/api/documents/${accessKey.key}/${csruid}`)
      .send(contents)
      .expect(200);

    const visitPii = await models.visitPii.findOne({
      where: { csruid: csruid }
    });

    const visitNonPii = await models.visitNonPii.findOne({
      where: { csruid: csruid }
    });

    return [visitNonPii, visitPii];
  }

  describe("get pending encounters", () => {
    it("should retrieve only completed vists", async () => {
      await request(internalApp)
        .get("/api/export/getEncounters")
        .expect(200)
        .expect(res => expect(res.body.encounters).toHaveLength(0));

      const visitId1 = "ABC123-_".repeat(8);
      const visit1 = new VisitInfoBuilder().build();
      const c1 = await createVisit(visitId1, visit1);

      const visitId2 = "LMN789-_".repeat(8);
      const visit2 = new VisitInfoBuilder().withComplete(false).build();
      const c2 = await createVisit(visitId2, visit2);

      try {
        await request(internalApp)
          .get("/api/export/getEncounters")
          .expect(200)
          .expect(bodyOnlyContainsFirstVisit);

        function bodyOnlyContainsFirstVisit(res) {
          expect(res.body.encounters).toHaveLength(1);
          if (!visitId1.startsWith(res.body.encounters[0].id)) {
            throw new Error(
              "Encounter id is not a prefix of the correct csruid, this is " +
                "not the correct record"
            );
          }
        }
      } finally {
        await destroyVisits([...c1, ...c2]);
      }
    });

    it("should not return encounters that have already been uploaded", async () => {
      const visitId1 = "ABC123-_".repeat(8);
      const visit1 = new VisitInfoBuilder().build();
      const c1 = await createVisit(visitId1, visit1);

      try {
        await hutchUpload.bulkCreate([{ visitId: +c1[0].id }]);

        await request(internalApp)
          .get("/api/export/getEncounters")
          .expect(200)
          .expect(res => expect(res.body.encounters).toHaveLength(0));
      } finally {
        await destroyVisits(c1);
      }
    });
  });

  describe("send encounters", () => {
    it("should update the upload log based on response status from the Hutch endpoint", async () => {
      const visitId1 = "ABC123-_".repeat(8);
      const visit1 = new VisitInfoBuilder().build();
      const c = await createVisit(visitId1, visit1);

      try {
        nock(hutchConfig.baseUrl)
          .post(new RegExp(".*"), new RegExp(".*ABC123.*"))
          .reply(200);

        const response = await request(internalApp)
          .get("/api/export/sendEncounters")
          .expect(200);

        expect(response.body.sent).toHaveLength(1);
        expect(response.body.sent[0]).toBe(c[0].id);

        const uploaded = await hutchUpload.findAll({
          where: {
            visitId: c[0].id
          }
        });

        expect(uploaded.length).toBe(1);
        expect(uploaded[0].visitId).toBe(+c[0].id);
      } finally {
        await destroyVisits(c);
      }
    });

    it("should not require communication with external services when there are no pending records", async () => {
      const response = await request(internalApp)
        .get("/api/export/sendEncounters")
        .expect(200);

      expect(response.body.sent.length).toBe(0);
    });

    it("should not retrieve demo records", async () => {
      const visitId1 = "TYU123-_".repeat(8);
      const visit1 = new VisitInfoBuilder().withDemoMode().build();
      const c = await createVisit(visitId1, visit1);

      const response = await request(internalApp)
        .get("/api/export/sendEncounters")
        .expect(200);

      expect(response.body.sent.length).toBe(0);
    });

    it("should error if geocoding fails", async () => {
      const address: AddressInfo = {
        use: AddressInfoUse.Home,
        line: ["4059 Mt Lee Dr."],
        city: "Hollywood",
        state: "CA",
        postalCode: "90086",
        country: "US"
      };

      const visitId1 = "ABC123-_".repeat(8);
      const visit1 = new VisitInfoBuilder().withAddress(address).build();
      const c1 = await createVisit(visitId1, visit1);

      try {
        nock(geocodingConfig.baseUrl)
          .get(new RegExp(".*"))
          .reply(400);

        await request(internalApp)
          .get("/api/export/sendEncounters")
          .expect(500);
      } finally {
        await destroyVisits(c1);
      }
    });

    it("should batch data sent to the geocoding service", async () => {
      const seq = Array.from(Array(10).keys());
      const visits = seq.map(id => {
        const address: AddressInfo = {
          use: AddressInfoUse.Home,
          line: [id + " Broadway E"],
          city: "Seattle",
          state: "WA",
          postalCode: "98102",
          country: "US"
        };

        const visitInfo = new VisitInfoBuilder().withAddress(address).build();

        return createVisit(
          "HIJ0" + ("0" + id).slice(-2) + "-_".repeat(8),
          visitInfo
        );
      });

      const c = await Promise.all(visits);

      try {
        nock(geocodingConfig.baseUrl)
          .post(new RegExp(".*"))
          .reply(200, rawResponse);

        nock(hutchConfig.baseUrl)
          .post(new RegExp(".*"))
          .times(10)
          .reply(200);

        await request(internalApp)
          .get("/api/export/sendEncounters")
          .expect(200);
      } finally {
        await destroyVisits([...c[0], ...c[1]]);
      }
    });
  });
});

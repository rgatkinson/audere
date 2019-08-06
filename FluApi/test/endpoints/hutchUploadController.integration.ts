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
  AddressInfoUse,
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
  VisitPIIInstance,
} from "../../src/models/db/sniffles";
import { defineHutchUpload } from "../../src/models/db/hutchUpload";
import { createTestSessionStore } from "../../src/endpoints/webPortal/endpoint";
import {
  defineFeverModels,
  FeverModels,
  SurveyInstance,
} from "../../src/models/db/fever";
import { SurveyDocumentBuilder } from "../surveyDocumentBuilder";
import {
  PIIInfo,
  SurveyNonPIIDbInfo,
  SurveyDocument,
} from "audere-lib/feverProtocol";
import { Encounter } from "audere-lib/hutchProtocol";

describe("export controller", () => {
  let sql;
  let internalApp;
  let publicApp;
  let feverModels: FeverModels;
  let snifflesModels;
  let hutchUpload;
  let feverAccessKey;
  let snifflesAccessKey;
  let geocodingConfig;
  let hutchConfig;

  beforeAll(async done => {
    sql = createSplitSql();
    const sessionStore = createTestSessionStore(sql);
    const config = { sql, sessionStore };
    publicApp = await createPublicApp(config);
    internalApp = createInternalApp(config);
    feverModels = defineFeverModels(sql);
    snifflesModels = defineSnifflesModels(sql);
    hutchUpload = defineHutchUpload(sql);
    feverAccessKey = await feverModels.accessKey.create({
      key: "accesskey1",
      valid: true,
    });
    snifflesAccessKey = await snifflesModels.accessKey.create({
      key: "accesskey1",
      valid: true,
    });

    const secrets = new SecretConfig(sql);
    geocodingConfig = await getGeocodingConfig(secrets);
    hutchConfig = await getHutchConfig(secrets);
    done();
  });

  beforeEach(async () => {
    await cleanupFever();
    await cleanupSniffles();
  });

  afterAll(async done => {
    await feverAccessKey.destroy();
    await snifflesAccessKey.destroy();
    await cleanupFever();
    await cleanupSniffles();
    await sql.close();
    done();
  });

  async function cleanupFever() {
    await feverModels.surveyNonPii.destroy({ where: {} });
    await feverModels.surveyPii.destroy({ where: {} });
    await feverModels.followUpSurveys.destroy({ where: {} });
  }

  async function cleanupSniffles() {
    await snifflesModels.visitPii.destroy({ where: {} });
    await snifflesModels.visitNonPii.destroy({ where: {} });
  }

  async function createSurvey(
    survey: SurveyDocument
  ): Promise<[SurveyInstance<SurveyNonPIIDbInfo>, SurveyInstance<PIIInfo>]> {
    await request(publicApp)
      .put(`/api/fever/documents/${feverAccessKey.key}/${survey.csruid}`)
      .send(survey)
      .expect(200);

    const surveyPii = await feverModels.surveyPii.findOne({
      where: { csruid: survey.csruid },
    });

    const surveyNonPii = await feverModels.surveyNonPii.findOne({
      where: { csruid: survey.csruid },
    });

    return [surveyNonPii, surveyPii];
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
        platform: "iOS",
      },
      visit: visit,
    };

    await request(publicApp)
      .put(`/api/documents/${snifflesAccessKey.key}/${csruid}`)
      .send(contents)
      .expect(200);

    const visitPii = await snifflesModels.visitPii.findOne({
      where: { csruid: csruid },
    });

    const visitNonPii = await snifflesModels.visitNonPii.findOne({
      where: { csruid: csruid },
    });

    return [visitNonPii, visitPii];
  }

  describe("get pending encounters", () => {
    it("should retrieve completed vists and surveys", async () => {
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

      const surveyId1 = "1A2B3C-_".repeat(8);
      const survey1 = new SurveyDocumentBuilder(surveyId1).build();
      const c3 = await createSurvey(survey1);

      const surveyId2 = "Z9Y8X7-_".repeat(8);
      const survey2 = new SurveyDocumentBuilder(surveyId2)
        .withSamples([])
        .build();
      const c4 = await createSurvey(survey2);

      const surveyId3 = "A0B0C0-_".repeat(8);
      const survey3 = new SurveyDocumentBuilder(surveyId3)
        .withDemoMode()
        .build();
      const c5 = await createSurvey(survey3);

      await request(internalApp)
        .get("/api/export/getEncounters")
        .expect(200)
        .expect(bodyOnlyContainsFirstVisitAndSurvey);

      function bodyOnlyContainsFirstVisitAndSurvey(res) {
        expect(res.body.encounters).toHaveLength(2);
        const encounters = <Encounter[]>res.body.encounters;

        if (!encounters.some(e => visitId1.startsWith(e.id))) {
          throw new Error(
            "Encounter id is not a prefix of the correct csruid, no record " +
              "matches the valid visit"
          );
        }

        if (!encounters.some(e => surveyId1.startsWith(e.id))) {
          throw new Error(
            "Encounter id is not a prefix of the correct csruid, no record " +
              "matches the valid survey"
          );
        }
      }
    });

    it("should not return encounters that have already been uploaded", async () => {
      const visitId1 = "ABC123-_".repeat(8);
      const visit1 = new VisitInfoBuilder().build();
      const c1 = await createVisit(visitId1, visit1);

      const surveyId1 = "DEF666-_".repeat(8);
      const survey1 = new SurveyDocumentBuilder(surveyId1).build();
      const c2 = await createSurvey(survey1);

      await hutchUpload.bulkCreate([
        { visitId: +c1[0].id },
        { surveyId: +c2[0].id },
      ]);

      await request(internalApp)
        .get("/api/export/getEncounters")
        .expect(200)
        .expect(res => expect(res.body.encounters).toHaveLength(0));
    });

    it("should include follow-up survey data if present", async () => {
      jest.setTimeout(10000000);
      const surveyId1 = "DEFJAM-_".repeat(8);
      const survey1 = new SurveyDocumentBuilder(surveyId1)
        .withEmail("surveytaker@surveymonkey.com")
        .build();
      const c = await createSurvey(survey1);

      await feverModels.followUpSurveys.create({
        email: "surveytaker@surveymonkey.com",
        survey: {
          record_id: 1,
          email: "surveytaker@surveymonkey.com",
          daily_activity: 1,
          medications: 2,
          care___1: 0,
          care___2: 1,
          care___3: 0,
          care___4: 1,
          care___5: 0,
          care___6: 1,
          care___7: 0,
          care___8: 0,
          care_other: undefined,
          found_study: 3,
        },
      });

      await request(internalApp)
        .get("/api/export/getEncounters")
        .expect(200)
        .expect(res => {
          expect(res.body.encounters).toHaveLength(1);

          const dailyActivity = res.body.encounters[0].responses.find(
            r => r.question.token === "daily_activity"
          );
          expect(dailyActivity).not.toBeNull();

          const medications = res.body.encounters[0].responses.find(
            r => r.question.token === "medications"
          );
          expect(medications).not.toBeNull();

          const care = res.body.encounters[0].responses.find(
            r => r.question.token === "care"
          );
          expect(care).not.toBeNull();

          const foundStudy = res.body.encounters[0].responses.find(
            r => r.question.token === "care"
          );
          expect(foundStudy).not.toBeNull();
        });
    });
  });

  describe("send encounters", () => {
    it("should update the upload log based on response status from the Hutch endpoint", async () => {
      const visitId1 = "ABC123-_".repeat(8);
      const visit1 = new VisitInfoBuilder().build();
      const c = await createVisit(visitId1, visit1);

      nock(hutchConfig.baseUrl)
        .post(new RegExp(".*"), new RegExp(".*ABC123.*"))
        .reply(200);

      const response = await request(internalApp)
        .get("/api/export/sendEncounters")
        .expect(200);

      const uploaded = await hutchUpload.findAll({
        where: {
          visitId: c[0].id,
        },
      });

      expect(uploaded.length).toBe(1);
      expect(uploaded[0].visitId).toBe(+c[0].id);
    });

    it("should not require communication with external services when there are no pending records", async () => {
      const response = await request(internalApp)
        .get("/api/export/sendEncounters")
        .expect(200);
    });

    it("should not retrieve demo records", async () => {
      const visitId1 = "TYU123-_".repeat(8);
      const visit1 = new VisitInfoBuilder().withDemoMode().build();
      const c = await createVisit(visitId1, visit1);

      const response = await request(internalApp)
        .get("/api/export/sendEncounters")
        .expect(200);
    });

    it("should error if geocoding fails", async () => {
      const address: AddressInfo = {
        use: AddressInfoUse.Home,
        line: ["4059 Mt Lee Dr."],
        city: "Hollywood",
        state: "CA",
        postalCode: "90086",
        country: "US",
      };

      const visitId1 = "ABC123-_".repeat(8);
      const visit1 = new VisitInfoBuilder().withAddress(address).build();
      const c1 = await createVisit(visitId1, visit1);

      nock(geocodingConfig.baseUrl)
        .get(new RegExp(".*"))
        .reply(400);

      await request(internalApp)
        .get("/api/export/sendEncounters")
        .expect(500);
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
          country: "US",
        };

        const visitInfo = new VisitInfoBuilder().withAddress(address).build();

        return createVisit(
          "HIJ0" + ("0" + id).slice(-2) + "-_".repeat(8),
          visitInfo
        );
      });

      const c = await Promise.all(visits);

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
    });
  });
});

// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Op } from "sequelize";
import {
  EncounterDetailsService,
  Release,
} from "../../src/services/encounterDetailsService";
import {
  defineSnifflesModels,
  SnifflesModels,
} from "../../src/models/db/sniffles";
import { createSplitSql, SplitSql } from "../../src/util/sql";
import { defineHutchUpload } from "../../src/models/db/hutchUpload";
import {
  documentContentsNonPII,
  documentContentsPII,
  BED_ASSIGNMENT_RESPONSE_ITEM,
  PII_RESPONSE_ITEM,
} from "../util/sample_data";
import { FeverModels, defineFeverModels } from "../../src/models/db/fever";
import _ from "lodash";
import moment from "moment";
import sequelize = require("sequelize");
import { surveyNonPIIInDb, surveyPIIInDb } from "../endpoints/feverSampleData";
import { EventInfoKind, TelecomInfoSystem } from "audere-lib/feverProtocol";

describe("encounterDetailsService", () => {
  let encounterDetails: EncounterDetailsService;
  let snifflesModels: SnifflesModels;
  let feverModels: FeverModels;
  let splitSql: SplitSql;

  beforeAll(async done => {
    splitSql = createSplitSql();
    feverModels = defineFeverModels(splitSql);
    snifflesModels = defineSnifflesModels(splitSql);
    encounterDetails = new EncounterDetailsService(
      feverModels,
      snifflesModels,
      defineHutchUpload(splitSql)
    );
    await cleanupSniffles();
    await cleanupFever();
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

  describe("retrieve visits", () => {
    beforeEach(async () => {
      await cleanupSniffles();
    });

    it("Returns visits that are complete and have a sample", async () => {
      const docNonPII = documentContentsNonPII("fakecsruid1");
      docNonPII.visit = {
        ...docNonPII.visit,
        events: [],
      };
      const docPII = documentContentsPII("fakecsruid1");
      const visitNonPII = await snifflesModels.visitNonPii.create(docNonPII);
      const visitPII = await snifflesModels.visitPii.create(docPII);

      const pending = await encounterDetails.retrieveDetails();

      const csruids = pending.map(value => value.encounter.csruid);

      expect(csruids).toContain("fakecsruid1");

      await visitPII.destroy();
      await visitNonPII.destroy();
    });

    it("Returns visits that have no samples but have completed the questionnarie", async () => {
      const docNonPII = documentContentsNonPII("fakecsruid2");
      docNonPII.visit = {
        ...docNonPII.visit,
        samples: [],
      };
      const docPII = documentContentsPII("fakecsruid2");
      const visitNonPII = await snifflesModels.visitNonPii.create(docNonPII);
      const visitPII = await snifflesModels.visitPii.create(docPII);

      const pending = await encounterDetails.retrieveDetails();

      const csruids = pending.map(value => value.encounter.csruid);

      expect(csruids).toContain("fakecsruid2");

      await visitPII.destroy();
      await visitNonPII.destroy();
    });

    it("Does not return recent visits that are not complete", async () => {
      const docNonPII = _.cloneDeep(documentContentsNonPII("fakecsruid4"));
      docNonPII.visit.complete = false;
      const docPII = documentContentsPII("fakecsruid4");
      const visitNonPII = await snifflesModels.visitNonPii.create(docNonPII);
      const visitPII = await snifflesModels.visitPii.create(docPII);

      const pending = await encounterDetails.retrieveDetails();

      const csruids = pending.map(value => value.encounter.csruid);

      expect(csruids).not.toContain("fakecsruid4");

      await visitPII.destroy();
      await visitNonPII.destroy();
    });

    it("does not return recent visits that have no sample or completed questionnaire", async () => {
      const docNonPII = _.cloneDeep(documentContentsNonPII("fakecsruid4"));
      docNonPII.visit.complete = false;
      docNonPII.visit.events = docNonPII.visit.events.filter(
        e => e.refId != "CompletedQuestionnaire"
      );
      docNonPII.visit.samples = [];
      const docPII = documentContentsPII("fakecsruid4");
      const visitNonPII = await snifflesModels.visitNonPii.create(docNonPII);
      const visitPII = await snifflesModels.visitPii.create(docPII);

      const pending = await encounterDetails.retrieveDetails();

      const csruids = pending.map(value => value.encounter.csruid);

      expect(csruids).not.toContain("fakecsruid4");

      await visitPII.destroy();
      await visitNonPII.destroy();
    });

    it("returns older visits that will no longer be edited, even if they are not marked as complete", async () => {
      const docNonPII = _.cloneDeep(documentContentsNonPII("fakecsruid5"));
      docNonPII.visit.complete = false;
      const docPII = documentContentsPII("fakecsruid5");
      const visitNonPII = await snifflesModels.visitNonPii.create(docNonPII);
      const visitPII = await snifflesModels.visitPii.create(docPII);

      const date = moment()
        .subtract(20, "days")
        .toISOString();

      await splitSql.nonPii.query(
        `
        update visits set "updatedAt" = '${date}' where csruid = 'fakecsruid5';
      `,
        { type: sequelize.QueryTypes.UPDATE }
      );

      const pending = await encounterDetails.retrieveDetails();

      const csruids = pending.map(value => value.encounter.csruid);

      expect(csruids).toContain("fakecsruid5");

      await visitPII.destroy();
      await visitNonPII.destroy();
    });

    it("includes bed assignment even if wrongly in pii", async () => {
      const docNonPII = documentContentsNonPII("fakecsruid1");
      docNonPII.visit = {
        ...docNonPII.visit,
        events: [],
      };
      const docPII = documentContentsPII("fakecsruid1");
      docPII.visit = {
        ...docPII.visit,
        responses: [
          {
            id: docPII.visit.responses[0].id,
            item: [
              ...docPII.visit.responses[0].item,
              BED_ASSIGNMENT_RESPONSE_ITEM,
              PII_RESPONSE_ITEM,
            ],
          },
        ],
      };
      const visitNonPII = await snifflesModels.visitNonPii.create(docNonPII);
      const visitPII = await snifflesModels.visitPii.create(docPII);

      const pending = await encounterDetails.retrieveDetails();

      const row = pending.find(x => x.encounter.csruid === "fakecsruid1");

      // Should include Bed Assignment
      expect(
        row.encounter.responses[0].item.some(
          x => x.id === BED_ASSIGNMENT_RESPONSE_ITEM.id
        )
      ).toBeTruthy();

      // But not any PII items
      expect(
        row.encounter.responses[0].item.every(
          x => x.id !== PII_RESPONSE_ITEM.id
        )
      ).toBeTruthy();

      await visitPII.destroy();
      await visitNonPII.destroy();
    });
  });

  describe("retrieve surveys", async () => {
    beforeEach(async () => {
      await cleanupFever();
    });

    it("only returns surveys with a recorded sample", async () => {
      const nonPII = [];
      const PII = [];

      const withSampleNonPII = _.cloneDeep(surveyNonPIIInDb("a"));
      const withSamplePII = _.cloneDeep(surveyPIIInDb("a"));

      nonPII.push((await feverModels.surveyNonPii.create(withSampleNonPII)).id);
      PII.push((await feverModels.surveyPii.create(withSamplePII)).id);

      const noSampleNonPII = _.cloneDeep(surveyNonPIIInDb("b"));
      noSampleNonPII.survey.samples = [];
      const noSamplePII = _.cloneDeep(surveyPIIInDb("b"));

      nonPII.push((await feverModels.surveyNonPii.create(noSampleNonPII)).id);
      PII.push((await feverModels.surveyPii.create(noSamplePII)).id);

      const pending = await encounterDetails.retrieveDetails();

      expect(pending).toHaveLength(1);
      expect(pending[0].key.release).toBe(Release.Fever);
      expect(pending[0].encounter.csruid).toBe("a");

      await feverModels.surveyNonPii.destroy({ where: { id: nonPII } });
      await feverModels.surveyPii.destroy({ where: { id: PII } });
    });

    it("only returns non-demo surveys", async () => {
      const nonPII = [];
      const PII = [];

      const realNonPII = _.cloneDeep(surveyNonPIIInDb("a"));
      const realPII = _.cloneDeep(surveyPIIInDb("a"));

      nonPII.push((await feverModels.surveyNonPii.create(realNonPII)).id);
      PII.push((await feverModels.surveyPii.create(realPII)).id);

      const demoNonPII = _.cloneDeep(surveyNonPIIInDb("b"));
      demoNonPII.survey.isDemo = true;
      const demoPII = _.cloneDeep(surveyPIIInDb("b"));
      demoPII.survey.isDemo = true;

      nonPII.push((await feverModels.surveyNonPii.create(demoNonPII)).id);
      PII.push((await feverModels.surveyPii.create(demoPII)).id);

      const pending = await encounterDetails.retrieveDetails();

      expect(pending).toHaveLength(1);
      expect(pending[0].key.release).toBe(Release.Fever);
      expect(pending[0].encounter.csruid).toBe("a");

      await feverModels.surveyNonPii.destroy({ where: { id: nonPII } });
      await feverModels.surveyPii.destroy({ where: { id: PII } });
    });

    it("returns appNav events", async () => {
      const nonPII = [];
      const PII = [];

      const nonPIISurvey = _.cloneDeep(surveyNonPIIInDb("a"));
      const PIISurvey = _.cloneDeep(surveyPIIInDb("a"));

      nonPIISurvey.survey.events.push({
        kind: EventInfoKind.Interaction,
        at: moment().toISOString(),
        refId: "A",
      });

      nonPIISurvey.survey.events.push({
        kind: EventInfoKind.AppNav,
        at: moment().toISOString(),
        refId: "B",
      });

      nonPII.push((await feverModels.surveyNonPii.create(nonPIISurvey)).id);
      PII.push((await feverModels.surveyPii.create(PIISurvey)).id);

      const pending = await encounterDetails.retrieveDetails();

      expect(pending).toHaveLength(1);
      expect(pending[0].encounter.events).toHaveLength(1);
      expect(pending[0].encounter.events[0].refId).toBe("B");

      await feverModels.surveyNonPii.destroy({ where: { id: nonPII } });
      await feverModels.surveyPii.destroy({ where: { id: PII } });
    });

    it("returns follow-up survey responses", async () => {
      const nonPII = [];
      const PII = [];

      const nonPIISurvey = _.cloneDeep(surveyNonPIIInDb("a"));
      const PIISurvey = _.cloneDeep(surveyPIIInDb("a"));
      PIISurvey.survey.patient.telecom = [
        {
          system: TelecomInfoSystem.Email,
          value: "me@mail.com",
        },
      ];

      nonPII.push((await feverModels.surveyNonPii.create(nonPIISurvey)).id);
      PII.push((await feverModels.surveyPii.create(PIISurvey)).id);

      const followUp = {
        email: "me@mail.com",
        survey: {
          record_id: 1,
          email: "me@mail.com",
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
      };

      await feverModels.followUpSurveys.create(followUp);

      const pending = await encounterDetails.retrieveDetails();

      expect(pending[0].encounter.followUpResponses).toEqual(followUp.survey);
    });
  });
});

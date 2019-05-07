// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Op } from "sequelize";
import { VisitsService } from "../../../src/services/sniffles/visitsService";
import {
  defineSnifflesModels,
  SnifflesModels
} from "../../../src/models/db/sniffles";
import { createSplitSql, SplitSql } from "../../../src/util/sql";
import { defineHutchUpload } from "../../../src/models/db/hutchUpload";
import {
  documentContentsNonPII,
  documentContentsPII,
  BED_ASSIGNMENT_RESPONSE_ITEM,
  PII_RESPONSE_ITEM
} from "../../util/sample_data";
import _ from "lodash";
import moment from "moment";
import sequelize = require("sequelize");

describe("visitsService", () => {
  let visitsService: VisitsService;
  let snifflesModels: SnifflesModels;
  let splitSql: SplitSql;
  beforeAll(async done => {
    splitSql = createSplitSql();
    snifflesModels = defineSnifflesModels(splitSql);
    visitsService = new VisitsService(
      snifflesModels,
      defineHutchUpload(splitSql)
    );
    await snifflesModels.visitPii.destroy({
      where: { csruid: { [Op.like]: "fakecsruid%" } }
    });
    await snifflesModels.visitNonPii.destroy({
      where: { csruid: { [Op.like]: "fakecsruid%" } }
    });
    done();
  });

  describe("retrievePendingDetails", () => {
    it("Returns visits that are complete and have a sample", async () => {
      const docNonPII = documentContentsNonPII("fakecsruid1");
      docNonPII.visit = {
        ...docNonPII.visit,
        events: []
      };
      const docPII = documentContentsPII("fakecsruid1");
      const visitNonPII = await snifflesModels.visitNonPii.create(docNonPII);
      const visitPII = await snifflesModels.visitPii.create(docPII);

      const pendingVisits = await visitsService.retrievePendingDetails(1000);

      const csruids = Array.from(pendingVisits.values()).map(
        value => value.csruid
      );

      expect(csruids).toContain("fakecsruid1");

      await visitPII.destroy();
      await visitNonPII.destroy();
    });

    it("Returns visits that have no samples but have completed the questionnarie", async () => {
      const docNonPII = documentContentsNonPII("fakecsruid2");
      docNonPII.visit = {
        ...docNonPII.visit,
        samples: []
      };
      const docPII = documentContentsPII("fakecsruid2");
      const visitNonPII = await snifflesModels.visitNonPii.create(docNonPII);
      const visitPII = await snifflesModels.visitPii.create(docPII);

      const pendingVisits = await visitsService.retrievePendingDetails(1000);

      const csruids = Array.from(pendingVisits.values()).map(
        value => value.csruid
      );

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

      const pendingVisits = await visitsService.retrievePendingDetails(1000);

      const csruids = Array.from(pendingVisits.values()).map(
        value => value.csruid
      );

      expect(csruids).not.toContain("fakecsruid4");

      await visitPII.destroy();
      await visitNonPII.destroy();
    });

    it("does not return recent visits that have no sample or completed questionnaire", async () => {
      const docNonPII = _.cloneDeep(documentContentsNonPII("fakecsruid4"));
      docNonPII.visit.complete = false;
      docNonPII.visit.events = docNonPII.visit.events
        .filter(e => e.refId != "CompletedQuestionnaire");
      docNonPII.visit.samples = [];
      const docPII = documentContentsPII("fakecsruid4");
      const visitNonPII = await snifflesModels.visitNonPii.create(docNonPII);
      const visitPII = await snifflesModels.visitPii.create(docPII);

      const pendingVisits = await visitsService.retrievePendingDetails(1000);

      const csruids = Array.from(pendingVisits.values()).map(
        value => value.csruid
      );

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

      const date = moment().subtract(20, "days").toISOString()

      await splitSql.nonPii.query(`
        update visits set "updatedAt" = '${date}' where csruid = 'fakecsruid5';
      `, { type: sequelize.QueryTypes.UPDATE });

      const pendingVisits = await visitsService.retrievePendingDetails(1000);

      const csruids = Array.from(pendingVisits.values()).map(
        value => value.csruid
      );

      expect(csruids).toContain("fakecsruid5");

      await visitPII.destroy();
      await visitNonPII.destroy();
    });

    it("includes bed assignment even if wrongly in pii", async () => {
      const docNonPII = documentContentsNonPII("fakecsruid1");
      docNonPII.visit = {
        ...docNonPII.visit,
        events: []
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
              PII_RESPONSE_ITEM
            ]
          }
        ]
      };
      const visitNonPII = await snifflesModels.visitNonPii.create(docNonPII);
      const visitPII = await snifflesModels.visitPii.create(docPII);

      const pendingVisits = await visitsService.retrievePendingDetails(1000);

      const rows = Array.from(pendingVisits.values()).filter(
        x => x.csruid === "fakecsruid1"
      );
      expect(rows.length).toEqual(1);
      const row = rows[0];

      // Should include Bed Assignment
      expect(
        row.visitInfo.responses[0].item.some(
          x => x.id === BED_ASSIGNMENT_RESPONSE_ITEM.id
        )
      ).toBeTruthy();

      // But not any PII items
      expect(
        row.visitInfo.responses[0].item.every(
          x => x.id !== PII_RESPONSE_ITEM.id
        )
      ).toBeTruthy();

      await visitPII.destroy();
      await visitNonPII.destroy();
    });
  });
});

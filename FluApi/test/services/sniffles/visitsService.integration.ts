import { Op } from "sequelize";
import { VisitsService } from "../../../src/services/sniffles/visitsService";
import {
  defineSnifflesModels,
  SnifflesModels
} from "../../../src/models/db/sniffles";
import { createSplitSql } from "../../../src/util/sql";
import { defineHutchUpload } from "../../../src/models/db/hutchUpload";
import {
  documentContentsNonPII,
  documentContentsPII,
  BED_ASSIGNMENT_RESPONSE_ITEM,
  PII_RESPONSE_ITEM,
} from "../../util/sample_data";

describe("visitsService", () => {
  let visitsService: VisitsService;
  let snifflesModels: SnifflesModels;
  beforeAll(async done => {
    const splitSql = createSplitSql();
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

    it("Returns visits that are complete but missing a sample", async () => {
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

    it("Returns visits that are not complete but have a sample", async () => {
      const docNonPII = documentContentsNonPII("fakecsruid3");
      docNonPII.visit = {
        ...docNonPII.visit,
        events: []
      };
      const docPII = documentContentsPII("fakecsruid3");
      const visitNonPII = await snifflesModels.visitNonPii.create(docNonPII);
      const visitPII = await snifflesModels.visitPii.create(docPII);

      const pendingVisits = await visitsService.retrievePendingDetails(1000);

      const csruids = Array.from(pendingVisits.values()).map(
        value => value.csruid
      );

      expect(csruids).toContain("fakecsruid3");

      await visitPII.destroy();
      await visitNonPII.destroy();
    });

    it("Does not return visits that are not complete nor have a sample", async () => {
      const docNonPII = documentContentsNonPII("fakecsruid4");
      docNonPII.visit = {
        ...docNonPII.visit,
        samples: [],
        events: []
      };
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

    it("includes bed assignment even if wrongly in pii", async () => {
      const docNonPII = documentContentsNonPII("fakecsruid1");
      docNonPII.visit = {
        ...docNonPII.visit,
        events: []
      };
      const docPII = documentContentsPII("fakecsruid1");
      docPII.visit = {
        ...docPII.visit,
        responses: [{
          id: docPII.visit.responses[0].id,
          item: [
            ...docPII.visit.responses[0].item,
            BED_ASSIGNMENT_RESPONSE_ITEM,
            PII_RESPONSE_ITEM,
          ]
        }]
      };
      const visitNonPII = await snifflesModels.visitNonPii.create(docNonPII);
      const visitPII = await snifflesModels.visitPii.create(docPII);

      const pendingVisits = await visitsService.retrievePendingDetails(1000);

      const rows = Array.from(pendingVisits.values())
        .filter(x => x.csruid === "fakecsruid1");
      expect(rows.length).toEqual(1);
      const row = rows[0];

      // Should include Bed Assignment
      expect(row.visitInfo.responses[0].item
        .some(x => x.id === BED_ASSIGNMENT_RESPONSE_ITEM.id)).toBeTruthy();

      // But not any PII items
      expect(row.visitInfo.responses[0].item
        .every(x => x.id !== PII_RESPONSE_ITEM.id)).toBeTruthy();

      await visitPII.destroy();
      await visitNonPII.destroy();
    });
  });
});

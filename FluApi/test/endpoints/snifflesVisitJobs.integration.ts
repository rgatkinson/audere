import { SnifflesVisitJobs } from "../../src/endpoints/snifflesVisitJobs";
import { getSql } from "../../src/util/sql";
import {
  defineSnifflesModels,
  SnifflesModels,
} from "../../src/models/db/sniffles";
import {
  documentContentsPII,
  documentContentsNonPII,
} from "../util/sample_data";

const tuple = <T extends any[]>(...args: T): T => args;

describe("SnifflesVisitJobs", () => {
  let sql, snifflesModels: SnifflesModels;
  beforeAll(() => {
    sql = getSql();
    snifflesModels = defineSnifflesModels(sql);
  });

  const createSnifflesVisitJobs = (name, visitIds) =>
    new SnifflesVisitJobs(sql, [
      {
        getName() {
          return name;
        },
        async processVisits(visits) {
          visits.forEach(visit => {
            visitIds.push(visit.nonPii.id);
          });
          return new Map(
            visits.map(visit => tuple(visit.nonPii.id, { result: {} }))
          );
        },
      },
    ]);

  it("runs a job on a new visit", async () => {
    const visitIds = [];
    const snifflesVisitJobs = createSnifflesVisitJobs("fakeJob", visitIds);

    const visitNonPII = await snifflesModels.visitNonPii.create(
      documentContentsNonPII("jobstestvisit")
    );
    const visitPII = await snifflesModels.visitPii.create(
      documentContentsPII("jobstestvisit")
    );

    try {
      await snifflesVisitJobs.runJobs(-1);

      expect(visitIds).toContain(visitNonPII.id);
    } finally {
      await Promise.all([
        visitNonPII.destroy(),
        visitPII.destroy(),
        snifflesModels.visitJobRecord.destroy({
          where: { jobName: "fakeJob" },
        }),
      ]);
    }
  });

  it("doesn't run a job again on an old visit", async () => {
    const visitIds = [];
    const snifflesVisitJobs = createSnifflesVisitJobs("fakeJob", visitIds);

    const visitNonPII = await snifflesModels.visitNonPii.create(
      documentContentsNonPII("jobstestvisit")
    );
    const visitPII = await snifflesModels.visitPii.create(
      documentContentsPII("jobstestvisit")
    );
    const jobRecord = await snifflesModels.visitJobRecord.create({
      visitId: visitNonPII.id,
      jobName: "fakeJob",
      result: {},
    });

    try {
      await snifflesVisitJobs.runJobs(-1);

      expect(visitIds).not.toContain(visitNonPII.id);
    } finally {
      await Promise.all([
        visitNonPII.destroy(),
        visitPII.destroy(),
        snifflesModels.visitJobRecord.destroy({
          where: { jobName: "fakeJob" },
        }),
      ]);
    }
  });

  it("runs a new job on an old visit", async () => {
    const visitIds = [];
    const snifflesVisitJobs = createSnifflesVisitJobs("newFakeJob", visitIds);

    const visitNonPII = await snifflesModels.visitNonPii.create(
      documentContentsNonPII("jobstestvisit")
    );
    const visitPII = await snifflesModels.visitPii.create(
      documentContentsPII("jobstestvisit")
    );
    const jobRecord = await snifflesModels.visitJobRecord.create({
      visitId: visitNonPII.id,
      jobName: "fakeJob",
      result: {},
    });

    try {
      await snifflesVisitJobs.runJobs(-1);

      expect(visitIds).toContain(visitNonPII.id);
    } finally {
      await Promise.all([
        visitNonPII.destroy(),
        visitPII.destroy(),
        jobRecord.destroy(),
        snifflesModels.visitJobRecord.destroy({
          where: { jobName: "newFakeJob" },
        }),
      ]);
    }
  });

  it("creates a record of successful runs", async () => {
    const visitIds = [];
    const snifflesVisitJobs = createSnifflesVisitJobs("fakeJob", visitIds);

    const visitNonPII = await snifflesModels.visitNonPii.create(
      documentContentsNonPII("jobstestvisit")
    );
    const visitPII = await snifflesModels.visitPii.create(
      documentContentsPII("jobstestvisit")
    );

    let jobRecord;
    try {
      await snifflesVisitJobs.runJobs(-1);

      jobRecord = await snifflesModels.visitJobRecord.find({
        where: { jobName: "fakeJob", visitId: visitNonPII.id },
      });
      expect(jobRecord).toBeTruthy();
    } finally {
      await Promise.all([
        visitNonPII.destroy(),
        visitPII.destroy(),
        snifflesModels.visitJobRecord.destroy({
          where: { jobName: "fakeJob" },
        }),
      ]);
    }
  });
});

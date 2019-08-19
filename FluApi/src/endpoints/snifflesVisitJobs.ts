import { Op, IncludeOptions } from "sequelize";
import { SplitSql } from "backend-lib";
import {
  defineSnifflesModels,
  SnifflesModels,
  VisitJobResult,
  VisitPIIInstance,
  VisitNonPIIInstance,
} from "../models/db/sniffles";
import logger from "../util/logger";

export type CombinedVisit = {
  nonPii: VisitNonPIIInstance;
  pii: VisitPIIInstance;
};

export interface SnifflesVisitJob {
  getName(): string;
  processVisits(visits: CombinedVisit[]): Promise<Map<string, VisitJobResult>>;
}

export class SnifflesVisitJobs {
  private readonly snifflesModels: SnifflesModels;
  private readonly jobs: SnifflesVisitJob[];
  constructor(sql: SplitSql, jobs: SnifflesVisitJob[]) {
    this.snifflesModels = defineSnifflesModels(sql);
    this.jobs = jobs;
  }

  public async performRequest(req, res) {
    res.json(await this.runJobs());
  }

  public async runJobs(maxVisits = 500) {
    const summary = {};
    await Promise.all(
      this.jobs.map(async job => {
        try {
          const jobName = job.getName();
          const visitNonPiis = await this.snifflesModels.visitNonPii.findAll({
            where: {
              visit: {
                complete: {
                  [Op.eq]: "true",
                },
              },
              "$sniffles_visit_job_records.id$": null,
            },
            include: [
              {
                model: this.snifflesModels.visitJobRecord,
                required: false,
                where: { jobName },
                // `duplicating` is not included in the IncludeOptions type definition,
                // hence the cast below, but it's needed to make the limit option work.
                // See: https://github.com/sequelize/sequelize/issues/4446
                duplicating: false,
              } as IncludeOptions,
            ],
            limit: maxVisits === -1 ? undefined : maxVisits,
            order: [["id", "ASC"]],
          });
          const visitPiis = await this.snifflesModels.visitPii.findAll({
            where: {
              csruid: visitNonPiis.map(visitNonPii => visitNonPii.csruid),
            },
          });
          const combinedVisits = visitNonPiis
            .map(visitNonPii => ({
              nonPii: visitNonPii,
              pii: visitPiis.find(
                visitPii => visitPii.csruid === visitNonPii.csruid
              ),
            }))
            .filter(combinedVisit => {
              if (!combinedVisit.pii) {
                console.error(
                  `Not running ${jobName} on visit ${combinedVisit.nonPii.id} because pii is mising`
                );
                return false;
              }
              return true;
            });
          const jobResults = await job.processVisits(combinedVisits);
          const jobRecords = Array.from(jobResults.entries())
            .filter(([visitId, jobResult]) => !jobResult.error)
            .map(([visitId, jobResult]) => ({
              visitId,
              jobName,
              result: jobResult.result,
            }));
          await this.snifflesModels.visitJobRecord.bulkCreate(jobRecords);
          summary[jobName] = {
            visitsProcessed: combinedVisits.length,
            visitsSucceeded: jobRecords.length,
          };
        } catch (e) {
          summary[job.getName()] = { error: true };
          logger.error(`[SnifflesVisitJobs] ${job.getName()} failed:`);
          logger.error(e.stack);
        }
      })
    );
    return summary;
  }
}

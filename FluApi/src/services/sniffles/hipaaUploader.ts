import * as AWS from "aws-sdk";
import { formatConsent } from "../../util/visit";
import logger from "../../util/logger";
import { CombinedVisit } from "../../endpoints/snifflesVisitJobs";
import { S3Uploader } from "../../external/s3Uploader";
import { getS3Config } from "../../util/s3Config";
import { SecretConfig, SplitSql } from "backend-lib";
import { VisitJobResult } from "../../models/db/sniffles";

const SEATTLE_CHILDRENS = "seattle-childrens";
const LOCATIONS_REQURING_UPLOAD = {
  ChildrensHospitalSeattle: SEATTLE_CHILDRENS,
  ChildrensHospitalBellevue: SEATTLE_CHILDRENS,
};

export class HipaaUploader {
  private readonly sql: SplitSql;
  constructor(sql: SplitSql) {
    this.sql = sql;
  }

  public getName() {
    return "HipaaUploader";
  }

  public async processVisits(visits: CombinedVisit[]) {
    const sts = new AWS.STS({ region: "us-west-2" });
    console.log(await sts.getCallerIdentity().promise());
    const secrets = new SecretConfig(this.sql);
    const s3Config = await getS3Config(secrets);
    const s3 = new AWS.S3({ region: "us-west-2" });
    const s3Uploader = new S3Uploader(s3, s3Config);
    logger.debug(JSON.stringify(s3Config));

    const results = new Map<string, VisitJobResult>();
    await Promise.all(
      visits.map(async visit => {
        try {
          const group = LOCATIONS_REQURING_UPLOAD[visit.nonPii.visit.location];
          if (!group) {
            results.set(visit.nonPii.id, {
              result: { skipped: "Not required for this location" },
            });
            return;
          }

          if (visit.pii.visit.consents.length === 0) {
            results.set(visit.nonPii.id, {
              result: { skipped: "No signed consents found" },
            });
            return;
          }

          const forms = visit.pii.visit.consents.map((consent, index) =>
            formatConsent(consent, visit.pii.visit.patient.name, index, true)
          );

          const document = `<html><body>${forms.join("<hr/>")}</body></html>`;
          await s3Uploader.writeHipaaForm(
            group,
            `${visit.pii.visit.consents[0].date}_${visit.nonPii.id}.html`,
            document
          );
          results.set(visit.nonPii.id, { result: { success: true } });
        } catch (e) {
          logger.error(
            `Failed to upload hipaa form for visit ${visit.nonPii.id}`
          );
          logger.error(e.stack);
          results.set(visit.nonPii.id, { error: true });
        }
      })
    );
    return results;
  }
}

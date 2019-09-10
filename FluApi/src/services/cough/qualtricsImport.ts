// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { CoughModels, FollowUpSurveyAttributes } from "../../models/db/cough";
import { CoughFollowUpClient } from "../../external/coughFollowUpClient";
import { SplitSql } from "../../util/sql";
import sequelize = require("sequelize");
import logger from "../../util/logger";

/**
 * Retrieves Qualtrics data for Cough from a static file and imports into the
 * database.
 */
export class QualtricsImport {
  private readonly models: CoughModels;
  private readonly s3: CoughFollowUpClient;
  private readonly sql: SplitSql;

  constructor(models: CoughModels, s3: CoughFollowUpClient, sql: SplitSql) {
    this.models = models;
    this.s3 = s3;
    this.sql = sql;
  }

  /**
   * Confirms that the input survey contains all expected keys & adheres to our
   * expectations
   *
   * @param survey Object to validate
   */
  private isValidSurvey(survey: any): boolean {
    return (
      "startDate" in survey &&
      "endDate" in survey &&
      "status" in survey &&
      "progress" in survey &&
      "duration" in survey &&
      "finished" in survey &&
      "recordedDate" in survey &&
      "responseId" in survey &&
      "externalDataReference" in survey &&
      "distributionChannel" in survey &&
      "userLanguage" in survey &&
      "QID12" in survey &&
      "QID15" in survey &&
      "QID9" in survey &&
      "QID17" in survey &&
      "QID6" in survey &&
      "QID59" in survey &&
      "QID16" in survey &&
      "QID8" in survey &&
      "QID14" in survey &&
      "QID23" in survey &&
      "QID22" in survey &&
      "QID20" in survey &&
      "QID21" in survey &&
      "QID24" in survey &&
      "QID33_1" in survey &&
      "QID33_2" in survey &&
      "QID33_3" in survey &&
      "QID33_7" in survey &&
      "QID42" in survey &&
      "QID34" in survey &&
      "QID43" in survey &&
      "QID58" in survey &&
      "QID31" in survey &&
      "QID46" in survey &&
      "QID30" in survey &&
      "QID41" in survey &&
      "QID44" in survey &&
      "QID47_1_1" in survey &&
      "QID47_1_2" in survey &&
      "QID47_1_3" in survey &&
      "QID47_1_4" in survey &&
      "QID35" in survey &&
      "QID61" in survey &&
      "QID45" in survey &&
      "QID28" in survey &&
      "QID62" in survey &&
      "QID63" in survey
    );
  }

  /**
   * Poll for new files and process the most recent. Files are cumulative
   * meaning the database state should always mirror the most recent file
   * imported. This simplifies processing mechanics and makes data restoration
   * and recoveery straightforward.
   */
  public async importFollowUpSurveys(): Promise<void> {
    const file = await this.s3.getFollowUpSurveys();

    if (file == null) {
      logger.info(`No follow-up survey data available for processing.`);
      return;
    }

    const processed = await this.models.followUpSurveyFile.findAll({
      where: {
        key: file.key,
        hash: file.hash,
      },
    });

    // If the same key and hash are present then we skip the file. If the file
    // has changed the hash should also be modified.
    if (processed.length > 0) {
      logger.warn(
        `Report located at ${file.key} with ETag ${file.hash} ` +
          `has already been processed. Skipping follow-up survey import.`
      );
      return;
    }

    logger.info(`Importing survey data, ${file.key} with hash ${file.hash}.`);

    // The file has 3 header rows. The third is a JSON fragment that seems to
    // be the most stable as it exposes system ids for each question/column.
    const names = file.records[2].map(s => JSON.parse(s).ImportId);
    const surveys: FollowUpSurveyAttributes[] = [];

    for (let i = 3; i < file.records.length; i++) {
      const survey = {};
      const row = file.records[i];

      for (let j = 0; j < row.length; j++) {
        const name = names[j];
        const value = row[j];

        switch (name) {
          case "_recordId":
            survey["responseId"] = value;
            break;
          case "recipientLastName":
            // ignore, PII
            break;
          case "recipientFirstName":
            // ignore, PII
            break;
          case "recipientEmail":
            // ignore, PII
            break;
          case "locationLatitude":
            // ignore, PII
            break;
          case "locationLongitude":
            // ignore, PII
            break;
          default:
            survey[name.replace("#", "_")] = value;
            break;
        }
      }

      if (!this.isValidSurvey(survey)) {
        throw Error(
          "Survey fields did not match existing schema, the file format " +
            "may have changed"
        );
      }

      surveys.push(<FollowUpSurveyAttributes>survey);
    }

    // Within a single transaction:
    // 1. Insert a record for the file we're importing.
    // 2. Upsert records from the report.
    // 3. Remove records from the database that are not in the latest report.
    await this.sql.nonPii.transaction(async t => {
      await this.models.followUpSurveyFile.upsert(
        { key: file.key, hash: file.hash },
        { transaction: t }
      );
      logger.debug(`Tracked file from ${file.key}`);

      let created = 0;
      let updated = 0;

      for (let i = 0; i < surveys.length; i++) {
        const result = await this.models.followUpSurvey.upsert(surveys[i], {
          transaction: t,
        });

        if (result) {
          created++;
        } else {
          updated++;
        }

        logger.debug(
          `Upserted survey with responseId ${surveys[i].responseId}.`
        );
      }
      logger.info(
        `Done upserting surveys - created ${created} records, updated ${updated} records.`
      );

      const destroyed = await this.models.followUpSurvey.destroy({
        where: {
          responseId: {
            [sequelize.Op.notIn]: surveys.map(s => s.responseId),
          },
        },
        transaction: t,
      });
      logger.info(`Destroyed ${destroyed} orphaned rows from previous surveys`);
    });
  }
}

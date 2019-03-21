// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { UWUploader } from "../../external/uwUploader";
import { SurveyCompletedReport } from "./surveyCompleteReport";
import { IncentiveRecipientsDataAccess } from "./incentiveRecipientsData";

/**
 * Retrieves a report of unique database records of participants that have
 * completed the second half of the app and have had a specimen kit processed by
 * the lab.
 */
export class Incentives extends SurveyCompletedReport {
  protected readonly report = "Incentives";
  private readonly uploader: UWUploader;

  constructor(
    dao: IncentiveRecipientsDataAccess,
    uploader: UWUploader
  ) {
    super(dao);
    this.uploader = uploader;
  }

  public async writeReport(batchId: number, report: string): Promise<void> {
    await this.uploader.sendIncentives(batchId, report);
  }
}

// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { UWUploader } from "../../external/uwUploader";
import { SurveyCompletedReport } from "./surveyCompleteReport";
import { FollowUpDataAccess } from "./followUpData";

/**
 * Retrieves a report of unique database records of participants that have
 * completed the second half of the app but have not necessarily had a specimen
 * kit processed by the lab.
 */
export class FollowUpSurveys extends SurveyCompletedReport {
  protected readonly report = "FollowUp";
  private readonly uploader;

  constructor(
    dao: FollowUpDataAccess,
    uploader: UWUploader
  ) {
    super(dao);
    this.uploader = uploader;
  }

  public async writeReport(batchId: number, report: string): Promise<void> {
    await this.uploader.sendFollowUps(batchId, report);
  }
}

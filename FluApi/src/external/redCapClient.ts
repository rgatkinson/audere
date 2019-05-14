// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { AxiosInstance, AxiosResponse } from "axios";
import { KitRecord } from "../models/kitRecord";
import { REDCapConfig } from "../util/redCapConfig";
import { UntrackedBarcode } from "../services/fever/receivedKitsData";
import moment from "moment-timezone";
import logger from "../util/logger";

interface AtHomeData {
  record_id: string;
  date_receieved: string;
  box_barcode: string;
  utm_barcode: string;
  rdt_barcode: string;
  strip_barcode: string;
}

interface AtHomeRecord {
  record_id: number;
  participant_entered_kit_ba: string;
  state_from_audere: string;
  date_barcode_scanned_by_pa?: string;
}

export interface FollowUpSurveyData {
  record_id: number;
  email: string;
  daily_activity: number;
  medications: number;
  care___1: number;
  care___2: number;
  care___3: number;
  care___4: number;
  care___5: number;
  care___6: number;
  care___7: number;
  care___8: number;
  care_other: string;
  found_study: number;
}

export interface RecordSurveyMapping {
  recordId: number;
  surveyId: number;
}

/**
 * Fetches data from REDCap, which is used by lab researchers for processing
 * specimen kits.
 */
export class REDCapClient {
  private readonly api: AxiosInstance;
  private readonly config: REDCapConfig;

  constructor(api: AxiosInstance, config: REDCapConfig) {
    this.api = api;
    this.config = config;
  }

  private async makeRequest<T>(data: string): Promise<AxiosResponse<T>> {
    try {
      const response = await this.api.post<T>("", data, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });

      return response;
    } catch (e) {
      if (e.response) {
        const message = JSON.stringify(e.response.data);
        logger.error(`Error returned from REDCap: ${message}`);
      }

      throw e;
    }
  }

  private validateReportRow(row: AtHomeData): boolean {
    return (
      row.record_id != null &&
      row.date_receieved != null &&
      row.box_barcode != null &&
      row.utm_barcode != null &&
      row.rdt_barcode != null &&
      row.strip_barcode != null
    );
  }

  /**
   * Retrieves a summary of anonymous lab data from REDCap
   */
  public async getAtHomeData(): Promise<KitRecord[]> {
    // Form encoding
    const data =
      `token=${this.config.kitProcessingToken}&` +
      `content=report&` +
      `report_id=${this.config.homeDataReportId}&` +
      `format=json&` +
      `returnFormat=json`;

    logger.info("Requesting Fever data from REDCap");
    const result = await this.makeRequest<AtHomeData[]>(data);
    logger.info(`Received ${result.status} from request to REDCap`);

    if (!Array.isArray(result.data)) {
      const error = JSON.stringify(result.data);
      throw Error(`Unknown response from REDCap - ${error}`);
    }

    if (result.data.length === 0) {
      throw Error("Report for @Home data is empty");
    }

    logger.info(`Received ${result.data.length} rows for @Home data report`);

    if (!result.data.every(row => this.validateReportRow(row))) {
      throw Error("Report for @Home data is not in the expected format");
    }

    return result.data.map(row => ({
      recordId: +row.record_id,
      dateReceived: row.date_receieved,
      boxBarcode: row.box_barcode,
      utmBarcode: row.utm_barcode,
      rdtBarcode: row.rdt_barcode,
      stripBarcode: row.strip_barcode
    }));
  }

  private validateSurveyRow(row: FollowUpSurveyData): boolean {
    return (
      row.daily_activity <= 1 &&
      row.daily_activity >= 0 &&
      row.medications <= 3 &&
      row.medications >= 1 &&
      row.care___1 <= 1 &&
      row.care___1 >= 0 &&
      row.care___2 <= 1 &&
      row.care___2 >= 0 &&
      row.care___3 <= 1 &&
      row.care___3 >= 0 &&
      row.care___4 <= 1 &&
      row.care___4 >= 0 &&
      row.care___5 <= 1 &&
      row.care___5 >= 0 &&
      row.care___6 <= 1 &&
      row.care___6 >= 0 &&
      row.care___7 <= 1 &&
      row.care___7 >= 0 &&
      row.care___8 <= 1 &&
      row.care___8 >= 0 &&
      row.found_study <= 8 &&
      row.found_study >= 1
    );
  }

  public async getFollowUpSurveys(): Promise<FollowUpSurveyData[]> {
    // Form encoding
    const data =
      `token=${this.config.followUpSurveyToken}&` +
      `content=report&` +
      `report_id=${this.config.surveyDataReportId}&` +
      `format=json&` +
      `returnFormat=json`;

    logger.info("Requesting survey data from REDCap");
    const result = await this.makeRequest<FollowUpSurveyData[]>(data);
    logger.info(`Received ${result.status} from request to REDCap`);

    if (!Array.isArray(result.data)) {
      const error = JSON.stringify(result.data);
      throw Error(`Unknown response from REDCap - ${error}`);
    }

    if (result.data.length === 0) {
      throw Error("Report for survey data is empty");
    }

    logger.info(
      `Received ${result.data.length} rows for follow-up survey report`
    );

    if (!result.data.every(row => this.validateSurveyRow(row))) {
      throw Error(
        "Report for follow-up survey data is not in the correct format"
      );
    }

    return result.data;
  }

  /**
   * Sets readonly Audere-supplied fields in REDCap.
   */
  public async provisionBarcodes(
    untrackedBarcodes: UntrackedBarcode[]
  ): Promise<Map<string, RecordSurveyMapping>> {
    logger.info("Requesting next REDCap record id");
    const nextRecordResponse = await this.makeRequest<number>(
      `token=${this.config.kitProcessingToken}&content=generateNextRecordName`
    );

    let nextRecord = nextRecordResponse.data;
    logger.info(
      `Next REDCap id is ${nextRecordResponse.data}, setting next ` +
        `record offset to ${nextRecord}`
    );

    const mappedRecords = new Map();
    const proposedMappings = new Map();
    const existingRecords: AtHomeRecord[] = [];
    const newRecords: AtHomeRecord[] = [];

    untrackedBarcodes.forEach(b => {
      const record: any = {
        participant_entered_kit_ba: b.code,
        state_from_audere: b.state
      };

      if (b.scannedAt != null) {
        const scanDate = moment(b.scannedAt)
          .tz("America/Los_Angeles")
          .format("YYYY-MM-DD");
        record.date_barcode_scanned_by_pa = scanDate;
      }

      if (b.recordId != null) {
        record.record_id = b.recordId;
        existingRecords.push(record);
        mappedRecords.set(b.code, { recordId: b.recordId, surveyId: b.id });
      } else {
        record.record_id = nextRecord;
        nextRecord++;
        newRecords.push(record);
        proposedMappings.set(record.record_id, [b.code, b.id]);
      }
    });

    logger.info(
      `Modifying ${untrackedBarcodes.length} records in REDCap ` +
        `including ${newRecords.length} new records and ` +
        `${existingRecords.length} existing records`
    );

    // Create new auto-numbered records
    if (newRecords.length > 0) {
      const result = await this.importRecords<string[]>(newRecords, true);

      if (!Array.isArray(result.data)) {
        const error = JSON.stringify(result.data);
        throw Error(`Unknown response from REDCap - ${error}`);
      }

      logger.info(
        `Received ${result.status} status from ` +
          `new record request with ${result.data.length} ` +
          `auto-ids`
      );

      result.data.forEach(res => {
        const [actual, proposed] = res.split(",");
        const [code, surveyId] = proposedMappings.get(+proposed);
        mappedRecords.set(code, { recordId: +actual, surveyId: surveyId });
      });
    }

    // Update existing records
    if (existingRecords.length > 0) {
      const result = await this.importRecords<{ count: string }>(
        existingRecords,
        false
      );

      const count = +result.data.count;
      if (Number.isNaN(count)) {
        const error = JSON.stringify(result.data);
        throw Error(`Unknown response from REDCap - ${error}`);
      }

      logger.info(
        `Received ${result.status} status from ` +
          `existing record request with ${count} records updated`
      );

      if (count !== existingRecords.length) {
        throw Error(
          `Expected to modify ${existingRecords.length} records ` +
            `but server returned ${count}`
        );
      }
    }

    return mappedRecords;
  }

  private async importRecords<T>(records: AtHomeRecord[], autoNumber: boolean) {
    // Form encoding
    const data =
      `token=${this.config.kitProcessingToken}&` +
      `content=record&` +
      `format=json&` +
      `type=flat&` +
      `overwriteBehavior=normal&` +
      `forceAutoNumber=${autoNumber}&` +
      `returnContent=auto_ids&` +
      `returnFormat=json&` +
      `data=${JSON.stringify(records)}`;

    return await this.makeRequest<T>(data);
  }
}

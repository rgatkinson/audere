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
  record_id: string,
  date_receieved: string,
  box_barcode: string,
  utm_barcode: string,
  rdt_barcode: string,
  strip_barcode: string
}

export interface RecordSurveyMapping {
  recordId: number,
  surveyId: number
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
    return this.api.post<T>("", data, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });
  }

  private validateReportRow(row: AtHomeData): boolean {
    return row.record_id != null &&
      row.date_receieved != null &&
      row.box_barcode != null &&
      row.utm_barcode != null &&
      row.rdt_barcode != null &&
      row.strip_barcode != null
  }

  /**
   * Retrieves a summary of anonymous lab data from REDCap
   */
  public async getAtHomeData(): Promise<KitRecord[]> {
    // Form encoding
    const data = `token=${this.config.apiToken}&` +
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

  /**
   * Sets readonly Audere-supplied fields in REDCap.
   */
  public async provisionBarcodes(
    untrackedBarcodes: UntrackedBarcode[]
  ): Promise<Map<string, RecordSurveyMapping>> {
    logger.info("Requesting next REDCap record id");
    const nextRecordResponse = await this.makeRequest<number>(
      `token=${this.config.apiToken}&content=generateNextRecordName`
    );

    // Random offset that ensures we are outside of the range of current ids.
    // If we collide with an existing id our request will be interpreted as an
    // update, where as if we provided a non-existant id it will be discarded
    // and remapped to a newly created, auto-numbered record.
    let nextRecord = nextRecordResponse.data + 1000;
    logger.info(`Next REDCap id is ${nextRecordResponse.data}, setting next ` +
      `record offset to ${nextRecord}`);

    const dataById = new Map();

    const records = untrackedBarcodes.map(b => {
      const record: any = {
        "participant_entered_kit_ba": b.code,
        "state_from_audere": b.state
      };

      if (b.scannedAt != null) {
        const scanDate = moment(b.scannedAt)
          .tz("America/Los_Angeles")
          .format('MM/DD/YYYY');
        record.date_barcode_scanned_by_pa = scanDate;
      }

      if (b.recordId != null) {
        record.record_id = b.recordId;
      } else {
        record.record_id = nextRecord;
        nextRecord++;
      }

      dataById.set(record.record_id, [b.code, b.id]);
      return record;
    });

    logger.info(`Modifying ${records.length} records in REDCap including ` +
      `${nextRecord - nextRecordResponse.data - 1000} new records`);

    // Form encoding
    const data = `token=${this.config.apiToken}&` +
      `content=record&` +
      `format=json&` +
      `type=flat&` +
      `overwriteBehavior=normal&` +
      `forceAutoNumber=true&` +
      `returnContent=auto_ids&` +
      `returnFormat=json&` +
      `data=${JSON.stringify(records)}`;

    const importRecordsResponse = await this.makeRequest<string[]>(data);
    logger.info(`Received ${importRecordsResponse.status} status from record ` +
      `request with ${(importRecordsResponse.data || []).length} auto-ids`);

    const mappedIds = new Map();

    importRecordsResponse.data.forEach(res => {
      const [actual, proposed] = res.split(",");
      const [code, surveyId] = dataById.get(+proposed);
      mappedIds.set(code, { recordId: +actual, surveyId: surveyId });
    });

    return mappedIds;
  }
}

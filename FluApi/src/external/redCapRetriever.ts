// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { AxiosInstance } from "axios";
import { KitRecord } from "../models/kitRecord";
import { REDCapConfig } from "../util/redCapConfig";

interface AtHomeData {
  date_receieved: string,
  box_barcode: string,
  utm_barcode: string,
  rdt_barcode: string,
  strip_barcode: string
}

/**
 * Fetches data from REDCap, which is used by lab researchers for processing
 * specimen kits.
 */
export class REDCapRetriever {
  private readonly api: AxiosInstance;
  private readonly config: REDCapConfig;

  constructor(api: AxiosInstance, config: REDCapConfig) {
    this.api = api;
    this.config = config;
  }

  private validateReportRow(row: AtHomeData): boolean {
    return row.date_receieved != null &&
      row.box_barcode != null &&
      row.utm_barcode != null &&
      row.rdt_barcode != null &&
      row.strip_barcode != null
  }

  public async getAtHomeData(): Promise<KitRecord[]> {
    // Form encoding
    const data = `token=${this.config.apiToken}&` +
      `content=report&` +
      `report_id=${this.config.homeDataReportId}&` +
      `format=json&` +
      `returnFormat=json`;

    const report = await this.api.post<AtHomeData[]>("", data, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    if (!report.data.every(row => this.validateReportRow(row))) {
      throw Error("Report for @Home data is not in the expected format");
    }

    return report.data.map(row => ({
      dateReceived: row.date_receieved,
      boxBarcode: row.box_barcode,
      utmBarcode: row.utm_barcode,
      rdtBarcode: row.rdt_barcode,
      stripBarcode: row.strip_barcode
    }));
  }
}
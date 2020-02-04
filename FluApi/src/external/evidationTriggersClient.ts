// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { sheets_v4 } from "googleapis";

export interface Trigger {
  evidationId: string;
  triggerDate: string;
}

/**
 * Client for interacting with Evidation-owned Google sheet for trigger dates.
 */
export class EvidationTriggersClient {
  private readonly api: sheets_v4.Sheets;

  constructor(api: sheets_v4.Sheets) {
    this.api = api;
  }

  /**
   * Retrieves sheet data from a Google sheet.  Assumes that data should be
   * returned from the first sheet within the spreadsheet.
   *
   * @param id Google's unique identifier for the spreadsheet
   */
  public async getSheetData(id: string): Promise<Trigger[]> {
    const spreadsheet = await this.api.spreadsheets.get({
      spreadsheetId: id,
      includeGridData: true,
    });

    const sheet = spreadsheet.data.sheets[0];
    const data = sheet.data[0];

    const kits = data.rowData
      .slice(1)
      .filter(row => row.values[1].formattedValue != null)
      .map(row => {
        const evidationId = row.values[0].formattedValue;
        const triggerDate = row.values[1].formattedValue;

        return {
          evidationId,
          triggerDate,
        };
      });

    return kits;
  }
}

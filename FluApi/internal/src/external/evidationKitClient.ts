// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { sheets_v4 } from "googleapis";

export interface ShippedKit {
  identifier: string;
  accessionNumber: string;
  email: string;
  birthdate: string;
  sex: string;
  city: string;
  state: string;
  postalCode: string;
  orderedAt: string;
}

/**
 * Client for interacting with Evidation-owned Google sheet.
 */
export class EvidationKitClient {
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
  public async getSheetData(id: string): Promise<ShippedKit[]> {
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
        const accessionNumber = row.values[1].formattedValue;

        if (!/^[\d\w]{10}$/.test(accessionNumber)) {
          throw Error(
            `Invalid barcode when importing Evidation kits, ${accessionNumber}`
          );
        }

        const state = row.values[6].formattedValue;

        if (!/^\w{2}$/.test(state)) {
          throw Error(`Invalid state when importing Evidation kits, ${state}`);
        }

        return {
          identifier: row.values[0].formattedValue,
          accessionNumber,
          email: row.values[2].formattedValue,
          birthdate: row.values[3].formattedValue,
          sex: row.values[4].formattedValue,
          city: row.values[5].formattedValue,
          state,
          postalCode: row.values[7].formattedValue,
          orderedAt: row.values[8].formattedValue,
        };
      });

    return kits;
  }
}

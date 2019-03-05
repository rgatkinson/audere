// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { AddressInfo } from "audere-lib/feverProtocol";
import { Batch } from "./surveyBatchData";
import { GeocodingService } from "../geocodingService";
import { PIIReport, RenderResult } from "./piiReport";
import { parse } from "json2csv";
import logger from "../../util/logger";

export interface Participant {
  workflowId?: number;
  surveyId: number;
  firstName: string;
  lastName: string;
  homeAddress: AddressInfo;
  email: string;
  timestamp: string;
}

export abstract class UWParticipantReport extends PIIReport<Participant> {
  protected abstract geocoder: GeocodingService;

  public async buildReport(batch: Batch<Participant>): Promise<RenderResult> {
    const addresses = new Map();
    batch.items.forEach(i => addresses.set(i.workflowId, [i.homeAddress]));
    const geocodedAddresses = await this.geocoder.geocodeAddresses(addresses);

    const rows = [];
    const discarded = [];

    batch.items.forEach(i => {
      const geocoded = geocodedAddresses.find(a => a.id === i.workflowId);

      if (geocoded != null) {
        const row = {
          "First Name": i.firstName,
          "Last Name": i.lastName,
          "Address 1": geocoded.address.address1,
          "Address 2": geocoded.address.address2,
          City: geocoded.address.city,
          State: geocoded.address.state,
          Zip: geocoded.address.postalCode,
          Email: i.email,
          Timestamp: i.timestamp,
          "Workflow ID": i.workflowId.toFixed(),
          "Audere System ID": i.surveyId.toFixed()
        };

        rows.push(row);
      } else {
        logger.error(
          "Discarded a participant because the address for survey " +
            +i.surveyId +
            " did not return successfully from geocoding."
        );
        discarded.push(i.workflowId);
      }
    });

    const csv = rows.length > 0 ? parse(rows, { header: true }) : undefined;
    return { report: csv, discarded: discarded };
  }
}

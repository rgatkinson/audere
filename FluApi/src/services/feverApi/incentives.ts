// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { IncentiveRecipients } from "./incentiveRecipients";
import { GeocodingService } from "../geocodingService";
import { SharePointUploader } from "./sharePointUploader";
import { parse } from "json2csv";
import logger from "../../util/logger";

export interface IncentiveRow {
  "First Name": string;
  "Last Name": string;
  "Address 1": string;
  "Address 2": string;
  "City": string;
  "State": string;
  "Zip": string;
  "Email": string;
  "Timestamp": string;
  "Workflow ID": number;
  "Audere System ID": number;
}

/**
 * Orchestrates sending incentives to the UW.
 */
export class Incentives {
  private readonly recipients: IncentiveRecipients;
  private readonly geocoder: GeocodingService;
  private readonly uploader: SharePointUploader;

  constructor(
    recipients: IncentiveRecipients,
    geocoder: GeocodingService,
    uploader: SharePointUploader
  ) {
    this.recipients = recipients;
    this.geocoder = geocoder;
    this.uploader = uploader;
  }

  public async sendIncentives() {
    const batch = await this.recipients.getBatch();

    if (batch != null) {
      // Address lookup could be stored from kit fulfillment to save us a
      // round-trip but we'll go ahead and make another call, in case there have
      // been any address changes.
      const addresses = new Map();
      batch.items.forEach(i => addresses.set(i.workflowId, [i.homeAddress]));
      const geocodedAddresses = await this.geocoder.geocodeAddresses(addresses);

      const rows = [];
      const discarded = [];

      batch.items.forEach(i => {
        const geocoded = geocodedAddresses.find(a => a.id === i.workflowId);

        if (geocoded != null) {
          const row =  {
            "First Name": i.firstName,
            "Last Name": i.lastName,
            "Address 1": geocoded.address.address1,
            "Address 2": geocoded.address.address2,
            "City": geocoded.address.city,
            "State": geocoded.address.state,
            "Zip": geocoded.address.postalCode,
            "Email": i.email,
            "Timestamp": i.timestamp,
            "Workflow ID": i.workflowId.toFixed(),
            "Audere System ID": i.surveyId.toFixed()
          }

          rows.push(row);
        } else {
          logger.error("Discarded an incentive because the address for " +
            "survey " + i.surveyId + " did not return successfully from " +
            "geocoding.");
          discarded.push(i.workflowId);
        }
      });

      if (rows.length > 0) {
        const csv = parse(rows, { header: true });
        await this.uploader.sendFile(batch.id, csv);
      }

      await this.recipients.commitUploadedBatch(batch.id, discarded);
    } else {
      logger.info("No incentives to publish.")
    }
  }
}
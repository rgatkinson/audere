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
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  email: string;
  timestamp: string;
  workflowId: number;
  systemId: number;
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
            firstName: i.firstName,
            lastName: i.lastName,
            address1: geocoded.address.address1,
            address2: geocoded.address.address2,
            city: geocoded.address.city,
            state: geocoded.address.state,
            zip: geocoded.address.postalCode,
            email: i.email,
            timestamp: i.timestamp,
            workflowId: i.workflowId,
            systemId: i.surveyId
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
        const csv = parse(rows, { header: false });
        await this.uploader.sendFile(batch.id, csv);
      }

      await this.recipients.commitUploadedBatch(batch.id, discarded);
    } else {
      logger.info("No incentives to publish.")
    }
  }
}
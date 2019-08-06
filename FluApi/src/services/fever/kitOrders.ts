// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  AddressInfo,
  AddressInfoUse,
  PIIInfo,
  TelecomInfoSystem,
} from "audere-lib/feverProtocol";
import { Batch, BatchItemWithCsruid } from "./surveyBatchData";
import { PIIReport, RenderResult } from "./piiReport";
import { KitRecipientsDataAccess } from "./kitOrdersData";
import { S3Uploader } from "../../external/s3Uploader";
import { SurveyAttributes } from "../../models/db/fever";
import { GeocodingService } from "../geocodingService";
import { parse } from "json2csv";
import logger from "../../util/logger";

export interface KitRecipient {
  workflowId?: number;
  surveyId: number;
  firstName: string;
  lastName: string;
  homeAddress: AddressInfo;
  email: string;
  timestamp: string;
}

/**
 * Generates a report of recipients for kit fulfillment.
 */
export class KitOrders extends PIIReport<BatchItemWithCsruid, KitRecipient> {
  protected readonly report = "Kit Orders";
  private readonly geocoder;
  private readonly uploader;

  constructor(
    dao: KitRecipientsDataAccess,
    geocoder: GeocodingService,
    uploader: S3Uploader
  ) {
    super(dao);
    this.geocoder = geocoder;
    this.uploader = uploader;
  }

  /**
   * Render output report based on the collected batch data.
   */
  public async buildReport(batch: Batch<KitRecipient>): Promise<RenderResult> {
    const addresses: Map<string, AddressInfo[]> = new Map();
    batch.items.forEach(i =>
      addresses.set(i.workflowId.toString(), [i.homeAddress])
    );
    logger.info(`[${this.report}] Validating report addresses`);
    const geocodedAddresses = await this.geocoder.geocodeAddresses(addresses);

    const rows = [];
    const discarded = [];

    batch.items.forEach(i => {
      const geocoded = geocodedAddresses.find(
        a => a.id === i.workflowId.toString()
      );

      if (geocoded != null) {
        const row = {
          "First Name": i.firstName,
          "Last Name": i.lastName,
          "Address 1": geocoded.addresses[0].address1,
          "Address 2": geocoded.addresses[0].address2,
          City: geocoded.addresses[0].city,
          State: geocoded.addresses[0].state,
          Zip: geocoded.addresses[0].postalCode,
          Email: i.email,
          Timestamp: i.timestamp,
          "Workflow ID": i.workflowId.toFixed(),
          "Audere System ID": i.surveyId.toFixed(),
        };

        rows.push(row);
      } else {
        logger.error(
          `[${this.report}] Discarded a participant because the address for ` +
            `survey ${i.surveyId} did not return successfully from geocoding.`
        );
        discarded.push(i.workflowId);
      }
    });

    const csv = rows.length > 0 ? parse(rows, { header: true }) : undefined;
    return { report: csv, discarded: discarded };
  }

  /**
   * Convert an individual database record into a polished representation of
   * information for a report row.
   */
  public transformSurveyData(
    item: BatchItemWithCsruid,
    pii: SurveyAttributes<PIIInfo>
  ): KitRecipient {
    const email = pii.survey.patient.telecom.find(
      t => t.system === TelecomInfoSystem.Email
    );

    const homeAddress = pii.survey.patient.address.find(
      a => a.use === AddressInfoUse.Home
    );

    if (homeAddress == null) {
      throw new Error(
        "A survey without a home address can not be converted " +
          "into an kit order. csruid " +
          item.csruid +
          " may be malformed."
      );
    }

    const recipient: KitRecipient = {
      workflowId: item.workflowId,
      surveyId: item.surveyId,
      firstName: (pii.survey.patient.firstName || "Current").trim(),
      lastName: (pii.survey.patient.lastName || "Resident").trim(),
      homeAddress: homeAddress,
      // This email address is used by the UW for the fulfillment house and
      // for answering questions about the mailing process.
      email: email == null ? undefined : email.value,
      timestamp: pii.survey.workflow.screeningCompletedAt,
    };

    return recipient;
  }

  /**
   * Output the report to S3.
   */
  public async writeReport(batchId: number, report: string): Promise<void> {
    await this.uploader.sendKits(batchId, report);
  }
}

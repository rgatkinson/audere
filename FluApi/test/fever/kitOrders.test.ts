// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { instance, mock, when, anything, anyString, capture } from "ts-mockito";
import { GeocodingService } from "../../src/services/geocodingService";
import { SharePointUploader } from "../../src/external/sharePointUploader";
import { Batch } from "../../src/services/fever/surveyBatchData";
import { makeRandomKitReceipient, makeRandomGeoResponse } from "./reportTestUtil";
import parse from "csv-parse/lib/sync";
import { KitOrders, KitRecipient } from "../../src/services/fever/kitOrders";
import { KitRecipientsDataAccess } from "../../src/services/fever/kitOrdersData";

export class TestKitOrders extends KitOrders {
  private readonly batch: Batch<KitRecipient>;

  constructor(
    batch: Batch<KitRecipient>,
    dao: KitRecipientsDataAccess,
    geocoder: GeocodingService,
    uploader: SharePointUploader
  ) {
    super(dao, geocoder, uploader);
    this.batch = batch;
  }

  public async getBatch(): Promise<Batch<KitRecipient> | null> {
    return Promise.resolve(this.batch);
  }
}

describe("sending kit orders", () => {
  it("should convert output to CSV format", async () => {
    const items = [
      makeRandomKitReceipient(2),
      makeRandomKitReceipient(3),
      makeRandomKitReceipient(4),
      makeRandomKitReceipient(5)
    ];
    const batch = { id: 8, items: items };

    const dao = mock(KitRecipientsDataAccess);
    when(dao.commitUploadedBatch(batch.id, [])).thenResolve();

    const geoResponses = items.map(makeRandomGeoResponse);
    const geocoder = mock(GeocodingService);
    when(geocoder.geocodeAddresses(anything())).thenResolve(geoResponses);

    const uploader = mock(SharePointUploader);
    when(uploader.sendKits(batch.id, anyString())).thenResolve();

    const i = new TestKitOrders(
      batch,
      instance(dao),
      instance(geocoder),
      instance(uploader)
    );
    await i.generateReport();

    const contents = capture(uploader.sendKits).first()[1];
    const rows: string[][] = parse(contents).slice(1);

    items.forEach(item => {
      const geo = geoResponses.find(r => r.id === item.workflowId);
      const contains = rows.some(row => {
        // These row indices follow the CSV format created for UW reports in
        // UWParticipantReport.
        return (
          row[0] === item.firstName &&
          row[1] === item.lastName &&
          row[2] === geo.address.address1 &&
          row[3] === geo.address.address2 &&
          row[4] === geo.address.city &&
          row[5] === geo.address.state &&
          row[6] === geo.address.postalCode &&
          row[7] === item.email &&
          row[8] === item.timestamp &&
          row[9] === item.workflowId.toFixed() &&
          row[10] === item.surveyId.toFixed()
        );
      });

      expect(contains).toBe(true);
    });
  });

  it("should discard rows that can't be geocoded", async () => {
    const items = [makeRandomKitReceipient(11), makeRandomKitReceipient(12)];
    const batch = { id: 24, items: items };

    const dao = mock(KitRecipientsDataAccess);
    when(dao.commitUploadedBatch(batch.id, [11, 12])).thenResolve();

    const geocoder = mock(GeocodingService);
    when(geocoder.geocodeAddresses(anything())).thenResolve([]);

    const i = new TestKitOrders(
      batch,
      instance(dao),
      instance(geocoder),
      undefined
    );
    await i.generateReport();
  });
});

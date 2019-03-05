// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  Incentives,
  IncentiveRecipientsDataAccess
} from "../../src/services/feverApi/incentiveRecipients";
import { Participant } from "../../src/services/feverApi/uwParticipantReport";
import { instance, mock, when, anything, anyString, capture } from "ts-mockito";
import { GeocodingService } from "../../src/services/geocodingService";
import { SharePointUploader } from "../../src/services/feverApi/sharePointUploader";
import { Batch } from "../../src/services/feverApi/surveyBatchData";
import { makeRandomParticipant, makeRandomGeoResponse } from "./reportTestUtil";
import parse from "csv-parse/lib/sync";

export class TestIncentives extends Incentives {
  private readonly batch: Batch<Participant>;

  constructor(
    batch: Batch<Participant>,
    dao: IncentiveRecipientsDataAccess,
    geocoder: GeocodingService,
    uploader: SharePointUploader
  ) {
    super(dao, geocoder, uploader);
    this.batch = batch;
  }

  public async getBatch(): Promise<Batch<Participant> | null> {
    return Promise.resolve(this.batch);
  }
}

describe("sending incentives", () => {
  it("should convert output to CSV format", async () => {
    const items = [
      makeRandomParticipant(2),
      makeRandomParticipant(3),
      makeRandomParticipant(4),
      makeRandomParticipant(5)
    ];
    const batch = { id: 8, items: items };

    const dao = mock(IncentiveRecipientsDataAccess);
    when(dao.commitUploadedBatch(batch.id, [])).thenResolve();

    const geoResponses = items.map(makeRandomGeoResponse);
    const geocoder = mock(GeocodingService);
    when(geocoder.geocodeAddresses(anything())).thenResolve(geoResponses);

    const uploader = mock(SharePointUploader);
    when(uploader.sendIncentives(batch.id, anyString())).thenResolve();

    const i = new TestIncentives(
      batch,
      instance(dao),
      instance(geocoder),
      instance(uploader)
    );
    await i.generateReport();

    const contents = capture(uploader.sendIncentives).first()[1];
    const rows: string[][] = parse(contents).slice(1);

    items.forEach(item => {
      const geo = geoResponses.find(r => r.id === item.workflowId);
      const contains = rows.some(row => {
        return (
          row[0] === item.firstName &&
          row[1] === item.lastName &&
          row[2] === geo.address.address1 &&
          row[9] === item.workflowId.toFixed() &&
          row[10] === item.surveyId.toFixed()
        );
      });

      expect(contains).toBe(true);
    });
  });

  it("should discard rows that can't be geocoded", async () => {
    const items = [makeRandomParticipant(11), makeRandomParticipant(12)];
    const batch = { id: 24, items: items };

    const dao = mock(IncentiveRecipientsDataAccess);
    when(dao.commitUploadedBatch(batch.id, [11, 12])).thenResolve();

    const geocoder = mock(GeocodingService);
    when(geocoder.geocodeAddresses(anything())).thenResolve([]);

    const i = new TestIncentives(
      batch,
      instance(dao),
      instance(geocoder),
      undefined
    );
    await i.generateReport();
  });
});

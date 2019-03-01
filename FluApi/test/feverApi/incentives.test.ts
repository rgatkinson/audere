// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { IncentiveRecipient, IncentiveRecipients } from "../../src/services/feverApi/incentiveRecipients";
import { instance, mock, when, anyNumber, anything, anyString, capture } from "ts-mockito";
import { GeocodingService } from "../../src/services/geocodingService";
import { GeocodingResponse } from "../../src/models/geocoding";
import { AddressInfoUse } from "audere-lib/snifflesProtocol";
import { SharePointUploader } from "../../src/services/feverApi/sharePointUploader";
import { Incentives } from "../../src/services/feverApi/incentives";
import parse from "csv-parse/lib/sync";

describe("sending incentives", () => {
  function makeString(): string {
    return Math.random().toString(36).substring(6);
  }

  function makeGeoResponse(
    recipient: IncentiveRecipient
  ): GeocodingResponse {
    return {
      id: recipient.workflowId,
      use: AddressInfoUse.Home,
      address: {
        canonicalAddress: makeString(),
        address1: makeString(),
        address2: makeString(),
        city: makeString(),
        state: makeString(),
        postalCode: makeString(),
        latitude: 1,
        longitude: 1,
        censusTract: makeString()
      }
    }
  }

  function makeRecipient(num: number): IncentiveRecipient {
    return {
      workflowId: num,
      surveyId: Math.random(),
      firstName: makeString(),
      lastName: makeString(),
      homeAddress: undefined,
      email: "email" + num + "@mail.com",
      timestamp: makeString()
    }
  }

  it("should convert output to CSV format", async () => {
    const items = [
      makeRecipient(2),
      makeRecipient(3),
      makeRecipient(4),
      makeRecipient(5)
    ];
    const batch = { id: 8, items: items };

    const recipients = mock(IncentiveRecipients);
    when(recipients.getBatch()).thenResolve(batch);
    when(recipients.commitUploadedBatch(batch.id, [])).thenResolve();

    const geoResponses = items.map(makeGeoResponse);
    const geocoder = mock(GeocodingService);
    when(geocoder.geocodeAddresses(anything())).thenResolve(geoResponses);

    const uploader = mock(SharePointUploader);
    when(uploader.sendFile(batch.id, anyString())).thenResolve();

    const i = new Incentives(
      instance(recipients),
      instance(geocoder),
      instance(uploader)
    );
    await i.sendIncentives();

    const contents = capture(uploader.sendFile).first()[1];
    const rows: string[][] = parse(contents);

    items.forEach(item => {
      const geo = geoResponses.find(r => r.id === item.workflowId);
      const contains = rows.some(row => {
        return row[0] === item.firstName &&
          row[1] === item.lastName &&
          row[2] === geo.address.address1 &&
          row[9] === item.workflowId.toString() &&
          row[10] === item.surveyId.toString();
      });

      expect(contains).toBe(true);
    });
  });

  it("should discard rows that can't be geocoded", async () => {
    const items = [
      makeRecipient(11),
      makeRecipient(12)
    ];
    const batch = { id: 24, items: items };

    const recipients = mock(IncentiveRecipients);
    when(recipients.getBatch()).thenResolve(batch);

    const geocoder = mock(GeocodingService);
    when(geocoder.geocodeAddresses(anything())).thenResolve([]);

    const i = new Incentives(
      instance(recipients),
      instance(geocoder),
      undefined
    );
    await i.sendIncentives();
  });
});
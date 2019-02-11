// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { anything, instance, mock, verify, when } from "ts-mockito";
import { HutchUploader } from "../../src/external/hutchUploader";
import { EncountersService } from "../../src/services/encountersService";
import { GeocodingService } from "../../src/services/geocodingService";
import { VisitsService } from "../../src/services/visitsService";
import { PIIVisitDetails } from "../../src/models/visitDetails";
import { AddressInfoUse } from "audere-lib/snifflesProtocol";
import { GeocodingResponse } from "../../src/models/geocoding";

describe("encounters service", () => {
  const details: PIIVisitDetails = {
    id: 1,
    csruid: "test",
    visitInfo: {
      complete: true,
      events: [],
      samples: [],
      giftcards: [],
      responses: [
        {
          id: "r1",
          item: [
            {
              id: "r1",
              text: "Do you like cookies?",
              answer: [
                {
                  valueString: "Yes"
                }
              ]
            }
          ]
        }
      ]
    },
    consentDate: "2019-04-05",
    patientInfo: {
      name: "Patient Zero",
      birthDate: "1/1/2000",
      telecom: [],
      address: [
        {
          use: AddressInfoUse.Home,
          line: [],
          city: "Seattle",
          state: "WA",
          postalCode: "98101",
          country: "US"
        }
      ]
    }
  };

  describe("get encounters", () => {
    it("should scrub participant and id fields", async () => {
      const numToRetrieve = 20;

      const geocoderMock = mock(GeocodingService);
      when(geocoderMock.geocodeAddresses(anything())).thenResolve([]);

      const visitsMock = mock(VisitsService);
      when(visitsMock.retrievePendingDetails(numToRetrieve))
        .thenResolve(new Map([[details.id, details]]));

      const encountersService = new EncountersService(
        instance(geocoderMock),
        undefined,
        instance(visitsMock)
      );
      const result = await encountersService.getEncounters(numToRetrieve);

      verify(visitsMock.retrievePendingDetails(numToRetrieve)).called();
      expect(result.size).toBe(1)
      expect(result.has(details.id)).toBe(true);

      // Does not contain common 
      const encounter = result.get(details.id);
      expect(encounter.id).toBe(details.csruid.substr(0, 121));
      expect(encounter.participant.includes(details.patientInfo.name))
        .toBe(false);
      expect(encounter.participant.includes(details.patientInfo.birthDate))
        .toBe(false);
    });

    it("should scrub address data by geocoding and append census tract", async () => {
      const numToRetrieve = 20;
      const homeAddress: GeocodingResponse = {
        id: details.id,
        use: AddressInfoUse.Home,
        address: {
          canonicalAddress: "Home",
          latitude: 10,
          longitude: -10,
          postalCode: "99999",
          censusTract: "12345"
        }
      };
      const workAddress: GeocodingResponse = {
        id: details.id,
        use: AddressInfoUse.Work,
        address: {
          canonicalAddress: "Work",
          latitude: -20,
          longitude: 20,
          postalCode: "99999",
          censusTract: "54321"
        }
      };

      const geocoderMock = mock(GeocodingService);
      when(geocoderMock.geocodeAddresses(anything())).thenResolve([
        homeAddress,
        workAddress
      ]);

      const visitsMock = mock(VisitsService);
      when(visitsMock.retrievePendingDetails(numToRetrieve)).thenResolve(
        new Map([[1, details]])
      );

      const encountersService = new EncountersService(
        instance(geocoderMock),
        undefined,
        instance(visitsMock)
      );
      const result = await encountersService.getEncounters(numToRetrieve);

      verify(visitsMock.retrievePendingDetails(numToRetrieve)).called();
      expect(result.size).toBe(1);
      expect(result.has(1)).toBe(true);

      const encounter = result.get(1);
      expect(encounter.household).not.toBeUndefined();
      const homeId = encounter.household.id
      expect(homeId.includes(homeAddress.address.canonicalAddress)).toBe(false);
      expect(encounter.household.region).toBe(homeAddress.address.censusTract);

      expect(encounter.workplace).not.toBeUndefined();
      const workId = encounter.workplace.id
      expect(workId.includes(workAddress.address.canonicalAddress))
        .toBe(false);
      expect(encounter.workplace.region).toBe(workAddress.address.censusTract);
    });
  });

  describe("send encounters", () => {
    it("should send encounters to the Hutch endpoint", async () => {
      const numToRetrieve = 20;
      
      const uploaderMock = mock(HutchUploader);
      when(uploaderMock.uploadEncounters(anything())).thenResolve();
      when(uploaderMock.commitUploads(anything())).thenResolve([details.id]);

      const geocoderMock = mock(GeocodingService);
      when(geocoderMock.geocodeAddresses(anything())).thenResolve([]);

      const visitsMock = mock(VisitsService);
      when(visitsMock.retrievePendingDetails(numToRetrieve)).thenResolve(
        new Map([[details.id, details]])
      );

      const encountersService = new EncountersService(
        instance(geocoderMock),
        instance(uploaderMock),
        instance(visitsMock)
      );
      const result = await encountersService.sendEncounters(numToRetrieve);

      verify(visitsMock.retrievePendingDetails(numToRetrieve)).called();
      verify(uploaderMock.uploadEncounters(anything())).called();
      expect(result.sent.includes(details.id)).toBe(true);
      expect(result.erred).toHaveLength(0);
    });
  });
});

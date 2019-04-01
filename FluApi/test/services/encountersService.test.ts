// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import _ from "lodash";
import { anything, instance, mock, verify, when } from "ts-mockito";
import { HutchUploader } from "../../src/external/hutchUploader";
import { canonicalizeName, EncountersService } from "../../src/services/sniffles/encountersService";
import { GeocodingService } from "../../src/services/geocodingService";
import { VisitsService } from "../../src/services/sniffles/visitsService";
import { PIIVisitDetails } from "../../src/models/visitDetails";
import { AddressInfoUse } from "audere-lib/snifflesProtocol";
import { GeocodingResponse } from "../../src/models/geocoding";
import { LocationUse } from "audere-lib/hutchProtocol";

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
      birthDate: "1960-01-01",
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
      when(visitsMock.retrievePendingDetails(numToRetrieve)).thenResolve(
        new Map([[details.id, details]])
      );

      const encountersService = new EncountersService(
        instance(geocoderMock),
        undefined,
        instance(visitsMock),
        "secret"
      );
      const result = await encountersService.getEncounters(numToRetrieve);

      verify(visitsMock.retrievePendingDetails(numToRetrieve)).called();
      expect(result.size).toBe(1);
      expect(result.has(details.id)).toBe(true);

      const encounter = result.get(details.id);

      const birthDate = new Date(details.patientInfo.birthDate);
      const expectedAge =
        new Date(details.consentDate).getFullYear() - birthDate.getFullYear();
      expect(encounter.age.ninetyOrAbove).toBe(false);
      expect(encounter.age.value).toBeGreaterThanOrEqual(expectedAge - 1);
      expect(encounter.age.value).toBeLessThanOrEqual(expectedAge + 1);

      expect(encounter.id).toBe(details.csruid.substr(0, 121));
      expect(encounter.participant.includes(details.patientInfo.name)).toBe(
        false
      );
      expect(
        encounter.participant.includes(details.patientInfo.birthDate)
      ).toBe(false);
    });

    it("should filter ages above 90", async () => {
        const geocoderMock = mock(GeocodingService);
        when(geocoderMock.geocodeAddresses(anything())).thenResolve([]);

        const visitsMock = mock(VisitsService);
        const olderDetails = _.cloneDeepWith(details);
        olderDetails.patientInfo.birthDate = "1900-01-01";
        when(visitsMock.retrievePendingDetails(20)).thenResolve(
          new Map([[details.id, olderDetails]])
        );

        const encountersService = new EncountersService(
          instance(geocoderMock),
          undefined,
          instance(visitsMock),
          "secret"
        );
        const result = await encountersService.getEncounters(20);

        const encounter = result.get(details.id);
        expect(encounter.age.ninetyOrAbove).toBe(true);
    });

    it("should ignore invalid birth dates", async () => {
      const geocoderMock = mock(GeocodingService);
      when(geocoderMock.geocodeAddresses(anything())).thenResolve([]);

      const visitsMock = mock(VisitsService);
      const badDetails = _.cloneDeepWith(details);
      badDetails.patientInfo.birthDate = "A long time ago in a galaxy far far away";
      when(visitsMock.retrievePendingDetails(20)).thenResolve(
        new Map([[details.id, badDetails]])
      );

      const encountersService = new EncountersService(
        instance(geocoderMock),
        undefined,
        instance(visitsMock),
        "secret"
      );
      const result = await encountersService.getEncounters(20);

      const encounter = result.get(details.id);
      expect(encounter.age).toBeUndefined();
    });

    it("should error when multiple addresses of a single type are present", async () => {
      const numToRetrieve = 20;
      const detailsClone = _.cloneDeep(details);
      detailsClone.patientInfo.address.push({
        use: AddressInfoUse.Work,
        line: [],
        city: "Seattle",
        state: "WA",
        postalCode: "98101",
        country: "US"
      });
      detailsClone.patientInfo.address.push({
        use: AddressInfoUse.Work,
        line: [],
        city: "Tacoma",
        state: "WA",
        postalCode: "98102",
        country: "US"
      });
      const visitsMock = mock(VisitsService);
      when(visitsMock.retrievePendingDetails(numToRetrieve)).thenResolve(
        new Map([[1, detailsClone]])
      );

      const encountersService = new EncountersService(
        undefined,
        undefined,
        instance(visitsMock),
        "secret"
      );

      const result = encountersService.getEncounters(numToRetrieve);
      expect(result).rejects.toThrow();
    });

    it("should scrub address data by geocoding and append census tract", async () => {
      const numToRetrieve = 20;
      const homeAddress: GeocodingResponse = {
        id: details.id,
        use: AddressInfoUse.Home,
        address: {
          canonicalAddress: "Home",
          address1: "123 Street",
          city: "West Someplace",
          state: "AB",
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
          address1: "123 Avenue",
          city: "East Bay",
          state: "CD",
          latitude: -20,
          longitude: 20,
          postalCode: "99999",
          censusTract: "54321"
        }
      };
      const tempAddress: GeocodingResponse = {
        id: details.id,
        use: AddressInfoUse.Temp,
        address: {
          canonicalAddress: "Temp",
          address1: "123 Place",
          city: "North Metropolis",
          state: "EF",
          latitude: 0,
          longitude: 100,
          postalCode: "99997",
          censusTract: "88888"
        }
      };

      const geocoderMock = mock(GeocodingService);
      when(geocoderMock.geocodeAddresses(anything())).thenResolve([
        homeAddress,
        workAddress,
        tempAddress
      ]);

      const detailsClone = _.cloneDeep(details);
      detailsClone.patientInfo.address.push({
        use: AddressInfoUse.Work,
        line: [],
        city: "Seattle",
        state: "WA",
        postalCode: "98101",
        country: "US"
      });
      detailsClone.patientInfo.address.push({
        use: AddressInfoUse.Temp,
        line: [],
        city: "Tacoma",
        state: "WA",
        postalCode: "98102",
        country: "US"
      });
      const visitsMock = mock(VisitsService);
      when(visitsMock.retrievePendingDetails(numToRetrieve)).thenResolve(
        new Map([[1, detailsClone]])
      );

      const encountersService = new EncountersService(
        instance(geocoderMock),
        undefined,
        instance(visitsMock),
        "secret"
      );
      const result = await encountersService.getEncounters(numToRetrieve);

      verify(visitsMock.retrievePendingDetails(numToRetrieve)).called();
      expect(result.size).toBe(1);
      expect(result.has(1)).toBe(true);

      const encounter = result.get(1);
      expect(encounter.locations).toHaveLength(3);

      expect(encounter.locations).toContainEqual(
        expect.objectContaining({
          use: LocationUse.Home,
          id: expect.not.stringContaining(homeAddress.address.canonicalAddress),
          region: homeAddress.address.censusTract
        })
      );

      expect(encounter.locations).toContainEqual(
        expect.objectContaining({
          use: LocationUse.Work,
          id: expect.not.stringContaining(workAddress.address.canonicalAddress),
          region: workAddress.address.censusTract
        })
      );

      expect(encounter.locations).toContainEqual(
        expect.objectContaining({
          use: LocationUse.Temp,
          id: expect.not.stringContaining(tempAddress.address.canonicalAddress),
          region: tempAddress.address.censusTract
        })
      );
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
        instance(visitsMock),
        "secret"
      );
      const result = await encountersService.sendEncounters(numToRetrieve);

      verify(visitsMock.retrievePendingDetails(numToRetrieve)).called();
      verify(uploaderMock.uploadEncounters(anything())).called();
      expect(result.sent.includes(details.id)).toBe(true);
      expect(result.erred).toHaveLength(0);
    });
  });
});

describe("canonicalizeName", () => {
  it("removes all ASCII punctuation and keeps alpha-numerics", () => {
    expect(canonicalizeName("`1234567890-=~!@#$%^&*()_+"))
      .toEqual("1234567890");
    expect(canonicalizeName("qwertyuiop[]\\QWERTYUIOP{}|"))
      .toEqual("QWERTYUIOPQWERTYUIOP");
    expect(canonicalizeName("asdfghjkl;'ASDFGHJKL:\""))
      .toEqual("ASDFGHJKLASDFGHJKL");
    expect(canonicalizeName("zxcvbnm,./ZXCVBNM<>?"))
      .toEqual("ZXCVBNMZXCVBNM");
  });

  it("collapses sequences of whitespace", () => {
    expect(canonicalizeName("The \t\n, quick   brown fox"))
      .toEqual("THE QUICK BROWN FOX");
    expect(canonicalizeName("  jumps\t\tover\n\n\nthe   .  "))
      .toEqual(" JUMPS OVER THE ");
    expect(canonicalizeName("lazydog"))
      .toEqual("LAZYDOG");
  });

  it("Removes Spanish punctuation", () => {
    expect(canonicalizeName("¿¡Y tú quién te crees!?"))
      .toEqual("Y TÚ QUIÉN TE CREES");
  });
});

// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import _ from "lodash";
import { anything, instance, mock, verify, when } from "ts-mockito";
import { HutchUploader } from "../../src/external/hutchUploader";
import {
  canonicalizeName,
  EncountersService
} from "../../src/services/encountersService";
import { GeocodingService } from "../../src/services/geocodingService";
import {
  EncounterDetailsService,
  Release
} from "../../src/services/encounterDetailsService";
import { PIIEncounterDetails } from "../../src/models/encounterDetails";
import { AddressInfoUse, PatientInfoGender } from "audere-lib/common";
import { GeocodingResponse } from "../../src/models/geocoding";
import { LocationUse } from "audere-lib/hutchProtocol";

describe("encounters service", () => {
  const details: PIIEncounterDetails = {
    id: 1,
    csruid: "test",
    consentDate: "2019-04-05",
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
    ],
    addresses: [
      {
        use: AddressInfoUse.Home,
        value: {
          line: [],
          city: "Seattle",
          state: "WA",
          postalCode: "98101",
          country: "US"
        }
      }
    ],
    samples: [],
    events: [],
    birthDate: "1960-01-01",
    gender: PatientInfoGender.Unknown,
    fullName: "Patient Zero"
  };

  describe("get encounters", () => {
    it("should scrub participant and id fields", async () => {
      const geocoderMock = mock(GeocodingService);
      when(geocoderMock.geocodeAddresses(anything())).thenResolve([]);

      const detailsMock = mock(EncounterDetailsService);
      when(detailsMock.retrieveDetails()).thenResolve([
        {
          key: { id: details.id, release: Release.Sniffles },
          encounter: details
        }
      ]);

      const encountersService = new EncountersService(
        instance(geocoderMock),
        undefined,
        instance(detailsMock),
        "secret"
      );
      const result = await encountersService.getEncounters();

      verify(detailsMock.retrieveDetails()).called();
      expect(result.length).toBe(1);
      expect(result[0].key).toEqual({
        id: details.id,
        release: Release.Sniffles
      });

      const birthDate = new Date(details.birthDate);
      const expectedAge =
        new Date(details.consentDate).getFullYear() - birthDate.getFullYear();
      expect(result[0].encounter.age.ninetyOrAbove).toBe(false);
      expect(result[0].encounter.age.value).toBeGreaterThanOrEqual(
        expectedAge - 1
      );
      expect(result[0].encounter.age.value).toBeLessThanOrEqual(
        expectedAge + 1
      );

      expect(result[0].encounter.id).toBe(details.csruid.substr(0, 121));
      expect(result[0].encounter.participant.includes(details.fullName)).toBe(
        false
      );
      expect(result[0].encounter.participant.includes(details.birthDate)).toBe(
        false
      );
    });

    it("should filter ages above 90", async () => {
      const geocoderMock = mock(GeocodingService);
      when(geocoderMock.geocodeAddresses(anything())).thenResolve([]);

      const detailsMock = mock(EncounterDetailsService);
      const olderDetails = _.cloneDeepWith(details);
      olderDetails.birthDate = "1900-01-01";
      when(detailsMock.retrieveDetails()).thenResolve([
        {
          key: { id: details.id, release: Release.Sniffles },
          encounter: olderDetails
        }
      ]);

      const encountersService = new EncountersService(
        instance(geocoderMock),
        undefined,
        instance(detailsMock),
        "secret"
      );
      const result = await encountersService.getEncounters();

      expect(result[0].encounter.age.ninetyOrAbove).toBe(true);
    });

    it("should ignore invalid birth dates", async () => {
      const geocoderMock = mock(GeocodingService);
      when(geocoderMock.geocodeAddresses(anything())).thenResolve([]);

      const detailsMock = mock(EncounterDetailsService);
      const badDetails = _.cloneDeepWith(details);
      badDetails.birthDate = "A long time ago in a galaxy far far away";
      when(detailsMock.retrieveDetails()).thenResolve([
        {
          key: { id: details.id, release: Release.Sniffles },
          encounter: badDetails
        }
      ]);

      const encountersService = new EncountersService(
        instance(geocoderMock),
        undefined,
        instance(detailsMock),
        "secret"
      );
      const result = await encountersService.getEncounters();

      expect(result[0].encounter.age).toBeUndefined();
    });

    it("should error when multiple addresses of a single type are present", async () => {
      const detailsClone = _.cloneDeep(details);
      detailsClone.addresses.push({
        use: AddressInfoUse.Work,
        value: {
          line: [],
          city: "Seattle",
          state: "WA",
          postalCode: "98101",
          country: "US"
        }
      });
      detailsClone.addresses.push({
        use: AddressInfoUse.Work,
        value: {
          line: [],
          city: "Tacoma",
          state: "WA",
          postalCode: "98102",
          country: "US"
        }
      });
      const detailsMock = mock(EncounterDetailsService);
      when(detailsMock.retrieveDetails()).thenResolve([
        {
          key: { id: details.id, release: Release.Sniffles },
          encounter: detailsClone
        }
      ]);

      const encountersService = new EncountersService(
        undefined,
        undefined,
        instance(detailsMock),
        "secret"
      );

      const result = encountersService.getEncounters();
      expect(result).rejects.toThrow();
    });

    it("should scrub address data by geocoding and append census tract", async () => {
      const homeAddress: GeocodingResponse = {
        id: details.id + "_" + Release.Sniffles,
        use: AddressInfoUse.Home,
        addresses: [
          {
            canonicalAddress: "Home",
            address1: "123 Street",
            city: "West Someplace",
            state: "AB",
            latitude: 10,
            longitude: -10,
            postalCode: "99999",
            censusTract: "12345"
          }
        ]
      };
      const workAddress: GeocodingResponse = {
        id: details.id + "_" + Release.Sniffles,
        use: AddressInfoUse.Work,
        addresses: [
          {
            canonicalAddress: "Work",
            address1: "123 Avenue",
            city: "East Bay",
            state: "CD",
            latitude: -20,
            longitude: 20,
            postalCode: "99999",
            censusTract: "54321"
          }
        ]
      };
      const tempAddress: GeocodingResponse = {
        id: details.id + "_" + Release.Sniffles,
        use: AddressInfoUse.Temp,
        addresses: [
          {
            canonicalAddress: "Temp",
            address1: "123 Place",
            city: "North Metropolis",
            state: "EF",
            latitude: 0,
            longitude: 100,
            postalCode: "99997",
            censusTract: "88888"
          }
        ]
      };

      const geocoderMock = mock(GeocodingService);
      when(geocoderMock.geocodeAddresses(anything())).thenResolve([
        homeAddress,
        workAddress,
        tempAddress
      ]);

      const detailsClone = _.cloneDeep(details);
      detailsClone.addresses.push({
        use: AddressInfoUse.Work,
        value: {
          line: [],
          city: "Seattle",
          state: "WA",
          postalCode: "98101",
          country: "US"
        }
      });
      detailsClone.addresses.push({
        use: AddressInfoUse.Temp,
        value: {
          line: [],
          city: "Tacoma",
          state: "WA",
          postalCode: "98102",
          country: "US"
        }
      });
      const detailsMock = mock(EncounterDetailsService);
      when(detailsMock.retrieveDetails()).thenResolve([
        {
          key: { id: details.id, release: Release.Sniffles },
          encounter: detailsClone
        }
      ]);

      const encountersService = new EncountersService(
        instance(geocoderMock),
        undefined,
        instance(detailsMock),
        "secret"
      );
      const result = await encountersService.getEncounters();

      verify(detailsMock.retrieveDetails()).called();
      expect(result.length).toBe(1);
      expect(result[0].key).toEqual({ id: 1, release: Release.Sniffles });

      expect(result[0].encounter.locations).toHaveLength(3);

      expect(result[0].encounter.locations).toContainEqual(
        expect.objectContaining({
          use: LocationUse.Home,
          id: expect.not.stringContaining(
            homeAddress.addresses[0].canonicalAddress
          ),
          region: homeAddress.addresses[0].censusTract
        })
      );

      expect(result[0].encounter.locations).toContainEqual(
        expect.objectContaining({
          use: LocationUse.Work,
          id: expect.not.stringContaining(
            workAddress.addresses[0].canonicalAddress
          ),
          region: workAddress.addresses[0].censusTract
        })
      );

      expect(result[0].encounter.locations).toContainEqual(
        expect.objectContaining({
          use: LocationUse.Temp,
          id: expect.not.stringContaining(
            tempAddress.addresses[0].canonicalAddress
          ),
          region: tempAddress.addresses[0].censusTract
        })
      );
    });
  });

  describe("send encounters", () => {
    it("should send encounters to the Hutch endpoint", async () => {
      const uploaderMock = mock(HutchUploader);
      when(uploaderMock.uploadEncounters(anything())).thenResolve();

      const geocoderMock = mock(GeocodingService);
      when(geocoderMock.geocodeAddresses(anything())).thenResolve([]);

      const detailsMock = mock(EncounterDetailsService);
      when(detailsMock.retrieveDetails()).thenResolve([
        {
          key: { id: details.id, release: Release.Sniffles },
          encounter: details
        }
      ]);
      when(detailsMock.commitUploads(anything())).thenResolve();

      const encountersService = new EncountersService(
        instance(geocoderMock),
        instance(uploaderMock),
        instance(detailsMock),
        "secret"
      );
      await encountersService.sendEncounters();

      verify(detailsMock.retrieveDetails()).called();
      verify(uploaderMock.uploadEncounters(anything())).called();
    });
  });
});

describe("canonicalizeName", () => {
  it("removes all ASCII punctuation and keeps alpha-numerics", () => {
    expect(canonicalizeName("`1234567890-=~!@#$%^&*()_+")).toEqual(
      "1234567890"
    );
    expect(canonicalizeName("qwertyuiop[]\\QWERTYUIOP{}|")).toEqual(
      "QWERTYUIOPQWERTYUIOP"
    );
    expect(canonicalizeName("asdfghjkl;'ASDFGHJKL:\"")).toEqual(
      "ASDFGHJKLASDFGHJKL"
    );
    expect(canonicalizeName("zxcvbnm,./ZXCVBNM<>?")).toEqual("ZXCVBNMZXCVBNM");
  });

  it("collapses sequences of whitespace", () => {
    expect(canonicalizeName("The \t\n, quick   brown fox")).toEqual(
      "THE QUICK BROWN FOX"
    );
    expect(canonicalizeName("  jumps\t\tover\n\n\nthe   .  ")).toEqual(
      " JUMPS OVER THE "
    );
    expect(canonicalizeName("lazydog")).toEqual("LAZYDOG");
  });

  it("Removes Spanish punctuation", () => {
    expect(canonicalizeName("¿¡Y tú quién te crees!?")).toEqual(
      "Y TÚ QUIÉN TE CREES"
    );
  });
});

// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { anything, instance, mock, verify, when } from "ts-mockito";
import { AddressInfo, AddressInfoUse } from "audere-lib/common";
import { GeocodingResponse } from "../../src/models/geocoding";
import { SmartyStreetsResponseModel } from "../../src/models/db/smartyStreetsResponses";
import {
  Geocoder,
  GeocodingService,
  cleanAddressString,
  canonicalizeAddressInfo,
  addressInfosEqual,
} from "../../src/services/geocodingService";
import { CensusTractService } from "../../src/services/censusTractService";
import { AddressDetails } from "../../src/models/encounterDetails";

describe("geocoding service", () => {
  function makeClient(handle: () => GeocodingResponse[]): Geocoder {
    let client: Geocoder = {
      async geocode(
        addresses: Map<string, AddressInfo[]>
      ): Promise<GeocodingResponse[]> {
        return handle();
      },
    };

    return client;
  }

  function makeGeoResponse(
    id: number,
    use: AddressInfoUse,
    request: AddressInfo,
    lat: number,
    lng: number,
    postalCode: string
  ): GeocodingResponse {
    const addressComponents = [
      ...request.line,
      request.city,
      request.state,
      request.postalCode,
    ];

    return {
      id: id.toString(),
      use: use,
      addresses: [
        {
          canonicalAddress: addressComponents.join(", "),
          address1: request.line[0],
          address2: request.line[1],
          city: request.city,
          state: request.state,
          latitude: lat,
          longitude: lng,
          postalCode: postalCode,
        },
      ],
    };
  }

  let homeAddress: AddressDetails = {
    use: AddressInfoUse.Home,
    value: {
      line: ["123 Place"],
      city: "Town",
      state: "PL",
      postalCode: "00000",
      country: "US",
    },
  };

  let homeLat = 4;
  let homeLng = 5;
  let homeZip = "12345";

  let workAddress: AddressDetails = {
    use: AddressInfoUse.Work,
    value: {
      line: ["456 Work"],
      city: "City",
      state: "PL",
      postalCode: "00001",
      country: "US",
    },
  };

  let workLat = -13;
  let workLng = 55;
  let workZip = "88888";

  let visitId = 100;
  let addresses = [homeAddress, workAddress];
  let homeCoded = makeGeoResponse(
    visitId,
    homeAddress.use,
    homeAddress.value,
    homeLat,
    homeLng,
    homeZip
  );
  let workCoded = makeGeoResponse(
    visitId,
    workAddress.use,
    workAddress.value,
    workLat,
    workLng,
    workZip
  );

  const makeMockSmartyStreetsCacheModel = (cachedAddresses = []) => {
    // It's hard to mock sequelize models, hence the weird casting here
    return ({
      cachedResponsesCreated: [],
      findAll() {
        return cachedAddresses;
      },
      bulkCreate(responses) {
        this.cachedResponsesCreated = responses;
      },
      upsert(value) {
        this.cachedResponsesCreated.push(value);
      },
    } as unknown) as SmartyStreetsResponseModel;
  };

  describe("geocode addresses", () => {
    it("should call to format address & get lat/long", async () => {
      let geoResponse: () => GeocodingResponse[] = () => [homeCoded, workCoded];
      let geoService: GeocodingService = new GeocodingService(
        makeClient(geoResponse),
        undefined,
        makeMockSmartyStreetsCacheModel()
      );

      let result = await geoService.geocodeAddresses(
        new Map([[visitId.toString(), addresses]])
      );

      expect(result.length).toBe(2);

      const homeResponse = result.find(
        a => a.id === visitId.toString() && a.use === AddressInfoUse.Home
      );
      expect(homeResponse.addresses[0].latitude).toBe(homeLat);
      expect(homeResponse.addresses[0].longitude).toBe(homeLng);
      expect(homeResponse.addresses[0].postalCode).toBe(homeZip);

      const workResponse = result.find(
        a => a.id === visitId.toString() && a.use === AddressInfoUse.Work
      );
      expect(workResponse.addresses[0].latitude).toBe(workLat);
      expect(workResponse.addresses[0].longitude).toBe(workLng);
      expect(workResponse.addresses[0].postalCode).toBe(workZip);
    });

    it("should append census tract details if they can be found from coordinates", async () => {
      let geoResponse: () => GeocodingResponse[] = () => [homeCoded, workCoded];

      let tracts = new Map();
      let homeRegion = "Census A";
      tracts.set(homeLat + "|" + homeLng, homeRegion);
      let workRegion = "Census B";
      tracts.set(workLat + "|" + workLng, workRegion);

      let censusService = mock(CensusTractService);
      when(censusService.lookupCensusTract(anything())).thenResolve(tracts);
      let geoService: GeocodingService = new GeocodingService(
        undefined,
        instance(censusService),
        makeMockSmartyStreetsCacheModel()
      );

      let result = await geoService.appendCensusTract([homeCoded, workCoded]);

      verify(censusService.lookupCensusTract(anything())).called();
      expect(result.length).toBe(2);

      const homeResponse = result.find(
        a => a.id === visitId.toString() && a.use === AddressInfoUse.Home
      );
      expect(homeResponse.addresses[0].censusTract).toBe(homeRegion);

      const workResponse = result.find(
        a => a.id === visitId.toString() && a.use === AddressInfoUse.Work
      );
      expect(workResponse.addresses[0].censusTract).toBe(workRegion);
    });

    it("should return cached responses", async () => {
      let geoResponse: () => GeocodingResponse[] = () => [homeCoded];
      const mockSmartyStreetsCache: any = makeMockSmartyStreetsCacheModel([
        {
          inputAddress: canonicalizeAddressInfo(workAddress.value),
          responseAddresses: workCoded.addresses,
        },
      ]);
      let geoService: GeocodingService = new GeocodingService(
        makeClient(geoResponse),
        undefined,
        mockSmartyStreetsCache
      );

      let result = await geoService.geocodeAddresses(
        new Map([[visitId.toString(), addresses]])
      );

      expect(result.length).toBe(2);

      const homeResponse = result.find(
        a => a.id === visitId.toString() && a.use === AddressInfoUse.Home
      );
      expect(homeResponse).toBeTruthy();

      const workResponse = result.find(
        a => a.id === visitId.toString() && a.use === AddressInfoUse.Work
      );
      expect(workResponse.addresses[0].latitude).toBe(workLat);
      expect(workResponse.addresses[0].longitude).toBe(workLng);
      expect(workResponse.addresses[0].postalCode).toBe(workZip);
    });

    it("should update the cache with new addresses", async () => {
      let geoResponse: () => GeocodingResponse[] = () => [homeCoded];
      const mockSmartyStreetsCache: any = makeMockSmartyStreetsCacheModel([
        {
          inputAddress: canonicalizeAddressInfo(workAddress.value),
          responseAddresses: [workCoded.addresses],
        },
      ]);
      let geoService: GeocodingService = new GeocodingService(
        makeClient(geoResponse),
        undefined,
        mockSmartyStreetsCache
      );

      await geoService.geocodeAddresses(
        new Map([[visitId.toString(), addresses]])
      );

      expect(mockSmartyStreetsCache.cachedResponsesCreated.length).toBe(1);
      expect(
        mockSmartyStreetsCache.cachedResponsesCreated[0].responseAddresses[0]
      ).toEqual(homeCoded.addresses[0]);
    });
  });
  describe("cleanAddressString", () => {
    it("accepts things with letters and numbers", () => {
      expect(cleanAddressString("123 Main St")).toEqual("123 MAIN ST");
    });

    it("Removes punctuation", () => {
      expect(cleanAddressString("123 Main St.")).toEqual("123 MAIN ST");
    });

    it("Accepts ZIP+4", () => {
      expect(cleanAddressString("98109-3858")).toEqual("98109-3858");
    });
  });
  describe("addressInfosEqual", () => {
    it("says equal addresses are equal", () => {
      const addr1 = {
        use: AddressInfoUse.Home,
        city: "IRVINE",
        line: ["8 VILLANOVA", null],
        state: "CA",
        country: "US",
        postalCode: "92606",
      };
      const addr2 = {
        use: AddressInfoUse.Home,
        line: ["8 VILLANOVA", undefined],
        city: "IRVINE",
        state: "CA",
        postalCode: "92606",
        country: "US",
      };

      expect(addressInfosEqual(addr1, addr2)).toBe(true);
    });
  });
});

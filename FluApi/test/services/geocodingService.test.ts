// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { anything, instance, mock, verify, when } from "ts-mockito";
import { AddressInfo, AddressInfoUse } from "audere-lib/snifflesProtocol";
import { GeocodingResponse } from "../../src/models/geocoding";
import {
  Geocoder,
  GeocodingService
} from "../../src/services/geocodingService";
import { CensusTractService } from "../../src/services/censusTractService";

describe("geocoding service", () => {
  function makeClient(handle: () => GeocodingResponse[]): Geocoder {
    let client: Geocoder = {
      async geocode(
        addresses: Map<number, AddressInfo[]>
      ): Promise<GeocodingResponse[]> {
        return handle();
      }
    };

    return client;
  }

  function makeGeoResponse(
    id: number,
    request: AddressInfo,
    lat: number,
    lng: number,
    postalCode: string
  ): GeocodingResponse {
    const addressComponents = [
      ...request.line,
      request.city,
      request.state,
      request.postalCode
    ];

    return {
      id: id,
      use: request.use,
      address: {
        canonicalAddress: addressComponents.join(", "),
        address1: request.line[0],
        address2: request.line[1],
        city: request.city,
        state: request.state,
        latitude: lat,
        longitude: lng,
        postalCode: postalCode
      }
    };
  }

  let homeAddress: AddressInfo = {
    use: AddressInfoUse.Home,
    line: ["123 Place"],
    city: "Town",
    state: "PL",
    postalCode: "00000",
    country: "US"
  };

  let homeLat = 4;
  let homeLng = 5;
  let homeZip = "12345";

  let workAddress: AddressInfo = {
    use: AddressInfoUse.Work,
    line: ["456 Work"],
    city: "City",
    state: "PL",
    postalCode: "00001",
    country: "US"
  };

  let workLat = -13;
  let workLng = 55;
  let workZip = "88888";

  let visitId = 100;
  let addresses = [homeAddress, workAddress];
  let homeCoded = makeGeoResponse(visitId, homeAddress, homeLat, homeLng, homeZip);
  let workCoded = makeGeoResponse(visitId, workAddress, workLat, workLng, workZip);

  describe("geocode addresses", () => {
    it("should call to format address & get lat/long", async () => {
      let geoResponse: () => GeocodingResponse[] = () => [homeCoded, workCoded];
      let geoService: GeocodingService = new GeocodingService(
        makeClient(geoResponse),
        undefined
      );

      let result = await geoService.geocodeAddresses(new Map([[1, addresses]]));

      expect(result.length).toBe(2);
      
      const homeResponse = result.find(
        a => a.id === visitId && a.use === AddressInfoUse.Home
      );
      expect(homeResponse.address.latitude).toBe(homeLat);
      expect(homeResponse.address.longitude).toBe(homeLng);
      expect(homeResponse.address.postalCode).toBe(homeZip);

      const workResponse = result.find(
        a => a.id === visitId && a.use === AddressInfoUse.Work
      );
      expect(workResponse.address.latitude).toBe(workLat);
      expect(workResponse.address.longitude).toBe(workLng);
      expect(workResponse.address.postalCode).toBe(workZip);
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
        instance(censusService)
      );

      let result = await geoService.appendCensusTract([homeCoded, workCoded]);

      verify(censusService.lookupCensusTract(anything())).called();
      expect(result.length).toBe(2);

      const homeResponse = result.find(
        a => a.id === visitId && a.use === AddressInfoUse.Home
      );
      expect(homeResponse.address.censusTract).toBe(homeRegion);
      
      const workResponse = result.find(
        a => a.id === visitId && a.use === AddressInfoUse.Work
      );
      expect(workResponse.address.censusTract).toBe(workRegion);
    });
  });
});

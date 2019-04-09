// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { AddressInfo } from "audere-lib/snifflesProtocol";
import { Op } from "sequelize";
import moment from "moment";
import { GeocodingResponse } from "../models/geocoding";
import {
  SmartyStreetsResponseModel,
  SmartyStreetsResponseAttributes
} from "../models/db/smartyStreetsResponses";
import { CensusTractService, LatLng } from "./censusTractService";
import logger from "../util/logger";

export interface Geocoder {
  geocode(addresses: Map<number, AddressInfo[]>): Promise<GeocodingResponse[]>;
}

type GetCachedAddressesResult = {
  cachedResults: GeocodingResponse[];
  uncachedAddressesMap: Map<number, AddressInfo[]>;
};

/**
 * Translates an address into geographic coordinates, specifically lat/lng and
 * census tract.
 */
export class GeocodingService {
  private readonly geocoder: Geocoder;
  private readonly censusTractService: CensusTractService;
  private readonly smartyStreetResponses: SmartyStreetsResponseModel;

  constructor(
    geocoder: Geocoder,
    censusTractService: CensusTractService,
    smartyStreetResponses: SmartyStreetsResponseModel
  ) {
    this.geocoder = geocoder;
    this.censusTractService = censusTractService;
    this.smartyStreetResponses = smartyStreetResponses;
  }

  /**
   * Performs address canonicalization, lat/lng lookup, and census tract lookup
   * on a set of addresses.
   * @param addresses A set of addresses keyed by a stable identifier that will
   * be present in the output if data is found.
   */
  public async geocodeAddresses(
    addresses: Map<number, AddressInfo[]>
  ): Promise<GeocodingResponse[]> {
    const {
      cachedResults,
      uncachedAddressesMap
    } = await this.getCachedAddresses(addresses);

    const uncachedAddressesCount = Array.from(
      uncachedAddressesMap.values()
    ).reduce((sum, values) => sum + values.length, 0);
    logger.info(
      `[Geocoder] Requesting ${uncachedAddressesCount} addresses from smartystreets`
    );
    const results = await this.geocoder.geocode(uncachedAddressesMap);
    logger.info(
      `[Geocoder] Received ${results.length} responses from smartystreets`
    );

    await this.updateAddressCache(uncachedAddressesMap, results);

    return results.concat(cachedResults);
  }

  private async getCachedAddresses(
    addresses: Map<number, AddressInfo[]>
  ): Promise<GetCachedAddressesResult> {
    const allAddressInfos = [];
    Array.from(addresses.values()).forEach(addressInfos =>
      allAddressInfos.push(...addressInfos.map(canonicalizeAddressInfo))
    );
    logger.info(`[Geocoder] Geocoding ${allAddressInfos.length} addresses`);
    const cachedResponses = await this.smartyStreetResponses.findAll({
      where: {
        inputAddress: {
          [Op.in]: allAddressInfos
        },
        createdAt: {
          [Op.gt]: moment()
            .subtract(2, "weeks")
            .toDate()
        }
      }
    });

    const uncachedAddressesMap: Map<number, AddressInfo[]> = new Map();
    const cachedResults: GeocodingResponse[] = [];
    let emptyCachedResponseCount = 0;
    addresses.forEach((addressInfos, key) => {
      const uncachedAddresses = [];
      addressInfos.forEach(addressInfo => {
        const cachedResponse = cachedResponses.find(response => {
          return addressInfosEqual(
            response.inputAddress,
            canonicalizeAddressInfo(addressInfo)
          );
        });
        if (cachedResponse) {
          if (cachedResponse.responseAddresses.length > 0) {
            cachedResults.push({
              id: key,
              use: addressInfo.use,
              address: cachedResponse.responseAddresses[0]
            });
          } else {
            emptyCachedResponseCount++;
          }
        } else {
          uncachedAddresses.push(addressInfo);
        }
      });
      if (uncachedAddresses.length > 0) {
        uncachedAddressesMap.set(key, uncachedAddresses);
      }
    });

    logger.info(
      `[Geocoder] ${cachedResults.length} addresses were found in the cache, ` +
        `along with ${emptyCachedResponseCount} empty responses.`
    );

    return {
      cachedResults,
      uncachedAddressesMap
    };
  }

  private async updateAddressCache(
    uncachedAddressesMap: Map<number, AddressInfo[]>,
    results: GeocodingResponse[]
  ): Promise<void> {
    const newResponses: SmartyStreetsResponseAttributes[] = [];
    for (let [key, addresses] of uncachedAddressesMap.entries()) {
      addresses.forEach(address => {
        const result = results.find(
          result => result.id === key && result.use === address.use
        );
        newResponses.push({
          inputAddress: canonicalizeAddressInfo(address),
          maxCandidates: 1,
          responseAddresses: result ? [result.address] : []
        });
      });
    }
    await this.smartyStreetResponses.bulkCreate(newResponses, {
      ignoreDuplicates: true
    });
  }

  /**
   * Optionally adds census geo id if it can be found.
   * @param addresses Geocoded address data lacking census tract information.
   */
  public async appendCensusTract(
    addresses: GeocodingResponse[]
  ): Promise<GeocodingResponse[]> {
    const latlng: LatLng[] = addresses
      .filter(a => a.address != null)
      .map(a => ({
        latitude: a.address.latitude,
        longitude: a.address.longitude
      }));

    const unique = Array.from(new Set(latlng));

    if (unique.length > 0) {
      logger.info(`[Geocoder] Querying coordinates for census data`);
      const tracts = await this.censusTractService.lookupCensusTract(unique);
      const appended = addresses.map(a => {
        if (a.address != null) {
          const key = a.address.latitude + "|" + a.address.longitude;
          const tract = tracts.get(key);
          a.address.censusTract = tract;
        }

        return a;
      });

      return appended;
    } else {
      return addresses;
    }
  }
}

const ADDRESS_EQUALITY_KEYS = [
  "line",
  "city",
  "state",
  "postalCode",
  "country"
];

function addressInfosEqual(addr1: AddressInfo, addr2: AddressInfo): boolean {
  return ADDRESS_EQUALITY_KEYS.every(keyToCheck => {
    if (!Array.isArray(addr1[keyToCheck])) {
      return addr1[keyToCheck] === addr2[keyToCheck];
    }

    if (addr1[keyToCheck].length !== addr2[keyToCheck].length) {
      return false;
    }
    return addr1[keyToCheck].every(
      (value, index) => addr2[keyToCheck][index] === value
    );
  });
}

export function cleanAddressString(str: string): string {
  return str.toUpperCase().replace(/[,.]/g, "");
}

export function canonicalizeAddressInfo(address: AddressInfo): AddressInfo {
  address = { ...address };
  delete address.use;
  for (let part in address) {
    if (Array.isArray(address[part])) {
      address[part] = address[part].map(cleanAddressString);
    } else {
      address[part] = cleanAddressString(address[part]);
    }
  }
  return address;
}

// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import * as SmartyStreetsSDK from "smartystreets-javascript-sdk";
import { AddressInfo, AddressInfoUse } from "audere-lib/snifflesProtocol";
import { GeocodingResponse } from "../models/geocoding";
import { Geocoder } from "../services/geocodingService";
import logger from "../util/logger";

/**
 * Address geocoder specific to the SmartyStreets US Streets service. Can only
 * geocode US addresses.
 */
export class SmartyStreetsGeocoder implements Geocoder {
  // SmartyStreets max batch size is 100
  private readonly BATCH_SIZE: number = 100;
  private readonly client: SmartyStreetsSDK.usStreet.Client;

  constructor(client: SmartyStreetsSDK.usStreet.Client) {
    this.client = client;
  }

  /**
   * SmartyStreets often doesn't propagate a useful message or stacktrace so we
   * create our own if necessary.
   */
  private handleError(response): void {
    if (response instanceof Error) {
      logger.error("SmartyStreets geocoding encountered an unhandled error.");
      throw response;
    } else if (response.error != null && response.error instanceof Error) {
      logger.error("SmartyStreets geocoding encountered an unhandled error.");
      throw response.error;
    } else {
      logger.error(
        "SmartyStreets geocoding returned an invalid response, " +
          " status code " +
          response.statusCode +
          "."
      );
      const e = new Error(
        "SmartyStreets geocoding request failed with " +
          " status code: " +
          response.statusCode
      );
      throw e;
    }
  }

  /**
   * Converts reported addresses to geocoded equivalents to standardize &
   * subsequently anonymize the location.
   * @param addresses Keyed id + input. The same key is present in the output
   * records.
   */
  public async geocode(
    addresses: Map<number, AddressInfo[]>
  ): Promise<GeocodingResponse[]> {
    const lookups: SmartyStreetsSDK.usStreet.Lookup[] = [];

    addresses.forEach((v, k) => {
      v.forEach(a => lookups.push(this.createLookup(k, a)));
    });

    let responses: GeocodingResponse[] = [];

    for (let i = 0; i < lookups.length; i += this.BATCH_SIZE) {
      const items = lookups.slice(i, i + this.BATCH_SIZE);
      const batch = new SmartyStreetsSDK.core.Batch();
      items.forEach(i => batch.add(i));
      responses = responses.concat(await this.send(batch));
    }

    return responses;
  }

  private async send(
    batch: SmartyStreetsSDK.core.Batch
  ): Promise<GeocodingResponse[]> {
    try {
      const response = await this.client.send(batch);
      return this.formatResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  private createLookup(
    k: number,
    a: AddressInfo
  ): SmartyStreetsSDK.usStreet.Lookup {
    const lookup = new SmartyStreetsSDK.usStreet.Lookup();

    // The input id must encode both the record identifier and address use.
    lookup.inputId = k + "_" + a.use;

    if (a.line != null && a.line.length > 0) {
      lookup.street = a.line[0];

      if (a.line.length > 1) {
        lookup.street2 = a.line[1];
      }
    }

    lookup.city = a.city;
    lookup.state = a.state;
    lookup.zipcode = a.postalCode;

    return lookup;
  }

  /**
   * Maps SmartyStreets into an internal response object. This handles only
   * valid HTTP responses since status codes are checked by the
   * StatusCodeSender and will throw failure back up the promise chain.
   * @param response Valid HTTP response from SmartyStreets.
   */
  private formatResponse(response): GeocodingResponse[] {
    const responses = [];

    response.lookups.forEach(lookup => {
      const inputIds = lookup.inputId.split("_");
      const id = +inputIds[0];

      // Converts string back to enumeration.
      const useKey = Object.keys(AddressInfoUse).find(
        k => AddressInfoUse[k] === inputIds[1]
      );
      const use = AddressInfoUse[useKey];

      // TODO: If there is no geocoded result is the record invalid?
      if (lookup.result != null && lookup.result.length > 0) {
        // We ask for max 1 candidate by default.
        const result = lookup.result[0];

        const address = [
          result.deliveryLine1,
          result.deliveryLine2,
          result.lastLine
        ]
          .filter(c => c != null)
          .join(", ");

        const latitude = result.metadata.latitude;
        const longitude = result.metadata.longitude;

        const { cityName, state, zipCode }: any = result.components || {};

        const r: GeocodingResponse = {
          id: id,
          use: use,
          address: {
            canonicalAddress: address.length > 0 ? address : undefined,
            address1: result.deliveryLine1,
            address2: result.deliveryLine2,
            city: cityName,
            state: state,
            latitude: latitude,
            longitude: longitude,
            postalCode: zipCode
          }
        };

        responses.push(r);
      }
    });

    return responses;
  }
}

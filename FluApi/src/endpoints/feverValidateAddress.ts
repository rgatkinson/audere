// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Op, cast } from "sequelize";
import { createGeocoder } from "../util/geocoder";
import { LazyAsync } from "../util/lazyAsync";
import { SplitSql } from "../util/sql";
import { GeocodingService } from "../../src/services/geocodingService";
import * as Model from "audere-lib/snifflesProtocol";
import { GeocodingResponse } from "../../src/models/geocoding";
import { defineFeverModels, FeverModels } from "../models/db/fever";
import { SecretConfig } from "../util/secretsConfig";
import logger from "../util/logger";
import { AddressInfoUse } from "audere-lib/feverProtocol";

export class FeverValidateAddress {
  private readonly sql: SplitSql;
  private readonly geocoder: LazyAsync<GeocodingService>;
  private readonly fever: FeverModels;

  constructor(sql: SplitSql, geocoder?: LazyAsync<GeocodingService>) {
    this.sql = sql;
    this.geocoder = geocoder || new LazyAsync(() => initializeGeocoder(sql));
    this.fever = defineFeverModels(sql);
  }

  async validate(query: any) {
    const formattedRequest = this.createRequest(query);
    const geocoder = await this.geocoder.get();
    const geocoded = await geocoder.geocodeAddresses(formattedRequest);
    const formattedAddresses = this.formatResults(geocoded);
    return formattedAddresses;
  }

  async validateAndCheckDuplicates(address, csruid: string) {
    const suggestions = await this.validate(address);
    const duplicate = await this.containsDuplicates(
      address,
      suggestions,
      csruid
    );
    return { duplicate, suggestions };
  }

  createRequest(inputAddress) {
    const { address, address2, city, state, zipcode } = inputAddress;
    return new Map([
      [
        1,
        [
          {
            use: Model.AddressInfoUse.Home,
            line: [address, address2],
            city: city,
            state: state,
            postalCode: zipcode,
            country: "US"
          }
        ]
      ]
    ]);
  }

  formatResults(geocoded: GeocodingResponse[]) {
    return geocoded.map((response: GeocodingResponse) => {
      return {
        address: response.address.address1,
        address2:
          response.address.address2 === "Undefined"
            ? ""
            : response.address.address2,
        city: response.address.city,
        state: response.address.state,
        zipcode: response.address.postalCode
      };
    });
  }

  async containsDuplicates(inputAddress, validatedAddresses, csruid) {
    logger.info("[AddressValidator] Checking for duplicates");
    const formattedAddresses = validatedAddresses
      .concat(inputAddress)
      .map(addr => {
        const formattedAddress = {
          ...addr,
          line: [addr.address],
          use: AddressInfoUse.Home,
          firstName: inputAddress.firstName,
          lastName: inputAddress.lastName,
          country: addr.country || "",
          postalCode: addr.zipcode
        };
        if (addr.address2) {
          formattedAddress.line.push(addr.address2);
        }
        delete formattedAddress.address;
        delete formattedAddress.address2;
        delete formattedAddress.zipcode;
        return formattedAddress;
      });

    const duplicates = await this.fever.surveyPii.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: formattedAddresses.map(address => ({
              "survey.patient.address::jsonb": {
                [Op.contains]: cast(JSON.stringify([address]), "JSONB")
              }
            }))
          },
          {
            [Op.not]: { csruid }
          }
        ]
      }
    });
    logger.info(`[AddressValidator] ${duplicates.length} duplicates found`);
    return duplicates.length > 0;
  }
}
async function initializeGeocoder(sql: SplitSql) {
  const secrets = new SecretConfig(sql);
  return await createGeocoder(secrets, sql, true);
}

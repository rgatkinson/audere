// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import * as Encounter from "audere-lib/hutchProtocol";
import * as Model from "audere-lib/common";
import * as Mapper from "../mappers/encounterMapper";
import moment from "moment";
import { GeocodingService } from "./geocodingService";
import { HutchUploader } from "../external/hutchUploader";
import {
  EncounterDetailsService,
  EncounterKey,
  KeyedEncounter,
} from "./encounterDetailsService";
import { sha256 } from "../util/crypto";
import { GeocodingResponse, GeocodedAddress } from "../models/geocoding";
import {
  NonPIIEncounterDetails,
  PIIEncounterDetails,
  AddressDetails,
} from "../models/encounterDetails";
import logger from "../util/logger";

/**
 * Service for interacting with underlying visit data as an Encounter.
 * Encounters are an external representation of visit data used by the flu
 * study.
 *
 * Send encounters will orchestrate data retrieval, mapping, and geocoding
 * before sending records downstream.
 */
export class EncountersService {
  private readonly geocoder: GeocodingService;
  private readonly uploader: HutchUploader;
  private readonly encounterDetails: EncounterDetailsService;
  private readonly hashSecret: string;

  constructor(
    geocoder: GeocodingService,
    uploader: HutchUploader,
    encounterDetails: EncounterDetailsService,
    hashSecret: string
  ) {
    this.geocoder = geocoder;
    this.uploader = uploader;
    this.encounterDetails = encounterDetails;
    this.hashSecret = hashSecret;
  }

  /**
   * Pushes a batch of visit data to external partners.
   */
  public async sendEncounters(): Promise<void> {
    const encounters = await this.getEncounters();

    logger.info(
      `[sendEncounters] Attempt to send ${encounters.length} records`
    );
    await this.sendToHutch(encounters);
    logger.info(`[sendEncounters] Sent ${encounters.length} records`);
  }

  /**
   * Pulls completed visits from the database as Encounters.
   */
  public async getEncounters(): Promise<KeyedEncounter<Encounter.Encounter>[]> {
    logger.info("[getEncounters] Querying for pending visits");
    const pending = await this.encounterDetails.retrieveDetails();
    logger.info(`[getEncounters] ${pending.length} visits found`);

    logger.info("[getEncounters] Geocoding address data");
    const geocodedAddresses = await this.geocodeAddressData(pending);

    logger.info(
      `[getEncounters] Scrubbing PII for ${pending.length} encounters`
    );
    let numGeocoded = 0;

    let start = 0;
    let middle = 0;
    let end = 0;

    const encounters = pending.map(encounter => {
      let scrubbed: NonPIIEncounterDetails;
      const key = this.getKeyString(encounter.key);
      const geocodedAddress = geocodedAddresses.get(key);

      if (geocodedAddress != null) numGeocoded++;

      if (
        geocodedAddress != null &&
        geocodedAddress.some(
          a =>
            a.addresses != null &&
            a.addresses.some(aa => aa.censusTract != null)
        )
      ) {
        start++;
      }

      try {
        scrubbed = this.scrubEncounter(
          encounter.key,
          encounter.encounter,
          geocodedAddress
        );
      } catch (e) {
        logger.error(
          `A problem occurred scrubbing visit ${encounter.key}: `,
          e
        );
        throw e;
      }

      if (scrubbed.locations.some(l => l.region != null)) middle++;

      const mapped = Mapper.mapEncounter(scrubbed);

      if (mapped.locations.some(l => l.region != null)) end++;

      return {
        key: encounter.key,
        encounter: mapped,
      };
    });

    const numCensusTracts = encounters.filter(e =>
      e.encounter.locations.some(l => l.region != null)
    ).length;

    logger.info(
      `[getEncounters] Scrubbed ${encounters.length} encounters - ` +
        `${numGeocoded} matched a geocoded address, ` +
        `${numCensusTracts} had a matching census tract`
    );

    logger.info(
      `[getEncounters] Started with ${start} tracts, then ${middle} tracts, ` +
        `then ${end} tracts`
    );

    return encounters;
  }

  private deidentifyAddress(
    inputAddress: Model.AddressInfo,
    addressUse: Model.AddressInfoUse,
    geocodedAddress: GeocodedAddress,
    includeCityAndState: boolean
  ): Encounter.Location {
    let streetAddress: string;
    let region: string;
    let city: string;
    let state: string;

    if (geocodedAddress != null) {
      streetAddress = geocodedAddress.canonicalAddress;
      region = geocodedAddress.censusTract;
      city = geocodedAddress.city;
      state = geocodedAddress.state;
    } else if (inputAddress != null) {
      // If there is no geocoding result then we rely on the user input.
      // This will be a weaker guarantee of uniqueness.
      const input = [
        ...inputAddress.line,
        inputAddress.city,
        inputAddress.state,
        inputAddress.postalCode,
        inputAddress.country,
      ];

      city = inputAddress.city;
      state = inputAddress.state;

      streetAddress = input.join(", ");
    } else {
      return undefined;
    }

    let use: Encounter.LocationUse;
    switch (addressUse) {
      case Model.AddressInfoUse.Home:
        use = Encounter.LocationUse.Home;
        break;
      case Model.AddressInfoUse.Temp:
        use = Encounter.LocationUse.Temp;
        break;
      case Model.AddressInfoUse.Work:
        use = Encounter.LocationUse.Work;
        break;
    }

    const de = {
      use: use,
      id: sha256(this.hashSecret, streetAddress),
      region: region,
      city: includeCityAndState ? city : undefined,
      state: includeCityAndState ? state : undefined,
    };

    if (
      de.region == null &&
      geocodedAddress != null &&
      geocodedAddress.censusTract != null
    ) {
      logger.info("Census disappeared in deidentify");
    }

    return de;
  }

  private deidentifyParticipant({
    name,
    gender,
    birthDate,
    postalCode,
  }: ParticipantIdentifierParts): string {
    return sha256(
      this.hashSecret,
      canonicalizeName(name),
      gender,
      birthDate,
      postalCode
    );
  }

  // Encounter key as a string
  private getKeyString(key: EncounterKey): string {
    return key.release + "_" + key.id;
  }

  private hasAddressInfo(details: PIIEncounterDetails) {
    return (
      details != null &&
      details.addresses != null &&
      details.addresses.length > 0
    );
  }

  /**
   * Convert address to structured data through external service.
   */
  private async geocodeAddressData(
    encounters: KeyedEncounter<PIIEncounterDetails>[]
  ): Promise<Map<string, GeocodingResponse[]>> {
    let requests: Map<string, AddressDetails[]> = new Map();

    encounters.forEach(e => {
      if (this.hasAddressInfo(e.encounter)) {
        const id = e.key.id;

        // Mobile app logic should not allow for multiple addresses of a given
        // use type.  Multiple home addresses would complicate our ability to
        // describe the patient with a unique id.
        const addressTypes = [];

        for (let i = 0; i < e.encounter.addresses.length; i++) {
          const a = e.encounter.addresses[i];
          if (addressTypes.includes(a.use)) {
            throw Error(`Visit ${id} addresses contain duplicate use types`);
          } else {
            addressTypes.push(a.use);
          }
        }

        requests.set(this.getKeyString(e.key), e.encounter.addresses);
      }
    });

    if (requests.size == 0) {
      return new Map();
    }

    const geocoded = await this.geocoder.geocodeAddresses(requests);
    await this.geocoder.appendCensusTract(geocoded);
    return geocoded.reduce((map, x) => {
      return this.multiMapAdd(map, x.id, x);
    }, new Map());
  }

  /**
   * Adds items to an array bucket in an existing map. If the key is not
   * contained a new array will be created. If the key is contains the value
   * will be appended.
   */
  private multiMapAdd<K, V>(
    map: Map<K, V[]>,
    key: K,
    ...items: V[]
  ): Map<K, V[]> {
    let value = map.get(key) || [];
    items.forEach(i => value.push(i));
    map.set(key, value);

    return map;
  }

  private obscureCsruid(id: string): string {
    // We take a prefix of the key, instead of a hash as elsewhere, so it is
    // easier to correlate records internally/externally.
    return id.substr(0, 21);
  }

  /**
   * Do the actual work to scrub and map an individual visit with PII data into
   * a summary without. Falls back to input data if the address could not be
   * geocoded.
   */
  private scrubEncounter(
    id: EncounterKey,
    details: PIIEncounterDetails,
    geocodedAddresses: GeocodingResponse[]
  ): NonPIIEncounterDetails {
    const locations = [];
    let userPostalCode: string = "";

    if (this.hasAddressInfo(details)) {
      details.addresses.forEach(a => {
        const geocoded = (geocodedAddresses || []).find(x => x.use === a.use);
        const geocodedAddress =
          geocoded != null && geocoded.addresses.length > 0
            ? geocoded.addresses[0]
            : undefined;

        // Get the postal code most closely associated with the user's home
        // address. This is part of the unique identifier generated for each
        // participant.
        if (a.use === Model.AddressInfoUse.Home) {
          if (geocodedAddress != null) {
            userPostalCode = geocodedAddress.postalCode;
          } else {
            userPostalCode = a.value.postalCode;
          }
        }

        const deidentifiedAddress = this.deidentifyAddress(
          a.value,
          a.use,
          geocodedAddress,
          details.site === "self-test"
        );
        locations.push(deidentifiedAddress);
      });
    }

    let birthYear: number;
    const birthDate = moment(details.birthDate, "YYYY-MM-DD");

    if (birthDate.isValid()) {
      birthYear = birthDate.year();
    }

    // Deidentify participant to a hash of DOB and postal code. Also
    // obscure visit id.
    return {
      id: id.id,
      encounterId: this.obscureCsruid(details.csruid),
      consentDate: details.consentDate,
      startTime: details.startTime,
      site: details.site,
      responses: details.responses,
      participant: this.deidentifyParticipant({
        name:
          details.fullName != null
            ? details.fullName
            : details.firstName + " " + details.lastName,
        gender: details.gender,
        birthDate: details.birthDate,
        postalCode: userPostalCode,
      }),
      locations: locations,
      samples: details.samples,
      events: details.events,
      birthYear: birthYear,
      followUpResponses: details.followUpResponses,
    };
  }

  /**
   * Push to Hutch over HTTP for analysis.
   */
  private async sendToHutch(
    encounters: KeyedEncounter<Encounter.Encounter>[]
  ): Promise<void> {
    if (encounters.length === 0) {
      return;
    }

    const values = encounters.map(e => e.encounter);
    await this.uploader.uploadEncounters(values);
    const keys = encounters.map(e => e.key);
    await this.encounterDetails.commitUploads(keys);
  }
}

type ParticipantIdentifierParts = {
  name: string;
  gender: string;
  birthDate: string;
  postalCode: string;
};

export function canonicalizeName(name: string): string {
  return name
    .replace(
      /[^\s\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Join_Control}]/gu,
      ""
    )
    .replace(/\s+/gu, " ")
    .toUpperCase();
}

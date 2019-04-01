// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import * as Encounter from "audere-lib/hutchProtocol";
import * as Model from "audere-lib/snifflesProtocol";
import * as Mapper from "../../mappers/encounterMapper";
import moment from "moment";
import { GeocodingService } from "../geocodingService";
import { HutchUploader } from "../../external/hutchUploader";
import { VisitsService } from "./visitsService";
import { generateSHA256 } from "../../util/crypto";
import { GeocodingResponse } from "../../models/geocoding";
import { NonPIIVisitDetails, PIIVisitDetails } from "../../models/visitDetails";
import logger from "../../util/logger";

/**
 * Return type for sendEncounters. Contains a list of ids which were confirmed
 * as send and a list of ids for records which were filtered for any reason.
 */
export interface SendEncountersResult {
  sent: number[];
  erred: number[];
}

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
  private readonly visits: VisitsService;
  private readonly hashSecret: string;

  constructor(
    geocoder: GeocodingService,
    uploader: HutchUploader,
    visits: VisitsService,
    hashSecret: string
  ) {
    this.geocoder = geocoder;
    this.uploader = uploader;
    this.visits = visits;
    this.hashSecret = hashSecret;
  }

  /**
   * Pushes a batch of visit data to external partners.
   * @param maxToSend Maximum number of records to send. Actual number sent may
   * be less even if nuumerous pending records exist.
   */
  public async sendEncounters(
    maxToSend: number
  ): Promise<SendEncountersResult> {
    const encounters = await this.getEncounters(maxToSend);

    logger.info(`[sendEncounters] Attempt to send ${encounters.size} records`);
    const sent = await this.sendToHutch(encounters);

    logger.info(`[sendEncounters] Sent ${sent.length} records`);
    const erred = Array.from(encounters.keys()).filter(
      id => !sent.includes(id)
    );

    return { sent: sent, erred: erred };
  }

  /**
   * Pulls completed visits from the database as Encounters.
   * @param maxToRetrieve Maxiumum number of records to retrieve. Actual number
   * retrieved may be less even if numerous pending records exist.
   */
  public async getEncounters(
    maxToRetrieve: number
  ): Promise<Map<number, Encounter.Encounter>> {
    logger.info("[getEncounters] Querying for pending visits");
    const pending = await this.visits.retrievePendingDetails(maxToRetrieve);
    logger.info(`[getEncounters] ${pending.size} visits found`);

    const scrubbed = await this.scrubPIIData(pending);
    const encounters: Map<number, Encounter.Encounter> = new Map();

    logger.info("[getEncounters] Mapping output");
    scrubbed.forEach(v => encounters.set(v.id, Mapper.mapEncounter(v)));

    return encounters;
  }

  private deidentifyAddress(
    inputAddress: Model.AddressInfo,
    geocodedAddress: GeocodingResponse
  ): Encounter.Location {
    let streetAddress: string;
    let region: string;

    if (geocodedAddress != null) {
      streetAddress = geocodedAddress.address.canonicalAddress;
      region = geocodedAddress.address.censusTract;
    } else if (inputAddress != null) {
      // If there is no geocoding result then we rely on the user input.
      // This will be a weaker guarantee of uniqueness.
      const input = [
        ...inputAddress.line,
        inputAddress.city,
        inputAddress.state,
        inputAddress.postalCode,
        inputAddress.country
      ];

      streetAddress = input.join(", ");
    }

    if (streetAddress != null) {
      let use: Encounter.LocationUse;
      switch (inputAddress.use) {
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

      return {
        use: use,
        id: generateSHA256(this.hashSecret, streetAddress),
        region: region
      };
    }

    return undefined;
  }

  private deidentifyParticipant({name, gender, birthDate, postalCode}: ParticipantIdentifierParts): string {
    return generateSHA256(this.hashSecret, canonicalizeName(name), gender, birthDate, postalCode);
  }

  private hasAddressInfo(details: PIIVisitDetails) {
    return (
      details.patientInfo != null &&
      details.patientInfo.address != null &&
      details.patientInfo.address.length > 0
    );
  }

  /**
   * Convert address to structured data through external service.
   */
  private async geocodeAddressData(
    visits: Map<number, PIIVisitDetails>
  ): Promise<Map<number, GeocodingResponse[]>> {
    let requests: Map<number, Model.AddressInfo[]> = new Map();

    visits.forEach((v, id) => {
      if (this.hasAddressInfo(v)) {
        // Mobile app logic should not allow for multiple addresses of a given
        // use type.  Multiple home addresses would complicate our ability to
        // describe the patient with a unique id.
        const addressSet = [];
        const addressTypes = [];

        for (let i = 0; i < v.patientInfo.address.length; i++) {
          const a = v.patientInfo.address[i];
          if (addressTypes.includes(a.use)) {
            throw Error(`Visit ${id} addresses contain duplicate use types`);
          } else {
            addressSet.push(a);
            addressTypes.push(a.use);
          }
        }

        requests.set(id, v.patientInfo.address);
      }
    });

    if (requests.size == 0) {
      return new Map();
    }

    const geocoded = await this.geocoder.geocodeAddresses(requests);
    await this.geocoder.appendCensusTract(geocoded);
    return geocoded.reduce(
      (map, x) => this.multiMapAdd(map, x.id, x),
      new Map()
    );
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
   * Remove personally identifiable data from the document. Removes name, DOB,
   * address details, etc.
   *
   * It is important that after this step data is safe to be shared with
   * external partners.
   */
  private async scrubPIIData(
    visits: Map<number, PIIVisitDetails>
  ): Promise<NonPIIVisitDetails[]> {
    logger.info("[getEncounters] Geocoding address data");
    const geocodedAddresses = await this.geocodeAddressData(visits);

    logger.info("[getEncounters] Scrubbing PII data");
    const scrubbedVisits = Array.from(visits.keys()).map(k => {
      try {
        const visit = visits.get(k);

        if (visit.patientInfo == null) {
          throw Error(
            `Patient info does not exist for visit ${visit.id}`
          );
        }

        return this.scrubVisit(k, visit, geocodedAddresses.get(k));
      } catch (e) {
        logger.error(`A problem occurred scrubbing visit ${k}: `, e);
        throw e;
      }
    });

    return scrubbedVisits.filter(v => v != null);
  }

  /**
   * Do the actual work to scrub and map an individual visit with PII data into
   * a summary without. Falls back to input data if the address could not be
   * geocoded.
   */
  private scrubVisit(
    id: number,
    visit: PIIVisitDetails,
    geocodedAddresses: GeocodingResponse[]
  ): NonPIIVisitDetails {
    const locations = [];
    let userPostalCode: string = "";

    if (this.hasAddressInfo(visit)) {
      visit.patientInfo.address.forEach(a => {
        const geocoded = (geocodedAddresses || []).find(x => x.use === a.use);

        // Get the postal code most closely associated with the user's home
        // address. This is part of the unique identifier generated for each
        // participant.
        if (a.use === Model.AddressInfoUse.Home) {
          if (geocoded != null) {
            userPostalCode = geocoded.address.postalCode;
          } else {
            userPostalCode = a.postalCode;
          }
        }

        locations.push(this.deidentifyAddress(a, geocoded));
      });
    }

    let birthYear: number;
    const birthDate = moment(visit.patientInfo.birthDate, "YYYY-MM-DD");

    if (birthDate.isValid()) {
      birthYear = birthDate.year();
    }

    // Deidentify participant to a hash of DOB and postal code. Also
    // obscure visit id.
    return {
      id: id,
      visitId: this.obscureCsruid(visit.csruid),
      visitInfo: visit.visitInfo,
      consentDate: visit.consentDate,
      participant: this.deidentifyParticipant({
        name: visit.patientInfo.name,
        gender: visit.patientInfo.gender,
        birthDate: visit.patientInfo.birthDate,
        postalCode: userPostalCode
      }),
      locations: locations,
      birthYear: birthYear
    };
  }

  /**
   * Push to Hutch over HTTP for analysis.
   */
  private async sendToHutch(
    records: Map<number, Encounter.Encounter>
  ): Promise<number[]> {
    if (records.size === 0) {
      return [];
    }

    const uploads = await this.uploader.uploadEncounters(records);
    return await this.uploader.commitUploads(uploads);
  }
}

type ParticipantIdentifierParts = {
  name: string,
  gender: string,
  birthDate: string,
  postalCode: string,
};

export function canonicalizeName(name: string): string {
  return name
    .replace(/[^\s\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Join_Control}]/ug, "")
    .replace(/\s+/ug, " ")
    .toUpperCase();
}

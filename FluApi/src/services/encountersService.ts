// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import * as Encounter from "audere-lib/hutchProtocol";
import * as Model from "audere-lib/snifflesProtocol";
import { GeocodingService } from "./geocodingService";
import * as Mapper from "../mappers/encounterMapper";
import { HutchUploader } from "../external/hutchUploader";
import { VisitsService } from "./visitsService";
import { generateSHA256 } from "../util/crypto";
import { GeocodingResponse } from "../models/geocoding";
import { NonPIIVisitDetails, PIIVisitDetails } from "../models/visitDetails";
import logger from "../util/logger";

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
  public async sendEncounters(maxToSend: number): Promise<SendEncountersResult> {
    const encounters = await this.getEncounters(maxToSend);
    const sent = await this.sendToHutch(encounters);
    const erred = Array.from(encounters.keys())
      .filter(id => !sent.includes(id));
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
    const pending = await this.visits.retrievePendingDetails(maxToRetrieve);
    const scrubbed = await this.scrubPIIData(pending);
    const encounters: Map<number, Encounter.Encounter> = new Map();

    scrubbed.forEach(v => {
      try {
        encounters.set(v.id, Mapper.mapEncounter(v));
      } catch (e) {
        // TODO: This error should be monitored.
        // Retrying these records is not helpful until the error is fixed. But
        // presently the record will be retried indefinitely.
        logger.error(
          "Unable to map visit " + v.id + ", this record will be ommitted: ",
          e
        );
      }
    });
    
    return encounters;
  }

  private deidentifyAddress(
    inputAddress: Model.AddressInfo,
    geocodedAddress: GeocodingResponse
  ): Encounter.Location {
    if (geocodedAddress != null) {
      return this.deidentifyLocation(
        geocodedAddress.address.canonicalAddress,
        geocodedAddress.address.censusTract
      );
    } else {
      if (inputAddress != null) {
        // If there is no geocoding result then we rely on the user input.
        // This will be a weaker guarantee of uniqueness.
        const fullDetails = [
          ...inputAddress.line,
          inputAddress.city,
          inputAddress.state,
          inputAddress.postalCode,
          inputAddress.country
        ];

        return this.deidentifyLocation(fullDetails.join(", "), undefined);
      }
    }

    return undefined;
  }

  private deidentifyLocation(
    streetAddress: string,
    censusTract: string
  ): Encounter.Location {
    return {
      id: generateSHA256(this.hashSecret, [streetAddress]),
      region: censusTract
    };
  }

  private deidentifyParticipant(name: string, birthDate: string): string {
    return generateSHA256(this.hashSecret, [name, birthDate]);
  }

  /**
   * Convert address to structured data through external service.
   */
  private async geocodeAddressData(
    visits: Map<number, PIIVisitDetails>
  ): Promise<Map<number, GeocodingResponse[]>> {
    let requests: Map<number, Model.AddressInfo[]> = new Map();

    // Collect supplied addresses regardless of type.
    visits.forEach((v, k) => {
      if (
        v.patientInfo != null &&
        v.patientInfo.address != null &&
        v.patientInfo.address.length > 0
      ) {
        const homeAddress = v.patientInfo.address.find(
          a => a.use === Model.AddressInfoUse.Home
        );

        if (homeAddress != null) {
          this.multiMapAdd(requests, k, homeAddress);
        }

        const workAddress = v.patientInfo.address.find(
          a => a.use === Model.AddressInfoUse.Work
        );

        if (workAddress != null) {
          this.multiMapAdd(requests, k, workAddress);
        }
      }
    });

    if (requests.size == 0) {
      return new Map();
    }

    const geocoded = await this.geocoder.geocodeAddresses(requests);
    await this.geocoder.appendCensusTract(geocoded);
    return geocoded.reduce((map, x) => 
      this.multiMapAdd(map, x.id, x), new Map()
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
    const geocodedAddresses = await this.geocodeAddressData(visits);

    const scrubbedVisits = Array.from(visits.keys())
      .map(k => {
        try {
          const visit = visits.get(k);

          if (visit.patientInfo == null) {
            throw new Error("Patient info should exist for all visits but " +
              "does not exist for visit " + visit.id);
          }

          return this.scrubVisit(k, visit, geocodedAddresses.get(k));
        } catch (e) {
          logger.error(
            "A problem occurred converting a PII visit to a non-PII visit. " +
            "Record with id " + k + " will be ommitted",
            e
          );

          return undefined;
        }
      });

    return scrubbedVisits.filter(v => v != null);
  }

  /**
   * Do the actual work to scrub and map an individual visit with PII data into
   * a summary without. Falls back to input data if the address doesn't have
   * a geocoded address.
   */
  private scrubVisit(
    id: number,
    visit: PIIVisitDetails,
    geocodedAddresses: GeocodingResponse[]
  ) {
    // Try to extract home address and deidentify.
    const geocodedHomeAddress = (geocodedAddresses || [])
      .find(a => a.use === Model.AddressInfoUse.Home);

    let inputHomeAddress: Model.AddressInfo
    
    if (visit.patientInfo.address != null) {
      inputHomeAddress = visit.patientInfo.address
        .find(a => a.use === Model.AddressInfoUse.Home);
    }

    const household = this.deidentifyAddress(
      inputHomeAddress,
      geocodedHomeAddress
    );

    // Try to extract work address and deidentify.
    const geocodedWorkAddress = (geocodedAddresses || [])
      .find(a => a.use === Model.AddressInfoUse.Work);

    let inputWorkAddress: Model.AddressInfo

    if (visit.patientInfo.address != null) {
      inputWorkAddress = visit.patientInfo.address
        .find(a => a.use === Model.AddressInfoUse.Work);
    }

    const workplace = this.deidentifyAddress(
      inputWorkAddress,
      geocodedWorkAddress
    );

    // Get the postal code most closely associated with the user's home
    // address. This will be used for ensuring each participant has a
    // unique identifier.
    let userPostalCode: string

    if (
    geocodedHomeAddress != null &&
    geocodedHomeAddress.address.postalCode != null
    ) {
      userPostalCode = geocodedHomeAddress.address.postalCode
    } else if (
      inputHomeAddress != null &&
      inputHomeAddress.postalCode != null
    ) {
      userPostalCode = inputHomeAddress.postalCode;
    }

    // Deidentify participant to a hash of DOB and postal code. Also
    // obscure visit id.
    return {
      id: id,
      visitId: this.obscureCsruid(visit.csruid),
      visitInfo: visit.visitInfo,
      consentDate: visit.consentDate,
      participant: this.deidentifyParticipant(
        visit.patientInfo.birthDate,
        userPostalCode
      ),
      household: household,
      workplace: workplace
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

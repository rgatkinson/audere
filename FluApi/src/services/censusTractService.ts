// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import Sequelize from "sequelize";

export interface LatLng {
  latitude: number;
  longitude: number;
}

/**
 * Talks to PostGIS to find census data for a given point or coordinate.
 */
export class CensusTractService {
  private readonly postGIS: Sequelize.Sequelize;

  constructor(postGIS: Sequelize.Sequelize) {
    this.postGIS = postGIS;
  }

  /**
   * Perform conversion of coordinates to census data. If a coordinate returns
   * no census tract we remove it from output.
   * @param records Coordinates expressed as a latitude and longitude tuple.
   */
  public async lookupCensusTract(
    records: LatLng[]
  ): Promise<Map<string, string>> {
    const values = [];
    records.forEach(r => {
      // Filter out any NaN values to ensure SQL is sane.
      if (!isNaN(r.latitude) && !isNaN(r.longitude)) {
        values.push("(" + r.latitude + ", " + r.longitude + ")");
      }
    });

    const dynamicQuery =
      `SELECT
        lat,
        lng,
        get_tract(ST_Point(lng, lat), 'tract_id') as tract
      FROM
        (VALUES ` +
      values.join(", ") +
      `) as latlng(lat, lng)`;

    const result = await this.postGIS.query(dynamicQuery, {
      type: Sequelize.QueryTypes.SELECT,
      searchPath: "public, tiger",
      supportsSearchPath: true
    });

    const tracts: Map<string, string> = new Map();
    result.forEach(row => {
      if (row.tract != null) {
        const key = row.lat + "|" + row.lng;
        tracts.set(key, row.tract);
      }
    });

    return tracts;
  }
}

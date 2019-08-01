// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file

import React from "react";
import {
  EncounterDocument,
  EncounterInfo
} from "audere-lib/dist/ebPhotoStoreProtocol";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  withGoogleMap,
  withScriptjs
} from "react-google-maps";

const EVD_POS = 1;
const EVD_NEG = 2;
const EVD_UNTRIAGED = 3;
const apiKey = "AIzaSyAgQB01v0gEm2L93fAfB_dnf_JJR8K-gAM";
const googleMapURL = `https://maps.googleapis.com/maps/api/js?v=3.exp&key=${apiKey}`;
const DEFAULT_ZOOM = 11;

interface Props {
  encounters: EncounterDocument[];
  style: React.CSSProperties;
}

interface Location {
  name: string;
  date: string;
  latitude: number;
  longitude: number;
  docId: string;
  diagnosis: number;
}

interface State {
  locations: Location[] | null;
}

export class SimpleMap extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { locations: null };
  }

  static getDerivedStateFromProps(props: Props, state: State): State | null {
    console.log("Encounters from props", props.encounters);
    if (
      !state.locations ||
      props.encounters.length !== state.locations.length
    ) {
      return {
        locations: SimpleMap.getLocations(props.encounters)
      };
    }
    return null;
  }

  private rad2degr(rad: number) {
    return (rad * 180) / Math.PI;
  }
  private degr2rad(degr: number) {
    return (degr * Math.PI) / 180;
  }
  //https://stackoverflow.com/questions/6671183/calculate-the-center-point-of-multiple-latitude-longitude-coordinate-pairs/14231286
  private computeCenter(locations: Location[]): { lat: number; lng: number } {
    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;

    for (let loc of locations) {
      let lat = this.degr2rad(loc.latitude);
      let lng = this.degr2rad(loc.longitude);
      sumX += Math.cos(lat) * Math.cos(lng);
      sumY += Math.cos(lat) * Math.sin(lng);
      sumZ += Math.sin(lat);
    }
    const avgX = sumX / locations.length;
    const avgY = sumY / locations.length;
    const avgZ = sumZ / locations.length;
    const lng = Math.atan2(avgY, avgX);
    const hyp = Math.sqrt(avgX * avgX + avgY * avgY);
    const lat = Math.atan2(avgZ, hyp);

    const center = { lat: this.rad2degr(lat), lng: this.rad2degr(lng) };
    return center;
  }

  private getIconUrl(diagnosis: number): string {
    switch (diagnosis) {
      case EVD_POS:
        return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
      case EVD_NEG:
        // Would prefer gray but Google doesn't offer a gray dot
        return "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
      case EVD_UNTRIAGED:
      default:
        return "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
    }
  }

  private static getLocations(encounters: EncounterDocument[]) {
    return encounters
      .filter(
        (eDoc: EncounterDocument) =>
          !!eDoc.encounter.rdtPhotos && eDoc.encounter.rdtPhotos.length > 0
      )
      .map((eDoc: EncounterDocument) => {
        const enc: EncounterInfo = eDoc.encounter;
        //const triage = await getApi().loadTriage(eDoc.docId);
        return {
          name: enc.patient.lastName + ", " + enc.patient.firstName,
          date: enc.rdtPhotos[0].timestamp.substring(0, 10),
          latitude: +enc.rdtPhotos[0].gps.latitude,
          longitude: +enc.rdtPhotos[0].gps.longitude,
          diagnosis: Math.ceil(Math.random() * 3.0), // TODO: Read this from the triage doc
          docId: eDoc.docId
        };
      });
  }

  MyGoogleMap = withScriptjs(
    withGoogleMap(() => (
      <GoogleMap
        defaultCenter={this.computeCenter(this.state.locations!)}
        defaultZoom={DEFAULT_ZOOM}
      >
        {this.state.locations!.map(location => (
          <Marker
            position={{ lat: location.latitude, lng: location.longitude }}
            icon={{ url: this.getIconUrl(location.diagnosis) }}
          >
            <InfoWindow>
              <span>
                {location.name} <br />
                {location.date} <br />
                <a href={`/patient-detail/${location.docId}`}>Details</a>
              </span>
            </InfoWindow>
          </Marker>
        ))}
      </GoogleMap>
    ))
  );
  loadingElement = <div />;
  containerElement = <div style={this.props.style} />;
  mapElement = <div style={this.props.style} />;
  map = (
    <this.MyGoogleMap
      loadingElement={this.loadingElement}
      containerElement={this.containerElement}
      googleMapURL={googleMapURL}
      mapElement={this.mapElement}
    />
  );

  public render(): React.ReactNode {
    const { locations } = this.state;
    console.log(
      "Location count:",
      locations,
      locations ? locations.length : locations
    );
    return (
      <div>
        {apiKey == null ? (
          "Cannot load map. Google Cloud API key is not configured."
        ) : locations == null || locations.length === 0 ? (
          "Loading..."
        ) : (
          <div style={this.props.style}>{this.map}</div>
        )}
      </div>
    );
  }
}

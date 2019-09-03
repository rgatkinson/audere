// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file

import React, { useState } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  withGoogleMap,
  withScriptjs,
} from "react-google-maps";
import { getApi } from "./api";
import { WithNamespaces, withNamespaces } from "react-i18next";

interface Props {
  locations: Location[];
  style: React.CSSProperties;
  zoom: number;
}

export interface Location {
  name: string;
  date: string;
  latitude: number;
  longitude: number;
  docId: string;
  iconUrl: string;
}

interface LatLng {
  lat: number;
  lng: number;
}

interface State {
  apiKey?: string;
}

class SimpleMap extends React.Component<Props & WithNamespaces, State> {
  state: State = {};
  componentWillMount() {
    this.loadApiKey();
  }
  private async loadApiKey() {
    const apiKey = await getApi().getGoogleCloudApiKey();
    this.setState({ apiKey });
  }
  private rad2degr(rad: number) {
    return (rad * 180) / Math.PI;
  }
  private degr2rad(degr: number) {
    return (degr * Math.PI) / 180;
  }
  //https://stackoverflow.com/questions/6671183/calculate-the-center-point-of-multiple-latitude-longitude-coordinate-pairs/14231286
  private computeCenter(locations: Location[]): LatLng {
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

  private getMapCenter(locations: Location[]): LatLng {
    if (locations.length === 1) {
      return {
        lat: locations[0].latitude,
        lng: locations[0].longitude,
      };
    } else {
      return {
        lat: -3.4,
        lng: 22.7,
      };
    }
  }

  MyGoogleMap = withScriptjs(
    withGoogleMap((props: { locations: Location[] }) => (
      <GoogleMap
        defaultCenter={this.getMapCenter(props.locations!)}
        defaultZoom={this.props.zoom}
      >
        {props.locations.map((location: Location) => (
          <SimpleMarker
            location={location}
            key={location.docId}
            tReady={this.props.tReady}
            i18n={this.props.i18n}
            t={this.props.t}
          />
        ))}
      </GoogleMap>
    ))
  );
  loadingElement = <div />;
  containerElement = <div style={this.props.style} />;
  mapElement = <div style={this.props.style} />;

  public render(): React.ReactNode {
    const { t } = this.props;
    const googleMapURL = `https://maps.googleapis.com/maps/api/js?v=3.exp&key=${this.state.apiKey}`;
    return (
      <div>
        {this.state.apiKey == null || this.props.locations == null ? (
          t("common:loading")
        ) : (
          <div style={this.props.style}>
            <this.MyGoogleMap
              loadingElement={this.loadingElement}
              containerElement={this.containerElement}
              googleMapURL={googleMapURL}
              mapElement={this.mapElement}
              locations={this.props.locations}
            />
          </div>
        )}
      </div>
    );
  }
}

export default withNamespaces("simpleMap")(SimpleMap);

interface SimpleMarkerProps {
  location: Location;
}

const SimpleMarker: React.FC<SimpleMarkerProps & WithNamespaces> = props => {
  const { location, t } = props;
  const [open, setOpen] = useState(false);

  return (
    <Marker
      position={{ lat: location.latitude, lng: location.longitude }}
      icon={{ url: location.iconUrl }}
      onClick={() => setOpen(!open)}
    >
      {open && (
        <InfoWindow>
          <span>
            {location.name} <br />
            {location.date} <br />
            <a href={`/patient-detail/${location.docId}`}>
              {t("simpleMap:details")}
            </a>
          </span>
        </InfoWindow>
      )}
    </Marker>
  );
};

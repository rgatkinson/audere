// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  Locations as COLLECTION_LOCATIONS,
  LocationType,
} from "audere-lib/locations";

export function getLocationType(locationKey: string) {
  return COLLECTION_LOCATIONS[locationKey].type;
}
export function getContactName(locationKey: string) {
  return !!locationKey && COLLECTION_LOCATIONS[locationKey]
    ? COLLECTION_LOCATIONS[locationKey].contactName
    : null;
}
export function getContactPhone(locationKey: string) {
  return !!locationKey && COLLECTION_LOCATIONS[locationKey]
    ? COLLECTION_LOCATIONS[locationKey].contactPhone
    : null;
}

/*
export const COLLECTION_LOCATIONS: {
  [key: string]: {
    type: locationType;
    contactName: string;
    contactPhone: string;
  };
} = {
  Harborview: {
    type: "hospital",
    contactName: "Dr. Helen Y. Chu",
    contactPhone: "(206) 897-5318",
  },
  HarborviewLobby: {
    type: "homelessShelter",
    contactName: "Dr. Helen Y. Chu",
    contactPhone: "(206) 897-5318",
  },
  ChildrensHospitalSeattle: {
    type: "childrensHospital",
    contactName: "Dr. Helen Y. Chu",
    contactPhone: "(206) 897-5318",
  },
  ChildrensHospitalBellevue: {
    type: "childrensHospital",
    contactName: "Dr. Helen Y. Chu",
    contactPhone: "(206) 897-5318",
  },
  HUB: {
    type: "collegeCampus",
    contactName: "Dr. Helen Y. Chu",
    contactPhone: "(206) 897-5318",
  },
  UWHallHealth: {
    type: "collegeCampus",
    contactName: "Dr. Helen Y. Chu",
    contactPhone: "(206) 897-5318",
  },
  HealthSciencesRotunda: {
    type: "collegeCampus",
    contactName: "Dr. Helen Y. Chu",
    contactPhone: "(206) 897-5318",
  },
  HealthSciencesLobby: {
    type: "collegeCampus",
    contactName: "Dr. Helen Y. Chu",
    contactPhone: "(206) 897-5318",
  },
  StMartins: {
    type: "homelessShelter",
    contactName: "Dr. Helen Y. Chu",
    contactPhone: "(206) 897-5318",
  },
  DESC: {
    type: "homelessShelter",
    contactName: "Dr. Helen Y. Chu",
    contactPhone: "(206) 897-5318",
  },
  PioneerSquare: {
    type: "homelessShelter",
    contactName: "Dr. Helen Y. Chu",
    contactPhone: "(206) 897-5318",
  },
  UWSeaMar: {
    type: "clinic",
    contactName: "Dr. Helen Y. Chu",
    contactPhone: "(206) 897-5318",
  },
  ChildrensSeaMar: {
    type: "childrensClinic",
    contactName: "Dr. Helen Y. Chu",
    contactPhone: "(206) 897-5318",
  },
  HutchKids: {
    type: "childcare",
    contactName: "Dr. Helen Y. Chu",
    contactPhone: "(206) 897-5318",
  },
  UWDaycare: {
    type: "childcare",
    contactName: "Dr. Helen Y. Chu",
    contactPhone: "(206) 897-5318",
  },
  SeaTacInternational: {
    type: "port",
    contactName: "Dr. Helen Y. Chu",
    contactPhone: "(206) 897-5318",
  },
  Costco: {
    type: "clinic",
    contactName: "Dr. Helen Y. Chu",
    contactPhone: "(206) 897-5318",
  },
  FredHutchLobby: {
    type: "clinic",
    contactName: "Dr. Helen Y. Chu",
    contactPhone: "(206) 897-5318",
  },
};
*/

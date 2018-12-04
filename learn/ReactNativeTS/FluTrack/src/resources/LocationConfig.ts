export type locationType =
  | "clinic"
  | "communityClinic"
  | "childcare"
  | "homeless"
  | "pharmacy"
  | "port"
  | "workplace";

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

export const COLLECTION_LOCATIONS: {
  [key: string]: {
    type: locationType;
    contactName: string;
    contactPhone: string;
  };
} = {
  UniversityOfWashington: {
    type: "clinic",
    contactName: "[INSERT NAME]",
    contactPhone: "[INSERT PHONE]",
  },
  Harborview: {
    type: "clinic",
    contactName: "[INSERT NAME]",
    contactPhone: "[INSERT PHONE]",
  },
  NorthwestHospital: {
    type: "clinic",
    contactName: "[INSERT NAME]",
    contactPhone: "[INSERT PHONE]",
  },
  SeattleChildrens: {
    type: "clinic",
    contactName: "[INSERT NAME]",
    contactPhone: "[INSERT PHONE]",
  },
  FredHutch: {
    type: "clinic",
    contactName: "[INSERT NAME]",
    contactPhone: "[INSERT PHONE]",
  },
  UWFremontClinic: {
    type: "clinic",
    contactName: "[INSERT NAME]",
    contactPhone: "[INSERT PHONE]",
  },
  SeamarSoKingCounty: {
    type: "communityClinic",
    contactName: "[INSERT NAME]",
    contactPhone: "[INSERT PHONE]",
  },
  UWHealthcareEquity: {
    type: "communityClinic",
    contactName: "[INSERT NAME]",
    contactPhone: "[INSERT PHONE]",
  },
  HutchKids: {
    type: "childcare",
    contactName: "[INSERT NAME]",
    contactPhone: "[INSERT PHONE]",
  },
  UWDaycare: {
    type: "childcare",
    contactName: "[INSERT NAME]",
    contactPhone: "[INSERT PHONE]",
  },
  HealthCareForTheHomeless: {
    type: "homeless",
    contactName: "[INSERT NAME]",
    contactPhone: "[INSERT PHONE]",
  },
  KingCountyPublicHealth: {
    type: "homeless",
    contactName: "[INSERT NAME]",
    contactPhone: "[INSERT PHONE]",
  },
  Bartell: {
    type: "pharmacy",
    contactName: "[INSERT NAME]",
    contactPhone: "[INSERT PHONE]",
  },
  Walgreens: {
    type: "pharmacy",
    contactName: "[INSERT NAME]",
    contactPhone: "[INSERT PHONE]",
  },
  DomesticArrivalsSeaTac: {
    type: "port",
    contactName: "[INSERT NAME]",
    contactPhone: "[INSERT PHONE]",
  },
  AlaskaCruises: {
    type: "port",
    contactName: "[INSERT NAME]",
    contactPhone: "[INSERT PHONE]",
  },
  InternationalArrivalsCDC: {
    type: "port",
    contactName: "[INSERT NAME]",
    contactPhone: "[INSERT PHONE]",
  },
  AlaskaAirlines: {
    type: "port",
    contactName: "[INSERT NAME]",
    contactPhone: "[INSERT PHONE]",
  },
  Boeing: {
    type: "workplace",
    contactName: "[INSERT NAME]",
    contactPhone: "[INSERT PHONE]",
  },
  Microsoft: {
    type: "workplace",
    contactName: "[INSERT NAME]",
    contactPhone: "[INSERT PHONE]",
  },
  Amazon: {
    type: "workplace",
    contactName: "[INSERT NAME]",
    contactPhone: "[INSERT PHONE]",
  },
  OtherWorkplace: {
    type: "workplace",
    contactName: "[INSERT NAME]",
    contactPhone: "[INSERT PHONE]",
  },
};

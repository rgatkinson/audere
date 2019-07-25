// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

export interface PatientRecord {
  uid: string; // internal Audere id, globally unique
  localId: string;
  patient: Patient,
  chw: HealthWorker;
  photo: PatientRDTPhoto;
}

export interface Patient {
  firstName: string;
  lastName: string
  phone: string;
  notes: string;
}

export interface HealthWorker {
  firstName: string;
  lastName: string
  phone: string;
  notes: string;
}

export interface PatientRDTPhoto {
  uid: string;
  gps: GPSLocation;
  timestamp: string;
}

export interface GPSLocation {
  latitude: string;
  longitude: string;
}

const CHW0: HealthWorker = {
  firstName: "A.",
  lastName: "Healthworker",
  phone: "+999999",
  notes: "",
}

const CHW1: HealthWorker = {
  firstName: "Community",
  lastName: "Hw",
  phone: "+888888",
  notes: "Based in Abcde",
}

export const SAMPLE_PATIENT_RECORDS: PatientRecord[] = [
  {
    uid: "1",
    localId: "20",
    patient: {
      firstName: "Mary",
      lastName: "Patient",
      phone: "1234",
      notes: "",
    },
    chw: CHW0,
    photo: {
      uid: "B020B59C-30A8-4A56-A803-8A13E1405037",
      gps: {
        latitude: "1.123456789",
        longitude: "2.123456789",
      },
      timestamp: "2019-07-21T05:50:30.154Z"
    }
  },
  {
    uid: "2",
    localId: "5",
    patient: {
      firstName: "Bob",
      lastName: "Patient",
      phone: "2345",
      notes: "has high fever",
    },
    chw: CHW1,
    photo: {
      uid: "B9AB20EA-8D45-4731-8B50-C245AB758B5A",
      gps: {
        latitude: "3.123456789",
        longitude: "4.123456789",
      },
      timestamp: "2019-07-22T05:50:30.154Z"
    }
  },
  {
    uid: "3",
    localId: "14",
    patient: {
      firstName: "Alice",
      lastName: "Patient",
      phone: "3456",
      notes: "",
    },
    chw: CHW1,
    photo: {
      uid: "5721982F-D18F-46B0-AAAD-06FBB58865BA",
      gps: {
        latitude: "5.123456789",
        longitude: "6.123456789",
      },
      timestamp: "2019-07-23T05:50:30.154Z"
    }
  },
  {
    uid: "4",
    localId: "87",
    patient: {
      firstName: "Joe",
      lastName: "Patient",
      phone: "4567",
      notes: "",
    },
    chw: CHW0,
    photo: {
      uid: "FC669686-BCD0-40ED-89D6-E86C26F3C38B",
      gps: {
        latitude: "7.123456789",
        longitude: "8.123456789",
      },
      timestamp: "2019-07-24T05:50:30.154Z"
    }
  },
  {
    uid: "5",
    localId: "53",
    patient: {
      firstName: "Pat",
      lastName: "Patient",
      phone: "5678",
      notes: "",
    },
    chw: CHW0,
    photo: {
      uid: "F95D6F42-C4B6-4D76-9CD1-81E780A950CA",
      gps: {
        latitude: "9.123456789",
        longitude: "10.123456789",
      },
      timestamp: "2019-07-25T05:50:30.154Z"
    }
  },
];

export interface PatientRecordTriage {
  uid: string; // Matches PatentRecord.uid
  notes: string;
  testIndicatesEVD: boolean;
}

export const SAMPLE_TRIAGES: PatientRecordTriage[] = [
  {
    uid: "1",
    notes: "",
    testIndicatesEVD: false
  },
  {
    uid: "2",
    notes: "confirmed by Dr. M. D.\nThe RDT clearly shows two pink lines.",
    testIndicatesEVD: true
  },
  {
    uid: "3",
    notes: "",
    testIndicatesEVD: false
  },
  {
    uid: "4",
    notes: "",
    testIndicatesEVD: false
  },
  {
    uid: "5",
    notes: "",
    testIndicatesEVD: false
  }
];

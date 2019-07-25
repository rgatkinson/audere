// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { PatientRecord, PatientRecordTriage, SAMPLE_PATIENT_RECORDS, SAMPLE_TRIAGES } from "./protocol";
import { getRoot } from "./util";

export interface User {
  email: string;
  token: string;
}

// TODO
export class Api {
  csrf: string | null;
  baseUrl: string | null;
  session: Storage;
  triages: Map<string, PatientRecordTriage>;

  constructor() {
    const root = getRoot();
    this.csrf = (root && root.dataset.csrf) || null;
    this.baseUrl = (root && root.dataset.baseUrl) || null;
    this.session = window.sessionStorage;
    this.triages = new Map(SAMPLE_TRIAGES.map(
      x => [x.uid, x] as [string, PatientRecordTriage]
    ));
  }

  isAuthenticated(): boolean {
    return ["UserEmail", "UserToken"]
      .every(key => this.session.getItem(key) != null);
  }

  currentUser(): User | null {
    const email = this.session.getItem("UserEmail");
    const token = this.session.getItem("UserToken");
    if (email != null && token != null) {
      return { email, token };
    } else {
      return null;
    }
  }

  async login(email: string, password: string): Promise<User> {
    await this.delay(500);
    if (password === email) {
      throw new Error(`No valid user found with that email and password.`);
    }
    this.session.setItem("UserEmail", email);
    this.session.setItem("UserToken", password);
    return { email, token: password };
  }

  async logout(): Promise<void> {
    this.session.clear();
    await this.delay(500);
  }

  async loadPatientRecord(): Promise<PatientRecord[]> {
    await this.delay(1000);
    return SAMPLE_PATIENT_RECORDS;
  }

  async loadRecord(uid: string): Promise<PatientRecord> {
    await this.delay(1000);
    const matches = SAMPLE_PATIENT_RECORDS.filter(record => record.uid === uid);
    return expectOne(matches, "record", uid);
  }

  async loadTriage(uid: string): Promise<PatientRecordTriage> {
    await this.delay(300);
    const triage = this.triages.get(uid);
    if (triage == null) {
      throw new Error(`No triage found for uid ${uid}`);
    }
    return triage;
  }

  async saveTriage(uid: string, triage: PatientRecordTriage): Promise<void> {
    await this.delay(300);
    this.triages.set(uid, triage);
  }

  async delay(ms: number) {
    await new Promise(f => setTimeout(f, ms));
  }
}

function expectOne<T>(array: T[], noun: string, criterion: string): T {
  if (array.length !== 1) {
    throw new Error(`Expected one ${noun} to match ${criterion}, got ${array.length}`);
  }
  return array[0];
}

let api: Api | null = null;
export function getApi() {
  if (api == null) {
    api = new Api();
  }
  return api;
}

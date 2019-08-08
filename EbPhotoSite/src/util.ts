// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  DocumentType,
  EncounterDocument,
  EncounterTriageDocument,
  EncounterTriageInfo,
} from "audere-lib/dist/ebPhotoStoreProtocol";
import { getApi } from "./api";
import { format } from "date-fns";

export function getRoot() {
  return document.getElementById("root");
}

export function localeDate(timestamp: string): string {
  return format(date(timestamp), "DD/MM/YYYY, HH:mm");
}

export function date(timestamp: string): Date {
  if (/^[0-9]+$/.test(timestamp)) {
    return new Date(Number.parseInt(timestamp));
  } else {
    return new Date(timestamp);
  }
}

export function last<T>(array: Array<T>): T | null {
  if (array.length === 0) {
    return null;
  } else {
    return array[array.length - 1];
  }
}

export async function loadAllEncounters(): Promise<EncounterDocument[]> {
  const snapshot = (await getApi().loadEncounters()) as firebase.firestore.QuerySnapshot;
  return snapshot.docs.map(e => e.data() as EncounterDocument);
}

export async function loadAllTriages(): Promise<EncounterTriageDocument[]> {
  const snapshot = (await getApi().loadTriages()) as firebase.firestore.QuerySnapshot;
  return snapshot.docs.map(e => e.data() as EncounterTriageDocument);
}

export function triageDocFromTriage(
  docId: string,
  triage: EncounterTriageInfo
): EncounterTriageDocument {
  return {
    documentType: DocumentType.Triage,
    schemaId: 1,
    docId,
    triage,
  };
}

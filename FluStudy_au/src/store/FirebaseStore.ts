import firebase from "react-native-firebase";
import { DEVICE_INFO } from "../transport/DeviceInfo";
import { AppHealthEvents, LogDebugEvent } from "../util/tracker";
import { sha256 } from "js-sha256";
import {
  FirestoreProtocolDocument,
  SurveyNonPIIInfo,
  DocumentType,
} from "audere-lib/coughProtocol";

const DEFAULT_SURVEY_COLLECTION = "surveys";

export async function initializeFirestore() {
  // This enables offline caching
  await firebase.firestore().settings({ persistence: true });
}

export async function saveSurvey(docId: string, survey: SurveyNonPIIInfo) {
  try {
    const existingRef = getSurveyCollection().doc(docId);
    const existingSnap = await existingRef.get();
    const storedSurvey: FirestoreProtocolDocument = {
      _transport: {
        sentAt: new Date().toISOString(),
        contentHash: hashFromSurvey(survey),
        lastWriter: "sender",
        protocolVersion: 1,
      },
      device: DEVICE_INFO,
      docId,
      documentType: DocumentType.Survey,
      schemaId: 1,
      survey,
    };

    if (existingSnap.exists) {
      await existingRef.update(storedSurvey);
    } else {
      await existingRef.set(storedSurvey);
    }
  } catch (e) {
    LogDebugEvent(AppHealthEvents.FIRESTORE_SAVE_SURVEY_ERROR, e);
  }
}

function getSurveyCollection() {
  const collectionName =
    process.env.FIRESTORE_SURVEY_COLLECTION || DEFAULT_SURVEY_COLLECTION;
  return firebase.firestore().collection(collectionName);
}

function hashFromSurvey(survey: SurveyNonPIIInfo) {
  return sha256(JSON.stringify(survey));
}

function getPhotoPath(docId: string): string {
  return `images/${docId}.jpg`;
}

export function savePhoto(docId: string, photoBase64: string) {
  const storage = firebase.storage().ref();
  const path = getPhotoPath(docId);
  const dataUri = `data:image/jpg;base64,${photoBase64}`;

  // In upcoming PR, going to implement offline <> online durable file upload
  // storage.child(path).putFile(dataUri, { contentType: "image/jpeg" });
  return path;
}

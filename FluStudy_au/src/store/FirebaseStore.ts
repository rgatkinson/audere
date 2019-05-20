import firebase from "react-native-firebase";
import { DEVICE_INFO } from "../transport/DeviceInfo";
import { AppHealthEvents, logDebugEvent } from "../util/tracker";
import { sha256 } from "js-sha256";
import {
  FirestoreProtocolDocument,
  SurveyNonPIIInfo,
  DocumentType,
} from "audere-lib/coughProtocol";
import { PhotoUploader } from "../transport/PhotoUploader";

const DEFAULT_SURVEY_COLLECTION = "surveys";

const photoUploader = new PhotoUploader();

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
    logDebugEvent(AppHealthEvents.FIRESTORE_SAVE_SURVEY_ERROR, e);
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

export function savePhoto(photoId: string, jpegBase64: string): void {
  photoUploader.savePhoto(photoId, jpegBase64);
}

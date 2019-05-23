import firebase from "react-native-firebase";
import { DEVICE_INFO } from "../transport/DeviceInfo";
import { AppHealthEvents, logDebugEvent } from "../util/tracker";
import { sha256 } from "js-sha256";
import {
  FirestoreProtocolDocument,
  SurveyNonPIIInfo,
  DocumentType,
  ProtocolDocument,
} from "audere-lib/coughProtocol";
import { PhotoUploader } from "../transport/PhotoUploader";

const DEFAULT_SURVEY_COLLECTION = "surveys";
const DEFAULT_PHOTO_COLLECTION = "photos";

const photoUploader = new PhotoUploader();

function getSurveyCollection() {
  const collectionName =
    process.env.FIRESTORE_SURVEY_COLLECTION || DEFAULT_SURVEY_COLLECTION;
  return firebase.firestore().collection(collectionName);
}

function getPhotoCollection() {
  const collectionName =
    process.env.FIRESTORE_PHOTO_COLLECTION || DEFAULT_PHOTO_COLLECTION;
  return firebase.firestore().collection(collectionName);
}

export async function initializeFirestore() {
  // This enables offline caching
  await firebase.firestore().settings({ persistence: true });
}

export async function saveSurvey(docId: string, survey: SurveyNonPIIInfo) {
  try {
    const surveyDocument: FirestoreProtocolDocument = frame({
      schemaId: 1,
      docId,
      device: DEVICE_INFO,
      documentType: DocumentType.Survey,
      survey,
    });
    await getSurveyCollection()
      .doc(docId)
      .set(surveyDocument);
  } catch (e) {
    logDebugEvent(AppHealthEvents.FIRESTORE_SAVE_SURVEY_ERROR, e);
  }
}

export async function savePhoto(photoId: string, jpegBase64: string) {
  try {
    photoUploader.savePhoto(photoId, jpegBase64);
  } catch (e) {
    // Error was already logged
    return;
  }

  try {
    const photoDocument: FirestoreProtocolDocument = frame({
      schemaId: 1,
      docId: photoId,
      device: DEVICE_INFO,
      documentType: DocumentType.Photo,
      photo: {
        timestamp: new Date().toISOString(),
        photoId,
      },
    });
    await getPhotoCollection()
      .doc(photoId)
      .set(photoDocument);
  } catch (e) {
    logDebugEvent(AppHealthEvents.FIRESTORE_SAVE_PHOTO_ERROR, e);
  }
}

function frame(document: ProtocolDocument): FirestoreProtocolDocument {
  return {
    ...document,
    _transport: {
      sentAt: new Date().toISOString(),
      contentHash: sha256(JSON.stringify(document)),
      lastWriter: "sender",
      protocolVersion: 1,
    },
  };
}

import { hasPendingPhotos, waitForIdlePhotoUploader } from "../store";
const PHOTO_UPLOAD_TIMEOUT = 90000;

export async function pendingNavigation() {
  const hasPhotos = await hasPendingPhotos();
  return hasPhotos ? "PendingData" : "Thanks";
}

export async function hasPendingData() {
  return await hasPendingPhotos();
}

export async function uploadPendingSuccess() {
  try {
    await waitForIdlePhotoUploader(PHOTO_UPLOAD_TIMEOUT);
    return true;
  } catch (error) {
    return false;
  }
}

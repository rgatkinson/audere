import { hasPendingPhotos } from "../store";

export async function pendingNavigation() {
  const hasPhotos = await hasPendingPhotos();
  return hasPhotos ? "PendingData" : "Thanks";
}

export async function hasPendingData() {
  return await hasPendingPhotos();
}

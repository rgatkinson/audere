// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import firebase from "react-native-firebase";
import NetInfo from "@react-native-community/netinfo";
import {
  Action,
  PhotoUpload,
  PhotoUploadState,
  getStore,
  startPhotoUpload,
  retryPhotoUpload,
  photoUploadFailed,
  photoUploadFinished
} from "../store";

NetInfo.addEventListener(state => {
  if (state.isInternetReachable) {
    retryUploads();
  }
});

export async function startUpload(photoId: string, uri: string) {
  console.log(photoId + ": " + uri);
  const store = await getStore();
  store.dispatch(startPhotoUpload(photoId, uri));
  uploadPhoto(photoId, uri);
}

export async function retryUploads(force = false) {
  const store = await getStore();
  const photoUploads: PhotoUploadState = store.getState().photoUploads;
  Object.values(photoUploads)
    .filter(
      photoUpload =>
        photoUpload.uploadState == PhotoUploadState.FAILED ||
        (force && photoUpload.uploadState === PhotoUploadState.UPLOADING)
    )
    .map(photoUpload => retryUpload(photoUpload.photoId));
}

async function retryUpload(photoId: string) {
  const store = await getStore();
  const state = store.getState();
  const uri = state.photoUploads;
  store.dispatch(startPhotoUpload(photoId, uri));
  uploadPhoto(photoId, uri);
}

async function uploadPhoto(photoId: string, uri: string) {
  const store = await getStore();
  try {
    await firebase
      .storage()
      .ref()
      .child(`photos/${photoId}.jpg`)
      .putFile(uri, { contentType: "image/jpeg" });
  } catch (e) {
    console.warn(`Failed to upload ${photoId}`);
    console.warn(e);
    store.dispatch(photoUploadFailed(photoId, e.message));
    return;
  }
  store.dispatch(photoUploadFinished(photoId));
}

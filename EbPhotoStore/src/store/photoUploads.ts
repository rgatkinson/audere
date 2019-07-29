// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

export type PhotoUploadAction =
  | {
      type: "START_UPLOAD";
      photoId: string;
      photoUri: string;
    }
  | {
      type: "FINISH_UPLOAD";
      photoId: string;
    }
  | {
      type: "UPLOAD_FAILED";
      photoId: string;
      error: string;
    }
  | {
      type: "RETRY_UPLOAD";
      photoId: string;
    };

export enum PhotoUploadState {
  UPLOADING,
  FAILED,
  UPLOADED
}

export type PhotoUpload = {
  photoId: string;
  uploadState: PhotoUploadState;
  localUri: string;
  errors: string[];
};

export type PhotoUploadsState = { [photoId: string]: PhotoUpload };

export function startPhotoUpload(
  photoId: string,
  photoUri: string
): PhotoUploadAction {
  return {
    type: "START_UPLOAD",
    photoId,
    photoUri
  };
}

export function retryPhotoUpload(photoId: string): PhotoUploadAction {
  return {
    type: "RETRY_UPLOAD",
    photoId
  };
}

export function photoUploadFinished(photoId: string): PhotoUploadAction {
  return {
    type: "FINISH_UPLOAD",
    photoId
  };
}

export function photoUploadFailed(
  photoId: string,
  error: string
): PhotoUploadAction {
  return {
    type: "UPLOAD_FAILED",
    photoId,
    error
  };
}

const initialState: PhotoUploadsState = {};

export default function reducer(
  state = initialState,
  action: PhotoUploadAction
): PhotoUploadsState {
  let photoUpload: PhotoUpload;
  switch (action.type) {
    case "START_UPLOAD":
      if (Object.keys(state).includes(action.photoId)) {
        console.warn(
          `Uploading two photos with the same id: ${action.photoId}`
        );
      }
      return {
        ...state,
        [action.photoId]: {
          photoId: action.photoId,
          localUri: action.photoUri,
          uploadState: PhotoUploadState.UPLOADING,
          errors: []
        }
      };
    case "FINISH_UPLOAD":
      photoUpload = state[action.photoId];
      return {
        ...state,
        [action.photoId]: {
          ...photoUpload,
          uploadState: PhotoUploadState.UPLOADED
        }
      };
    case "UPLOAD_FAILED":
      photoUpload = state[action.photoId];
      return {
        ...state,
        [action.photoId]: {
          ...photoUpload,
          uploadState: PhotoUploadState.FAILED,
          errors: [...photoUpload.errors, action.error]
        }
      };
    case "RETRY_UPLOAD":
      photoUpload = state[action.photoId];
      return {
        ...state,
        [action.photoId]: {
          ...photoUpload,
          uploadState: PhotoUploadState.UPLOADING
        }
      };
  }
  return state;
}

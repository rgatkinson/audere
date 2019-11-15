// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { AppHealthEvents, logFirebaseEvent } from "../util/tracker";

const DEBUG_ASYNC_ERRORS = process.env.DEBUG_ASYNC_ERRORS === "true";

export async function logIfAsyncError<T>(
  tag: string,
  call: () => Promise<T>
): Promise<T> {
  try {
    return await call();
  } catch (err) {
    if ((err as any).logged) {
      throw err;
    } else {
      throw logError(tag, err);
    }
  }
}

export function logError(tag: string, err: any): LoggedError {
  const message = err != null ? err.message : "";
  const name = err != null ? err.name : "";
  const summary = `${tag} threw '${name}': '${message}'`;

  debug(summary);
  logFirebaseEvent(AppHealthEvents.ASYNC_ERROR, {
    tag,
    message,
    name,
  });
  return new LoggedError(summary);
}

// Ensure we only log this error once.
class LoggedError extends Error {
  readonly logged: boolean;

  constructor(message: string) {
    super(message);
    this.logged = true;
  }
}

function debug(s: string) {
  if (DEBUG_ASYNC_ERRORS) {
    console.log(`PhotoUploader: ${s}`);
  }
}

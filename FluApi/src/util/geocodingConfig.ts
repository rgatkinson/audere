// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { getSecret } from "./secretsConfig";

export const smartyStreetsAuthId: Promise<string> = getSecret("SMARTYSTREETS_AUTH_ID");

export const smartyStreetsAuthToken: Promise<string> = getSecret("SMARTYSTREETS_AUTH_TOKEN");

export const smartyStreetsBaseUrl: string = process.env.SMARTYSTREETS_BASE_URL;

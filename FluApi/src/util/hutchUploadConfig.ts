// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { getSecret } from "./secretsConfig";

export const baseUrl: Promise<string> = getSecret("HUTCH_BASE_URL");

export const user: Promise<string> = getSecret("HUTCH_USER");

export const password: Promise<string> = getSecret("HUTCH_PASSWORD");

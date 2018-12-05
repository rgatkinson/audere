// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

/**
 * This script generates a  64 character base64url-encoded random key
 * and prints out 3 keys that xor to it.
 *
 * Run using `yarn run generate-access-key`
 */

import base64url from "base64url";
import bufferXor from "buffer-xor";
import { generateRandomKey } from "../util/crypto";
import { AccessKey } from "../models/accessKey";

async function generateAccessKey() {
  const components = [
    await generateRandomKey(),
    await generateRandomKey(),
    await generateRandomKey()
  ];
  const buffers = components.map(base64url.toBuffer);
  const buffer = buffers.reduce(bufferXor, new Buffer(0));
  const key = base64url(buffer);

  await AccessKey.create({ key, valid: true });
  return components;
}

generateAccessKey().then(components => {
  components.forEach(component => console.log(component));
  process.exit();
});

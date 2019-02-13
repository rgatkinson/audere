// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

/**
 * This script generates a 64 character base64url-encoded random key
 * and prints out 3 keys that xor to it.
 *
 * Run using `yarn run generate-access-key`
 */

import base64url from "base64url";
import bufferXor from "buffer-xor";
import { generateRandomKey } from "../util/crypto";
import { createSplitSql } from "../util/sql";
import { defineSnifflesModels } from "../models/sniffles";

async function generateAccessKey() {
  const components = [
    "X12ct9Go-AqgxyjnuCT4uOHFFokVfnB03BXo3vxw_TEQVBAaK53Kkk74mEwU5Nuw",
    await generateRandomKey(),
    await generateRandomKey()
  ];
  const buffers = components.map(base64url.toBuffer);
  const buffer = buffers.reduce(bufferXor, new Buffer(0));
  const key = base64url(buffer);

  const sql = createSplitSql();
  const models = defineSnifflesModels(sql);
  await models.accessKey.create({ key, valid: true });
  await sql.close();
  return components;
}

generateAccessKey().then(components => {
  console.log();
  console.log("Copy the following lines to your .env file:");
  console.log(`ACCESS_KEY_A=${components[1]}`);
  console.log(`ACCESS_KEY_B=${components[2]}`);
  console.log();
  process.exit();
});

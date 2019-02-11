// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import dotenv from "dotenv";

dotenv.config();

if (!process.env.NONPII_DATABASE_URL) {
  throw new Error("Copy .env.example to .env and customize stuff :)");
}

if (!process.env.PII_DATABASE_URL) {
  throw new Error("Copy .env.example to .env and customize stuff :)");
}

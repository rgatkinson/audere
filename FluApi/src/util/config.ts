// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("Copy .env.example to .env and customize stuff :)");
}

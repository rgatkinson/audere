// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { SplitSql, createSplitSql } from "backend-lib";
import logger from "../util/logger";
import "../util/config";

export function getSql(): SplitSql {
  return createSplitSql(logger.info);
}

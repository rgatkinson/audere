// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { AccessKey } from "../models/accessKey";
import { Visit } from "../models/visit";
import logger from "../util/logger";

export async function putDocument(req, res) {
  await Visit.upsert({
    csruid: req.params.documentId,
    device: req.body.device,
    visit: req.body.visit
  });
  res.json({ Status: "SUCCESS" });
}

export async function putDocumentWithKey(req, res, next) {
  const matchingKey = await AccessKey.findOne({
    where: { key: req.params.key, valid: true }
  });

  if (!matchingKey) {
    next();
    logger.warn(`Rejected document upload with key: ${req.params.key}`);
    return;
  }
  try {
    return await putDocument(req, res);
  } catch (e) {
    next(e);
  }
}

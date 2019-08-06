// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  defineModel,
  Model,
  SplitSql,
  booleanColumn,
  integerColumn,
  unique,
} from "../../util/sql";

export interface ConsentEmailAttributes {
  id?: number;
  visitId: string;
  emailRequested: boolean;
  consentsSent: number;
  signaturesSent: boolean;
}
export type ConsentEmailModel = Model<ConsentEmailAttributes>;
export function defineConsentEmail(sql: SplitSql): ConsentEmailModel {
  return defineModel<ConsentEmailAttributes>(sql.nonPii, "consent_email", {
    visitId: unique(integerColumn("visit_id")),
    emailRequested: booleanColumn("email_requested"),
    consentsSent: integerColumn("consents_sent"),
    signaturesSent: booleanColumn("signatures_sent"),
  });
}

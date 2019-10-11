// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import AWS from "aws-sdk";

AWS.config.update({
  region: "us-west-2",
  credentialProvider: new AWS.CredentialProviderChain([
    () => new AWS.SharedIniFileCredentials(),
    () => new AWS.ECSCredentials(),
  ]),
});

export { AWS };

// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { publicApp, internalApp } from "./app";

export const externalServer = publicApp.listen(
  publicApp.get("port"),
  () => {
    console.log(
      "Public app is running at http://localhost:%d in %s mode",
      publicApp.get("port"),
      publicApp.get("env")
    );
  }
);

export const internalServer = internalApp.listen(
  internalApp.get("port"),
  () => {
    console.log(
      "Internal app is running at http://localhost:%d in %s mode",
      internalApp.get("port"),
      internalApp.get("env")
    );
  }
);

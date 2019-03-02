// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { sp } from "@pnp/sp";
import { SPFetchClient } from "@pnp/nodejs";
import { SharePointConfig } from "../../util/sharePointConfig";

export class SharePointUploader {
  private readonly config: SharePointConfig;

  constructor(config: SharePointConfig) {
    this.config = config;

    sp.setup({
      sp: {
        fetchClientFactory: () => {
          return new SPFetchClient(
            config.url,
            config.clientId,
            config.clientSecret
          );
        }
      }
    })
  }

  public async sendFile(batch: number, contents: string): Promise<void> {
    // YYYY-MM-DDTHH:mm
    const now = new Date().toISOString().substring(0, 10);
    const file = `Gift-Card-Report-${batch}.${now}.csv`;

    await sp.web.getFolderByServerRelativePath(this.config.incentivesFolder)
      .files
      .add(file, contents);
  }
}
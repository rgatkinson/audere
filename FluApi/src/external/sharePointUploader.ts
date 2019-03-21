// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { sp } from "@pnp/sp";
import { SPFetchClient } from "@pnp/nodejs";
import { SharePointConfig } from "../util/sharePointConfig";
import { UWUploader } from "./uwUploader";

export class SharePointUploader implements UWUploader {
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
    });
  }

  public async sendIncentives(batch: number, contents: string): Promise<void> {
    // YYYY-MM-DD
    const now = new Date().toISOString().substring(0, 10);
    const file = `Gift-Card-Report-${batch}.${now}.csv`;

    await sp.web
      .getFolderByServerRelativePath(this.config.incentivesFolder)
      .files.add(file, contents);
  }

  public async sendKits(batch: number, contents: string): Promise<void> {
    // YYYY-MM-DD
    const now = new Date().toISOString().substring(0, 10);
    const file = `Kit-Fulfillment-Report-${batch}.${now}.csv`;

    await sp.web
      .getFolderByServerRelativePath(this.config.kitsFolder)
      .files.add(file, contents);
  }

  public async sendFollowUps(batch: number, contents: string): Promise<void> {
    // YYYY-MM-DD
    const now = new Date().toISOString().substring(0, 10);
    const file = `FollowUp-Report-${batch}.${now}.csv`;

    await sp.web
      .getFolderByServerRelativePath(this.config.kitsFolder)
      .files.add(file, contents);
  }

  public async writeBarcodeErrors(contents: string): Promise<void> {
    // YYYY-MM-DD
    const now = new Date().toISOString().substring(0, 10);
    const file = `Surveys-Report.${now}.csv`;

    await sp.web
      .getFolderByServerRelativePath(this.config.kitsFolder)
      .files.add(file, contents);
  }
}

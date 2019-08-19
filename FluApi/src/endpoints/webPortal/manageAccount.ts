// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { SplitSql } from "backend-lib";
import { AuthManager } from "./auth";

export class ManageAccount {
  constructor(sql: SplitSql, getStatic: () => string) {
    this.authManager = new AuthManager(sql);
    this.getStatic = getStatic;
  }
  private authManager: AuthManager;
  private getStatic: () => string;

  public getForm = async (req, res) => {
    res.render("account.html", {
      static: this.getStatic(),
      csrf: req.csrfToken(),
    });
  };

  public updatePassword = async (req, res) => {
    const verifyResult = await this.authManager.verifyPassword(
      req.user.userid,
      req.body.currentPassword
    );
    if (verifyResult.failed) {
      res.render("account.html", {
        static: this.getStatic(),
        csrf: req.csrfToken(),
        error: verifyResult.failed,
      });
      return;
    }
    if (req.body.newPassword !== req.body.confirmNewPassword) {
      res.render("account.html", {
        static: this.getStatic(),
        csrf: req.csrfToken(),
        error: "Passwords do not match",
      });
      return;
    }
    await this.authManager.setPassword(
      verifyResult.user.userid,
      req.body.newPassword
    );
    res.render("account.html", {
      static: this.getStatic(),
      csrf: req.csrfToken(),
      message: "Password updated",
    });
  };
}

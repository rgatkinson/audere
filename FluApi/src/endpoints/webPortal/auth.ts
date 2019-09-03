// Copyright (c) 2018, 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import crypto from "crypto";
import uuidv4 from "uuid/v4";
import passport, { Passport } from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Inst, SplitSql } from "../../util/sql";
import { defineSiteUserModels, SiteUserModels, UserAttributes } from "./models";
import logger from "../../util/logger";

export class AuthManager {
  private readonly models: SiteUserModels;

  constructor(sql: SplitSql) {
    this.models = defineSiteUserModels(sql);
  }

  makePassport(): passport.Authenticator {
    const auth = new Passport();
    auth.use(
      new LocalStrategy(async (userid, password, done) => {
        try {
          const result = await this.verifyPassword(userid, password);
          if (result.failed) {
            done(null, false, { message: result.failed });
          } else {
            done(null, result.user);
          }
        } catch (e) {
          done(e);
        }
      })
    );

    auth.serializeUser((user: UserAttributes, done) => {
      logger.debug(`AuthManager: serialize ${user.userid} (${user.uuid})`);
      done(null, user.uuid);
    });

    auth.deserializeUser(async (uuid: string, done) => {
      logger.debug(`AuthManager: deserializing ${uuid}`);
      try {
        const user = await this.models.user.findOne({ where: { uuid } });
        logger.debug(`AuthManager: deserialized ${user.userid} (${user.uuid})`);
        done(null, user);
      } catch (err) {
        logger.error(
          `AuthManager: failed deserializing user for ${uuid}: ${err}`
        );
        done(err);
      }
    });

    return auth;
  }

  public async verifyPassword(
    userid: string,
    password: string
  ): Promise<{ user?: UserAttributes; failed?: string }> {
    logger.info(`passport.local: looking up '${userid}'`);
    try {
      const user = await this.models.user.findOne({ where: { userid } });
      if (!user) {
        logger.debug(`passport.local: could not find user for '${userid}'`);
        return { failed: "Invalid userid/password combination" };
      } else if (sha256(user.salt, userid, password) !== user.token) {
        logger.debug(`passport.local: password invalid for '${userid}'`);
        return { failed: "Invalid userid/password combination" };
      } else {
        logger.debug(`passport.local: successfully authenticated '${userid}'`);
        return { user };
      }
    } catch (err) {
      logger.error(
        `passport.local: error while authenticating '${userid}': ${err}`
      );
      throw err;
    }
  }

  async createUser(userid: string, password: string): Promise<void> {
    const salt = await makeSecret();
    await this.models.user.create({
      uuid: uuidv4(),
      userid,
      salt,
      token: makeToken({ salt, userid, password }),
    });
  }

  async setPassword(userid: string, password: string): Promise<void> {
    const user = await this.findUser(userid);
    const salt = await makeSecret();
    await user.update({ salt, token: makeToken({ salt, userid, password }) });
  }

  async disableUser(userid: string): Promise<void> {
    const user = await this.findUser(userid);
    const salt = await makeSecret();
    await user.update({ salt, token: "" });
  }

  async deleteUser(userid: string): Promise<void> {
    const user = await this.findUser(userid);
    await user.destroy();
  }

  async grantPermission(userid: string, permission: string): Promise<void> {
    const user = await this.findUser(userid);
    await this.models.permissions.create({
      userId: user.id,
      permission,
    });
  }

  async revokePermission(userid: string, permission: string): Promise<void> {
    const user = await this.findUser(userid);
    const permissionsRevoked = await this.models.permissions.destroy({
      where: {
        userId: user.id,
        permission,
      },
    });
    if (permissionsRevoked === 0) {
      throw new Error("Could not find a permission to revoke");
    }
  }

  async authorize(userid: string, permission: string): Promise<boolean> {
    try {
      logger.info(
        `[AuthManager#authorize] authorizing ${userid} to ${permission} @audit`
      );
      const user = await this.findUser(userid);
      return !!(await this.models.permissions.findOne({
        where: {
          userId: user.id,
          permission,
        },
      }));
    } catch (e) {
      logger.error(
        `[AuthManager#authorize] Error authorizing ${userid} to ${permission}`
      );
      logger.error(e.toString());
      return false;
    }
  }

  private async findUser(userid: string): Promise<Inst<UserAttributes>> {
    const user = await this.models.user.findOne({ where: { userid } });
    if (user == null) {
      throw new Error(`Unrecognized userid`);
    }
    return user;
  }
}

async function makeSecret(size: number = 64): Promise<string> {
  return crypto.randomBytes(size).toString("base64");
}

interface TokenParts {
  salt: string;
  userid: string;
  password: string;
}
function makeToken({ salt, userid, password }: TokenParts): string {
  return sha256(salt, userid, password);
}

export const Permissions = {
  SEATTLE_CHILDRENS_HIPAA_ACCESS: "seattleChildrensHipaaAccess",
  COUGH_RDT_PHOTOS_ACCESS: "coughRdtPhotosAccess",
  COUGH_INTERPRETATION_WRITE: "coughInterpretationWrite",
};

export function authorizationMiddleware(
  authManager: AuthManager,
  requiredPermission: string
) {
  return async (req, res, next) => {
    if (!req.user) {
      throw new Error("Attempted to authorize an unauthenticated user");
    }
    const authorized = await authManager.authorize(
      req.user.userid,
      requiredPermission
    );
    if (!authorized) {
      res.status(401);
      res.send("Not authorized");
      return;
    }
    next();
  };
}

function sha256(...args: (string | Buffer)[]): string {
  const hash = crypto.createHash("sha256");
  args.forEach(arg => hash.update(arg));
  return hash.digest("hex").toString();
}

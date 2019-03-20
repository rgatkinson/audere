// Copyright (c) 2018 by Audere
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
          const user = await this.models.user.findOne({ where: { userid } });
          if (!user) {
            logger.debug(`passport.local: could not find user for '${userid}'`);
            const message = "Invalid userid/password combination";
            return done(null, false, { message });
          } else if (hash(user.salt, userid, password) !== user.token) {
            logger.debug(`passport.local: password invalid for '${userid}'`);
            const message = "Invalid userid/password combination";
            return done(null, false, { message });
          } else {
            logger.debug(
              `passport.local: successfully authenticated '${userid}'`
            );
            return done(null, user);
          }
        } catch (err) {
          logger.error(
            `passport.local: error while authenticating '${userid}': ${err}`
          );
          return done(err);
        }
      })
    );

    auth.serializeUser((user: UserAttributes, done) => done(null, user.uuid));
    auth.deserializeUser(async (uuid: string, done) => {
      try {
        const user = await this.models.user.findOne({ where: { uuid } });
        done(null, user);
      } catch (err) {
        done(err);
      }
    });

    return auth;
  }

  async createUser(userid: string, password: string): Promise<void> {
    const salt = await makeSecret();
    await this.models.user.create({
      uuid: uuidv4(),
      userid,
      salt,
      token: makeToken({ salt, userid, password })
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
  return hash(salt, userid, password);
}

function hash(...args: (string | Buffer)[]): string {
  const hash = crypto.createHash("sha256");
  args.forEach(arg => hash.update(arg));
  return hash.digest("hex").toString();
}

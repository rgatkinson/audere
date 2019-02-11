// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import fs from "fs";
import util from "util";
import crypto from "crypto";
import uuidv4 from "uuid/v4";
import passport, { Passport } from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Model, SplitSql } from "../../util/sql";
import { defineUser, UserAttributes } from "./models";

export class AuthManager {
  readonly _user: Model<UserAttributes>;

  constructor(sql: SplitSql) {
    this._user = defineUser(sql);
  }

  makePassport(): passport.Authenticator {
    const auth = new Passport();
    auth.use(new LocalStrategy(
      async (userid, password, done) => {
        try {
          const user = await this._user.findOne({ where: { userid }}) || false;
          if (!user || hash(user.salt, userid, password) !== user.token) {
            const message = "Invalid userid/password combination";
            return done(null, user, { message });
          } else {
            return done(null, user);
          }
        } catch (err) {
          return done(err)
        }
      }
    ));

    auth.serializeUser((user: UserAttributes, done) => done(null, user.uuid));
    auth.deserializeUser(async (uuid: string, done) => {
      try {
        const user = await this._user.findOne({ where: { uuid }});
        done(null, user);
      } catch (err) {
        done(err);
      }
    });

    return auth;
  }

  async createUser(userid: string, password: string): Promise<void> {
    const salt = await makeSecret();
    await this._user.create({
      uuid: uuidv4(),
      userid,
      salt,
      token: makeToken({ salt, userid, password }),
    });
  }

  async setPassword(userid: string, password: string): Promise<void> {
    const user = await this._user.findOne({ where: { userid }});
    if (user == null) {
      throw new Error(`Unrecognized userid`);
    }

    const salt = await makeSecret();
    await this._user.upsert({
      uuid: user.uuid,
      userid,
      salt,
      token: makeToken({ salt, userid, password }),
    });
  }
}

const fsOpen = util.promisify(fs.open);
const fsRead = util.promisify(fs.read);
const fsClose = util.promisify(fs.close);

async function makeSecret(size: number = 64): Promise<string> {
  const buffer = Buffer.alloc(size);
  const fd = await fsOpen("/dev/urandom", "r");
  try {
    let count = 0;
    while (count < size) {
      const read = await fsRead(fd, buffer, count, size - count, null);
      if (read.bytesRead < 1) {
        throw new Error(`Got ${read.bytesRead} from read of /dev/urandom`);
      }
      count += read.bytesRead;
    }
    return hash(buffer);
  } finally {
    await fsClose(fd);
  }
}

interface TokenParts {
  salt: string;
  userid: string;
  password: string;
}
function makeToken(parts: TokenParts): string {
  const { salt, userid, password } = parts;
  return hash(salt, userid, password);
}

function hash(...args: (string | Buffer)[]): string {
  const hash = crypto.createHash("sha256");
  args.forEach(arg => hash.update(arg));
  return hash.digest("hex").toString();
}

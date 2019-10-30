// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import uuidv4 from "uuid/v4";
import express, { Express } from "express";
import { ErrorRequestHandler } from "express-serve-static-core";
import Ouch from "ouch";
import helmet from "helmet";

import { isAWS } from "./environment";
import logger from "./logger";
import { RequestContext } from "./requestContext";

export function createApp(): Express {
  const app = express();
  app.use(helmet.noCache());
  app.use(helmet.frameguard({ action: "deny" }));

  return app;
}

export function useOuch(app: Express): Express {
  app.use(defaultErrorHandler(app.get("env")));
  return app;
}

function defaultErrorHandler(env: string): ErrorRequestHandler {
  return (err, req, res, next) => {
    if (err) {
      logger.error(
        `${requestId(req)} uncaught exception: '${err.message}'\n${err.stack}`
      );
    }

    if (isAWS()) {
      next();
      return;
    }

    const ouch = new Ouch();
    ouch.pushHandler(new Ouch.handlers.PrettyPageHandler("orange", null));
    ouch.handleException(err, req, res);
  };
}

export function render<T>(template: string, builder: ContextBuilder<T>) {
  return wrap(async (req, res) => res.render(template, builder(req)));
}

export function wrap(handler: any) {
  return function(req: any, res: any, next: any) {
    try {
      const maybePromise = handler(req, res, next);

      if (
        maybePromise != null &&
        typeof maybePromise.then === "function" &&
        typeof maybePromise.catch === "function"
      ) {
        maybePromise.catch(next);
      }
    } catch (err) {
      // Make sure any synchronous errors are also exposed
      next(err);
    }
  };
}

export interface ContextBuilder<T> {
  (req: any): T;
}

export function requestId(req: express.Request): string {
  const casted: RequestContext = <any>req;
  if (!casted.uuid) {
    casted.uuid = uuidv4();
  }
  return casted.uuid;
}

export function jsonApi<Req, Res>(
  fn: (req: Req) => Promise<Res>,
  paramName: string
): (req, res) => void {
  return async (req, res) => {
    const response = await fn(JSON.parse(req.query[paramName]));
    res.json(response);
  };
}

export function booleanQueryParameter(
  req,
  name: string,
  dflt: boolean
): boolean {
  switch (req.query[name]) {
    case "true":
      return true;
    case "false":
      return false;
    default:
      return dflt;
  }
}

export function jsonKeepAlive(res): KeepAliveJson {
  // Set Content-Type now since headers have to go before body and we start
  // streaming whitespace to keep alive.
  res.type("json");
  // Prevent nginx from buffering the stream so the keep-alive whitespace
  // makes it to the ELB as well.
  res.set("X-Accel-Buffering", "no");

  // Send whitespace regularly during import so ExpressJS, nginx, and ELB
  // don't time out.
  const progress = () => res.write(" ");

  const replyJson = (result: object) => {
    res.write("\n");
    res.write(JSON.stringify(result));
    res.end();
  };

  return { progress, replyJson };
}

export interface KeepAliveJson {
  progress: () => void;
  replyJson: (result: object) => void;
}

// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import express, { Express } from "express";
import { ErrorRequestHandler } from "express-serve-static-core";
import Ouch from "ouch";
import helmet from "helmet";

import { isAWS } from "./environment";
import logger from "./logger";

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
      logger.error("Uncaught exception:");
      logger.error(err.message);
      logger.error(err.stack);
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
    handler(req, res).catch(next);
  };
}

export interface ContextBuilder<T> {
  (req: any): T;
}

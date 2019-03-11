// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { join as pjoin, resolve } from "path";
import passport from "passport";
import express, { Express } from "express";
import session from "express-session";
import bodyParser from "body-parser";
import consolidate from "consolidate";
import csurf from "csurf";
import { AuthManager } from "./auth";
import { useOuch, createApp, render } from "../../util/expressApp";
import { SplitSql } from "../../util/sql";
import { SecretConfig } from "../../util/secretsConfig";
import parseurl from "parseurl";

export async function portalApp(sql: SplitSql) {
  const app = createApp();

  // TODO: set up static directory in nginx
  app.use(express.static(resolve(__dirname, 'static')));

  app.engine('html', consolidate.handlebars);
  app.set('view engine', 'html');
  app.set('views', resolve(__dirname, "templates"));

  const secretConfig = new SecretConfig(sql);
  await addSession(app, secretConfig);
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(csurf({ cookie: false }));

  const auth = new AuthManager(sql).makePassport();
  app.use(auth.initialize());
  app.use(auth.session());

  addHandlers(app, auth);

  addErrorHandler(app);
  useOuch(app);
  return app;
}

async function addSession(app: Express, secretConfig: SecretConfig): Promise<Express> {
  const secret = await secretConfig.getOrCreate("WEB_PORTAL_SESSION_SECRET");
  const secure = app.get("env") === "production";
  const sameSite = true;
  // TODO: store; MemoryStore leaks memory, and resave=true requires touch() support
  const spec = {
    secret,
    cookie: {
      sameSite,
      secure,
    },
    resave: false,
    rolling: true,
    saveUninitialized: true,
  };

  if (secure) {
    app.set("trust proxy", 1);
  }

  app.use(session(spec));

  return app;
}

function addHandlers(app: Express, auth: passport.Authenticator): Express {
  app.use(debugPageViews);
  app.get("/login", render("login.html", loginContext));

  app.post("/login", auth.authenticate('local', {
    successRedirect: "/portal/index",
    failureRedirect: "/portal/login",
  }));

  app.use(requireLoggedInUser);
  app.get("/index", render("index.html", userContext));

  return app;

  function requireLoggedInUser(req, res, next) {
    if (req.user) {
      return next();
    } else {
      return res.redirect(sitepath("/login"));
    }
  }

  function userContext(req) {
    return {
      ...loginContext(req),
      user: req.user,
    }
  }

  function loginContext(req) {
    return {
      requestCount: req.session.requestCount[pathname(req)],
      static: app.mountpath,
      csrf: req.csrfToken(),
    }
  }

  function debugPageViews(req, res, next) {
    if (!req.session.requestCount) {
      req.session.requestCount = {};
    }
    const pathkey = pathname(req);
    req.session.requestCount[pathkey] = (req.session.requestCount[pathkey] || 0) + 1;
    next();
  }

  function pathname(req): string {
    return parseurl(req).pathname;
  }

  // Given a portal-relative path, returns a site-wide url path
  function sitepath(portalPath) {
    return pjoin(mountpath(), portalPath)
  }

  function mountpath(): string {
    const mpath = app.mountpath;
    if (typeof mpath === "string") {
      return mpath;
    } else {
      return mpath[0];
    }
  }
}

function addErrorHandler(app: Express): void {
  app.use((err, req, res, next) => {
    if (err.code === "EBADCSRFTOKEN") {
      return res.status(403).send("Failed CSRF token check");
    }
    return next(err);
  });
}

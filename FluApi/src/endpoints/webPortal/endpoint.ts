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
import { AuthManager, Permissions, authorizationMiddleware } from "./auth";
import {
  useOuch,
  createApp,
  render,
  wrap,
  requestId,
} from "../../util/expressApp";
import { SplitSql } from "../../util/sql";
import { SecretConfig } from "../../util/secretsConfig";
import { isAWS } from "../../util/environment";
import { defineSiteUserModels, SESSION_TABLE_NAME } from "./models";
import {
  getMetrics,
  getExcelDataSummary,
  getLastMonday,
  getThisSunday,
  getExcelReport,
  getFeverMetrics,
  getFeverExcelReport,
} from "./metrics";
import logger from "../../util/logger";
import { S3DirectoryServer } from "./s3server";

const INDEX_PAGE_LINKS = [
  {
    label: "Metrics for FluTrack kiosk app (codename Sniffles)",
    url: "./metrics",
    permissionsRequired: [],
  },
  {
    label: "Metrics for flu@home (codename Fever)",
    url: "./feverMetrics",
    permissionsRequired: [],
  },
  {
    label: "Seattle Children's HIPAA and consent forms",
    url: "./seattleChildrensForms",
    permissionsRequired: [Permissions.SEATTLE_CHILDRENS_HIPAA_ACCESS],
  },
];

const SequelizeSessionStore = require("connect-session-sequelize")(
  session.Store
);

export interface PortalConfig {
  sql: SplitSql;
  sessionStore?: session.Store;
}

export function createTestSessionStore(sql: SplitSql): session.Store {
  const store = createSessionStore(sql);
  // Session store normally creates a timer that prevents test process exit.
  store.stopExpiringSessions();
  return store;
}

export async function portalApp(config: PortalConfig) {
  const app = createApp();

  // TODO: set up static directory in nginx
  app.use(express.static(resolve(__dirname, "static")));

  app.engine("html", consolidate.handlebars);
  app.set("view engine", "html");
  app.engine("ejs", consolidate.ejs);
  app.set("view engine", "ejs");

  app.set("views", resolve(__dirname, "templates"));

  await addSession(app, config);

  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(csurf({ cookie: false }));

  const authManager = new AuthManager(config.sql);
  const auth = authManager.makePassport();
  app.use(auth.initialize());
  app.use(auth.session());

  addHandlers(app, auth, authManager, config);

  addErrorHandler(app);
  useOuch(app);
  return app;
}

async function addSession(
  app: Express,
  config: PortalConfig
): Promise<Express> {
  const secretConfig = new SecretConfig(config.sql);
  const secret = await secretConfig.getOrCreate("WEB_PORTAL_SESSION_SECRET");
  const secure = isAWS();
  const store = config.sessionStore || createSessionStore(config.sql);

  const spec = {
    secret,
    cookie: {
      sameSite: true,
      secure,
    },
    store,
    proxy: secure,
    resave: false,
    saveUninitialized: false,
  };

  if (secure) {
    app.set("trust proxy", 1);
  }

  app.use(session(spec));

  return app;
}

function addHandlers(
  app: Express,
  auth: passport.Authenticator,
  authManager: AuthManager,
  config: PortalConfig
): Express {
  app.get("/login", render("login.html", loginContext));
  app.post("/login", wrap(login));

  app.use(wrap(requireLoggedInUser));
  app.get(
    "/index",
    wrap(async (req, res) =>
      res.render("index.html", {
        ...userContext(req),
        links: await indexPageLinks(req, authManager),
      })
    )
  );

  addMetricsHandlers(app);

  const s3DirectoryServer = new S3DirectoryServer(
    config.sql,
    `${process.env.NODE_ENV.toLowerCase()}/shared/hipaa-forms/seattle-childrens/`,
    () => ({
      static: Array.isArray(app.mountpath) ? app.mountpath[0] : app.mountpath,
      title: "Seattle Children's Flu Study Consent and HIPAA Forms",
    })
  );
  app.get(
    "/seattleChildrensForms",
    authorizationMiddleware(
      authManager,
      Permissions.SEATTLE_CHILDRENS_HIPAA_ACCESS
    ),
    wrap(s3DirectoryServer.performRequest)
  );

  return app;

  function login(req, res, next) {
    const postedUserid = req.body.username;
    auth.authenticate(
      "local",
      // Ideally we would not pass a callback and could just use options.
      // However, the implementation of authenticate-with-options does not play
      // well with connect-session-sequelize, and redirects before the successful
      // login is reflected in the session.  To work around this, we implement
      // the callback ourselves so we can login, then save, then redirect.
      (err, user, info) => {
        if (err) {
          logger.warn(
            `${requestId(
              req
            )}: FAILED authentication for '${postedUserid}' err='${
              err.message
            }'`
          );
          return next(err);
        }
        if (!user) {
          logger.warn(
            `${requestId(
              req
            )}: FAILED authentication for '${postedUserid}' no user`
          );
          return res.redirect("./login");
        }
        logger.debug(
          `${requestId(req)}: post/login: logging in as '${user.userid}'`
        );
        req.login(user, err => {
          if (err) {
            logger.warn(`${requestId(req)}: FAILED login for ${user.userid}`);
            return next(err);
          }
          req.session.save(() => {
            logger.debug(
              `${requestId(req)}: post/login: logged in as '${
                user.userid
              }', redirecting`
            );
            res.redirect("./index");
          });
        });
      }
    )(req, res, next);
  }

  function requireLoggedInUser(req, res, next) {
    if (req.user) {
      logger.debug(
        `${requestId(req)}: requireLoggedInUser allowing ${req.user.userid} (${
          req.user.uuid
        })`
      );
      return next();
    } else {
      logger.warn(`${requestId(req)}: FAILED not authenticated`);
      return res.redirect(sitepath("/login"));
    }
  }

  function addMetricsHandlers(app: Express): void {
    app.get(
      "/metrics",
      wrap(async (req, res) => {
        const startDate = req.query.startDate || getLastMonday();
        const endDate = req.query.endDate || getThisSunday();
        const {
          surveyStatsData,
          surveyStatsByAdminData,
          lastQuestionData,
          studyIdData,
          feedbackData,
        } = await getMetrics(startDate, endDate);
        res.render("metrics.ejs", {
          static: app.mountpath,
          surveyStatsData: surveyStatsData,
          surveyStatsByAdminData: surveyStatsByAdminData,
          lastQuestionData: lastQuestionData,
          feedbackData: feedbackData,
          startDate: startDate,
          endDate: endDate,
        });
      })
    );

    app.get(
      "/feverMetrics",
      wrap(async (req, res) => {
        const startDate = req.query.startDate || getLastMonday();
        const endDate = req.query.endDate || getThisSunday();
        const {
          surveyStatsData,
          lastScreenData,
          statesData,
          studyIdData,
        } = await getFeverMetrics(startDate, endDate);
        res.render("feverMetrics.ejs", {
          static: app.mountpath,
          surveyStatsData: surveyStatsData,
          lastQuestionData: lastScreenData,
          statesData: statesData,
          studyIdData: studyIdData,
          startDate: startDate,
          endDate: endDate,
        });
      })
    );

    app.get("/saveMetrics", excelHandler("sfs", getExcelReport));
    app.get(
      "/saveFeverMetrics",
      excelHandler("fluAtHome", getFeverExcelReport)
    );
    app.get("/saveDataSummary", excelHandler("sfsData", getExcelDataSummary));

    type DateRangeQuery = (start: string, end: string) => Promise<Buffer>;

    function excelHandler(
      prefix: string,
      query: DateRangeQuery
    ): express.Handler {
      return wrap(async (req, res) => {
        const start = req.query.startDate || getLastMonday();
        const end = req.query.endDate || getThisSunday();
        const data = await query(start, end);

        const range = start === end ? start : `${start}_${end}`;
        const filename = `${prefix}-${range}.xlsx`;
        sendExcel(res, filename, data);
      });
    }

    function sendExcel(res: any, name: string, data: Buffer): void {
      res.setHeader("Content-Type", "application/vnd.openxmlformats");
      res.setHeader("Content-Disposition", `attachment; filename=${name}`);
      res.end(data, "binary");
    }
  }

  async function indexPageLinks(req, authManager: AuthManager) {
    return await asyncFilter(INDEX_PAGE_LINKS, link =>
      asyncEvery(link.permissionsRequired, permission =>
        authManager.authorize(req.user.userid, permission)
      )
    );
  }

  function userContext(req) {
    return {
      ...loginContext(req),
      user: req.user,
    };
  }

  function loginContext(req) {
    return {
      static: app.mountpath,
      csrf: req.csrfToken(),
    };
  }

  // Given a portal-relative path, returns a site-wide url path
  function sitepath(portalPath) {
    return pjoin(mountpath(), portalPath);
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

function createSessionStore(sql: SplitSql) {
  defineSiteUserModels(sql);
  return new SequelizeSessionStore({
    db: sql.pii,
    table: SESSION_TABLE_NAME,
  });
}

function asyncArrayFn(fn) {
  return async (array, predicate) => {
    const results = await Promise.all(array.map(predicate));
    return fn.bind(array)((val, index) => results[index]);
  };
}

const asyncEvery = asyncArrayFn(Array.prototype.every);
const asyncFilter = asyncArrayFn(Array.prototype.filter);

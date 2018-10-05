import express from "express";
import Ouch from "ouch";
import bodyParser from "body-parser";
import errorHandler from "errorhandler";
import { ButtonPush } from "./models";
import { ValidationError } from "sequelize";

const app = express();

app.set("port", process.env.PORT || 3000);
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("OK");
});

app.get("/boom", (req, res) => {
  throw new Error("Boom!");
});

app.get(
  "/async-boom",
  wrap(async (req, res) => {
    throw new Error("Boom!");
  })
);

app.get("/api", (req, res) => {
  res.json({
    // TODO: Generate the token using `csrf` npm module
    // Do we need CSRF for JSON API?
    CsrfToken: null,
    Status: "SUCCESS"
  });
});

app.post(
  "/api/button",
  wrap(async (req, res) => {
    try {
      await ButtonPush.create({
        deviceId: req.body.DeviceId,
        timestamp: req.body.Timestamp,
        count: req.body.Count
      });
      res.json({ Status: "SUCCESS" });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ Status: error.message });
      } else {
        throw error;
      }
    }
  })
);

function wrap(f: any) {
  return function(req, res, next) {
    f(req, res).catch(next);
  };
}

app.use((err, req, res, next) => {
  if (app.get("env") !== "development") {
    next();
    return;
  }
  const ouch = new Ouch();
  ouch.pushHandler(new Ouch.handlers.PrettyPageHandler("orange", null));
  ouch.handleException(err, req, res);
});

export default app;

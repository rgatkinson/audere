import express from "express";
import bodyParser from "body-parser";
import errorHandler from "errorhandler";
import { ButtonPush } from "./models";
import { ValidationError } from "sequelize";

const app = express();

app.set("port", process.env.PORT || 3000);
app.use(errorHandler());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("OK");
});

app.get("/api", (req, res) => {
  res.json({
    // TODO: Generate the token using `csrf` npm module
    // Do we need CSRF for JSON API?
    CsrfToken: null,
    Status: "SUCCESS"
  });
});

app.post("/api/button", async (req, res) => {
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
});

export default app;

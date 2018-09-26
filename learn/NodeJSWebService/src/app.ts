import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import errorHandler from "errorhandler";

dotenv.config({ path: ".env.example" });

const app = express();

app.set("port", process.env.PORT || 3000);
app.use(errorHandler());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("OK");
});

export default app;

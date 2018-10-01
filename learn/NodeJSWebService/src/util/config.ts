import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("Copy .env.example to .env and customize stuff :)");
}

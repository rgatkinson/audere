import request from "supertest";
import app from "../src/app";

describe("GET /", () => {
  it("should return 200 OK", () => {
    return request(app)
      .get("/")
      .expect(200)
      .expect("OK");
  });
});

describe("GET /api", () => {
  it("should return CSRF token", () => {
    return request(app)
      .get("/api")
      .expect(200)
      .expect("content-type", /json/)
      .then(response => {
        expect(response.body.Status).toEqual("SUCCESS");
      });
  });
});
